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

export const PRIORITY_LEVELS = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

export const SCORING_STATUSES = {
  unscored: "unscored",
  scored: "scored",
} as const;

export const SEVERITY_SCORE_MIN = 0;
export const SEVERITY_SCORE_MAX = 100;

export const PRIORITY_SCORE_BANDS = {
  low: { max: 39, min: 0 },
  medium: { max: 69, min: 40 },
  high: { max: 89, min: 70 },
  critical: { max: 100, min: 90 },
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

export const threatEventPriorityValidator = v.union(
  v.literal(PRIORITY_LEVELS.low),
  v.literal(PRIORITY_LEVELS.medium),
  v.literal(PRIORITY_LEVELS.high),
  v.literal(PRIORITY_LEVELS.critical),
);

export const threatEventScoringStatusValidator = v.union(
  v.literal(SCORING_STATUSES.unscored),
  v.literal(SCORING_STATUSES.scored),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreatEventStatus = Infer<typeof threatEventStatusValidator>;
export type ThreatEventMatchedField = Infer<
  typeof threatEventMatchedFieldValidator
>;
export type ThreatEventSeverity = Infer<typeof threatIndicatorSeverityValidator>;
export type ThreatEventPriority = Infer<typeof threatEventPriorityValidator>;
export type ThreatEventScoringStatus = Infer<
  typeof threatEventScoringStatusValidator
>;

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

// ---------------------------------------------------------------------------
// Severity Scoring Foundation Helpers
// ---------------------------------------------------------------------------

export function clampSeverityScore(score: number) {
  if (!Number.isFinite(score)) {
    return SEVERITY_SCORE_MIN;
  }

  const roundedScore = Math.round(score);

  if (roundedScore < SEVERITY_SCORE_MIN) {
    return SEVERITY_SCORE_MIN;
  }

  if (roundedScore > SEVERITY_SCORE_MAX) {
    return SEVERITY_SCORE_MAX;
  }

  return roundedScore;
}

export function getPriorityFromSeverityScore(
  score: number,
): ThreatEventPriority {
  const clampedScore = clampSeverityScore(score);

  if (clampedScore >= PRIORITY_SCORE_BANDS.critical.min) {
    return PRIORITY_LEVELS.critical;
  }

  if (clampedScore >= PRIORITY_SCORE_BANDS.high.min) {
    return PRIORITY_LEVELS.high;
  }

  if (clampedScore >= PRIORITY_SCORE_BANDS.medium.min) {
    return PRIORITY_LEVELS.medium;
  }

  return PRIORITY_LEVELS.low;
}

export function isValidSeverityScore(score: number) {
  return (
    Number.isFinite(score) &&
    score >= SEVERITY_SCORE_MIN &&
    score <= SEVERITY_SCORE_MAX
  );
}

export function isValidPriority(
  priority: string,
): priority is ThreatEventPriority {
  return Object.values(PRIORITY_LEVELS).includes(
    priority as ThreatEventPriority,
  );
}

export function isValidScoringStatus(
  status: string,
): status is ThreatEventScoringStatus {
  return Object.values(SCORING_STATUSES).includes(
    status as ThreatEventScoringStatus,
  );
}

export function getPriorityLabel(priority: ThreatEventPriority) {
  const labels: Record<ThreatEventPriority, string> = {
    critical: "Critical",
    high: "High",
    low: "Low",
    medium: "Medium",
  };

  return labels[priority];
}

export function getScoringStatusLabel(status: ThreatEventScoringStatus) {
  const labels: Record<ThreatEventScoringStatus, string> = {
    scored: "Scored",
    unscored: "Unscored",
  };

  return labels[status];
}
