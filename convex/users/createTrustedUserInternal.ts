import { v } from "convex/values";

import {
  USER_PROFILE_ROLES,
  USER_PROFILE_STATUSES,
} from "@convex/auth/authorization";
import {
  internalMutation,
  internalQuery,
} from "@convex/_generated/server";

export const getTrustedUserCreationAccess = internalQuery({
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

    return { status: "allowed" } as const;
  },
});

export const getUserProfileByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (lookup) => lookup.eq("email", args.email))
      .unique();
  },
});

export const createTrustedUserProfile = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal(USER_PROFILE_ROLES.admin),
      v.literal(USER_PROFILE_ROLES.analyst),
      v.literal(USER_PROFILE_ROLES.viewer),
    ),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.role === USER_PROFILE_ROLES.admin) {
      return { status: "unsupported_role_creation" } as const;
    }

    const existingUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", args.userId))
      .unique();

    if (existingUserProfile) {
      return { status: "duplicate_email" } as const;
    }

    const existingEmailProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (lookup) => lookup.eq("email", args.email))
      .unique();

    if (existingEmailProfile) {
      return { status: "duplicate_email" } as const;
    }

    const now = Date.now();

    await ctx.db.insert("userProfiles", {
      createdAt: now,
      email: args.email,
      name: args.name,
      role: args.role,
      status: USER_PROFILE_STATUSES.active,
      updatedAt: now,
      userId: args.userId,
    });

    return { status: "created" } as const;
  },
});
