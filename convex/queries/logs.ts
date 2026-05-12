import { v } from "convex/values";

import { query, type QueryCtx } from "@convex/_generated/server";
import { getCurrentAuthUser } from "@convex/auth/authorization";
import {
  INGESTION_STATUSES,
  LOG_SOURCE_TYPES,
  NORMALIZED_EVENT_SEVERITIES,
  PARSE_STATUSES,
  canViewRawLogs,
  logSourceTypeValidator,
  normalizedEventSeverityValidator,
  logIngestionStatusValidator,
  logParseStatusValidator,
  type LogSourceType,
  type NormalizedEventSeverity,
  type LogIngestionStatus,
  type LogParseStatus,
} from "@convex/logs/helpers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_LIST_RESULTS = 100;

// ---------------------------------------------------------------------------
// getLogIngestionContext
// ---------------------------------------------------------------------------

export const getLogIngestionContext = query({
  args: {},
  handler: async (ctx) => {
    const access = await getLogReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const rawAccess = canViewRawLogs(access.profile.role);

    return {
      capabilities: {
        canViewNormalizedEvents: true,
        canViewRawLogs: rawAccess,
        canViewRawPayload: rawAccess,
      },
      role: access.profile.role,
      status: "success",
    } as const;
  },
});

// ---------------------------------------------------------------------------
// listNormalizedEvents
// ---------------------------------------------------------------------------

