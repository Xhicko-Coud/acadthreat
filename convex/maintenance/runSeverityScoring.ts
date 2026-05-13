import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import { action } from "@convex/_generated/server";

const MAX_RECENT_THREAT_EVENTS = 100;

type RunSeverityScoringResult =
  | {
      failed: number;
      processed: number;
      scored: number;
      skipped: number;
      status: "completed";
      total: number;
    }
  | {
      failed: 0;
      processed: 0;
      scored: 0;
      skipped: 0;
      status: "unauthorized";
      total: 0;
    }
  | {
      failed: number;
      processed: number;
      scored: number;
      skipped: number;
      status: "failed";
      total: number;
    };

/**
 * Run deterministic severity scoring over a bounded set of recent generated
 * threat events. This is a protected maintenance/demo action, not a user-facing
 * score editing feature.
 *
 * Run via CLI:
 *   npx convex run maintenance/runSeverityScoring:runSeverityScoringForRecentThreatEvents '{"seedKey":"<seed key>"}'
 */
export const runSeverityScoringForRecentThreatEvents = action({
  args: {
    seedKey: v.string(),
  },
  handler: async (ctx, args): Promise<RunSeverityScoringResult> => {
    const unauthorizedResult: RunSeverityScoringResult = {
      failed: 0,
      processed: 0,
      scored: 0,
      skipped: 0,
      status: "unauthorized",
      total: 0,
    };
    const normalizedSeedKey = args.seedKey.trim();

    if (!normalizedSeedKey) {
      return unauthorizedResult;
    }

    let expectedSeedKey = "";

    try {
      expectedSeedKey = getRequiredEnv("ADMIN_SEED_KEY");
    } catch {
      return {
        failed: 0,
        processed: 0,
        scored: 0,
        skipped: 0,
        status: "failed",
        total: 0,
      };
    }

    if (!isValidSeedKey(normalizedSeedKey, expectedSeedKey)) {
      return unauthorizedResult;
    }

    let processed = 0;
    let scored = 0;
    let skipped = 0;
    let failed = 0;
    let total = 0;

    try {
      const recentThreatEvents = await ctx.runQuery(
        internal.threatEvents.scoring.listRecentThreatEventsForScoringInternal,
        { limit: MAX_RECENT_THREAT_EVENTS },
      );

      total = recentThreatEvents.length;

      for (const threatEvent of recentThreatEvents) {
        try {
          const result = await ctx.runMutation(
            internal.threatEvents.scoring.scoreThreatEventInternal,
            { threatEventId: threatEvent.id },
          );

          processed += 1;

          if (result.status === "scored") {
            scored += 1;
          } else if (result.status === "not_found") {
            skipped += 1;
          } else {
            failed += 1;
          }
        } catch {
          processed += 1;
          failed += 1;
        }
      }

      return {
        failed,
        processed,
        scored,
        skipped,
        status: "completed",
        total,
      };
    } catch {
      return {
        failed,
        processed,
        scored,
        skipped,
        status: "failed",
        total,
      };
    }
  },
});

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error("Required scoring runner configuration is missing.");
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
