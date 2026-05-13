import { v, type Infer } from "convex/values";

import type { Doc, Id } from "@convex/_generated/dataModel";
import { internalMutation, type MutationCtx } from "@convex/_generated/server";
import {
  clampFeedConfidence,
  normalizeProviderTags,
  sanitizeProviderText,
  sanitizeProviderUrl,
} from "@convex/threatFeeds/helpers";
import {
  THREAT_INDICATOR_SEVERITIES,
  THREAT_INDICATOR_STATUSES,
  normalizeThreatIndicatorValue,
  threatIndicatorSeverityValidator,
  threatIndicatorTypeValidator,
  validateThreatIndicatorPayload,
  type ThreatIndicatorSeverity,
} from "@convex/threatIndicators/helpers";

const SYSTEM_FEED_USER_ID = "system-feed-sync";
const SYSTEM_FEED_EMAIL = "feeds@acadthreat.local";
const MAX_BATCH_SIZE = 100;

const severityRank: Record<ThreatIndicatorSeverity, number> = {
  [THREAT_INDICATOR_SEVERITIES.low]: 1,
  [THREAT_INDICATOR_SEVERITIES.medium]: 2,
  [THREAT_INDICATOR_SEVERITIES.high]: 3,
  [THREAT_INDICATOR_SEVERITIES.critical]: 4,
};

const normalizedFeedIndicatorValidator = v.object({
  confidence: v.number(),
  description: v.optional(v.string()),
  firstSeenAt: v.optional(v.number()),
  lastSeenAt: v.optional(v.number()),
  lastSyncedAt: v.optional(v.number()),
  normalizedValue: v.string(),
  provider: v.optional(v.string()),
  providerIndicatorId: v.optional(v.string()),
  severity: threatIndicatorSeverityValidator,
  source: v.string(),
  sourceUrl: v.optional(v.string()),
  status: v.optional(v.literal(THREAT_INDICATOR_STATUSES.active)),
  tags: v.optional(v.array(v.string())),
  type: threatIndicatorTypeValidator,
  value: v.string(),
});

type NormalizedFeedIndicator = Infer<typeof normalizedFeedIndicatorValidator>;

type UpsertFeedIndicatorResult =
  | {
      indicatorId: Id<"threatIndicators">;
      status: "inserted" | "updated";
    }
  | {
      reason: string;
      status: "invalid_input" | "skipped";
    }
  | {
      status: "failed";
    };

export const upsertThreatIndicatorFromFeedInternal = internalMutation({
  args: {
    indicator: normalizedFeedIndicatorValidator,
  },
  handler: async (ctx, args): Promise<UpsertFeedIndicatorResult> => {
    try {
      return await upsertThreatIndicatorFromFeed(ctx, args.indicator);
    } catch {
      return { status: "failed" };
    }
  },
});

