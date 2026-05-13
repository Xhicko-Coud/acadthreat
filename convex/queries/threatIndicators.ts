import { v } from "convex/values";

import { query, type QueryCtx } from "@convex/_generated/server";
import { getCurrentAuthUser } from "@convex/auth/authorization";
import {
  THREAT_INDICATOR_SEVERITIES,
  THREAT_INDICATOR_STATUSES,
  THREAT_INDICATOR_TYPES,
  canWriteThreatIndicators,
  type ThreatIndicatorSeverity,
  type ThreatIndicatorStatus,
  type ThreatIndicatorType,
} from "@convex/threatIndicators/helpers";

export const listThreatIndicators = query({
  args: {
    search: v.optional(v.string()),
    provider: v.optional(v.union(v.literal("urlhaus"), v.literal("internal"))),
    severity: v.optional(
      v.union(
        v.literal(THREAT_INDICATOR_SEVERITIES.low),
        v.literal(THREAT_INDICATOR_SEVERITIES.medium),
        v.literal(THREAT_INDICATOR_SEVERITIES.high),
        v.literal(THREAT_INDICATOR_SEVERITIES.critical),
      ),
    ),
    status: v.optional(
      v.union(
        v.literal(THREAT_INDICATOR_STATUSES.active),
        v.literal(THREAT_INDICATOR_STATUSES.archived),
        v.literal(THREAT_INDICATOR_STATUSES.falsePositive),
      ),
    ),
    type: v.optional(
      v.union(
        v.literal(THREAT_INDICATOR_TYPES.ip),
        v.literal(THREAT_INDICATOR_TYPES.domain),
        v.literal(THREAT_INDICATOR_TYPES.url),
        v.literal(THREAT_INDICATOR_TYPES.hash),
        v.literal(THREAT_INDICATOR_TYPES.email),
        v.literal(THREAT_INDICATOR_TYPES.keyword),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const access = await getThreatIndicatorReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const records = await loadThreatIndicators(ctx, {
      provider: args.provider,
      severity: args.severity,
      status: args.status,
      type: args.type,
    });
    const filteredByStructuredFilters = records.filter((indicator) => {
      if (args.status && indicator.status !== args.status) {
        return false;
      }

      if (args.type && indicator.type !== args.type) {
        return false;
      }

      if (args.severity && indicator.severity !== args.severity) {
        return false;
      }

      if (args.provider === "urlhaus" && indicator.provider !== "urlhaus") {
        return false;
      }

      if (args.provider === "internal" && indicator.provider) {
        return false;
      }

      return true;
    });

    const normalizedSearch = args.search?.trim().toLowerCase() ?? "";
    const filteredRecords = normalizedSearch
      ? filteredByStructuredFilters.filter((indicator) =>
          [
            indicator.value,
            indicator.type,
            indicator.severity,
            indicator.status,
            indicator.source ?? "",
            indicator.description ?? "",
            indicator.provider ?? "",
            indicator.tags?.join(" ") ?? "",
            indicator.createdByEmail,
            indicator.updatedByEmail,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : filteredByStructuredFilters;

    const indicators = filteredRecords
      .slice()
      .sort((first, second) => second.createdAt - first.createdAt)
      .map((indicator) => ({
        id: indicator._id,
        confidence: indicator.confidence,
        createdAt: indicator.createdAt,
        createdByEmail: indicator.createdByEmail,
        description: indicator.description ?? null,
        firstSeenAt: indicator.firstSeenAt ?? null,
        lastSeenAt: indicator.lastSeenAt ?? null,
        lastSyncedAt: indicator.lastSyncedAt ?? null,
        provider: indicator.provider ?? null,
        providerIndicatorId: indicator.providerIndicatorId ?? null,
        severity: indicator.severity,
        source: indicator.source ?? null,
        sourceUrl: indicator.sourceUrl ?? null,
        tags: indicator.tags ?? [],
        status: indicator.status,
        type: indicator.type,
        updatedAt: indicator.updatedAt,
        updatedByEmail: indicator.updatedByEmail,
        value: indicator.value,
      }));

    return {
      indicators,
      status: "success",
    } as const;
  },
});

export const getThreatIndicatorDetail = query({
  args: {
    indicatorId: v.id("threatIndicators"),
  },
  handler: async (ctx, args) => {
    const access = await getThreatIndicatorReadContext(ctx);

    if (access.status !== "success") {
      return access;
    }

    const indicator = await ctx.db.get(args.indicatorId);

    if (!indicator) {
      return { status: "not_found" } as const;
    }

    return {
      indicator: {
        id: indicator._id,
        confidence: indicator.confidence,
        createdAt: indicator.createdAt,
        createdByEmail: indicator.createdByEmail,
        description: indicator.description ?? null,
        firstSeenAt: indicator.firstSeenAt ?? null,
        lastSeenAt: indicator.lastSeenAt ?? null,
        lastSyncedAt: indicator.lastSyncedAt ?? null,
        provider: indicator.provider ?? null,
        providerIndicatorId: indicator.providerIndicatorId ?? null,
        severity: indicator.severity,
        source: indicator.source ?? null,
        sourceUrl: indicator.sourceUrl ?? null,
        tags: indicator.tags ?? [],
        status: indicator.status,
        type: indicator.type,
        updatedAt: indicator.updatedAt,
        updatedByEmail: indicator.updatedByEmail,
        value: indicator.value,
      },
      status: "success",
    } as const;
  },
});

export const getThreatIndicatorContext = query({
  args: {},
  handler: async (ctx) => {
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

    const canWrite = canWriteThreatIndicators(profile.role);

    return {
      context: {
        canArchive: canWrite,
        canCreate: canWrite,
        canEdit: canWrite,
        canMarkFalsePositive: canWrite,
        canReactivate: canWrite,
        canView: true,
        email: profile.email,
        name: profile.name ?? null,
        role: profile.role,
        status: profile.status,
        userId: profile.userId,
      },
      status: "success",
    } as const;
  },
});

async function getThreatIndicatorReadContext(
  ctx: QueryCtx,
) {
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

async function loadThreatIndicators(
  ctx: QueryCtx,
  filters: {
    provider?: "urlhaus" | "internal";
    severity?: ThreatIndicatorSeverity;
    status?: ThreatIndicatorStatus;
    type?: ThreatIndicatorType;
  },
) {
  if (filters.status) {
    return await ctx.db
      .query("threatIndicators")
      .withIndex("by_status", (lookup) => lookup.eq("status", filters.status!))
      .collect();
  }

  if (filters.type) {
    return await ctx.db
      .query("threatIndicators")
      .withIndex("by_type", (lookup) => lookup.eq("type", filters.type!))
      .collect();
  }

  if (filters.severity) {
    return await ctx.db
      .query("threatIndicators")
      .withIndex("by_severity", (lookup) =>
        lookup.eq("severity", filters.severity!),
      )
      .collect();
  }

  return await ctx.db.query("threatIndicators").collect();
}
