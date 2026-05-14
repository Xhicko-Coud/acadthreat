import { v } from "convex/values";

import type { Doc } from "@convex/_generated/dataModel";
import { mutation, type MutationCtx } from "@convex/_generated/server";
import {
  USER_PROFILE_ROLES,
  USER_PROFILE_STATUSES,
} from "@convex/auth/authorization";
import { authComponent } from "@convex/auth";

type UserRole = "admin" | "analyst" | "viewer";

type UpdateUserRoleResult =
  | {
      status: "updated";
      userId: string;
      role: UserRole;
    }
  | {
      status: "unchanged";
      userId: string;
      role: UserRole;
    }
  | {
      status: "forbidden";
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "not_found";
    }
  | {
      status: "invalid_input";
    }
  | {
      status: "last_admin_blocked";
    }
  | {
      status: "failed";
    };

type TargetProfile = Doc<"userProfiles">;

export const updateUserRole = mutation({
  args: {
    role: v.union(
      v.literal(USER_PROFILE_ROLES.admin),
      v.literal(USER_PROFILE_ROLES.analyst),
      v.literal(USER_PROFILE_ROLES.viewer),
    ),
    targetUserId: v.string(),
  },
  handler: async (ctx, args): Promise<UpdateUserRoleResult> => {
    const actor = await getCurrentAuthUser(ctx);

    if (!actor) {
      return { status: "unauthenticated" };
    }

    const actorProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", actor._id))
      .unique();

    if (
      !actorProfile ||
      actorProfile.status !== USER_PROFILE_STATUSES.active ||
      actorProfile.role !== USER_PROFILE_ROLES.admin
    ) {
      return { status: "forbidden" };
    }

    const normalizedTargetUserId = args.targetUserId.trim();

    if (!normalizedTargetUserId) {
      return { status: "invalid_input" };
    }

    const targetProfile: TargetProfile | null = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) =>
        lookup.eq("userId", normalizedTargetUserId),
      )
      .unique();

    if (!targetProfile) {
      return { status: "not_found" };
    }

    if (
      targetProfile.role === USER_PROFILE_ROLES.admin &&
      args.role !== USER_PROFILE_ROLES.admin
    ) {
      const activeAdminCount = await countActiveAdmins(ctx);

      if (activeAdminCount <= 1) {
        return { status: "last_admin_blocked" };
      }
    }

    if (targetProfile.role === args.role) {
      return {
        role: targetProfile.role,
        status: "unchanged",
        userId: targetProfile.userId,
      };
    }

    await ctx.db.patch(targetProfile._id, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return {
      role: args.role,
      status: "updated",
      userId: targetProfile.userId,
    };
  },
});

async function getCurrentAuthUser(ctx: MutationCtx) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
}

async function countActiveAdmins(ctx: MutationCtx) {
  const adminProfiles = await ctx.db
    .query("userProfiles")
    .withIndex("by_role", (lookup) => lookup.eq("role", USER_PROFILE_ROLES.admin))
    .collect();

  return adminProfiles.filter(
    (profile) => profile.status === USER_PROFILE_STATUSES.active,
  ).length;
}
