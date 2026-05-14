import type { Doc } from "@convex/_generated/dataModel";
import { query, type QueryCtx } from "@convex/_generated/server";
import { v } from "convex/values";
import {
  USER_PROFILE_ROLES,
  getCurrentAuthUser,
  type UserProfileRole,
} from "@convex/auth/authorization";
import {
  PRIORITY_LEVELS,
  type ThreatEventPriority,
} from "@convex/threatEvents/helpers";

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const DEFAULT_HISTORICAL_WINDOW_DAYS = 14;
const MIN_HISTORICAL_WINDOW_DAYS = 1;
const MAX_HISTORICAL_WINDOW_DAYS = 28;
const PREDICTION_WINDOW_DAYS = 3;
const MINIMUM_EVENTS_FOR_TREND = 7;
const LOW_CONFIDENCE_EVENT_LIMIT = 14;
const HIGH_CONFIDENCE_EVENT_LIMIT = 28;
const MAX_TREND_EVENTS = 5000;
const SMALL_CURRENT_COUNT_LIMIT = 3;
const STABLE_CHANGE_RATIO = 0.1;
const PROJECTION_ADJUSTMENT_RATIO = 0.15;

const TREND_PREDICTION_READ_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
  USER_PROFILE_ROLES.viewer,
] as const;

const PRIORITY_TREND_ORDER = [
  PRIORITY_LEVELS.low,
  PRIORITY_LEVELS.medium,
  PRIORITY_LEVELS.high,
  PRIORITY_LEVELS.critical,
] as const;

type TrendDirection =
  | "increasing"
  | "decreasing"
  | "stable"
  | "insufficient_data";

type TrendConfidence = "low" | "medium" | "high";

export const getThreatTrendPrediction = query({
  args: {
    historicalWindowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const access = await getTrendPredictionReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    try {
      const now = Date.now();
      const todayStart = getUtcDayStart(now);
      const currentHourStart = getUtcHourStart(now);
      const historicalWindowDays = normalizeHistoricalWindowDays(
        args.historicalWindowDays,
      );
      const comparisonWindowDays = Math.max(
        1,
        Math.ceil(historicalWindowDays / 2),
      );
      const historicalStart =
        historicalWindowDays === 1
          ? currentHourStart - 23 * HOUR_IN_MS
          : todayStart - (historicalWindowDays - 1) * DAY_IN_MS;
      const historicalEnd =
        historicalWindowDays === 1
          ? currentHourStart + HOUR_IN_MS
          : todayStart + DAY_IN_MS;
      const currentStart =
        historicalEnd - comparisonWindowDays * DAY_IN_MS;

      const threatEvents = await loadHistoricalThreatEvents(ctx, {
        endAt: historicalEnd,
        startAt: historicalStart,
      });
      const prediction = buildTrendPrediction({
        startAt: currentStart,
        comparisonWindowDays,
        historicalEnd,
        historicalStart,
        historicalWindowDays,
        threatEvents,
      });

      return {
        ...prediction,
        historicalWindowDays,
        predictionWindowDays: PREDICTION_WINDOW_DAYS,
        status: "success",
      } as const;
    } catch {
      return { status: "failed" } as const;
    }
  },
});

async function getTrendPredictionReadContext(ctx: QueryCtx) {
  const user = await getCurrentAuthUser(ctx);

  if (!user) {
    return { status: "unauthenticated" } as const;
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (lookup) => lookup.eq("userId", user._id))
    .unique();

  if (!profile || profile.status !== "active") {
    return { status: "forbidden" } as const;
  }

  if (!canViewTrendPrediction(profile.role)) {
    return { status: "forbidden" } as const;
  }

  return { profile, status: "success", user } as const;
}

function canViewTrendPrediction(role: UserProfileRole) {
  return TREND_PREDICTION_READ_ROLES.includes(role);
}

async function loadHistoricalThreatEvents(
  ctx: QueryCtx,
  window: { endAt: number; startAt: number },
) {
  const records = await ctx.db
    .query("threatEvents")
    .withIndex("by_detectedAt", (lookup) =>
      lookup.gte("detectedAt", window.startAt),
    )
    .order("asc")
    .take(MAX_TREND_EVENTS);

  return records.filter((event) => event.detectedAt < window.endAt);
}

