import { v } from "convex/values";

import type { Id } from "@convex/_generated/dataModel";
import { authComponent } from "@convex/auth";
import { mutation, type MutationCtx } from "@convex/_generated/server";
import {
  THREAT_INDICATOR_STATUSES,
  getThreatIndicatorDuplicateByTypeAndNormalizedValue,
  threatIndicatorWritePayloadValidator,
  validateThreatIndicatorPayload,
} from "@convex/threatIndicators/helpers";

export const createThreatIndicator = mutation({
  args: threatIndicatorWritePayloadValidator,
  handler: async (ctx, args) => {
    const access = await getThreatIndicatorWriteContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const validation = validateThreatIndicatorPayload(args);

    if (!validation.isValid) {
      return {
        issues: validation.issues,
        status: "invalid_input",
      } as const;
    }

    const duplicate = await getThreatIndicatorDuplicateByTypeAndNormalizedValue(
      ctx,
      {
        normalizedValue: validation.data.normalizedValue,
        type: validation.data.type,
      },
    );

    if (duplicate) {
      return { status: "duplicate_indicator" } as const;
    }

    const now = Date.now();
    const actorEmail = access.profile.email;
    const actorUserId = access.user._id;

    await ctx.db.insert("threatIndicators", {
      confidence: validation.data.confidence,
      createdAt: now,
      createdByEmail: actorEmail,
      createdByUserId: actorUserId,
      description: validation.data.description,
      normalizedValue: validation.data.normalizedValue,
      severity: validation.data.severity,
      source: validation.data.source,
      status: THREAT_INDICATOR_STATUSES.active,
      type: validation.data.type,
      updatedAt: now,
      updatedByEmail: actorEmail,
      updatedByUserId: actorUserId,
      value: validation.data.value,
    });

    return { status: "created" } as const;
  },
});

export const updateThreatIndicator = mutation({
  args: {
    indicatorId: v.id("threatIndicators"),
    ...threatIndicatorWritePayloadValidator,
  },
  handler: async (ctx, args) => {
    const access = await getThreatIndicatorWriteContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const indicator = await ctx.db.get(args.indicatorId);

    if (!indicator) {
      return { status: "not_found" } as const;
    }

    const validation = validateThreatIndicatorPayload(args);

    if (!validation.isValid) {
      return {
        issues: validation.issues,
        status: "invalid_input",
      } as const;
    }

    const duplicate = await getThreatIndicatorDuplicateByTypeAndNormalizedValue(
      ctx,
      {
        excludeIndicatorId: args.indicatorId,
        normalizedValue: validation.data.normalizedValue,
        type: validation.data.type,
      },
    );

    if (duplicate) {
      return { status: "duplicate_indicator" } as const;
    }

    const nextDescription = validation.data.description;
    const nextSource = validation.data.source;
    const hasChanges =
      indicator.value !== validation.data.value ||
      indicator.normalizedValue !== validation.data.normalizedValue ||
      indicator.type !== validation.data.type ||
      indicator.severity !== validation.data.severity ||
      indicator.confidence !== validation.data.confidence ||
      (indicator.source ?? undefined) !== nextSource ||
      (indicator.description ?? undefined) !== nextDescription;

    if (!hasChanges) {
      return { status: "unchanged" } as const;
    }

    await ctx.db.patch(args.indicatorId, {
      confidence: validation.data.confidence,
      description: nextDescription,
      normalizedValue: validation.data.normalizedValue,
      severity: validation.data.severity,
      source: nextSource,
      type: validation.data.type,
      updatedAt: Date.now(),
      updatedByEmail: access.profile.email,
      updatedByUserId: access.user._id,
      value: validation.data.value,
    });

    return { status: "updated" } as const;
  },
});

export const archiveThreatIndicator = mutation({
  args: {
    indicatorId: v.id("threatIndicators"),
  },
  handler: async (ctx, args) => {
    return await updateThreatIndicatorStatus(
      ctx,
      args.indicatorId,
      THREAT_INDICATOR_STATUSES.archived,
      "archived",
    );
  },
});

export const markThreatIndicatorFalsePositive = mutation({
  args: {
    indicatorId: v.id("threatIndicators"),
  },
  handler: async (ctx, args) => {
    return await updateThreatIndicatorStatus(
      ctx,
      args.indicatorId,
      THREAT_INDICATOR_STATUSES.falsePositive,
      "marked_false_positive",
    );
  },
});

export const reactivateThreatIndicator = mutation({
  args: {
    indicatorId: v.id("threatIndicators"),
  },
  handler: async (ctx, args) => {
    return await updateThreatIndicatorStatus(
      ctx,
      args.indicatorId,
      THREAT_INDICATOR_STATUSES.active,
      "reactivated",
    );
  },
});

async function getThreatIndicatorWriteContext(
  ctx: MutationCtx,
) {
  const user = await getCurrentMutationAuthUser(ctx);

  if (!user) {
    return { status: "unauthenticated" } as const;
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (lookup) => lookup.eq("userId", user._id))
    .unique();

  if (
    !profile ||
    profile.status !== "active" ||
    (profile.role !== "admin" && profile.role !== "analyst")
  ) {
    return { status: "forbidden" } as const;
  }

  return {
    profile,
    status: "success",
    user,
  } as const;
}

async function updateThreatIndicatorStatus(
  ctx: MutationCtx,
  indicatorId: Id<"threatIndicators">,
  nextStatus: "active" | "archived" | "false_positive",
  successStatus: "archived" | "marked_false_positive" | "reactivated",
) {
  const access = await getThreatIndicatorWriteContext(ctx);

  if (access.status !== "success") {
    return access;
  }

  const indicator = await ctx.db.get(indicatorId);

  if (!indicator) {
    return { status: "not_found" } as const;
  }

  if (indicator.status === nextStatus) {
    return { status: "unchanged" } as const;
  }

  await ctx.db.patch(indicatorId, {
    status: nextStatus,
    updatedAt: Date.now(),
    updatedByEmail: access.profile.email,
    updatedByUserId: access.user._id,
  });

  return { status: successStatus } as const;
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