export const listNormalizedEvents = query({
  args: {
    sourceType: v.optional(logSourceTypeValidator),
    eventType: v.optional(v.string()),
    severity: v.optional(normalizedEventSeverityValidator),
    outcome: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await getLogReadContext(ctx);

    if (access.status !== "success") {
      return { ...access, events: [] };
    }

    const records = await loadNormalizedEvents(ctx, {
      sourceType: args.sourceType,
    });

    // In-memory structured filters
    const filteredByStructured = records.filter((event) => {
      if (args.sourceType && event.sourceType !== args.sourceType) {
        return false;
      }

      if (args.eventType && event.eventType !== args.eventType) {
        return false;
      }

      if (args.severity && event.severity !== args.severity) {
        return false;
      }

      if (args.outcome && event.outcome !== args.outcome) {
        return false;
      }

      return true;
    });

    // Text search across safe normalized fields
    const normalizedSearch = args.search?.trim().toLowerCase() ?? "";
    const filteredRecords = normalizedSearch
      ? filteredByStructured.filter((event) =>
          [
            event.eventType,
            event.actor ?? "",
            event.srcIp ?? "",
            event.destIp ?? "",
            event.action ?? "",
            event.outcome ?? "",
            event.message ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : filteredByStructured;

    // Sort newest first, bounded
    const events = filteredRecords
      .slice()
      .sort((a, b) => b.eventTimestamp - a.eventTimestamp)
      .slice(0, MAX_LIST_RESULTS)
      .map((event) => ({
        id: event._id,
        sourceType: event.sourceType,
        eventType: event.eventType,
        eventTimestamp: event.eventTimestamp,
        actor: event.actor ?? null,
        srcIp: event.srcIp ?? null,
        destIp: event.destIp ?? null,
        srcPort: event.srcPort ?? null,
        destPort: event.destPort ?? null,
        protocol: event.protocol ?? null,
        action: event.action ?? null,
        outcome: event.outcome ?? null,
        severity: event.severity ?? null,
        userAgent: event.userAgent ?? null,
        requestPath: event.requestPath ?? null,
        message: event.message ?? null,
        isSimulated: event.isSimulated,
        createdAt: event.createdAt,
      }));

    return {
      events,
      status: "success",
    } as const;
  },
});

// ---------------------------------------------------------------------------
// getNormalizedEventDetail
// ---------------------------------------------------------------------------

export const getNormalizedEventDetail = query({
  args: {
    eventId: v.id("normalizedEvents"),
  },
  handler: async (ctx, args) => {
    const access = await getLogReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      return { status: "not_found" } as const;
    }

    const rawAccess = canViewRawLogs(access.profile.role);

    return {
      event: {
        id: event._id,
        sourceType: event.sourceType,
        eventType: event.eventType,
        eventTimestamp: event.eventTimestamp,
        actor: event.actor ?? null,
        srcIp: event.srcIp ?? null,
        destIp: event.destIp ?? null,
        srcPort: event.srcPort ?? null,
        destPort: event.destPort ?? null,
        protocol: event.protocol ?? null,
        action: event.action ?? null,
        outcome: event.outcome ?? null,
        severity: event.severity ?? null,
        userAgent: event.userAgent ?? null,
        requestPath: event.requestPath ?? null,
        message: event.message ?? null,
        isSimulated: event.isSimulated,
        createdAt: event.createdAt,
        ...(rawAccess
          ? { rawLogId: event.rawLogId, canViewRawLog: true }
          : { canViewRawLog: false }),
      },
      status: "success",
    } as const;
  },
});

// ---------------------------------------------------------------------------
// listRawLogs (admin/analyst only)
// ---------------------------------------------------------------------------

export const listRawLogs = query({
  args: {
    sourceType: v.optional(logSourceTypeValidator),
    ingestionStatus: v.optional(logIngestionStatusValidator),
    parseStatus: v.optional(logParseStatusValidator),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await getLogRawReadContext(ctx);

    if (access.status !== "success") {
      return { ...access, rawLogs: [] };
    }

    const records = await loadRawLogs(ctx, {
      sourceType: args.sourceType,
      ingestionStatus: args.ingestionStatus,
    });

    // In-memory structured filters
    const filteredByStructured = records.filter((log) => {
      if (args.sourceType && log.sourceType !== args.sourceType) {
        return false;
      }

      if (args.ingestionStatus && log.ingestionStatus !== args.ingestionStatus) {
        return false;
      }

      if (args.parseStatus && log.parseStatus !== args.parseStatus) {
        return false;
      }

      return true;
    });

    // Text search (safe fields only, not payload)
    const normalizedSearch = args.search?.trim().toLowerCase() ?? "";
    const filteredRecords = normalizedSearch
      ? filteredByStructured.filter((log) =>
          [
            log.sourceName ?? "",
            log.clientId ?? "",
            log.payloadHash,
            log.idempotencyKey,
            log.errorMessage ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : filteredByStructured;

    // Sort newest first, bounded — no payload in list
    const rawLogs = filteredRecords
      .slice()
      .sort((a, b) => b.receivedAt - a.receivedAt)
      .slice(0, MAX_LIST_RESULTS)
      .map((log) => ({
        id: log._id,
        sourceType: log.sourceType,
        sourceName: log.sourceName ?? null,
        receivedAt: log.receivedAt,
        eventTimestamp: log.eventTimestamp ?? null,
        payloadHash: log.payloadHash,
        idempotencyKey: log.idempotencyKey,
        ingestionStatus: log.ingestionStatus,
        parseStatus: log.parseStatus,
        errorMessage: log.errorMessage ?? null,
        clientId: log.clientId ?? null,
        isSimulated: log.isSimulated,
        createdAt: log.createdAt,
      }));

    return {
      rawLogs,
      status: "success",
    } as const;
  },
});

// ---------------------------------------------------------------------------
// getRawLogDetail (admin/analyst only)
// ---------------------------------------------------------------------------

export const getRawLogDetail = query({
  args: {
    rawLogId: v.id("rawLogs"),
  },
  handler: async (ctx, args) => {
    const access = await getLogRawReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const log = await ctx.db.get(args.rawLogId);

    if (!log) {
      return { status: "not_found" } as const;
    }

    return {
      rawLog: {
        id: log._id,
        sourceType: log.sourceType,
        sourceName: log.sourceName ?? null,
        receivedAt: log.receivedAt,
        eventTimestamp: log.eventTimestamp ?? null,
        payload: log.payload,
        payloadHash: log.payloadHash,
        idempotencyKey: log.idempotencyKey,
        ingestionStatus: log.ingestionStatus,
        parseStatus: log.parseStatus,
        errorMessage: log.errorMessage ?? null,
        clientId: log.clientId ?? null,
        isSimulated: log.isSimulated,
        createdAt: log.createdAt,
      },
      status: "success",
    } as const;
  },
});

// ---------------------------------------------------------------------------
// Private Helpers
// ---------------------------------------------------------------------------

/**
 * Validate auth and active profile for normalized event access.
 * All active roles (admin, analyst, viewer) are allowed.
 */
async function getLogReadContext(ctx: QueryCtx) {
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

  return {
    profile,
    status: "success",
    user,
  } as const;
}

/**
 * Validate auth and active profile for raw log access.
 * Only admin and analyst are allowed.
 */
async function getLogRawReadContext(ctx: QueryCtx) {
  const user = await getCurrentAuthUser(ctx);

  if (!user) {
    return { status: "unauthenticated" } as const;
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (lookup) => lookup.eq("userId", user._id))
    .unique();

  if (
    !profile ||
    profile.status !== "active" ||
    !canViewRawLogs(profile.role)
  ) {
    return { status: "forbidden" } as const;
  }

  return {
    profile,
    status: "success",
    user,
  } as const;
}

/**
 * Load normalized events using the best available index.
 */
async function loadNormalizedEvents(
  ctx: QueryCtx,
  filters: {
    sourceType?: LogSourceType;
  },
) {
  if (filters.sourceType) {
    return await ctx.db
      .query("normalizedEvents")
      .withIndex("by_sourceType", (lookup) =>
        lookup.eq("sourceType", filters.sourceType!),
      )
      .collect();
  }

  return await ctx.db.query("normalizedEvents").collect();
}

/**
 * Load raw logs using the best available index.
 */
async function loadRawLogs(
  ctx: QueryCtx,
  filters: {
    sourceType?: LogSourceType;
    ingestionStatus?: LogIngestionStatus;
  },
) {
  if (filters.sourceType) {
    return await ctx.db
      .query("rawLogs")
      .withIndex("by_sourceType", (lookup) =>
        lookup.eq("sourceType", filters.sourceType!),
      )
      .collect();
  }

  if (filters.ingestionStatus) {
    return await ctx.db
      .query("rawLogs")
      .withIndex("by_ingestionStatus", (lookup) =>
        lookup.eq("ingestionStatus", filters.ingestionStatus!),
      )
      .collect();
  }

  return await ctx.db.query("rawLogs").collect();
}
