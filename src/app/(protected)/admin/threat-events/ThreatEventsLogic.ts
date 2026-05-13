"use client";

import { useQuery } from "convex/react";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { RowAction } from "@/components/admin/DataTableRowActions";
import { useNotifications } from "@/hooks/use-notifications";

export type ThreatEventStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "false_positive";
export type ThreatEventSeverity = "low" | "medium" | "high" | "critical";
export type ThreatEventSourceType = "authentication" | "firewall";
export type ThreatEventIndicatorType =
  | "ip"
  | "domain"
  | "url"
  | "hash"
  | "email"
  | "keyword";
export type ThreatEventMatchedField =
  | "srcIp"
  | "destIp"
  | "actor"
  | "requestPath"
  | "message"
  | "eventType"
  | "action"
  | "outcome"
  | "other";

export type ThreatEventRecord = {
  id: string;
  confidence: number;
  correlationReason: string;
  createdAt: number;
  detectedAt: number;
  eventType: string;
  evidenceSummary: string;
  indicatorType: ThreatEventIndicatorType;
  indicatorValue: string;
  isSimulated: boolean;
  matchedField: ThreatEventMatchedField;
  severity: ThreatEventSeverity;
  sourceType: ThreatEventSourceType;
  status: ThreatEventStatus;
  updatedAt: number;
};

export type ThreatEventNormalizedContext = {
  action: string | null;
  actor: string | null;
  createdAt: number;
  destIp: string | null;
  destPort: number | null;
  eventTimestamp: number;
  eventType: string;
  isSimulated: boolean;
  message: string | null;
  outcome: string | null;
  protocol: string | null;
  requestPath: string | null;
  severity: ThreatEventSeverity | null;
  sourceType: ThreatEventSourceType;
  srcIp: string | null;
  srcPort: number | null;
  userAgent: string | null;
};

export type ThreatEventIndicatorContext = {
  confidence: number;
  createdAt: number;
  description: string | null;
  severity: ThreatEventSeverity;
  source: string | null;
  status: "active" | "archived" | "false_positive";
  type: ThreatEventIndicatorType;
  updatedAt: number;
  value: string;
};

export type ThreatEventDetailRecord = ThreatEventRecord & {
  indicator: ThreatEventIndicatorContext | null;
  normalizedEvent: ThreatEventNormalizedContext | null;
};

export function formatThreatEventTypeLabel(eventType: string) {
  const labels: Record<string, string> = {
    account_lockout: "Account lockout",
    connection_allowed: "Connection allowed",
    connection_blocked: "Connection blocked",
    connection_denied: "Connection denied",
    login_failed: "Login failed",
    login_success: "Login success",
    password_reset_attempt: "Password reset attempt",
    repeated_login_failed: "Repeated login failures",
    suspicious_port_scan: "Suspicious port scan",
  };

  return labels[eventType] ?? formatFallbackLabel(eventType);
}

export function formatThreatEventSourceLabel(sourceType: ThreatEventSourceType) {
  const labels: Record<ThreatEventSourceType, string> = {
    authentication: "Authentication",
    firewall: "Firewall",
  };

  return labels[sourceType];
}

export function formatThreatEventIndicatorTypeLabel(
  indicatorType: ThreatEventIndicatorType,
) {
  const labels: Record<ThreatEventIndicatorType, string> = {
    domain: "Domain",
    email: "Email",
    hash: "Hash",
    ip: "IP",
    keyword: "Keyword",
    url: "URL",
  };

  return labels[indicatorType];
}

export function formatThreatEventMatchedFieldLabel(
  matchedField: ThreatEventMatchedField,
) {
  const labels: Record<ThreatEventMatchedField, string> = {
    action: "Action",
    actor: "Actor",
    destIp: "Destination IP",
    eventType: "Event type",
    message: "Message",
    other: "Other",
    outcome: "Outcome",
    requestPath: "Request path",
    srcIp: "Source IP",
  };

  return labels[matchedField];
}

export function formatThreatEventSeverityLabel(severity: ThreatEventSeverity) {
  const labels: Record<ThreatEventSeverity, string> = {
    critical: "Critical",
    high: "High",
    low: "Low",
    medium: "Medium",
  };

  return labels[severity];
}

export function formatThreatEventStatusLabel(status: ThreatEventStatus) {
  const labels: Record<ThreatEventStatus, string> = {
    false_positive: "False positive",
    investigating: "Investigating",
    open: "Open",
    resolved: "Resolved",
  };

  return labels[status];
}

