import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { action, internalQuery } from "@convex/_generated/server";

const ADMIN_SEED_ENV = "ADMIN_SEED_KEY";
const SOURCE_TYPE = "firewall";
const SOURCE_NAME = "urlhaus-correlation-proof";
const CLIENT_ID = "urlhaus-proof-seed";
const NEXT_STEPS_MESSAGE =
  "Seeded one simulated firewall log containing a URLHaus URL indicator. Run correlation and severity scoring next.";

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
      message: typeof NEXT_STEPS_MESSAGE;
    }
  | {
      status: "duplicate";
      created: false;
      indicatorValue: string;
      message: "A matching proof log may already exist. Run correlation and severity scoring next.";
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
        return {
          created: true,
          indicatorValue: selectedIndicator.indicator.value,
          message: NEXT_STEPS_MESSAGE,
          sourceType: SOURCE_TYPE,
          status: "created",
        };
      }

      if (result.status === "duplicate") {
        return {
          created: false,
          indicatorValue: selectedIndicator.indicator.value,
          message:
            "A matching proof log may already exist. Run correlation and severity scoring next.",
          status: "duplicate",
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

function buildFirewallProofPayload(indicatorValue: string, timestamp: number) {
  return JSON.stringify({
    action: "block",
    destIp: "198.51.100.10",
    eventType: "connection_blocked",
    isSimulated: true,
    message: `Blocked attempted access to known malicious URL: ${indicatorValue}`,
    outcome: "blocked",
    protocol: "https",
    requestPath: indicatorValue,
    srcIp: "203.0.113.45",
    timestamp,
  });
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
