import { v } from "convex/values";

import type { Doc } from "@convex/_generated/dataModel";
import { internalMutation } from "@convex/_generated/server";
import { truncateText } from "@convex/logs/helpers";
import {
  THREAT_INDICATOR_STATUSES,
  THREAT_INDICATOR_TYPES,
} from "@convex/threatIndicators/helpers";
import {
  THREAT_EVENT_STATUSES,
  buildThreatEventDeduplicationKey,
  isValidThreatEventConfidence,
  normalizeCorrelationText,
  raiseSeverityOneLevel,
  type ThreatEventMatchedField,
  type ThreatEventSeverity,
} from "@convex/threatEvents/helpers";

type NormalizedEvent = Doc<"normalizedEvents">;
type ThreatIndicator = Doc<"threatIndicators">;

type CorrelationMatch = {
  indicator: ThreatIndicator;
  matchedField: ThreatEventMatchedField;
  matchedValue: string;
};

type CorrelationResult =
  | {
      created: number;
      matches: number;
      skipped: number;
      status: "correlated";
    }
  | {
      created: 0;
      skipped: 0;
      status: "not_found";
    }
  | {
      created: 0;
      matches: 0;
      skipped: 0;
      status: "failed" | "no_matches";
    };

export const correlateNormalizedEventInternal = internalMutation({
  args: {
    normalizedEventId: v.id("normalizedEvents"),
  },
  handler: async (ctx, args): Promise<CorrelationResult> => {
    try {
      const event = await ctx.db.get(args.normalizedEventId);

      if (!event) {
        return {
          created: 0,
          skipped: 0,
          status: "not_found",
        };
      }

      const activeIndicators = await ctx.db
        .query("threatIndicators")
        .withIndex("by_status", (lookup) =>
          lookup.eq("status", THREAT_INDICATOR_STATUSES.active),
        )
        .collect();

      const matches = findIndicatorMatchesForEvent(event, activeIndicators);

      if (matches.length === 0) {
        return {
          created: 0,
          matches: 0,
          skipped: 0,
          status: "no_matches",
        };
      }

      const now = Date.now();
      let created = 0;
      let skipped = 0;

      for (const match of matches) {
        const deduplicationKey = buildThreatEventDeduplicationKey(
          event._id,
          match.indicator._id,
          match.matchedField,
        );
        const existingThreatEvent = await ctx.db
          .query("threatEvents")
          .withIndex("by_deduplicationKey", (lookup) =>
            lookup.eq("deduplicationKey", deduplicationKey),
          )
          .unique();

        if (existingThreatEvent) {
          skipped += 1;
          continue;
        }

        if (!isValidThreatEventConfidence(match.indicator.confidence)) {
          skipped += 1;
          continue;
        }

        await ctx.db.insert("threatEvents", {
          normalizedEventId: event._id,
          rawLogId: event.rawLogId,
          matchedIndicatorId: match.indicator._id,
          deduplicationKey,
          eventType: event.eventType,
          sourceType: event.sourceType,
          indicatorType: match.indicator.type,
          indicatorValue: match.indicator.value,
          matchedField: match.matchedField,
          severity: deriveThreatEventSeverity(event, match.indicator.severity),
          confidence: match.indicator.confidence,
          status: THREAT_EVENT_STATUSES.open,
          correlationReason: buildCorrelationReason(match),
          evidenceSummary: buildEvidenceSummary(event, match),
          isSimulated: event.isSimulated,
          detectedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
      }

      return {
        created,
        matches: matches.length,
        skipped,
        status: "correlated",
      };
    } catch {
      return {
        created: 0,
        matches: 0,
        skipped: 0,
        status: "failed",
      };
    }
  },
});

function findIndicatorMatchesForEvent(
  event: NormalizedEvent,
  indicators: ThreatIndicator[],
) {
  return indicators.flatMap((indicator) => {
    if (indicator.status !== THREAT_INDICATOR_STATUSES.active) {
      return [];
    }

    if (indicator.type === THREAT_INDICATOR_TYPES.ip) {
      return matchIpIndicator(event, indicator);
    }

    if (indicator.type === THREAT_INDICATOR_TYPES.domain) {
      return matchDomainIndicator(event, indicator);
    }

    if (indicator.type === THREAT_INDICATOR_TYPES.url) {
      return matchUrlIndicator(event, indicator);
    }

    if (indicator.type === THREAT_INDICATOR_TYPES.email) {
      return matchEmailIndicator(event, indicator);
    }

    if (indicator.type === THREAT_INDICATOR_TYPES.keyword) {
      return matchKeywordIndicator(event, indicator);
    }

    return [];
  });
}

function matchIpIndicator(
  event: NormalizedEvent,
  indicator: ThreatIndicator,
): CorrelationMatch[] {
  const indicatorValue = normalizeIndicatorMatchValue(indicator);
  const fields = [
    { field: "srcIp", value: event.srcIp },
    { field: "destIp", value: event.destIp },
  ] as const;

  return fields
    .filter((entry) => normalizeCorrelationText(entry.value) === indicatorValue)
    .map((entry) => ({
      indicator,
      matchedField: entry.field,
      matchedValue: entry.value ?? "",
    }));
}

function matchDomainIndicator(
  event: NormalizedEvent,
  indicator: ThreatIndicator,
) {
  return matchTextIndicator(indicator, [
    { field: "requestPath", value: event.requestPath },
    { field: "message", value: event.message },
  ]);
}

function matchUrlIndicator(event: NormalizedEvent, indicator: ThreatIndicator) {
  return matchTextIndicator(indicator, [
    { field: "requestPath", value: event.requestPath },
    { field: "message", value: event.message },
  ]);
}

function matchEmailIndicator(
  event: NormalizedEvent,
  indicator: ThreatIndicator,
) {
  return matchTextIndicator(indicator, [
    { field: "actor", value: event.actor },
    { field: "message", value: event.message },
  ]);
}

function matchKeywordIndicator(
  event: NormalizedEvent,
  indicator: ThreatIndicator,
) {
  return matchTextIndicator(indicator, [
    { field: "message", value: event.message },
    { field: "eventType", value: event.eventType },
    { field: "action", value: event.action },
    { field: "outcome", value: event.outcome },
  ]);
}

function matchTextIndicator(
  indicator: ThreatIndicator,
  fields: readonly {
    field: ThreatEventMatchedField;
    value: string | undefined;
  }[],
): CorrelationMatch[] {
  const indicatorValue = normalizeIndicatorMatchValue(indicator);

  if (!indicatorValue) {
    return [];
  }

  return fields
    .filter((entry) =>
      normalizeCorrelationText(entry.value).includes(indicatorValue),
    )
    .map((entry) => ({
      indicator,
      matchedField: entry.field,
      matchedValue: entry.value ?? "",
    }));
}

function normalizeIndicatorMatchValue(indicator: ThreatIndicator) {
  return (
    normalizeCorrelationText(indicator.normalizedValue) ||
    normalizeCorrelationText(indicator.value)
  );
}

function deriveThreatEventSeverity(
  event: NormalizedEvent,
  indicatorSeverity: ThreatEventSeverity,
) {
  if (hasRiskyEventCharacteristics(event)) {
    return raiseSeverityOneLevel(indicatorSeverity);
  }

  return indicatorSeverity;
}

function hasRiskyEventCharacteristics(event: NormalizedEvent) {
  const eventType = normalizeCorrelationText(event.eventType);
  const outcome = normalizeCorrelationText(event.outcome);
  const action = normalizeCorrelationText(event.action);

  return (
    eventType === "repeated_login_failed" ||
    eventType === "account_lockout" ||
    eventType === "suspicious_port_scan" ||
    outcome === "blocked" ||
    outcome === "denied" ||
    action === "block" ||
    action === "deny"
  );
}

function buildCorrelationReason(match: CorrelationMatch) {
  const fieldLabels: Record<ThreatEventMatchedField, string> = {
    srcIp: "Source IP",
    destIp: "Destination IP",
    actor: "Actor",
    requestPath: "Request path",
    message: "Event message",
    eventType: "Event type",
    action: "Event action",
    outcome: "Event outcome",
    other: "Event field",
  };

  return `${fieldLabels[match.matchedField]} matched an active ${match.indicator.type} indicator.`;
}

function buildEvidenceSummary(
  event: NormalizedEvent,
  match: CorrelationMatch,
) {
  const matchedValue = truncateText(match.matchedValue, 160);
  const indicatorValue = truncateText(match.indicator.value, 160);
  const summary = `${formatSourceLabel(event.sourceType)} event ${event.eventType} matched indicator ${indicatorValue} in ${match.matchedField}: ${matchedValue}.`;

  return truncateText(summary, 500);
}

function formatSourceLabel(sourceType: NormalizedEvent["sourceType"]) {
  if (sourceType === "authentication") {
    return "Authentication";
  }

  return "Firewall";
}
