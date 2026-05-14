import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { action, internalQuery, type ActionCtx } from "@convex/_generated/server";
import { authComponent } from "@convex/auth";
import {
  USER_PROFILE_ROLES,
  USER_PROFILE_STATUSES,
} from "@convex/auth/authorization";
import { SCORING_STATUSES } from "@convex/threatEvents/helpers";

const DEFAULT_OPERATION_LIMIT = 100;
const MIN_OPERATION_LIMIT = 1;
const MAX_OPERATION_LIMIT = 500;

type CorrelationOperationCounts = {
  created: number;
  failed: number;
  noMatches: number;
  processed: number;
  skipped: number;
  total: number;
};

type SeverityScoringOperationCounts = {
  failed: number;
  processed: number;
  scored: number;
  skipped: number;
  total: number;
};

type CorrelationOperationResult =
  | {
      counts: CorrelationOperationCounts;
      operation: "correlation";
      status: "completed";
    }
  | {
      counts: CorrelationOperationCounts;
      operation: "correlation";
      status: "failed" | "forbidden" | "unauthenticated";
    };

type SeverityScoringOperationResult =
  | {
      counts: SeverityScoringOperationCounts;
      operation: "severity_scoring";
      status: "completed";
    }
  | {
      counts: SeverityScoringOperationCounts;
      operation: "severity_scoring";
      status: "failed" | "forbidden" | "unauthenticated";
    };

export const runCorrelationOperation = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<CorrelationOperationResult> => {
    const access = await getThreatEventOperationAccess(ctx);

    if (access.status !== "allowed") {
      return buildCorrelationAccessResult(access.status);
    }

    try {
      return await runCorrelation(ctx, normalizeOperationLimit(args.limit));
    } catch {
      return {
        counts: buildEmptyCorrelationCounts(),
        operation: "correlation",
        status: "failed",
      };
    }
  },
});

export const runSeverityScoringOperation = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SeverityScoringOperationResult> => {
    const access = await getThreatEventOperationAccess(ctx);

    if (access.status !== "allowed") {
      return buildSeverityScoringAccessResult(access.status);
    }

    try {
      return await runSeverityScoring(ctx, normalizeOperationLimit(args.limit));
    } catch {
      return {
        counts: buildEmptySeverityScoringCounts(),
        operation: "severity_scoring",
        status: "failed",
      };
    }
  },
});

export const getThreatEventOperationAccessInternal = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (lookup) => lookup.eq("userId", args.userId))
      .unique();

    if (!profile || profile.status !== USER_PROFILE_STATUSES.active) {
      return { status: "forbidden" } as const;
    }

    if (
      profile.role !== USER_PROFILE_ROLES.admin &&
      profile.role !== USER_PROFILE_ROLES.analyst
    ) {
      return { status: "forbidden" } as const;
    }

    return { status: "allowed" } as const;
  },
});

export const listRecentNormalizedEventsForCorrelationInternal = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args): Promise<{ id: Id<"normalizedEvents"> }[]> => {
    const limit = normalizeOperationLimit(args.limit);

    const events = await ctx.db
      .query("normalizedEvents")
      .withIndex("by_eventTimestamp")
      .order("desc")
      .take(limit);

    return events.map((event) => ({ id: event._id }));
  },
});

export const listRecentThreatEventsForScoringOperationInternal = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args): Promise<{ id: Id<"threatEvents"> }[]> => {
    const limit = normalizeOperationLimit(args.limit);
    const unscoredThreatEvents = await ctx.db
      .query("threatEvents")
      .withIndex("by_scoringStatus_and_detectedAt", (lookup) =>
        lookup.eq("scoringStatus", SCORING_STATUSES.unscored),
      )
      .order("desc")
      .take(limit);

    if (unscoredThreatEvents.length >= limit) {
      return unscoredThreatEvents.map((event) => ({ id: event._id }));
    }

    const recentThreatEvents = await ctx.db
      .query("threatEvents")
      .withIndex("by_detectedAt")
      .order("desc")
      .take(limit - unscoredThreatEvents.length);
    const seenThreatEventIds = new Set(
      unscoredThreatEvents.map((event) => event._id),
    );
    const additionalThreatEvents = recentThreatEvents.filter(
      (event) => !seenThreatEventIds.has(event._id),
    );

    return [...unscoredThreatEvents, ...additionalThreatEvents].map((event) => ({
      id: event._id,
    }));
  },
});

