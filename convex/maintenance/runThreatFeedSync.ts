import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import { action, type ActionCtx } from "@convex/_generated/server";
import {
  FEED_PROVIDERS,
  FEED_SYNC_STATUSES,
  buildEmptyFeedSyncCounts,
  normalizeFeedProvider,
  sanitizeProviderText,
  type FeedSyncCounts,
} from "@convex/threatFeeds/helpers";
import {
  URLHAUS_AUTH_ENV,
  URLHAUS_PROVIDER,
  fetchUrlhausRecentUrls,
} from "@convex/threatFeeds/providers/urlhaus";

const ADMIN_SEED_ENV = "ADMIN_SEED_KEY";
const DEFAULT_SYNC_LIMIT = 50;
const MIN_SYNC_LIMIT = 1;
const MAX_SYNC_LIMIT = 1000;

type RunThreatFeedSyncResult =
  | {
      counts: FeedSyncCounts;
      limit: number;
      provider: typeof URLHAUS_PROVIDER;
      status: "completed";
    }
  | {
      counts: FeedSyncCounts;
      provider: string;
      reason: string;
      status: "invalid_input" | "provider_failed" | "provider_skipped";
    }
  | {
      counts: FeedSyncCounts;
      provider: typeof URLHAUS_PROVIDER;
      status: "failed" | "unauthorized";
    };

/**
 * Run a bounded manual sync for URLHaus recent URL indicators.
 *
 * Run via CLI:
 *   npx convex run maintenance/runThreatFeedSync:runThreatFeedSync '{"seedKey":"<seed key>","provider":"urlhaus","limit":50}'
 */
export const runThreatFeedSync = action({
  args: {
    limit: v.optional(v.number()),
    provider: v.string(),
    seedKey: v.string(),
  },
  handler: async (ctx, args): Promise<RunThreatFeedSyncResult> => {
    const unauthorizedResult: RunThreatFeedSyncResult = {
      counts: buildEmptyFeedSyncCounts(),
      provider: URLHAUS_PROVIDER,
      status: FEED_SYNC_STATUSES.unauthorized,
    };
    const normalizedSeedKey = args.seedKey.trim();

    if (!normalizedSeedKey) {
      return unauthorizedResult;
    }

    let expectedSeedKey = "";

    try {
      expectedSeedKey = getRequiredEnv(ADMIN_SEED_ENV);
    } catch {
      return {
        counts: buildEmptyFeedSyncCounts(),
        provider: URLHAUS_PROVIDER,
        status: FEED_SYNC_STATUSES.failed,
      };
    }

    if (!isValidSeedKey(normalizedSeedKey, expectedSeedKey)) {
      return unauthorizedResult;
    }

    const provider = normalizeFeedProvider(args.provider);

    if (provider !== FEED_PROVIDERS.urlhaus) {
      return {
        counts: buildEmptyFeedSyncCounts(),
        provider: sanitizeProviderText(args.provider) ?? "unknown",
        reason: "unsupported_provider",
        status: FEED_SYNC_STATUSES.invalidInput,
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

async function runUrlhausSync(
  ctx: ActionCtx,
  args: {
    authKey: string;
    limit: number;
  },
): Promise<RunThreatFeedSyncResult> {
  const now = Date.now();
  const fetchResult = await fetchUrlhausRecentUrls({
    authKey: args.authKey,
    limit: args.limit,
    now,
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

      if (result.status === "inserted") {
        counts.inserted += 1;
      } else if (result.status === "updated") {
        counts.updated += 1;
      } else if (
        result.status === "skipped" ||
        result.status === "invalid_input"
      ) {
        counts.skipped += 1;
      } else {
        counts.failed += 1;
      }
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

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error("Required maintenance configuration is missing.");
  }

  return value;
}

function isValidSeedKey(inputSeedKey: string, expectedSeedKey: string) {
  if (inputSeedKey.length !== expectedSeedKey.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < expectedSeedKey.length; index += 1) {
    difference |=
      inputSeedKey.charCodeAt(index) ^ expectedSeedKey.charCodeAt(index);
  }

  return difference === 0;
}

function normalizeSyncLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_SYNC_LIMIT;
  }

  return Math.min(MAX_SYNC_LIMIT, Math.max(MIN_SYNC_LIMIT, Math.trunc(limit)));
}
