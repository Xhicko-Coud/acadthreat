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
  getFeedProviderLabel,
  normalizeFeedProvider,
  sanitizeProviderText,
  type FeedProvider,
} from "@convex/threatFeeds/helpers";

const SOURCE_TYPE = "firewall" as const;
const SOURCE_NAME = "provider-proof-log";
const CLIENT_ID = "provider-proof-seed";
const DEFAULT_PROOF_LOG_COUNT = 1;
const MIN_PROOF_LOG_COUNT = 1;
const MAX_PROOF_LOG_COUNT = 50;

type ProofLogOperationResult = {
  createdCount: number;
  failedCount: number;
  message: string;
  normalizedEventCount: number;
  provider: string;
  providerLabel: string;
  requestedCount: number;
  skippedCount: number;
  status:
    | "created"
    | "failed"
    | "forbidden"
    | "not_found"
    | "partial"
    | "provider_not_enabled"
    | "unauthenticated";
};

export const seedProviderProofLogOperation = action({
  args: {
    count: v.optional(v.number()),
    provider: v.union(
      v.literal("urlhaus"),
      v.literal("abuseipdb"),
      v.literal("otx"),
      v.literal("phishtank"),
      v.literal("misp"),
    ),
  },
  handler: async (ctx, args): Promise<ProofLogOperationResult> => {
    const provider = normalizeFeedProvider(args.provider);
    const safeProvider = provider ?? sanitizeProviderText(args.provider) ?? "unknown";
    const providerLabel = provider
      ? getFeedProviderLabel(provider)
      : formatProviderLabel(safeProvider);
    const requestedCount = normalizeProofLogCount(args.count);

    if (!provider) {
      return buildAccessResult(
        "failed",
        safeProvider,
        providerLabel,
        requestedCount,
      );
    }

    const access = await getProofLogOperationAccess(ctx);

    if (access.status !== "allowed") {
      return buildAccessResult(
        access.status,
        provider,
        providerLabel,
        requestedCount,
      );
    }

    if (provider !== FEED_PROVIDERS.urlhaus) {
      return {
        createdCount: 0,
        failedCount: 0,
        message: "This provider is not enabled in this MVP.",
        normalizedEventCount: 0,
        provider,
        providerLabel,
        requestedCount,
        skippedCount: requestedCount,
        status: "provider_not_enabled",
      };
    }

    try {
      return await seedUrlhausProofLogs(ctx, {
        provider,
        providerLabel,
        requestedCount,
      });
    } catch {
      return buildAccessResult("failed", provider, providerLabel, requestedCount);
    }
  },
});

