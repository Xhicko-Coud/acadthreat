import type { Doc } from "@convex/_generated/dataModel";
import { query, type QueryCtx } from "@convex/_generated/server";
import {
  USER_PROFILE_ROLES,
  getCurrentAuthUser,
  type UserProfileRole,
} from "@convex/auth/authorization";
import { LOG_SOURCE_TYPES } from "@convex/logs/helpers";
import {
  PRIORITY_LEVELS,
  SCORING_STATUSES,
  THREAT_EVENT_STATUSES,
  type ThreatEventPriority,
  type ThreatEventScoringStatus,
} from "@convex/threatEvents/helpers";
import { THREAT_INDICATOR_STATUSES } from "@convex/threatIndicators/helpers";

const RECENT_HIGH_PRIORITY_LIMIT = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const DASHBOARD_READ_ROLES = [
  USER_PROFILE_ROLES.admin,
  USER_PROFILE_ROLES.analyst,
  USER_PROFILE_ROLES.viewer,
] as const;

const PRIORITY_DISTRIBUTION_ORDER = [
  PRIORITY_LEVELS.low,
  PRIORITY_LEVELS.medium,
  PRIORITY_LEVELS.high,
  PRIORITY_LEVELS.critical,
] as const;

const STATUS_DISTRIBUTION_ORDER = [
  THREAT_EVENT_STATUSES.open,
  THREAT_EVENT_STATUSES.investigating,
  THREAT_EVENT_STATUSES.resolved,
  THREAT_EVENT_STATUSES.falsePositive,
] as const;

const SOURCE_TYPE_DISTRIBUTION_ORDER = [
  LOG_SOURCE_TYPES.authentication,
  LOG_SOURCE_TYPES.firewall,
] as const;

export const getDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    const access = await getDashboardReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    try {
      const now = Date.now();
      const todayStart = getUtcDayStart(now);
      const sevenDayStart = todayStart - 6 * DAY_IN_MS;

      const [activeIndicators, normalizedEvents, rawLogs, threatEvents] =
        await Promise.all([
          loadActiveIndicators(ctx),
          loadRecentNormalizedEvents(ctx, todayStart),
          loadLatestRawLog(ctx),
          loadThreatEvents(ctx),
        ]);

      return {
        priorityDistribution: buildPriorityDistribution(threatEvents),
        recentHighPriorityThreats:
          buildRecentHighPriorityThreats(threatEvents),
        sevenDayThreatTrend: buildSevenDayThreatTrend({
          startAt: sevenDayStart,
          threatEvents,
        }),
        sourceTypeDistribution: buildSourceTypeDistribution(threatEvents),
        status: "success",
        statusDistribution: buildStatusDistribution(threatEvents),
        summary: {
          activeIndicators: activeIndicators.length,
          highPriorityThreatEvents:
            countHighPriorityThreatEvents(threatEvents),
          lastIngestionAt: rawLogs[0]?.receivedAt ?? null,
          normalizedEventsToday: normalizedEvents.length,
          openThreatEvents: threatEvents.filter(
            (event) => event.status === THREAT_EVENT_STATUSES.open,
          ).length,
          unscoredThreatEvents: threatEvents.filter(
            (event) =>
              (event.scoringStatus ?? SCORING_STATUSES.unscored) ===
              SCORING_STATUSES.unscored,
          ).length,
        },
      } as const;
    } catch {
      return { status: "failed" } as const;
    }
  },
});

async function getDashboardReadContext(ctx: QueryCtx) {
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

  if (!canViewDashboard(profile.role)) {
    return { status: "forbidden" } as const;
  }

  return {
    profile,
    status: "success",
    user,
  } as const;
}

function canViewDashboard(role: UserProfileRole) {
  return DASHBOARD_READ_ROLES.includes(role);
}

async function loadActiveIndicators(ctx: QueryCtx) {
  return await ctx.db
    .query("threatIndicators")
    .withIndex("by_status", (lookup) =>
      lookup.eq("status", THREAT_INDICATOR_STATUSES.active),
    )
    .collect();
}

async function loadRecentNormalizedEvents(ctx: QueryCtx, todayStart: number) {
  return await ctx.db
    .query("normalizedEvents")
    .withIndex("by_eventTimestamp", (lookup) =>
      lookup.gte("eventTimestamp", todayStart),
    )
    .collect();
}

async function loadLatestRawLog(ctx: QueryCtx) {
  return await ctx.db
    .query("rawLogs")
    .withIndex("by_receivedAt")
    .order("desc")
    .take(1);
}

async function loadThreatEvents(ctx: QueryCtx) {
  return await ctx.db.query("threatEvents").collect();
}

function buildPriorityDistribution(threatEvents: Doc<"threatEvents">[]) {
  return PRIORITY_DISTRIBUTION_ORDER.map((priority) => ({
    count: threatEvents.filter(
      (event) => getDashboardPriority(event) === priority,
    ).length,
    priority,
  }));
}

function buildStatusDistribution(threatEvents: Doc<"threatEvents">[]) {
  return STATUS_DISTRIBUTION_ORDER.map((status) => ({
    count: threatEvents.filter((event) => event.status === status).length,
    status,
  }));
}

function buildSourceTypeDistribution(threatEvents: Doc<"threatEvents">[]) {
  return SOURCE_TYPE_DISTRIBUTION_ORDER.map((sourceType) => ({
    count: threatEvents.filter((event) => event.sourceType === sourceType)
      .length,
    sourceType,
  }));
}

function buildSevenDayThreatTrend({
  startAt,
  threatEvents,
}: {
  startAt: number;
  threatEvents: Doc<"threatEvents">[];
}) {
  return Array.from({ length: 7 }, (_, index) => {
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

function buildRecentHighPriorityThreats(
  threatEvents: Doc<"threatEvents">[],
) {
  return threatEvents
    .filter(isHighPriorityThreatEvent)
    .sort((first, second) => second.detectedAt - first.detectedAt)
    .slice(0, RECENT_HIGH_PRIORITY_LIMIT)
    .map(toRecentHighPriorityThreat);
}

function countHighPriorityThreatEvents(threatEvents: Doc<"threatEvents">[]) {
  return threatEvents.filter(isHighPriorityThreatEvent).length;
}

function isHighPriorityThreatEvent(event: Doc<"threatEvents">) {
  const priority = getDashboardPriority(event);

  return (
    priority === PRIORITY_LEVELS.high ||
    priority === PRIORITY_LEVELS.critical
  );
}

function toRecentHighPriorityThreat(event: Doc<"threatEvents">) {
  return {
    correlationReason: event.correlationReason,
    detectedAt: event.detectedAt,
    eventType: event.eventType,
    evidenceSummary: event.evidenceSummary,
    id: event._id,
    indicatorType: event.indicatorType,
    indicatorValue: event.indicatorValue,
    isSimulated: event.isSimulated,
    matchedField: event.matchedField,
    priority: getDashboardPriority(event),
    scoringStatus: getDashboardScoringStatus(event),
    severity: event.severity,
    severityScore: event.severityScore ?? 0,
    sourceType: event.sourceType,
    status: event.status,
  };
}

function getDashboardPriority(
  event: Doc<"threatEvents">,
): ThreatEventPriority {
  return event.priority ?? event.severity;
}

function getDashboardScoringStatus(
  event: Doc<"threatEvents">,
): ThreatEventScoringStatus {
  return event.scoringStatus ?? SCORING_STATUSES.unscored;
}

function getUtcDayStart(timestamp: number) {
  const date = new Date(timestamp);

  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

function formatUtcDateLabel(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}
