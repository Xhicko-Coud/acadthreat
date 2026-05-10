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
});
