import { v, type Infer } from "convex/values";

import type { QueryCtx } from "@convex/_generated/server";
import {
  USER_PROFILE_ROLES,
  requireRole,
} from "@convex/auth/authorization";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LOG_SOURCE_TYPES = {
  authentication: "authentication",
  firewall: "firewall",
} as const;

export const INGESTION_STATUSES = {
  received: "received",
  normalized: "normalized",
  normalizationFailed: "normalization_failed",
} as const;

export const PARSE_STATUSES = {
  pending: "pending",
  parsed: "parsed",
  parseError: "parse_error",
} as const;

export const NORMALIZED_EVENT_SEVERITIES = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

export const logSourceTypeValidator = v.union(
  v.literal(LOG_SOURCE_TYPES.authentication),
  v.literal(LOG_SOURCE_TYPES.firewall),
);

export const logIngestionStatusValidator = v.union(
  v.literal(INGESTION_STATUSES.received),
  v.literal(INGESTION_STATUSES.normalized),
  v.literal(INGESTION_STATUSES.normalizationFailed),
);

export const logParseStatusValidator = v.union(
  v.literal(PARSE_STATUSES.pending),
  v.literal(PARSE_STATUSES.parsed),
  v.literal(PARSE_STATUSES.parseError),
);

export const normalizedEventSeverityValidator = v.union(
  v.literal(NORMALIZED_EVENT_SEVERITIES.low),
  v.literal(NORMALIZED_EVENT_SEVERITIES.medium),
  v.literal(NORMALIZED_EVENT_SEVERITIES.high),
  v.literal(NORMALIZED_EVENT_SEVERITIES.critical),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogSourceType = Infer<typeof logSourceTypeValidator>;
export type LogIngestionStatus = Infer<typeof logIngestionStatusValidator>;
export type LogParseStatus = Infer<typeof logParseStatusValidator>;
export type NormalizedEventSeverity = Infer<
  typeof normalizedEventSeverityValidator
>;

// ---------------------------------------------------------------------------
// Role / Capability Helpers
// ---------------------------------------------------------------------------

/**
 * All active roles that can view normalized events.
 */
export const LOG_NORMALIZED_READ_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
  USER_PROFILE_ROLES.viewer,
] as const;

/**
 * Only admin and analyst can view raw logs (may contain sensitive data).
 */
export const LOG_RAW_READ_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
] as const;

export async function requireLogNormalizedReadAccess(ctx: QueryCtx) {
  return await requireRole(ctx, LOG_NORMALIZED_READ_ROLES);
}

export async function requireLogRawReadAccess(ctx: QueryCtx) {
  return await requireRole(ctx, LOG_RAW_READ_ROLES);
}

export function canViewRawLogs(role: string) {
  return (
    role === USER_PROFILE_ROLES.admin || role === USER_PROFILE_ROLES.analyst
  );
}

// ---------------------------------------------------------------------------
// Payload Size Limits
// ---------------------------------------------------------------------------

/** Maximum raw payload size in bytes (64 KB). */
export const MAX_PAYLOAD_SIZE_BYTES = 65_536;

/** Maximum source name length. */
export const MAX_SOURCE_NAME_LENGTH = 120;

/** Maximum safe error message length stored on raw log. */
export const MAX_ERROR_MESSAGE_LENGTH = 500;

/** Maximum message/summary length on normalized events. */
export const MAX_NORMALIZED_MESSAGE_LENGTH = 1000;

// ---------------------------------------------------------------------------
// Validation Types
// ---------------------------------------------------------------------------

export type LogPayloadMetadataInput = {
  sourceType: string;
  sourceName?: string | null;
  eventTimestamp?: number | null;
  clientId?: string | null;
  isSimulated?: boolean;
};

export type LogPayloadMetadataValidationResult =
  | {
      data: ValidatedLogPayloadMetadata;
      isValid: true;
      status: "success";
    }
  | {
      issues: string[];
      isValid: false;
      status: "invalid_input";
    };

