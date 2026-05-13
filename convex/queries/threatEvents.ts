import { v } from "convex/values";

import type { Doc } from "@convex/_generated/dataModel";
import { query, type QueryCtx } from "@convex/_generated/server";
import { getCurrentAuthUser } from "@convex/auth/authorization";
import { logSourceTypeValidator } from "@convex/logs/helpers";
import {
  threatIndicatorSeverityValidator,
  threatIndicatorTypeValidator,
} from "@convex/threatIndicators/helpers";
import {
  canUpdateThreatEventStatus,
  canViewThreatEvents,
  threatEventStatusValidator,
} from "@convex/threatEvents/helpers";

const MAX_LIST_RESULTS = 100;

export const getThreatEventContext = query({
  args: {},
  handler: async (ctx) => {
    const access = await getThreatEventReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    return {
      capabilities: {
        canUpdateThreatEventStatus: canUpdateThreatEventStatus(
          access.profile.role,
        ),
        canViewThreatEvents: true,
      },
      role: access.profile.role,
      status: "success",
    } as const;
  },
});

export const listThreatEvents = query({
  args: {
    indicatorType: v.optional(threatIndicatorTypeValidator),
    search: v.optional(v.string()),
    severity: v.optional(threatIndicatorSeverityValidator),
    sourceType: v.optional(logSourceTypeValidator),
    status: v.optional(threatEventStatusValidator),
  },
  handler: async (ctx, args) => {
    const access = await getThreatEventReadContext(ctx);

    if (access.status !== "success") {
      return { ...access, threatEvents: [] };
    }

    try {
      const records = await loadThreatEvents(ctx, {
        severity: args.severity,
        sourceType: args.sourceType,
        status: args.status,
      });
      const normalizedSearch = args.search?.trim().toLowerCase() ?? "";

      const threatEvents = records
        .filter((event) => matchesStructuredFilters(event, args))
        .filter((event) =>
          normalizedSearch
            ? matchesThreatEventSearch(event, normalizedSearch)
            : true,
        )
        .sort((first, second) => second.detectedAt - first.detectedAt)
        .slice(0, MAX_LIST_RESULTS)
        .map(toThreatEventRow);

      return {
        status: "success",
        threatEvents,
      } as const;
    } catch {
      return {
        status: "failed",
        threatEvents: [],
      } as const;
    }
  },
});

export const getThreatEventDetail = query({
  args: {
    threatEventId: v.id("threatEvents"),
  },
  handler: async (ctx, args) => {
    const access = await getThreatEventReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    try {
      const threatEvent = await ctx.db.get(args.threatEventId);

      if (!threatEvent) {
        return { status: "not_found" } as const;
      }

      const [normalizedEvent, indicator] = await Promise.all([
        ctx.db.get(threatEvent.normalizedEventId),
        ctx.db.get(threatEvent.matchedIndicatorId),
      ]);

      return {
        status: "success",
        threatEvent: toThreatEventDetail(threatEvent, {
          indicator,
          normalizedEvent,
        }),
      } as const;
    } catch {
      return { status: "failed" } as const;
    }
  },
});

async function getThreatEventReadContext(ctx: QueryCtx) {
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

  if (!canViewThreatEvents(profile.role)) {
    return { status: "forbidden" } as const;
  }

  return {
    profile,
    status: "success",
    user,
  } as const;
}

