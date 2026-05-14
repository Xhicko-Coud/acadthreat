import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import { action, internalQuery, type ActionCtx } from "@convex/_generated/server";
import { authComponent } from "@convex/auth";
import {
  USER_PROFILE_ROLES,
  USER_PROFILE_STATUSES,
} from "@convex/auth/authorization";
import {
  FEED_PROVIDERS,
  FEED_SYNC_STATUSES,
  buildEmptyFeedSyncCounts,
  normalizeFeedProvider,
  sanitizeProviderText,
  type FeedProvider,
  type FeedSyncCounts,
} from "@convex/threatFeeds/helpers";
import {
  URLHAUS_AUTH_ENV,
  URLHAUS_PROVIDER,
  fetchUrlhausRecentUrls,
} from "@convex/threatFeeds/providers/urlhaus";

const DEFAULT_SYNC_LIMIT = 50;
const MIN_SYNC_LIMIT = 1;
const MAX_SYNC_LIMIT = 1000;

type ThreatFeedSyncOperationStatus =
  | "completed"
  | "failed"
  | "forbidden"
  | "invalid_input"
  | "provider_failed"
  | "provider_not_enabled"
  | "provider_skipped"
  | "unauthenticated";

type ThreatFeedSyncOperationResult =
  | {
      counts: FeedSyncCounts;
      limit: number;
      provider: typeof URLHAUS_PROVIDER;
      status: "completed";
    }
  | {
      counts: FeedSyncCounts;
      message: string;
      provider: Exclude<FeedProvider, typeof URLHAUS_PROVIDER>;
      status: "provider_not_enabled";
    }
  | {
      counts: FeedSyncCounts;
      provider: string;
      status: "forbidden" | "invalid_input" | "unauthenticated";
    }
  | {
      counts: FeedSyncCounts;
      provider: typeof URLHAUS_PROVIDER;
      reason?: string;
      status: "failed" | "provider_failed" | "provider_skipped";
    };

export const runThreatFeedSyncOperation = action({
  args: {
    limit: v.optional(v.number()),
    provider: v.string(),
  },
  handler: async (ctx, args): Promise<ThreatFeedSyncOperationResult> => {
    const provider = normalizeFeedProvider(args.provider);
    const safeProvider = provider ?? sanitizeProviderText(args.provider) ?? "unknown";

    if (!provider) {
      return buildAccessResult("invalid_input", safeProvider);
    }

    const access = await getThreatFeedSyncOperationAccess(ctx);

    if (access.status !== "allowed") {
      return buildAccessResult(access.status, provider);
    }

    if (provider !== FEED_PROVIDERS.urlhaus) {
      return {
        counts: buildEmptyFeedSyncCounts(),
        message: "This provider is not enabled in this MVP.",
        provider,
        status: "provider_not_enabled",
      };
    }

    const authKey = process.env[URLHAUS_AUTH_ENV]?.trim();

    if (!authKey) {
      return {
        counts: buildEmptyFeedSyncCounts(),
        provider: URLHAUS_PROVIDER,
        reason: "missing_auth_key",
        status: FEED_SYNC_STATUSES.providerSkipped,
      };
    }

    try {
      return await runUrlhausSync(ctx, {
        authKey,
        limit: normalizeSyncLimit(args.limit),
      });
    } catch {
      return {
        counts: buildEmptyFeedSyncCounts(),
        provider: URLHAUS_PROVIDER,
        status: FEED_SYNC_STATUSES.failed,
      };
    }
  },
});

export const getThreatFeedSyncOperationAccessInternal = internalQuery({
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

    if (profile.role !== USER_PROFILE_ROLES.admin) {
      return { status: "forbidden" } as const;
    }

    return { status: "allowed" } as const;
  },
});

async function getThreatFeedSyncOperationAccess(ctx: ActionCtx) {
  const actor = await getCurrentAuthUser(ctx);

  if (!actor) {
    return { status: "unauthenticated" } as const;
  }

  const access = await ctx.runQuery(
    internal.threatFeeds.operations.getThreatFeedSyncOperationAccessInternal,
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

async function runUrlhausSync(
  ctx: ActionCtx,
  args: {
    authKey: string;
    limit: number;
  },
): Promise<ThreatFeedSyncOperationResult> {
  const fetchResult = await fetchUrlhausRecentUrls({
    authKey: args.authKey,
    limit: args.limit,
    now: Date.now(),
  });

  if (fetchResult.status === FEED_SYNC_STATUSES.providerSkipped) {
    return {
      counts: fetchResult.counts,
      provider: URLHAUS_PROVIDER,
      reason: fetchResult.reason,
      status: FEED_SYNC_STATUSES.providerSkipped,
    };
  }

  if (fetchResult.status === FEED_SYNC_STATUSES.providerFailed) {
    return {
      counts: {
        ...fetchResult.counts,
        failed: Math.max(fetchResult.counts.failed, 1),
      },
      provider: URLHAUS_PROVIDER,
      reason: fetchResult.reason,
      status: FEED_SYNC_STATUSES.providerFailed,
    };
  }

  const counts: FeedSyncCounts = {
    ...fetchResult.counts,
    inserted: 0,
    updated: 0,
  };

  for (const indicator of fetchResult.indicators) {
    try {
      const result = await ctx.runMutation(
        internal.threatFeeds.sync.upsertThreatIndicatorFromFeedInternal,
        { indicator },
      );

      applyUpsertResult(counts, result.status);
    } catch {
      counts.failed += 1;
    }
  }

  return {
    counts,
    limit: args.limit,
    provider: URLHAUS_PROVIDER,
    status: FEED_SYNC_STATUSES.completed,
  };
}

function buildAccessResult(
  status: Extract<
    ThreatFeedSyncOperationStatus,
    "forbidden" | "invalid_input" | "unauthenticated"
  >,
  provider: string,
): ThreatFeedSyncOperationResult {
  return {
    counts: buildEmptyFeedSyncCounts(),
    provider,
    status,
  };
}

function applyUpsertResult(
  counts: FeedSyncCounts,
  status: "failed" | "inserted" | "invalid_input" | "skipped" | "updated",
) {
  if (status === "inserted") {
    counts.inserted += 1;
    return;
  }

  if (status === "updated") {
    counts.updated += 1;
    return;
  }

  if (status === "skipped" || status === "invalid_input") {
    counts.skipped += 1;
    return;
  }

  counts.failed += 1;
}

function normalizeSyncLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_SYNC_LIMIT;
  }

  return Math.min(MAX_SYNC_LIMIT, Math.max(MIN_SYNC_LIMIT, Math.trunc(limit)));
}
