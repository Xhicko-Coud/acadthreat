import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { action, internalQuery } from "@convex/_generated/server";

const ADMIN_SEED_ENV = "ADMIN_SEED_KEY";
const SOURCE_TYPE = "firewall";
const SOURCE_NAME = "urlhaus-correlation-proof";
const CLIENT_ID = "urlhaus-proof-seed";
const NEXT_STEPS_MESSAGE =
  "Seeded one simulated firewall log containing a URLHaus URL indicator. Confirm it in /admin/logs, then run correlation and severity scoring.";
const DUPLICATE_MESSAGE =
  "A matching proof log may already exist. Check /admin/logs, then run correlation and severity scoring.";
const NORMALIZATION_FAILED_MESSAGE =
  "Proof log was accepted but did not create a normalized event. Check firewall normalizer shape.";

type SelectedUrlhausIndicator = {
  id: Id<"threatIndicators">;
  value: string;
};

type SeedUrlhausCorrelationProofResult =
  | {
      status: "created";
      created: true;
      indicatorValue: string;
      sourceType: typeof SOURCE_TYPE;
      ingestionStatus: "ingested";
      rawLogId?: string;
      normalizedEventId?: string;
      normalizedEventCreated: true;
      message: typeof NEXT_STEPS_MESSAGE;
    }
  | {
      status: "duplicate";
      created: false;
      indicatorValue: string;
      sourceType: typeof SOURCE_TYPE;
      ingestionStatus: "duplicate";
      rawLogId?: string;
      normalizedEventId?: string;
      normalizedEventCreated: boolean;
      message: typeof DUPLICATE_MESSAGE;
    }
  | {
      status: "normalization_failed";
      created: false;
      indicatorValue: string;
      sourceType: typeof SOURCE_TYPE;
      ingestionStatus: "normalization_failed";
      rawLogId?: string;
      normalizedEventCreated: false;
      message: typeof NORMALIZATION_FAILED_MESSAGE;
    }
  | {
      status: "invalid_input";
      created: false;
      reason: "invalid_indicator";
    }
  | {
      status: "not_found";
      created: false;
      reason: "no_active_urlhaus_url_indicator";
    }
  | {
      status: "unauthorized";
      created: false;
    }
  | {
      status: "failed";
      created: false;
    };

/**
 * Seed one simulated firewall log containing an existing active URLHaus URL
 * indicator. This proves the feed-to-ingestion-to-correlation path without
 * creating threat events directly.
 *
 * Run via CLI:
 *   npx convex run maintenance/seedUrlhausCorrelationProof:seedUrlhausCorrelationProof '{"seedKey":"<seed key>"}'
 */
