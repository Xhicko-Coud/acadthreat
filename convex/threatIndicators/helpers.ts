import { v, type Infer } from "convex/values";

import type { Id } from "@convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "@convex/_generated/server";
import {
  USER_PROFILE_ROLES,
  requireActiveProfile,
  requireRole,
  type UserProfileRole,
} from "@convex/auth/authorization";

export const THREAT_INDICATOR_TYPES = {
  ip: "ip",
  domain: "domain",
  url: "url",
  hash: "hash",
  email: "email",
  keyword: "keyword",
} as const;

export const THREAT_INDICATOR_SEVERITIES = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

export const THREAT_INDICATOR_STATUSES = {
  active: "active",
  archived: "archived",
  falsePositive: "false_positive",
} as const;

export const THREAT_INDICATOR_READ_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
  USER_PROFILE_ROLES.viewer,
] as const;

export const THREAT_INDICATOR_WRITE_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
] as const;

export const threatIndicatorTypeValidator = v.union(
  v.literal(THREAT_INDICATOR_TYPES.ip),
  v.literal(THREAT_INDICATOR_TYPES.domain),
  v.literal(THREAT_INDICATOR_TYPES.url),
  v.literal(THREAT_INDICATOR_TYPES.hash),
  v.literal(THREAT_INDICATOR_TYPES.email),
  v.literal(THREAT_INDICATOR_TYPES.keyword),
);

export const threatIndicatorSeverityValidator = v.union(
  v.literal(THREAT_INDICATOR_SEVERITIES.low),
  v.literal(THREAT_INDICATOR_SEVERITIES.medium),
  v.literal(THREAT_INDICATOR_SEVERITIES.high),
  v.literal(THREAT_INDICATOR_SEVERITIES.critical),
);

export const threatIndicatorStatusValidator = v.union(
  v.literal(THREAT_INDICATOR_STATUSES.active),
  v.literal(THREAT_INDICATOR_STATUSES.archived),
  v.literal(THREAT_INDICATOR_STATUSES.falsePositive),
);

export type ThreatIndicatorType = Infer<typeof threatIndicatorTypeValidator>;
export type ThreatIndicatorSeverity = Infer<typeof threatIndicatorSeverityValidator>;
export type ThreatIndicatorStatus = Infer<typeof threatIndicatorStatusValidator>;

export type ThreatIndicatorPayloadInput = {
  confidence: number;
  description?: string | null;
  severity: ThreatIndicatorSeverity;
  source?: string | null;
  type: ThreatIndicatorType;
  value: string;
};

export type ValidatedThreatIndicatorPayload = {
  confidence: number;
  description?: string;
  normalizedValue: string;
  severity: ThreatIndicatorSeverity;
  source?: string;
  type: ThreatIndicatorType;
  value: string;
};

export type ThreatIndicatorValidationResult =
  | {
      data: ValidatedThreatIndicatorPayload;
      isValid: true;
      status: "success";
    }
  | {
      issues: string[];
      isValid: false;
      status: "invalid_input";
    };

export const threatIndicatorWritePayloadValidator = {
  confidence: v.number(),
  description: v.optional(v.string()),
  severity: threatIndicatorSeverityValidator,
  source: v.optional(v.string()),
  type: threatIndicatorTypeValidator,
  value: v.string(),
} as const;

const MAX_SOURCE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const HASH_LENGTHS = new Set([32, 40, 64, 128]);

export function normalizeThreatIndicatorValue(
  type: ThreatIndicatorType,
  value: string,
) {
  const trimmedValue = value.trim();

  if (type === THREAT_INDICATOR_TYPES.domain) {
    return trimmedValue.toLowerCase();
  }

  if (type === THREAT_INDICATOR_TYPES.hash) {
    return trimmedValue.toLowerCase();
  }

  if (type === THREAT_INDICATOR_TYPES.email) {
    return trimmedValue.toLowerCase();
  }

  return trimmedValue;
}

export function validateThreatIndicatorPayload(
  input: ThreatIndicatorPayloadInput,
): ThreatIndicatorValidationResult {
  const value = input.value.trim();
  const normalizedValue = normalizeThreatIndicatorValue(input.type, input.value);
  const source = normalizeOptionalText(input.source);
  const description = normalizeOptionalText(input.description);
  const issues: string[] = [];

  if (!value) {
    issues.push("Indicator value is required.");
  }

  if (!isThreatIndicatorType(input.type)) {
    issues.push("Indicator type is invalid.");
  }

  if (!isThreatIndicatorSeverity(input.severity)) {
    issues.push("Indicator severity is invalid.");
  }

  if (
    typeof input.confidence !== "number" ||
    Number.isNaN(input.confidence) ||
    input.confidence < 0 ||
    input.confidence > 100
  ) {
    issues.push("Confidence must be a number between 0 and 100.");
  }

  if (source && source.length > MAX_SOURCE_LENGTH) {
    issues.push(`Source must be ${MAX_SOURCE_LENGTH} characters or fewer.`);
  }

  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push(
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
    );
  }

  if (value && !isThreatIndicatorValueValid(input.type, normalizedValue)) {
    issues.push(getThreatIndicatorTypeErrorMessage(input.type));
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      issues,
      status: "invalid_input",
    };
  }

  return {
    data: {
      confidence: input.confidence,
      ...(description ? { description } : {}),
      normalizedValue,
      severity: input.severity,
      ...(source ? { source } : {}),
      type: input.type,
      value,
    },
    isValid: true,
    status: "success",
  };
}