export type ValidatedLogPayloadMetadata = {
  sourceType: LogSourceType;
  sourceName?: string;
  eventTimestamp?: number;
  clientId?: string;
  isSimulated: boolean;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateLogPayloadMetadata(
  input: LogPayloadMetadataInput,
): LogPayloadMetadataValidationResult {
  const issues: string[] = [];

  if (!isLogSourceType(input.sourceType)) {
    issues.push(
      `Source type must be one of: ${Object.values(LOG_SOURCE_TYPES).join(", ")}.`,
    );
  }

  const sourceName = normalizeOptionalText(input.sourceName);

  if (sourceName && sourceName.length > MAX_SOURCE_NAME_LENGTH) {
    issues.push(
      `Source name must be ${MAX_SOURCE_NAME_LENGTH} characters or fewer.`,
    );
  }

  if (
    input.eventTimestamp !== undefined &&
    input.eventTimestamp !== null &&
    (typeof input.eventTimestamp !== "number" ||
      Number.isNaN(input.eventTimestamp) ||
      input.eventTimestamp < 0)
  ) {
    issues.push("Event timestamp must be a valid positive number.");
  }

  const clientId = normalizeOptionalText(input.clientId);

  if (issues.length > 0) {
    return {
      isValid: false,
      issues,
      status: "invalid_input",
    };
  }

  return {
    data: {
      sourceType: input.sourceType as LogSourceType,
      ...(sourceName ? { sourceName } : {}),
      ...(input.eventTimestamp != null
        ? { eventTimestamp: input.eventTimestamp }
        : {}),
      ...(clientId ? { clientId } : {}),
      isSimulated: input.isSimulated === true,
    },
    isValid: true,
    status: "success",
  };
}

/**
 * Check whether a raw payload string exceeds the maximum allowed size.
 */
export function isPayloadTooLarge(payload: string): boolean {
  return new TextEncoder().encode(payload).length > MAX_PAYLOAD_SIZE_BYTES;
}

/**
 * Validate that a payload string is non-empty and within size limits.
 */
export function validatePayloadString(payload: string): {
  isValid: boolean;
  issue?: string;
} {
  if (!payload || payload.trim().length === 0) {
    return { isValid: false, issue: "Payload is required." };
  }

  if (isPayloadTooLarge(payload)) {
    return {
      isValid: false,
      issue: `Payload exceeds maximum size of ${MAX_PAYLOAD_SIZE_BYTES} bytes.`,
    };
  }

  return { isValid: true };
}

// ---------------------------------------------------------------------------
// Idempotency Helpers
// ---------------------------------------------------------------------------

/**
 * Build a stable idempotency key from log fields.
 *
 * Uses Web Crypto API (available in Convex runtime) to produce a SHA-256
 * hex digest of the composite key components.
 */
export async function buildIdempotencyKey(components: {
  sourceType: string;
  eventTimestamp?: number;
  srcIp?: string;
  actor?: string;
  action?: string;
  message?: string;
  payloadHash?: string;
}): Promise<string> {
  const parts = [
    components.sourceType,
    components.eventTimestamp != null
      ? String(components.eventTimestamp)
      : components.payloadHash ?? "",
    components.srcIp ?? "",
    components.actor ?? "",
    components.action ?? "",
    components.message ?? "",
  ];

  return await computeSha256Hex(parts.join("|"));
}

/**
 * Compute a SHA-256 hex digest of a string.
 *
 * Uses the Web Crypto API which is available in the Convex runtime.
 */
export async function computeSha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Safe Text Helpers
// ---------------------------------------------------------------------------

export function normalizeOptionalText(
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength - 3) + "...";
}

/**
 * Produce a safe error message suitable for storage. Strips potential
 * stack traces and truncates to the maximum allowed length.
 */
export function buildSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return truncateText(error.message, MAX_ERROR_MESSAGE_LENGTH);
  }

  if (typeof error === "string") {
    return truncateText(error, MAX_ERROR_MESSAGE_LENGTH);
  }

  return "An unexpected error occurred during log processing.";
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isLogSourceType(value: string): value is LogSourceType {
  return Object.values(LOG_SOURCE_TYPES).includes(value as LogSourceType);
}

export function isNormalizedEventSeverity(
  value: string,
): value is NormalizedEventSeverity {
  return Object.values(NORMALIZED_EVENT_SEVERITIES).includes(
    value as NormalizedEventSeverity,
  );
}
