import { v } from "convex/values";

import { mutation } from "@convex/_generated/server";

export const logAuthDiagnostic = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("authDiagnostics", {
      createdAt: Date.now(),
      emailDomain: args.emailDomain,
      errorCode: args.errorCode,
      errorStatus: args.errorStatus,
      event: args.event,
      maskedEmail: args.maskedEmail,
      safeReasonCategory: args.safeReasonCategory,
      source: args.source,
    });

    return { status: "logged" } as const;
  },
});