async function loadThreatEvents(
  ctx: QueryCtx,
  filters: {
    severity?: Doc<"threatEvents">["severity"];
    sourceType?: Doc<"threatEvents">["sourceType"];
    status?: Doc<"threatEvents">["status"];
  },
) {
  if (filters.status) {
    return await ctx.db
      .query("threatEvents")
      .withIndex("by_status_and_detectedAt", (lookup) =>
        lookup.eq("status", filters.status!),
      )
      .order("desc")
      .take(MAX_LIST_RESULTS);
  }

  if (filters.severity) {
    return await ctx.db
      .query("threatEvents")
      .withIndex("by_severity_and_detectedAt", (lookup) =>
        lookup.eq("severity", filters.severity!),
      )
      .order("desc")
      .take(MAX_LIST_RESULTS);
  }

  if (filters.sourceType) {
    return await ctx.db
      .query("threatEvents")
      .withIndex("by_sourceType_and_detectedAt", (lookup) =>
        lookup.eq("sourceType", filters.sourceType!),
      )
      .order("desc")
      .take(MAX_LIST_RESULTS);
  }

  return await ctx.db
    .query("threatEvents")
    .withIndex("by_detectedAt")
    .order("desc")
    .take(MAX_LIST_RESULTS);
}

function matchesStructuredFilters(
  event: Doc<"threatEvents">,
  filters: {
    indicatorType?: Doc<"threatEvents">["indicatorType"];
    severity?: Doc<"threatEvents">["severity"];
    sourceType?: Doc<"threatEvents">["sourceType"];
    status?: Doc<"threatEvents">["status"];
  },
) {
  if (filters.status && event.status !== filters.status) {
    return false;
  }

  if (filters.severity && event.severity !== filters.severity) {
    return false;
  }

  if (filters.sourceType && event.sourceType !== filters.sourceType) {
    return false;
  }

  if (filters.indicatorType && event.indicatorType !== filters.indicatorType) {
    return false;
  }

  return true;
}

function matchesThreatEventSearch(
  event: Doc<"threatEvents">,
  normalizedSearch: string,
) {
  return [
    event.eventType,
    event.sourceType,
    event.indicatorValue,
    event.indicatorType,
    event.matchedField,
    event.severity,
    event.status,
    event.correlationReason,
    event.evidenceSummary,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function toThreatEventRow(event: Doc<"threatEvents">) {
  return {
    id: event._id,
    confidence: event.confidence,
    correlationReason: event.correlationReason,
    createdAt: event.createdAt,
    detectedAt: event.detectedAt,
    eventType: event.eventType,
    evidenceSummary: event.evidenceSummary,
    indicatorType: event.indicatorType,
    indicatorValue: event.indicatorValue,
    isSimulated: event.isSimulated,
    matchedField: event.matchedField,
    severity: event.severity,
    sourceType: event.sourceType,
    status: event.status,
    updatedAt: event.updatedAt,
  };
}

function toThreatEventDetail(
  event: Doc<"threatEvents">,
  context: {
    indicator: Doc<"threatIndicators"> | null;
    normalizedEvent: Doc<"normalizedEvents"> | null;
  },
) {
  return {
    ...toThreatEventRow(event),
    indicator: context.indicator
      ? toSafeIndicatorContext(context.indicator)
      : null,
    normalizedEvent: context.normalizedEvent
      ? toSafeNormalizedEventContext(context.normalizedEvent)
      : null,
  };
}

function toSafeNormalizedEventContext(event: Doc<"normalizedEvents">) {
  return {
    action: event.action ?? null,
    actor: event.actor ?? null,
    createdAt: event.createdAt,
    destIp: event.destIp ?? null,
    destPort: event.destPort ?? null,
    eventTimestamp: event.eventTimestamp,
    eventType: event.eventType,
    isSimulated: event.isSimulated,
    message: event.message ?? null,
    outcome: event.outcome ?? null,
    protocol: event.protocol ?? null,
    requestPath: event.requestPath ?? null,
    severity: event.severity ?? null,
    sourceType: event.sourceType,
    srcIp: event.srcIp ?? null,
    srcPort: event.srcPort ?? null,
    userAgent: event.userAgent ?? null,
  };
}

function toSafeIndicatorContext(indicator: Doc<"threatIndicators">) {
  return {
    confidence: indicator.confidence,
    createdAt: indicator.createdAt,
    description: indicator.description ?? null,
    severity: indicator.severity,
    source: indicator.source ?? null,
    status: indicator.status,
    type: indicator.type,
    updatedAt: indicator.updatedAt,
    value: indicator.value,
  };
}
