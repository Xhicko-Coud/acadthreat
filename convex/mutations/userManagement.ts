import { v } from "convex/values";

import {
  USER_PROFILE_ROLES,
  USER_PROFILE_STATUSES,
} from "@convex/auth/authorization";
import {
  internalMutation,
  internalQuery,
} from "@convex/_generated/server";

export const getUserManagementAccess = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", args.userId))
      .unique();

    if (!profile) {
      return { status: "forbidden" } as const;
    }

    if (profile.status !== USER_PROFILE_STATUSES.active) {
      return { status: "forbidden" } as const;
    }

    if (profile.role !== USER_PROFILE_ROLES.admin) {
      return { status: "forbidden" } as const;
    }

    return {
      status: "allowed",
      profile: {
        email: profile.email,
        name: profile.name ?? null,
        role: profile.role,
        status: profile.status,
        userId: profile.userId,
      },
    } as const;
  },
});

export const getManagedUserProfile = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", args.userId))
      .unique();
  },
});

export const setUserStatus = internalMutation({
  args: {
    status: v.union(
      v.literal(USER_PROFILE_STATUSES.active),
      v.literal(USER_PROFILE_STATUSES.inactive),
    ),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", args.userId))
      .unique();

    if (!profile) {
      return { status: "not_found" } as const;
    }

    if (profile.status === args.status) {
      return {
        status:
          args.status === USER_PROFILE_STATUSES.active
            ? "already_active"
            : "already_inactive",
      } as const;
    }

    await ctx.db.patch(profile._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { status: "success" } as const;
  },
});