export const upsertThreatIndicatorsFromFeedInternal = internalMutation({
  args: {
    indicators: v.array(normalizedFeedIndicatorValidator),
  },
  handler: async (ctx, args) => {
    const counts = {
      failed: 0,
      inserted: 0,
      skipped: 0,
      updated: 0,
    };
    const indicators = args.indicators.slice(0, MAX_BATCH_SIZE);

    for (const indicator of indicators) {
      try {
        const result = await upsertThreatIndicatorFromFeed(ctx, indicator);

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
      processed: indicators.length,
      skippedByLimit: Math.max(0, args.indicators.length - MAX_BATCH_SIZE),
      status: "completed",
    } as const;
  },
});

async function upsertThreatIndicatorFromFeed(
  ctx: MutationCtx,
  indicator: NormalizedFeedIndicator,
): Promise<UpsertFeedIndicatorResult> {
  const normalizedIndicator = normalizeFeedIndicatorForUpsert(indicator);

  if (!normalizedIndicator) {
    return { reason: "invalid_indicator", status: "invalid_input" };
  }

  const existingIndicator = await findExistingFeedIndicator(
    ctx,
    normalizedIndicator,
  );
  const now = Date.now();

  if (!existingIndicator) {
    const indicatorId = await insertFeedIndicator(ctx, normalizedIndicator, now);
    return { indicatorId, status: "inserted" };
  }

  await patchFeedIndicator(ctx, existingIndicator, normalizedIndicator, now);

  return { indicatorId: existingIndicator._id, status: "updated" };
}

function normalizeFeedIndicatorForUpsert(indicator: NormalizedFeedIndicator) {
  const value = indicator.value.trim();
  const normalizedValue = indicator.normalizedValue.trim();

  if (!value || !normalizedValue) {
    return null;
  }

  const expectedNormalizedValue = normalizeThreatIndicatorValue(
    indicator.type,
    value,
  );

  if (expectedNormalizedValue !== normalizedValue) {
    return null;
  }

  const validation = validateThreatIndicatorPayload({
    confidence: clampFeedConfidence(indicator.confidence),
    description: sanitizeProviderText(indicator.description),
    severity: indicator.severity,
    source: sanitizeProviderText(indicator.source),
    type: indicator.type,
    value,
  });

  if (!validation.isValid) {
    return null;
  }

  return {
    confidence: validation.data.confidence,
    description: validation.data.description,
    firstSeenAt: sanitizeTimestamp(indicator.firstSeenAt),
    lastSeenAt: sanitizeTimestamp(indicator.lastSeenAt),
    normalizedValue: validation.data.normalizedValue,
    provider: sanitizeProviderText(indicator.provider),
    providerIndicatorId: sanitizeProviderText(indicator.providerIndicatorId),
    severity: validation.data.severity,
    source: validation.data.source,
    sourceUrl: sanitizeProviderUrl(indicator.sourceUrl),
    status: THREAT_INDICATOR_STATUSES.active,
    tags: normalizeProviderTags(indicator.tags),
    type: validation.data.type,
    value: validation.data.value,
  };
}

async function findExistingFeedIndicator(
  ctx: MutationCtx,
  indicator: NonNullable<ReturnType<typeof normalizeFeedIndicatorForUpsert>>,
) {
  const duplicateByValue = await ctx.db
    .query("threatIndicators")
    .withIndex("by_type_and_normalizedValue", (lookup) =>
      lookup
        .eq("type", indicator.type)
        .eq("normalizedValue", indicator.normalizedValue),
    )
    .unique();

  if (duplicateByValue) {
    return duplicateByValue;
  }

  if (!indicator.provider || !indicator.providerIndicatorId) {
    return null;
  }

  return await ctx.db
    .query("threatIndicators")
    .withIndex("by_provider_and_providerIndicatorId", (lookup) =>
      lookup
        .eq("provider", indicator.provider)
        .eq("providerIndicatorId", indicator.providerIndicatorId),
    )
    .unique();
}

async function insertFeedIndicator(
  ctx: MutationCtx,
  indicator: NonNullable<ReturnType<typeof normalizeFeedIndicatorForUpsert>>,
  now: number,
) {
  return await ctx.db.insert("threatIndicators", {
    confidence: indicator.confidence,
    createdAt: now,
    createdByEmail: SYSTEM_FEED_EMAIL,
    createdByUserId: SYSTEM_FEED_USER_ID,
    description: indicator.description,
    firstSeenAt: indicator.firstSeenAt,
    lastSeenAt: indicator.lastSeenAt,
    lastSyncedAt: now,
    normalizedValue: indicator.normalizedValue,
    provider: indicator.provider,
    providerIndicatorId: indicator.providerIndicatorId,
    severity: indicator.severity,
    source: indicator.source,
    sourceUrl: indicator.sourceUrl,
    status: indicator.status,
    tags: indicator.tags,
    type: indicator.type,
    updatedAt: now,
    updatedByEmail: SYSTEM_FEED_EMAIL,
    updatedByUserId: SYSTEM_FEED_USER_ID,
    value: indicator.value,
  });
}

async function patchFeedIndicator(
  ctx: MutationCtx,
  existing: Doc<"threatIndicators">,
  incoming: NonNullable<ReturnType<typeof normalizeFeedIndicatorForUpsert>>,
  now: number,
) {
  await ctx.db.patch(existing._id, {
    confidence: Math.max(existing.confidence, incoming.confidence),
    description: getNextDescription(existing, incoming),
    firstSeenAt: existing.firstSeenAt ?? incoming.firstSeenAt,
    lastSeenAt: incoming.lastSeenAt ?? existing.lastSeenAt,
    lastSyncedAt: now,
    provider: incoming.provider ?? existing.provider,
    providerIndicatorId:
      incoming.providerIndicatorId ?? existing.providerIndicatorId,
    severity: getHigherSeverity(existing.severity, incoming.severity),
    source: getNextSource(existing, incoming),
    sourceUrl: incoming.sourceUrl ?? existing.sourceUrl,
    tags: mergeProviderTags(existing.tags, incoming.tags),
    updatedAt: now,
    updatedByEmail: SYSTEM_FEED_EMAIL,
    updatedByUserId: SYSTEM_FEED_USER_ID,
  });
}

function getNextDescription(
  existing: Doc<"threatIndicators">,
  incoming: NonNullable<ReturnType<typeof normalizeFeedIndicatorForUpsert>>,
) {
  if (existing.provider && existing.provider === incoming.provider) {
    return incoming.description ?? existing.description;
  }

  if (!existing.description) {
    return incoming.description;
  }

  return existing.description;
}

function getNextSource(
  existing: Doc<"threatIndicators">,
  incoming: NonNullable<ReturnType<typeof normalizeFeedIndicatorForUpsert>>,
) {
  if (existing.provider && existing.provider === incoming.provider) {
    return incoming.source ?? existing.source;
  }

  if (!existing.source) {
    return incoming.source;
  }

  return existing.source;
}

function getHigherSeverity(
  existingSeverity: ThreatIndicatorSeverity,
  incomingSeverity: ThreatIndicatorSeverity,
) {
  if (severityRank[incomingSeverity] > severityRank[existingSeverity]) {
    return incomingSeverity;
  }

  return existingSeverity;
}

function mergeProviderTags(
  existingTags: string[] | undefined,
  incomingTags: string[],
) {
  return normalizeProviderTags([...(existingTags ?? []), ...incomingTags]);
}

function sanitizeTimestamp(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}