export const seedUrlhausCorrelationProof = action({
  args: {
    indicatorId: v.optional(v.id("threatIndicators")),
    seedKey: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<SeedUrlhausCorrelationProofResult> => {
    const normalizedSeedKey = args.seedKey.trim();

    if (!normalizedSeedKey) {
      return { created: false, status: "unauthorized" };
    }

    let expectedSeedKey = "";

    try {
      expectedSeedKey = getRequiredEnv(ADMIN_SEED_ENV);
    } catch {
      return { created: false, status: "failed" };
    }

    if (!isValidSeedKey(normalizedSeedKey, expectedSeedKey)) {
      return { created: false, status: "unauthorized" };
    }

    const selectedIndicator = await ctx.runQuery(
      internal.maintenance.seedUrlhausCorrelationProof
        .selectUrlhausCorrelationProofIndicatorInternal,
      { indicatorId: args.indicatorId },
    );

    if (selectedIndicator.status === "invalid_input") {
      return {
        created: false,
        reason: "invalid_indicator",
        status: "invalid_input",
      };
    }

    if (selectedIndicator.status === "not_found") {
      return {
        created: false,
        reason: "no_active_urlhaus_url_indicator",
        status: "not_found",
      };
    }

    try {
      const now = Date.now();
      const result = await ctx.runMutation(
        internal.logs.ingestLog.ingestSingleLogInternal,
        {
          clientId: CLIENT_ID,
          eventTimestamp: now,
          isSimulated: true,
          payload: buildFirewallProofPayload(
            selectedIndicator.indicator.value,
            now,
          ),
          sourceName: SOURCE_NAME,
          sourceType: SOURCE_TYPE,
        },
      );

      if (result.status === "ingested") {
        const normalizedEvent = await ctx.runQuery(
          internal.maintenance.seedUrlhausCorrelationProof
            .findProofNormalizedEventInternal,
          {
            indicatorValue: selectedIndicator.indicator.value,
            normalizedEventId: result.normalizedEventId as Id<"normalizedEvents">,
            rawLogId: result.rawLogId as Id<"rawLogs">,
          },
        );

        if (!normalizedEvent) {
          return {
            created: false,
            indicatorValue: selectedIndicator.indicator.value,
            ingestionStatus: "normalization_failed",
            message: NORMALIZATION_FAILED_MESSAGE,
            normalizedEventCreated: false,
            rawLogId: result.rawLogId,
            sourceType: SOURCE_TYPE,
            status: "normalization_failed",
          };
        }

        return {
          created: true,
          indicatorValue: selectedIndicator.indicator.value,
          ingestionStatus: "ingested",
          message: NEXT_STEPS_MESSAGE,
          normalizedEventCreated: true,
          normalizedEventId: normalizedEvent._id,
          rawLogId: result.rawLogId,
          sourceType: SOURCE_TYPE,
          status: "created",
        };
      }

      if (result.status === "duplicate") {
        const normalizedEvent = await ctx.runQuery(
          internal.maintenance.seedUrlhausCorrelationProof
            .findProofNormalizedEventInternal,
          {
            indicatorValue: selectedIndicator.indicator.value,
            rawLogId: result.rawLogId as Id<"rawLogs">,
          },
        );

        return {
          created: false,
          indicatorValue: selectedIndicator.indicator.value,
          ingestionStatus: "duplicate",
          message: DUPLICATE_MESSAGE,
          normalizedEventCreated: normalizedEvent !== null,
          ...(normalizedEvent ? { normalizedEventId: normalizedEvent._id } : {}),
          rawLogId: result.rawLogId,
          sourceType: SOURCE_TYPE,
          status: "duplicate",
        };
      }

      if (result.status === "normalization_failed") {
        return {
          created: false,
          indicatorValue: selectedIndicator.indicator.value,
          ingestionStatus: "normalization_failed",
          message: NORMALIZATION_FAILED_MESSAGE,
          normalizedEventCreated: false,
          rawLogId: result.rawLogId,
          sourceType: SOURCE_TYPE,
          status: "normalization_failed",
        };
      }

      return { created: false, status: "failed" };
    } catch {
      return { created: false, status: "failed" };
    }
  },
});

export const selectUrlhausCorrelationProofIndicatorInternal = internalQuery({
  args: {
    indicatorId: v.optional(v.id("threatIndicators")),
  },
  handler: async (ctx, args) => {
    if (args.indicatorId) {
      const indicator = await ctx.db.get(args.indicatorId);

      if (!isActiveUrlhausUrlIndicator(indicator)) {
        return { status: "invalid_input" } as const;
      }

      return {
        indicator: toSelectedIndicator(indicator),
        status: "success",
      } as const;
    }

    const indicators = await ctx.db
      .query("threatIndicators")
      .withIndex("by_provider", (lookup) => lookup.eq("provider", "urlhaus"))
      .take(50);
    const indicator = indicators.find(isActiveUrlhausUrlIndicator);

    if (!indicator) {
      return { status: "not_found" } as const;
    }

    return {
      indicator: toSelectedIndicator(indicator),
      status: "success",
    } as const;
  },
});

export const findProofNormalizedEventInternal = internalQuery({
  args: {
    indicatorValue: v.string(),
    normalizedEventId: v.optional(v.id("normalizedEvents")),
    rawLogId: v.optional(v.id("rawLogs")),
  },
  handler: async (ctx, args) => {
    if (args.normalizedEventId) {
      const event = await ctx.db.get(args.normalizedEventId);

      if (isMatchingProofNormalizedEvent(event, args.indicatorValue)) {
        return event;
      }
    }

    if (args.rawLogId) {
      const event = await ctx.db
        .query("normalizedEvents")
        .withIndex("by_rawLogId", (lookup) => lookup.eq("rawLogId", args.rawLogId!))
        .unique();

      if (isMatchingProofNormalizedEvent(event, args.indicatorValue)) {
        return event;
      }
    }

    const recentEvents = await ctx.db
      .query("normalizedEvents")
      .withIndex("by_sourceType_and_eventTimestamp", (lookup) =>
        lookup.eq("sourceType", SOURCE_TYPE),
      )
      .order("desc")
      .take(25);

    return (
      recentEvents.find((event) =>
        isMatchingProofNormalizedEvent(event, args.indicatorValue),
      ) ?? null
    );
  },
});

function buildFirewallProofPayload(indicatorValue: string, timestamp: number) {
  return JSON.stringify({
    action: "block",
    destIp: "198.51.100.10",
    destPort: 443,
    eventType: "connection_blocked",
    isSimulated: true,
    message: `URLHaus proof event: blocked attempted access to known malicious URL ${indicatorValue} at ${timestamp}`,
    outcome: "blocked",
    protocol: "TCP",
    requestPath: indicatorValue,
    srcIp: "203.0.113.45",
    srcPort: 57152,
    timestamp,
  });
}

function isMatchingProofNormalizedEvent(
  event: Doc<"normalizedEvents"> | null,
  indicatorValue: string,
): event is Doc<"normalizedEvents"> {
  if (!event || event.sourceType !== SOURCE_TYPE || !event.isSimulated) {
    return false;
  }

  const normalizedIndicatorValue = indicatorValue.trim();

  return (
    event.requestPath === normalizedIndicatorValue ||
    event.message?.includes(normalizedIndicatorValue) === true
  );
}

function isActiveUrlhausUrlIndicator(
  indicator: Doc<"threatIndicators"> | null,
): indicator is Doc<"threatIndicators"> {
  if (!indicator || typeof indicator !== "object") {
    return false;
  }

  const candidate = indicator as {
    normalizedValue?: unknown;
    provider?: unknown;
    status?: unknown;
    type?: unknown;
    value?: unknown;
  };

  return (
    candidate.provider === "urlhaus" &&
    candidate.type === "url" &&
    candidate.status === "active" &&
    (isNonEmptyString(candidate.value) ||
      isNonEmptyString(candidate.normalizedValue))
  );
}

function toSelectedIndicator(
  indicator: Doc<"threatIndicators">,
): SelectedUrlhausIndicator {
  return {
    id: indicator._id,
    value: indicator.value.trim() || indicator.normalizedValue.trim(),
  };
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error("Required proof seed configuration is missing.");
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