function buildTrendPrediction({
  comparisonWindowDays,
  historicalEnd,
  historicalStart,
  historicalWindowDays,
  startAt,
  threatEvents,
}: {
  comparisonWindowDays: number;
  historicalEnd: number;
  historicalStart: number;
  historicalWindowDays: number;
  startAt: number;
  threatEvents: Doc<"threatEvents">[];
}) {
  const previousEvents = filterEventsInWindow(threatEvents, {
    endAt: startAt,
    startAt: historicalStart,
  });
  const currentEvents = filterEventsInWindow(threatEvents, {
    endAt: historicalEnd,
    startAt,
  });
  const trendDirection = getTrendDirection({
    currentCount: currentEvents.length,
    previousCount: previousEvents.length,
    totalCount: threatEvents.length,
  });

  return {
    confidence: getTrendConfidence({
      currentCount: currentEvents.length,
      previousCount: previousEvents.length,
      totalCount: threatEvents.length,
      trendDirection,
    }),
    historicalSeries: buildHistoricalSeries({
      historicalWindowDays,
      startAt: historicalStart,
      threatEvents,
    }),
    priorityTrend: buildPriorityTrend({ currentEvents, previousEvents }),
    projectedSeries: buildProjectedSeries({
      comparisonWindowDays,
      currentCount: currentEvents.length,
      historicalWindowDays,
      startAt: historicalEnd,
      trendDirection,
    }),
    summary: getTrendSummary(trendDirection, historicalWindowDays),
    trendDirection,
  };
}

function buildHistoricalSeries({
  historicalWindowDays,
  startAt,
  threatEvents,
}: {
  historicalWindowDays: number;
  startAt: number;
  threatEvents: Doc<"threatEvents">[];
}) {
  if (historicalWindowDays === 1) {
    return Array.from({ length: 24 }, (_, index) => {
      const hourStart = startAt + index * HOUR_IN_MS;
      const hourEnd = hourStart + HOUR_IN_MS;

      return {
        count: threatEvents.filter(
          (event) =>
            event.detectedAt >= hourStart && event.detectedAt < hourEnd,
        ).length,
        date: formatUtcHourLabel(hourStart),
      };
    });
  }

  return Array.from({ length: historicalWindowDays }, (_, index) => {
    const dayStart = startAt + index * DAY_IN_MS;
    const dayEnd = dayStart + DAY_IN_MS;

    return {
      count: threatEvents.filter(
        (event) => event.detectedAt >= dayStart && event.detectedAt < dayEnd,
      ).length,
      date: formatUtcDateLabel(dayStart),
    };
  });
}

function filterEventsInWindow(
  threatEvents: Doc<"threatEvents">[],
  window: { endAt: number; startAt: number },
) {
  return threatEvents.filter(
    (event) =>
      event.detectedAt >= window.startAt && event.detectedAt < window.endAt,
  );
}

function getTrendDirection({
  currentCount,
  previousCount,
  totalCount,
}: {
  currentCount: number;
  previousCount: number;
  totalCount: number;
}): TrendDirection {
  if (
    totalCount < MINIMUM_EVENTS_FOR_TREND ||
    (currentCount === 0 && previousCount === 0)
  ) {
    return "insufficient_data";
  }

  const change = currentCount - previousCount;

  if (previousCount === 0) {
    return currentCount <= SMALL_CURRENT_COUNT_LIMIT ? "stable" : "increasing";
  }

  if (Math.abs(change) <= previousCount * STABLE_CHANGE_RATIO) {
    return "stable";
  }

  return change > 0 ? "increasing" : "decreasing";
}

function getTrendConfidence({
  currentCount,
  previousCount,
  totalCount,
  trendDirection,
}: {
  currentCount: number;
  previousCount: number;
  totalCount: number;
  trendDirection: TrendDirection;
}): TrendConfidence {
  if (
    trendDirection === "insufficient_data" ||
    totalCount < LOW_CONFIDENCE_EVENT_LIMIT
  ) {
    return "low";
  }

  const clearChange =
    Math.abs(currentCount - previousCount) >
    Math.max(previousCount, 1) * 0.25;

  if (totalCount >= HIGH_CONFIDENCE_EVENT_LIMIT && clearChange) {
    return "high";
  }

  return "medium";
}

