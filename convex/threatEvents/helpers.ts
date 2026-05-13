import { v, type Infer } from "convex/values";

import type { Id } from "@convex/_generated/dataModel";
import {
  USER_PROFILE_ROLES,
  type UserProfileRole,
} from "@convex/auth/authorization";
import { threatIndicatorSeverityValidator } from "@convex/threatIndicators/helpers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const THREAT_EVENT_STATUSES = {
  open: "open",
  investigating: "investigating",
  resolved: "resolved",
  falsePositive: "false_positive",
} as const;

export const THREAT_EVENT_MATCHED_FIELDS = {
  srcIp: "srcIp",
  destIp: "destIp",
  actor: "actor",
  requestPath: "requestPath",
  message: "message",
  eventType: "eventType",
  action: "action",
  outcome: "outcome",
  other: "other",
} as const;

export const THREAT_EVENT_READ_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
  USER_PROFILE_ROLES.viewer,
] as const;

export const THREAT_EVENT_STATUS_UPDATE_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
] as const;

export const THREAT_EVENT_SEVERITY_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
} as const;

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

export const threatEventStatusValidator = v.union(
  v.literal(THREAT_EVENT_STATUSES.open),
  v.literal(THREAT_EVENT_STATUSES.investigating),
  v.literal(THREAT_EVENT_STATUSES.resolved),
  v.literal(THREAT_EVENT_STATUSES.falsePositive),
);

export const threatEventMatchedFieldValidator = v.union(
  v.literal(THREAT_EVENT_MATCHED_FIELDS.srcIp),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.destIp),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.actor),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.requestPath),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.message),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.eventType),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.action),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.outcome),
  v.literal(THREAT_EVENT_MATCHED_FIELDS.other),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreatEventStatus = Infer<typeof threatEventStatusValidator>;
export type ThreatEventMatchedField = Infer<
  typeof threatEventMatchedFieldValidator
>;
export type ThreatEventSeverity = Infer<typeof threatIndicatorSeverityValidator>;

// ---------------------------------------------------------------------------
// Capability Helpers
// ---------------------------------------------------------------------------

export function canViewThreatEvents(role: UserProfileRole) {
  return (
    role === USER_PROFILE_ROLES.admin ||
    role === USER_PROFILE_ROLES.analyst ||
    role === USER_PROFILE_ROLES.viewer
  );
}

export function canUpdateThreatEventStatus(role: UserProfileRole) {
  return (
    role === USER_PROFILE_ROLES.admin || role === USER_PROFILE_ROLES.analyst
  );
}

// ---------------------------------------------------------------------------
// Correlation Foundation Helpers
// ---------------------------------------------------------------------------

export function raiseSeverityOneLevel(
  severity: ThreatEventSeverity,
): ThreatEventSeverity {
  if (severity === "low") {
    return "medium";
  }

  if (severity === "medium") {
    return "high";
  }

  return "critical";
}

export function isValidThreatEventConfidence(confidence: number) {
  return (
    typeof confidence === "number" &&
    !Number.isNaN(confidence) &&
    confidence >= 0 &&
    confidence <= 100
  );
}

export function buildThreatEventDeduplicationKey(
  normalizedEventId: Id<"normalizedEvents"> | string,
  matchedIndicatorId: Id<"threatIndicators"> | string,
  matchedField: ThreatEventMatchedField,
) {
  return [
    String(normalizedEventId),
    String(matchedIndicatorId),
    matchedField,
  ].join("|");
}

export function normalizeCorrelationText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}
