import { v } from "convex/values";

import { authComponent } from "@convex/auth";
import { mutation, type MutationCtx } from "@convex/_generated/server";
import {
  canUpdateThreatEventStatus,
  threatEventStatusValidator,
} from "@convex/threatEvents/helpers";

export const updateThreatEventStatus = mutation({
  args: {
    status: threatEventStatusValidator,
    threatEventId: v.id("threatEvents"),
  },
  handler: async (ctx, args) => {
    const access = await getThreatEventStatusUpdateContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const threatEvent = await ctx.db.get(args.threatEventId);

    if (!threatEvent) {
      return { status: "not_found" } as const;
    }

    if (threatEvent.status === args.status) {
      return { status: "unchanged" } as const;
    }

    try {
      await ctx.db.patch(args.threatEventId, {
        status: args.status,
        updatedAt: Date.now(),
      });

      return { status: "updated" } as const;
    } catch {
      return { status: "failed" } as const;
    }
  },
});

async function getThreatEventStatusUpdateContext(ctx: MutationCtx) {
  const user = await getCurrentMutationAuthUser(ctx);

  if (!user) {
    return { status: "unauthenticated" } as const;
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (lookup) => lookup.eq("userId", user._id))
    .unique();

  if (!profile || profile.status !== "active") {
    return { status: "forbidden" } as const;
  }

  if (!canUpdateThreatEventStatus(profile.role)) {
    return { status: "forbidden" } as const;
  }

  return {
    profile,
    status: "success",
    user,
  } as const;
}

async function getCurrentMutationAuthUser(
  ctx: Parameters<typeof authComponent.getAuthUser>[0],
) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
}
