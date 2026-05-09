import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
} from "@convex/_generated/server";
import {
  USER_PROFILE_ROLES,
  USER_PROFILE_STATUSES,
} from "@convex/auth/authorization";

export const hasAdminProfile = internalQuery({
  args: {},
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (lookup) => lookup.eq("role", USER_PROFILE_ROLES.admin))
      .first();

    return profile !== null;
  },
});

export const getAdminProfileByEmail = internalQuery({
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

export const createAdminProfile = internalMutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", args.userId))
      .unique();

    if (existingProfile) {
      return { status: "profile_exists" } as const;
    }

    const now = Date.now();

    await ctx.db.insert("userProfiles", {
      createdAt: now,
      email: args.email,
      name: args.name,
      role: USER_PROFILE_ROLES.admin,
      status: USER_PROFILE_STATUSES.active,
      updatedAt: now,
      userId: args.userId,
    });

    return { status: "created" } as const;
  },
});

export const updateAdminProfileUserId = internalMutation({
  args: {
    profileId: v.id("userProfiles"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db.get(args.profileId);

    if (!existingProfile) {
      return { status: "missing_profile" } as const;
    }

    await ctx.db.patch(args.profileId, {
      updatedAt: Date.now(),
      userId: args.userId,
    });

    return { status: "updated" } as const;
  },
});
