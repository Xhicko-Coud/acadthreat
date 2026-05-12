"use node";

import { timingSafeEqual } from "node:crypto";

import { v } from "convex/values";

import { internal } from "@convex/_generated/api";
import { action } from "@convex/_generated/server";

type SeedDemoIndicatorsResult =
  | {
      status: "seeded";
      inserted: number;
      skipped: number;
      total: number;
    }
  | {
      status: "unauthorized";
      inserted: 0;
      skipped: 0;
      total: 0;
    }
  | {
      status: "failed";
      inserted: 0;
      skipped: 0;
      total: 0;
    };

export const seedDemoThreatIndicators = action({
  args: {
    seedKey: v.string(),
  },
  handler: async (ctx, args): Promise<SeedDemoIndicatorsResult> => {
    const normalizedSeedKey = args.seedKey.trim();

    if (!normalizedSeedKey) {
      return {
        inserted: 0,
        skipped: 0,
        status: "unauthorized",
        total: 0,
      };
    }

    let expectedSeedKey = "";

    try {
      expectedSeedKey = getRequiredEnv("ADMIN_SEED_KEY");
    } catch {
      return {
        inserted: 0,
        skipped: 0,
        status: "failed",
        total: 0,
      };
    }

    if (!isValidSeedKey(normalizedSeedKey, expectedSeedKey)) {
      return {
        inserted: 0,
        skipped: 0,
        status: "unauthorized",
        total: 0,
      };
    }

    const result = await ctx.runMutation(
      internal.threatIndicators.seedDemoIndicatorsInternal
        .insertDemoThreatIndicators,
      {},
    );

    return {
      inserted: result.inserted,
      skipped: result.skipped,
      status: "seeded",
      total: result.total,
    };
  },
});

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