export const getProofLogOperationAccessInternal = internalQuery({
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

export const listProviderProofIndicatorsInternal = internalQuery({
  args: {
    count: v.number(),
    provider: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ value: string }[]> => {
    const provider = normalizeFeedProvider(args.provider);
    const count = normalizeProofLogCount(args.count);

    if (provider !== FEED_PROVIDERS.urlhaus) {
      return [];
    }

    const indicators = await ctx.db
      .query("threatIndicators")
      .withIndex("by_provider", (lookup) => lookup.eq("provider", provider))
      .take(MAX_PROOF_LOG_COUNT * 2);

    return indicators
      .filter(
        (candidate) =>
          candidate.type === "url" &&
          candidate.status === "active" &&
          candidate.normalizedValue.trim().length > 0,
      )
      .sort(
        (left, right) =>
          (right.lastSyncedAt ?? right.updatedAt) -
          (left.lastSyncedAt ?? left.updatedAt),
      )
      .slice(0, count)
      .map((indicator) => ({ value: indicator.normalizedValue }));
  },
});

async function getProofLogOperationAccess(ctx: ActionCtx) {
  const actor = await getCurrentAuthUser(ctx);

  if (!actor) {
    return { status: "unauthenticated" } as const;
  }

  const access = await ctx.runQuery(
    internal.logs.operations.getProofLogOperationAccessInternal,
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

async function seedUrlhausProofLogs(
  ctx: ActionCtx,
  args: {
    provider: FeedProvider;
    providerLabel: string;
    requestedCount: number;
  },
): Promise<ProofLogOperationResult> {
  const indicators = await ctx.runQuery(
    internal.logs.operations.listProviderProofIndicatorsInternal,
    { count: args.requestedCount, provider: args.provider },
  );

  if (indicators.length === 0) {
    return {
      createdCount: 0,
      failedCount: 0,
      message:
        "No active indicator was found for the selected provider. Sync indicators for this provider first.",
      normalizedEventCount: 0,
      provider: args.provider,
      providerLabel: args.providerLabel,
      requestedCount: args.requestedCount,
      skippedCount: args.requestedCount,
      status: "not_found",
    };
  }

  const now = Date.now();
  const counts = {
    createdCount: 0,
    failedCount: 0,
    normalizedEventCount: 0,
  };

  for (const [index, indicator] of indicators.entries()) {
    const timestamp = now + index;
    const payload = buildFirewallProofPayload({
      batchIndex: index + 1,
      indicatorValue: indicator.value,
      providerLabel: args.providerLabel,
      timestamp,
    });
    const ingestResult = await ctx.runMutation(
      internal.logs.ingestLog.ingestSingleLogInternal,
      {
        clientId: CLIENT_ID,
        eventTimestamp: timestamp,
        isSimulated: true,
        payload,
        sourceName: SOURCE_NAME,
        sourceType: SOURCE_TYPE,
      },
    );

    if (
      ingestResult.status !== "ingested" &&
      ingestResult.status !== "duplicate" &&
      ingestResult.status !== "normalization_failed"
    ) {
      counts.failedCount += 1;
      continue;
    }

    counts.createdCount += 1;

    if (
      ingestResult.status === "ingested" &&
      Boolean(ingestResult.normalizedEventId)
    ) {
      counts.normalizedEventCount += 1;
    }
  }

  const skippedCount = Math.max(
    0,
    args.requestedCount - indicators.length + counts.failedCount,
  );
  const status =
    counts.createdCount === args.requestedCount && counts.failedCount === 0
      ? "created"
      : "partial";

  return {
    createdCount: counts.createdCount,
    failedCount: counts.failedCount,
    message: `Seeded ${counts.createdCount} proof logs from ${args.providerLabel}.`,
    normalizedEventCount: counts.normalizedEventCount,
    provider: args.provider,
    providerLabel: args.providerLabel,
    requestedCount: args.requestedCount,
    skippedCount,
    status,
  };
}

function buildFirewallProofPayload({
  batchIndex,
  indicatorValue,
  providerLabel,
  timestamp,
}: {
  batchIndex: number;
  indicatorValue: string;
  providerLabel: string;
  timestamp: number;
}) {
  return JSON.stringify({
    action: "block",
    destIp: "198.51.100.10",
    destPort: 443,
    eventType: "connection_blocked",
    isSimulated: true,
    message: `${providerLabel} proof event ${batchIndex}: blocked attempted access to imported indicator ${indicatorValue}.`,
    outcome: "blocked",
    protocol: "TCP",
    requestPath: indicatorValue,
    srcIp: "203.0.113.45",
    srcPort: 57152,
    timestamp,
  });
}

function buildAccessResult(
  status: "failed" | "forbidden" | "unauthenticated",
  provider: string,
  providerLabel: string,
  requestedCount: number,
): ProofLogOperationResult {
  return {
    createdCount: 0,
    failedCount: status === "failed" ? requestedCount : 0,
    message:
      status === "failed"
        ? "Proof log seed failed. Please try again later."
        : "This account cannot run the proof log seed operation.",
    normalizedEventCount: 0,
    provider,
    providerLabel,
    requestedCount,
    skippedCount: status === "failed" ? 0 : requestedCount,
    status,
  };
}

function normalizeProofLogCount(count: number | undefined) {
  if (typeof count !== "number" || !Number.isFinite(count)) {
    return DEFAULT_PROOF_LOG_COUNT;
  }

  return Math.min(
    MAX_PROOF_LOG_COUNT,
    Math.max(MIN_PROOF_LOG_COUNT, Math.trunc(count)),
  );
}

function formatProviderLabel(provider: string) {
  return provider
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}