export async function getThreatIndicatorDuplicateByTypeAndNormalizedValue(
  ctx: MutationCtx | QueryCtx,
  args: {
    excludeIndicatorId?: Id<"threatIndicators">;
    normalizedValue: string;
    type: ThreatIndicatorType;
  },
) {
  const existingIndicator = await ctx.db
    .query("threatIndicators")
    .withIndex("by_type_and_normalizedValue", (lookup) =>
      lookup.eq("type", args.type).eq("normalizedValue", args.normalizedValue),
    )
    .unique();

  if (!existingIndicator) {
    return null;
  }

  if (
    args.excludeIndicatorId &&
    existingIndicator._id === args.excludeIndicatorId
  ) {
    return null;
  }

  return existingIndicator;
}

export async function buildThreatIndicatorActorSnapshot(ctx: QueryCtx) {
  const { profile, user } = await requireActiveProfile(ctx);

  return {
    email: profile.email,
    role: profile.role,
    userId: user._id,
  };
}

export async function requireThreatIndicatorReadAccess(ctx: QueryCtx) {
  return await requireRole(ctx, THREAT_INDICATOR_READ_ROLES);
}

export async function requireThreatIndicatorWriteAccess(ctx: QueryCtx) {
  return await requireRole(ctx, THREAT_INDICATOR_WRITE_ROLES);
}

export function canWriteThreatIndicators(role: UserProfileRole) {
  return (
    role === USER_PROFILE_ROLES.admin || role === USER_PROFILE_ROLES.analyst
  );
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? "";
  return normalizedValue ? normalizedValue : undefined;
}

function isThreatIndicatorType(value: string): value is ThreatIndicatorType {
  return Object.values(THREAT_INDICATOR_TYPES).includes(
    value as ThreatIndicatorType,
  );
}

function isThreatIndicatorSeverity(
  value: string,
): value is ThreatIndicatorSeverity {
  return Object.values(THREAT_INDICATOR_SEVERITIES).includes(
    value as ThreatIndicatorSeverity,
  );
}

function isThreatIndicatorValueValid(
  type: ThreatIndicatorType,
  value: string,
) {
  if (type === THREAT_INDICATOR_TYPES.ip) {
    return isIpAddress(value);
  }

  if (type === THREAT_INDICATOR_TYPES.domain) {
    return isDomain(value);
  }

  if (type === THREAT_INDICATOR_TYPES.url) {
    return isUrl(value);
  }

  if (type === THREAT_INDICATOR_TYPES.hash) {
    return isHash(value);
  }

  if (type === THREAT_INDICATOR_TYPES.email) {
    return isEmail(value);
  }

  return Boolean(value);
}

function getThreatIndicatorTypeErrorMessage(type: ThreatIndicatorType) {
  if (type === THREAT_INDICATOR_TYPES.ip) {
    return "IP indicators must be a valid IPv4 or IPv6 address.";
  }

  if (type === THREAT_INDICATOR_TYPES.domain) {
    return "Domain indicators must be a valid domain name.";
  }

  if (type === THREAT_INDICATOR_TYPES.url) {
    return "URL indicators must be a valid URL.";
  }

  if (type === THREAT_INDICATOR_TYPES.hash) {
    return "Hash indicators must be 32, 40, 64, or 128 hexadecimal characters.";
  }

  if (type === THREAT_INDICATOR_TYPES.email) {
    return "Email indicators must be a valid email address.";
  }

  return "Keyword indicators must not be empty.";
}

function isIpAddress(value: string) {
  return isIpv4Address(value) || isIpv6Address(value);
}

function isIpv4Address(value: string) {
  const parts = value.split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }

    const parsedPart = Number(part);
    return parsedPart >= 0 && parsedPart <= 255;
  });
}

function isIpv6Address(value: string) {
  return /^[0-9a-f:]+$/i.test(value) && value.includes(":");
}

function isDomain(value: string) {
  return /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i.test(value);
}

function isUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    return Boolean(parsedUrl.protocol && parsedUrl.hostname);
  } catch {
    return false;
  }
}

function isHash(value: string) {
  return HASH_LENGTHS.has(value.length) && /^[a-f0-9]+$/i.test(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
