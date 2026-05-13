import { v } from "convex/values";

import type { Doc, Id } from "@convex/_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "@convex/_generated/server";
import { SCORING_STATUSES } from "@convex/threatEvents/helpers";
import { calculateThreatEventSeverityScore } from "@convex/threatEvents/severityScoring";

const MAX_RECENT_THREAT_EVENTS = 100;
const MAX_FREQUENCY_CONTEXT_EVENTS = 25;

type ScoreThreatEventResult =
  | {
      priority: "low" | "medium" | "high" | "critical";
      severityScore: number;
      status: "scored";
      threatEventId: Id<"threatEvents">;
    }
  | {
      status: "not_found";
    }
  | {
      status: "failed";
    };

export const listRecentThreatEventsForScoringInternal = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args): Promise<{ id: Id<"threatEvents"> }[]> => {
    const limit = Math.min(
      Math.max(Math.floor(args.limit), 0),
      MAX_RECENT_THREAT_EVENTS,
    );

    if (limit === 0) {
      return [];
    }

    const unscoredThreatEvents = await ctx.db
      .query("threatEvents")
      .withIndex("by_scoringStatus_and_detectedAt", (lookup) =>
        lookup.eq("scoringStatus", SCORING_STATUSES.unscored),
      )
      .order("desc")
      .take(limit);

    if (unscoredThreatEvents.length >= limit) {
      return unscoredThreatEvents.map(toThreatEventReference);
    }

    const recentThreatEvents = await ctx.db
      .query("threatEvents")
      .withIndex("by_detectedAt")
      .order("desc")
      .take(limit - unscoredThreatEvents.length);
    const seenThreatEventIds = new Set(
      unscoredThreatEvents.map((event) => event._id),
    );
    const additionalThreatEvents = recentThreatEvents.filter(
      (event) => !seenThreatEventIds.has(event._id),
    );

    return [...unscoredThreatEvents, ...additionalThreatEvents].map(
      toThreatEventReference,
    );
  },
});

export const scoreThreatEventInternal = internalMutation({
  args: {
    threatEventId: v.id("threatEvents"),
  },
  handler: async (ctx, args): Promise<ScoreThreatEventResult> => {
    try {
      const threatEvent = await ctx.db.get(args.threatEventId);

      if (!threatEvent) {
        return { status: "not_found" };
      }

      const [normalizedEvent, indicator] = await Promise.all([
        ctx.db.get(threatEvent.normalizedEventId),
        ctx.db.get(threatEvent.matchedIndicatorId),
      ]);
      const frequencyCount = await getThreatEventFrequencyCount(
        ctx,
        threatEvent,
      );
      const scoringResult = calculateThreatEventSeverityScore({
        frequencyCount,
        indicator: indicator
          ? {
              confidence: indicator.confidence,
              severity: indicator.severity,
              type: indicator.type,
            }
          : null,
        normalizedEvent: normalizedEvent
          ? {
              action: normalizedEvent.action ?? null,
              actor: normalizedEvent.actor ?? null,
              destIp: normalizedEvent.destIp ?? null,
              eventType: normalizedEvent.eventType,
              message: normalizedEvent.message ?? null,
              outcome: normalizedEvent.outcome ?? null,
              sourceType: normalizedEvent.sourceType,
              srcIp: normalizedEvent.srcIp ?? null,
            }
          : null,
        threatEvent: {
          confidence: threatEvent.confidence,
          eventType: threatEvent.eventType,
          isSimulated: threatEvent.isSimulated,
          matchedField: threatEvent.matchedField,
          severity: threatEvent.severity,
          sourceType: threatEvent.sourceType,
        },
      });
      const now = Date.now();

      await ctx.db.patch(threatEvent._id, {
        priority: scoringResult.priority,
        scoredAt: now,
        scoringFactors: scoringResult.scoringFactors,
        scoringReason: scoringResult.scoringReason,
        scoringStatus: SCORING_STATUSES.scored,
        severity: scoringResult.priority,
        severityScore: scoringResult.severityScore,
        updatedAt: now,
      });

      return {
        priority: scoringResult.priority,
        severityScore: scoringResult.severityScore,
        status: "scored",
        threatEventId: threatEvent._id,
      };
    } catch {
      return { status: "failed" };
    }
  },
});

async function getThreatEventFrequencyCount(
  ctx: MutationCtx,
  threatEvent: Doc<"threatEvents">,
) {
  const recentRelatedEvents = await ctx.db
    .query("threatEvents")
    .withIndex("by_sourceType_and_detectedAt", (lookup) =>
      lookup.eq("sourceType", threatEvent.sourceType),
    )
    .order("desc")
    .take(MAX_FREQUENCY_CONTEXT_EVENTS);

  return recentRelatedEvents.filter(
    (event) =>
      event.eventType === threatEvent.eventType &&
      event.isSimulated === false,
  ).length;
}

function toThreatEventReference(event: Doc<"threatEvents">) {
  return {
    id: event._id,
  };
}
