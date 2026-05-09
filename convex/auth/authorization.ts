import { ConvexError } from "convex/values";

import { query, type QueryCtx } from "@convex/_generated/server";
import { authComponent } from "@convex/auth";

export const USER_PROFILE_ROLES = {
  admin: "admin",
  analyst: "analyst",
  viewer: "viewer",
} as const;

export const USER_PROFILE_STATUSES = {
  active: "active",
  inactive: "inactive",
} as const;

export type UserProfileRole =
  (typeof USER_PROFILE_ROLES)[keyof typeof USER_PROFILE_ROLES];
export type UserProfileStatus =
  (typeof USER_PROFILE_STATUSES)[keyof typeof USER_PROFILE_STATUSES];

export async function getCurrentAuthUser(ctx: QueryCtx) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
}

export async function getUserProfileByUserId(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (lookup) => lookup.eq("userId", userId))
    .unique();
}

export async function getCurrentUserProfile(ctx: QueryCtx) {
  const user = await getCurrentAuthUser(ctx);

  if (!user) {
    return null;
  }

  return await getUserProfileByUserId(ctx, user._id);
}

export async function requireActiveProfile(ctx: QueryCtx) {
  const user = await getCurrentAuthUser(ctx);

  if (!user) {
    throw new ConvexError("Unauthenticated");
  }

  const profile = await getUserProfileByUserId(ctx, user._id);

  if (!profile) {
    throw new ConvexError("Missing profile");
  }

  if (profile.status !== USER_PROFILE_STATUSES.active) {
    throw new ConvexError("Inactive profile");
  }

  return { profile, user };
}

export async function requireRole(
  ctx: QueryCtx,
  allowedRoles: readonly UserProfileRole[],
) {
  const access = await requireActiveProfile(ctx);

  if (allowedRoles.includes(access.profile.role)) {
    return access;
  }

  throw new ConvexError("Forbidden");
}

export const getAccessStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentAuthUser(ctx);

    if (!user) {
      return { status: "unauthenticated" } as const;
    }

    const profile = await getUserProfileByUserId(ctx, user._id);

    if (!profile) {
      return { status: "missing_profile" } as const;
    }

    if (profile.status === USER_PROFILE_STATUSES.inactive) {
      return { status: "inactive" } as const;
    }

    return {
      status: "success",
      profile: {
        email: profile.email,
        name: profile.name ?? null,
        role: profile.role,
        status: profile.status,
      },
    } as const;
  },
});
