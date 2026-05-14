"use node";

import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";

import { internal } from "@convex/_generated/api";
import type { DataModel } from "@convex/_generated/dataModel";
import { action } from "@convex/_generated/server";
import { authComponent } from "@convex/auth";
import {
  USER_PROFILE_ROLES,
  USER_PROFILE_STATUSES,
} from "@convex/auth/authorization";

type UserManagementActionCtx = GenericActionCtx<DataModel>;

export const deactivateUser = action({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await updateManagedUserStatus(ctx, args.targetUserId, USER_PROFILE_STATUSES.inactive);
  },
});

export const reactivateUser = action({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await updateManagedUserStatus(ctx, args.targetUserId, USER_PROFILE_STATUSES.active);
  },
});

async function updateManagedUserStatus(
  ctx: UserManagementActionCtx,
  targetUserId: string,
  nextStatus: "active" | "inactive",
) {
  const actor = await getCurrentAuthUser(ctx);

  if (!actor) {
    return { status: "unauthenticated" } as const;
  }

  const access = await ctx.runQuery(
    internal.mutations.userManagement.getUserManagementAccess,
    { userId: actor._id },
  );

  if (access.status !== "allowed") {
    return { status: "forbidden" } as const;
  }

  const normalizedTargetUserId = targetUserId.trim();

  if (!normalizedTargetUserId) {
    return { status: "invalid_input" } as const;
  }

  if (normalizedTargetUserId === actor._id) {
    return { status: "self_action_blocked" } as const;
  }

  const targetProfile = await ctx.runQuery(
    internal.mutations.userManagement.getManagedUserProfile,
    { userId: normalizedTargetUserId },
  );

  if (!targetProfile) {
    return { status: "not_found" } as const;
  }

  if (
    nextStatus === USER_PROFILE_STATUSES.inactive &&
    targetProfile.role === USER_PROFILE_ROLES.admin
  ) {
    const activeAdminCount = await ctx.runQuery(
      internal.mutations.userManagement.countActiveAdminProfiles,
      {},
    );

    if (activeAdminCount <= 1) {
      return { status: "last_admin_blocked" } as const;
    }
  }

  const result = await ctx.runMutation(
    internal.mutations.userManagement.setUserStatus,
    {
      status: nextStatus,
      userId: normalizedTargetUserId,
    },
  );

  if (result.status === "success") {
    return { status: "success" } as const;
  }

  if (result.status === "already_active") {
    return { status: "already_active" } as const;
  }

  if (result.status === "already_inactive") {
    return { status: "already_inactive" } as const;
  }

  if (result.status === "not_found") {
    return { status: "not_found" } as const;
  }

  return { status: "failed" } as const;
}

async function getCurrentAuthUser(ctx: UserManagementActionCtx) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
}