export function formatThreatEventTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function useThreatEventsLogic() {
  const { showNotification } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<ThreatEventStatus | "all">(
    "all",
  );
  const [severityFilter, setSeverityFilter] = useState<
    ThreatEventSeverity | "all"
  >("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<
    ThreatEventSourceType | "all"
  >("all");
  const [indicatorTypeFilter, setIndicatorTypeFilter] = useState<
    ThreatEventIndicatorType | "all"
  >("all");
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [lastLoadedThreatEvents, setLastLoadedThreatEvents] = useState<
    ThreatEventRecord[]
  >([]);
  const [lastAlertKey, setLastAlertKey] = useState<string | null>(null);
  const [selectedThreatEvent, setSelectedThreatEvent] =
    useState<ThreatEventRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const queryResult = useQuery(api.queries.threatEvents.listThreatEvents, {
    indicatorType:
      indicatorTypeFilter === "all" ? undefined : indicatorTypeFilter,
    severity: severityFilter === "all" ? undefined : severityFilter,
    sourceType: sourceTypeFilter === "all" ? undefined : sourceTypeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const contextResult = useQuery(api.queries.threatEvents.getThreatEventContext);
  const detailResult = useQuery(
    api.queries.threatEvents.getThreatEventDetail,
    selectedThreatEvent
      ? {
          threatEventId: selectedThreatEvent.id as Id<"threatEvents">,
        }
      : "skip",
  );

  const liveThreatEvents = useMemo<ThreatEventRecord[]>(() => {
    if (!queryResult || queryResult.status !== "success") {
      return [];
    }

    return queryResult.threatEvents as ThreatEventRecord[];
  }, [queryResult]);

  useEffect(() => {
    if (queryResult !== undefined && contextResult !== undefined) {
      setHasLoadedInitialData(true);
    }
  }, [contextResult, queryResult]);

  useEffect(() => {
    if (queryResult?.status === "success") {
      setLastLoadedThreatEvents(queryResult.threatEvents as ThreatEventRecord[]);
    }
  }, [queryResult]);

  useEffect(() => {
    if (contextResult === undefined && queryResult === undefined) {
      return;
    }

    const accessStatus = contextResult?.status;
    const queryStatus = queryResult?.status;

    if (accessStatus === "forbidden" || accessStatus === "unauthenticated") {
      const alertKey = `threat-events-access-${accessStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Your account cannot review threat events.",
        title: "Access denied",
        variant: "error",
      });
      setLastAlertKey(alertKey);
      return;
    }

    if (
      queryStatus !== undefined &&
      queryStatus !== "success" &&
      queryStatus !== "forbidden" &&
      queryStatus !== "unauthenticated"
    ) {
      const alertKey = `threat-events-query-${queryStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Threat events could not be loaded. Try again.",
        title: "Load failed",
        variant: "error",
      });
      setLastAlertKey(alertKey);
      return;
    }

    if (accessStatus === "success" && queryStatus === "success" && lastAlertKey) {
      setLastAlertKey(null);
    }
  }, [contextResult, lastAlertKey, queryResult, showNotification]);

  const threatEvents =
    queryResult === undefined ? lastLoadedThreatEvents : liveThreatEvents;
  const isLoading = queryResult === undefined || contextResult === undefined;
  const isInitialLoading = !hasLoadedInitialData && isLoading;
  const isTableLoading = hasLoadedInitialData && queryResult === undefined;
  const hasAccess = contextResult?.status === "success";
  const detailedThreatEvent =
    detailResult?.status === "success"
      ? (detailResult.threatEvent as ThreatEventDetailRecord)
      : selectedThreatEvent;
  const isDetailsLoading = isDetailsOpen && detailResult === undefined;

  function openThreatEventDetails(threatEvent: ThreatEventRecord) {
    setSelectedThreatEvent(threatEvent);
    setIsDetailsOpen(true);
  }

  function closeThreatEventDetails() {
    setIsDetailsOpen(false);
    setSelectedThreatEvent(null);
  }

  function handleDetailsOpenChange(open: boolean) {
    if (!open) {
      closeThreatEventDetails();
      return;
    }

    setIsDetailsOpen(true);
  }

  function getThreatEventActions(event: ThreatEventRecord): RowAction[] {
    return [
      {
        icon: Eye,
        label: "View details",
        onClick: () => openThreatEventDetails(event),
      },
    ];
  }

  return {
    detailedThreatEvent,
    getThreatEventActions,
    handleDetailsOpenChange,
    hasAccess,
    indicatorTypeFilter,
    isDetailsLoading,
    isDetailsOpen,
    isInitialLoading,
    isTableLoading,
    selectedThreatEvent,
    setIndicatorTypeFilter,
    setSeverityFilter,
    setSourceTypeFilter,
    setStatusFilter,
    severityFilter,
    sourceTypeFilter,
    statusFilter,
    threatEvents,
  };
}

function formatFallbackLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}
