"use node";

import { timingSafeEqual } from "node:crypto";

import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import { action } from "@convex/_generated/server";
import { SIMULATED_LOG_SEEDS } from "@convex/logs/seedDemoLogsData";

// ---------------------------------------------------------------------------
// Result Type
// ---------------------------------------------------------------------------

type SeedDemoLogsResult =
  | {
      status: "seeded";
      ingested: number;
      duplicates: number;
      failed: number;
      total: number;
    }
  | {
      status: "unauthorized";
      ingested: 0;
      duplicates: 0;
      failed: 0;
      total: 0;
    }
  | {
      status: "failed";
      ingested: 0;
      duplicates: 0;
      failed: 0;
      total: 0;
    };

// ---------------------------------------------------------------------------
// Seed Action
// ---------------------------------------------------------------------------

/**
 * Seed simulated authentication and firewall logs through the ingestion
 * pipeline. Validates the seed key against ADMIN_SEED_KEY before proceeding.
 *
 * Run via CLI:
 *   npx convex run actions/seedDemoLogs:seedDemoLogs '{"seedKey":"<seed key>"}'
 *
 * Each log is ingested through ingestSingleLogInternal, which validates,
 * hashes, deduplicates, stores the raw log, normalizes, and inserts the
 * normalized event. Re-running the seed command is safe — duplicates are
 * skipped via idempotency.
 */
export const seedDemoLogs = action({
  args: {
    seedKey: v.string(),
  },
  handler: async (ctx, args): Promise<SeedDemoLogsResult> => {
    // -----------------------------------------------------------------
    // 1. Validate seed key
    // -----------------------------------------------------------------
    const normalizedSeedKey = args.seedKey.trim();

    if (!normalizedSeedKey) {
      return {
        duplicates: 0,
        failed: 0,
        ingested: 0,
        status: "unauthorized",
        total: 0,
      };
    }

    let expectedSeedKey = "";

    try {
      expectedSeedKey = getRequiredEnv("ADMIN_SEED_KEY");
    } catch {
      return {
        duplicates: 0,
        failed: 0,
        ingested: 0,
        status: "failed",
        total: 0,
      };
    }

    if (!isValidSeedKey(normalizedSeedKey, expectedSeedKey)) {
      return {
        duplicates: 0,
        failed: 0,
        ingested: 0,
        status: "unauthorized",
        total: 0,
      };
    }

    // -----------------------------------------------------------------
    // 2. Ingest each simulated log through the pipeline
    // -----------------------------------------------------------------
    let ingested = 0;
    let duplicates = 0;
    let failed = 0;

    for (const seed of SIMULATED_LOG_SEEDS) {
      try {
        const result = await ctx.runMutation(
          internal.logs.ingestLog.ingestSingleLogInternal,
          {
            sourceType: seed.sourceType,
            sourceName: seed.sourceName,
            eventTimestamp: seed.eventTimestamp,
            payload: seed.payload,
            clientId: seed.clientId,
            isSimulated: seed.isSimulated,
          },
        );

        if (result.status === "ingested") {
          ingested += 1;
        } else if (result.status === "duplicate") {
          duplicates += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    return {
      duplicates,
      failed,
      ingested,
      status: "seeded",
      total: SIMULATED_LOG_SEEDS.length,
    };
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error("Required seed configuration is missing.");
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