function buildProjectedSeries({
  comparisonWindowDays,
  currentCount,
  historicalWindowDays,
  startAt,
  trendDirection,
}: {
  comparisonWindowDays: number;
  currentCount: number;
  historicalWindowDays: number;
  startAt: number;
  trendDirection: TrendDirection;
}) {
  if (trendDirection === "insufficient_data") {
    return [];
  }

  const adjustment = getProjectionAdjustment(trendDirection);

  if (historicalWindowDays === 1) {
    const hourlyAverage = currentCount / 24;

    return Array.from({ length: 3 }, (_, index) => ({
      count: Math.max(0, Math.round(hourlyAverage * adjustment)),
      date: formatUtcHourLabel(startAt + index * HOUR_IN_MS),
      projected: true as const,
    }));
  }

  const dailyAverage = currentCount / comparisonWindowDays;

  return Array.from({ length: PREDICTION_WINDOW_DAYS }, (_, index) => ({
    count: Math.max(0, Math.round(dailyAverage * adjustment)),
    date: formatUtcDateLabel(startAt + index * DAY_IN_MS),
    projected: true as const,
  }));
}

function getProjectionAdjustment(trendDirection: TrendDirection) {
  if (trendDirection === "increasing") {
    return 1 + PROJECTION_ADJUSTMENT_RATIO;
  }

  if (trendDirection === "decreasing") {
    return 1 - PROJECTION_ADJUSTMENT_RATIO;
  }

  return 1;
}

function buildPriorityTrend({
  currentEvents,
  previousEvents,
}: {
  currentEvents: Doc<"threatEvents">[];
  previousEvents: Doc<"threatEvents">[];
}) {
  return PRIORITY_TREND_ORDER.map((priority) => {
    const current = countPriority(currentEvents, priority);
    const previous = countPriority(previousEvents, priority);

    return {
      change: current - previous,
      current,
      previous,
      priority,
    };
  });
}

function countPriority(
  threatEvents: Doc<"threatEvents">[],
  priority: ThreatEventPriority,
) {
  return threatEvents.filter(
    (event) => getThreatEventPriority(event) === priority,
  ).length;
}

function getThreatEventPriority(
  event: Doc<"threatEvents">,
): ThreatEventPriority {
  return event.priority ?? event.severity;
}

function getTrendSummary(
  trendDirection: TrendDirection,
  historicalWindowDays: number,
) {
  if (trendDirection === "insufficient_data") {
    return "There is not enough generated threat event data to estimate a reliable trend.";
  }

  if (trendDirection === "increasing") {
    return `Threat activity is currently increasing based on generated threat events from the last ${historicalWindowDays === 1 ? "24 hours" : `${historicalWindowDays} days`}.`;
  }

  if (trendDirection === "decreasing") {
    return `Threat activity is currently decreasing based on generated threat events from the last ${historicalWindowDays === 1 ? "24 hours" : `${historicalWindowDays} days`}.`;
  }

  return "Threat activity appears stable based on recent generated threat events.";
}

function normalizeHistoricalWindowDays(windowDays: number | undefined) {
  if (typeof windowDays !== "number" || !Number.isFinite(windowDays)) {
    return DEFAULT_HISTORICAL_WINDOW_DAYS;
  }

  return Math.min(
    MAX_HISTORICAL_WINDOW_DAYS,
    Math.max(MIN_HISTORICAL_WINDOW_DAYS, Math.trunc(windowDays)),
  );
}

function getUtcDayStart(timestamp: number) {
  const date = new Date(timestamp);

  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

function getUtcHourStart(timestamp: number) {
  const date = new Date(timestamp);

  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
  );
}

function formatUtcDateLabel(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function formatUtcHourLabel(timestamp: number) {
  return `${new Date(timestamp).toISOString().slice(11, 16)} UTC`;
}
