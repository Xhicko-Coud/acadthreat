"use node";

import { timingSafeEqual } from "node:crypto";

import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import { action } from "@convex/_generated/server";

const MAX_RECENT_EVENTS = 100;

type RunCorrelationResult =
  | {
      status: "completed";
      processed: number;
      created: number;
      skipped: number;
      noMatches: number;
      failed: number;
      total: number;
    }
  | {
      status: "unauthorized";
      processed: 0;
      created: 0;
      skipped: 0;
      noMatches: 0;
      failed: 0;
      total: 0;
    }
  | {
      status: "failed";
      processed: number;
      created: number;
      skipped: number;
      noMatches: number;
      failed: number;
      total: number;
    };

/**
 * Run deterministic correlation over a bounded set of recent normalized
 * events. This is a protected maintenance/demo action, not user-facing threat
 * creation.
 *
 * Run via CLI:
 *   npx convex run actions/runCorrelation:runCorrelationForRecentEvents '{"seedKey":"<seed key>"}'
 */
export const runCorrelationForRecentEvents = action({
  args: {
    seedKey: v.string(),
  },
  handler: async (ctx, args): Promise<RunCorrelationResult> => {
    const unauthorizedResult: RunCorrelationResult = {
      created: 0,
      failed: 0,
      noMatches: 0,
      processed: 0,
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
        created: 0,
        failed: 0,
        noMatches: 0,
        processed: 0,
        skipped: 0,
        status: "failed",
        total: 0,
      };
    }

    if (!isValidSeedKey(normalizedSeedKey, expectedSeedKey)) {
      return unauthorizedResult;
    }

    let processed = 0;
    let created = 0;
    let skipped = 0;
    let noMatches = 0;
    let failed = 0;
    let total = 0;

    try {
      const recentEvents = await ctx.runQuery(
        internal.threatEvents.recentEvents.listRecentNormalizedEventsInternal,
        { limit: MAX_RECENT_EVENTS },
      );

      total = recentEvents.length;

      for (const event of recentEvents) {
        try {
          const result = await ctx.runMutation(
            internal.threatEvents.correlation.correlateNormalizedEventInternal,
            { normalizedEventId: event.id },
          );

          processed += 1;

          if (result.status === "correlated") {
            created += result.created;
            skipped += result.skipped;
          } else if (result.status === "no_matches") {
            noMatches += 1;
          } else {
            failed += 1;
          }
        } catch {
          processed += 1;
          failed += 1;
        }
      }

      return {
        created,
        failed,
        noMatches,
        processed,
        skipped,
        status: "completed",
        total,
      };
    } catch {
      return {
        created,
        failed,
        noMatches,
        processed,
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
    throw new Error("Required correlation runner configuration is missing.");
  }

  return value;
}

function isValidSeedKey(inputSeedKey: string, expectedSeedKey: string) {
  const inputBuffer = Buffer.from(inputSeedKey, "utf8");
  const expectedBuffer = Buffer.from(expectedSeedKey, "utf8");

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
