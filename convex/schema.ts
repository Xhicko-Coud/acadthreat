import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const threatIndicatorTypeValidator = v.union(
  v.literal("ip"),
  v.literal("domain"),
  v.literal("url"),
  v.literal("hash"),
  v.literal("email"),
  v.literal("keyword"),
);

const threatIndicatorSeverityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const threatIndicatorStatusValidator = v.union(
  v.literal("active"),
  v.literal("archived"),
  v.literal("false_positive"),
);

const logSourceTypeValidator = v.union(
  v.literal("authentication"),
  v.literal("firewall"),
);

const logIngestionStatusValidator = v.union(
  v.literal("received"),
  v.literal("normalized"),
  v.literal("normalization_failed"),
);

const logParseStatusValidator = v.union(
  v.literal("pending"),
  v.literal("parsed"),
  v.literal("parse_error"),
);

const normalizedEventSeverityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const threatEventMatchedFieldValidator = v.union(
  v.literal("srcIp"),
  v.literal("destIp"),
  v.literal("actor"),
  v.literal("requestPath"),
  v.literal("message"),
  v.literal("eventType"),
  v.literal("action"),
  v.literal("outcome"),
  v.literal("other"),
);

const threatEventStatusValidator = v.union(
  v.literal("open"),
  v.literal("investigating"),
  v.literal("resolved"),
  v.literal("false_positive"),
);

export default defineSchema({
  healthChecks: defineTable({
    message: v.string(),
    checkedAt: v.number(),
  }),
  authDiagnostics: defineTable({
    event: v.union(v.literal("login_failed"), v.literal("login_exception")),
    source: v.literal("login_page"),
    maskedEmail: v.optional(v.string()),
    emailDomain: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorStatus: v.optional(v.number()),
    safeReasonCategory: v.union(
      v.literal("invalid_credentials"),
      v.literal("auth_server_unreachable"),
      v.literal("unknown_auth_error"),
    ),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_event", ["event"]),
  userProfiles: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),
      v.literal("analyst"),
      v.literal("viewer"),
    ),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"]),
  threatIndicators: defineTable({
    value: v.string(),
    normalizedValue: v.string(),
    type: threatIndicatorTypeValidator,
    severity: threatIndicatorSeverityValidator,
    confidence: v.number(),
    source: v.optional(v.string()),
    description: v.optional(v.string()),
    status: threatIndicatorStatusValidator,
    createdByUserId: v.string(),
    createdByEmail: v.string(),
    updatedByUserId: v.string(),
    updatedByEmail: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_createdAt", ["createdAt"])
    .index("by_createdByUserId", ["createdByUserId"])
    .index("by_updatedByUserId", ["updatedByUserId"])
    .index("by_type_and_normalizedValue", ["type", "normalizedValue"])
    .index("by_status_and_createdAt", ["status", "createdAt"]),
  rawLogs: defineTable({
    sourceType: logSourceTypeValidator,
    sourceName: v.optional(v.string()),
    receivedAt: v.number(),
    eventTimestamp: v.optional(v.number()),
    payload: v.string(),
    payloadHash: v.string(),
    idempotencyKey: v.string(),
    ingestionStatus: logIngestionStatusValidator,
    parseStatus: logParseStatusValidator,
    errorMessage: v.optional(v.string()),
    clientId: v.optional(v.string()),
    isSimulated: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_sourceType", ["sourceType"])
    .index("by_ingestionStatus", ["ingestionStatus"])
    .index("by_receivedAt", ["receivedAt"])
    .index("by_sourceType_and_receivedAt", ["sourceType", "receivedAt"]),
  normalizedEvents: defineTable({
    rawLogId: v.id("rawLogs"),
    sourceType: logSourceTypeValidator,
    eventType: v.string(),
    eventTimestamp: v.number(),
    actor: v.optional(v.string()),
    srcIp: v.optional(v.string()),
    destIp: v.optional(v.string()),
    srcPort: v.optional(v.number()),
    destPort: v.optional(v.number()),
    protocol: v.optional(v.string()),
    action: v.optional(v.string()),
    outcome: v.optional(v.string()),
    severity: v.optional(normalizedEventSeverityValidator),
    userAgent: v.optional(v.string()),
    requestPath: v.optional(v.string()),
    message: v.optional(v.string()),
    isSimulated: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_rawLogId", ["rawLogId"])
    .index("by_sourceType", ["sourceType"])
    .index("by_eventType", ["eventType"])
    .index("by_eventTimestamp", ["eventTimestamp"])
    .index("by_sourceType_and_eventTimestamp", ["sourceType", "eventTimestamp"])
    .index("by_srcIp", ["srcIp"]),
  threatEvents: defineTable({
    normalizedEventId: v.id("normalizedEvents"),
    rawLogId: v.optional(v.id("rawLogs")),
    matchedIndicatorId: v.id("threatIndicators"),
    deduplicationKey: v.string(),
    eventType: v.string(),
    sourceType: logSourceTypeValidator,
    indicatorType: threatIndicatorTypeValidator,
    indicatorValue: v.string(),
    matchedField: threatEventMatchedFieldValidator,
    severity: threatIndicatorSeverityValidator,
    confidence: v.number(),
    status: threatEventStatusValidator,
    correlationReason: v.string(),
    evidenceSummary: v.string(),
    isSimulated: v.boolean(),
    detectedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_deduplicationKey", ["deduplicationKey"])
    .index("by_normalizedEventId", ["normalizedEventId"])
    .index("by_matchedIndicatorId", ["matchedIndicatorId"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_sourceType", ["sourceType"])
    .index("by_detectedAt", ["detectedAt"])
    .index("by_status_and_detectedAt", ["status", "detectedAt"])
    .index("by_severity_and_detectedAt", ["severity", "detectedAt"])
    .index("by_sourceType_and_detectedAt", ["sourceType", "detectedAt"]),
});