async function getThreatEventOperationAccess(ctx: ActionCtx) {
  const actor = await getCurrentAuthUser(ctx);

  if (!actor) {
    return { status: "unauthenticated" } as const;
  }

  const access = await ctx.runQuery(
    internal.threatEvents.operations.getThreatEventOperationAccessInternal,
    { userId: actor._id },
  );

  if (access.status !== "allowed") {
    return { status: "forbidden" } as const;
  }

  return { status: "allowed" } as const;
}

async function getCurrentAuthUser(ctx: ActionCtx) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
}

async function runCorrelation(
  ctx: ActionCtx,
  limit: number,
): Promise<CorrelationOperationResult> {
  const counts = buildEmptyCorrelationCounts();
  const recentEvents = await ctx.runQuery(
    internal.threatEvents.operations.listRecentNormalizedEventsForCorrelationInternal,
    { limit },
  );

  counts.total = recentEvents.length;

  for (const event of recentEvents) {
    try {
      const result = await ctx.runMutation(
        internal.threatEvents.correlation.correlateNormalizedEventInternal,
        { normalizedEventId: event.id },
      );

      applyCorrelationResult(counts, result);
    } catch {
      counts.processed += 1;
      counts.failed += 1;
    }
  }

  return {
    counts,
    operation: "correlation",
    status: "completed",
  };
}

async function runSeverityScoring(
  ctx: ActionCtx,
  limit: number,
): Promise<SeverityScoringOperationResult> {
  const counts = buildEmptySeverityScoringCounts();
  const recentThreatEvents = await ctx.runQuery(
    internal.threatEvents.operations.listRecentThreatEventsForScoringOperationInternal,
    { limit },
  );

  counts.total = recentThreatEvents.length;

  for (const threatEvent of recentThreatEvents) {
    try {
      const result = await ctx.runMutation(
        internal.threatEvents.scoring.scoreThreatEventInternal,
        { threatEventId: threatEvent.id },
      );

      applySeverityScoringResult(counts, result.status);
    } catch {
      counts.processed += 1;
      counts.failed += 1;
    }
  }

  return {
    counts,
    operation: "severity_scoring",
    status: "completed",
  };
}

function applyCorrelationResult(
  counts: CorrelationOperationCounts,
  result:
    | {
        created: number;
        matches: number;
        skipped: number;
        status: "correlated";
      }
    | {
        created: 0;
        skipped: 0;
        status: "not_found";
      }
    | {
        created: 0;
        matches: 0;
        skipped: 0;
        status: "failed" | "no_matches";
      },
) {
  counts.processed += 1;

  if (result.status === "correlated") {
    counts.created += result.created;
    counts.skipped += result.skipped;
    return;
  }

  if (result.status === "no_matches") {
    counts.noMatches += 1;
    return;
  }

  if (result.status === "not_found") {
    counts.skipped += 1;
    return;
  }

  counts.failed += 1;
}

function applySeverityScoringResult(
  counts: SeverityScoringOperationCounts,
  status: "failed" | "not_found" | "scored",
) {
  counts.processed += 1;

  if (status === "scored") {
    counts.scored += 1;
    return;
  }

  if (status === "not_found") {
    counts.skipped += 1;
    return;
  }

  counts.failed += 1;
}

function buildCorrelationAccessResult(
  status: "forbidden" | "unauthenticated",
): CorrelationOperationResult {
  return {
    counts: buildEmptyCorrelationCounts(),
    operation: "correlation",
    status,
  };
}

function buildSeverityScoringAccessResult(
  status: "forbidden" | "unauthenticated",
): SeverityScoringOperationResult {
  return {
    counts: buildEmptySeverityScoringCounts(),
    operation: "severity_scoring",
    status,
  };
}

function buildEmptyCorrelationCounts(): CorrelationOperationCounts {
  return {
    created: 0,
    failed: 0,
    noMatches: 0,
    processed: 0,
    skipped: 0,
    total: 0,
  };
}

function buildEmptySeverityScoringCounts(): SeverityScoringOperationCounts {
  return {
    failed: 0,
    processed: 0,
    scored: 0,
    skipped: 0,
    total: 0,
  };
}

function normalizeOperationLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_OPERATION_LIMIT;
  }

  return Math.min(
    MAX_OPERATION_LIMIT,
    Math.max(MIN_OPERATION_LIMIT, Math.trunc(limit)),
  );
}
