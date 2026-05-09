import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  healthChecks: defineTable({
    message: v.string(),
    checkedAt: v.number(),
  }),
});
