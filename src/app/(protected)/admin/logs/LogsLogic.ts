"use client";

import { useQuery } from "convex/react";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "@convex/_generated/api";
import type { RowAction } from "@/components/admin/DataTableRowActions";
import { useNotifications } from "@/hooks/use-notifications";

export type LogSourceType = "authentication" | "firewall";
export type NormalizedEventSeverity = "low" | "medium" | "high" | "critical";
export type LogOutcomeFilter =
  | "all"
  | "allowed"
  | "blocked"
  | "denied"
  | "failure"
  | "locked"
  | "success";
export type NormalizedEventRecord = {
  id: string;
  sourceType: LogSourceType;
  eventType: string;
  eventTimestamp: number;
  actor: string | null;
  srcIp: string | null;
  destIp: string | null;
  srcPort: number | null;
  destPort: number | null;
  protocol: string | null;
  action: string | null;
  outcome: string | null;
  severity: NormalizedEventSeverity | null;
  userAgent: string | null;
  requestPath: string | null;
  message: string | null;
  isSimulated: boolean;
  createdAt: number;
};

const LOG_EVENT_TYPE_OPTIONS = [
  { label: "Login success", value: "login_success" },
  { label: "Login failed", value: "login_failed" },
  { label: "Repeated login failures", value: "repeated_login_failed" },
  { label: "Account lockout", value: "account_lockout" },
  { label: "Password reset attempt", value: "password_reset_attempt" },
  { label: "Connection allowed", value: "connection_allowed" },
  { label: "Connection blocked", value: "connection_blocked" },
  { label: "Connection denied", value: "connection_denied" },
  { label: "Suspicious port scan", value: "suspicious_port_scan" },
] as const;

export function formatLogSourceTypeLabel(sourceType: LogSourceType) {
  const labels: Record<LogSourceType, string> = {
    authentication: "Authentication",
    firewall: "Firewall",
  };

  return labels[sourceType];
}

export function formatNormalizedEventTypeLabel(eventType: string) {
  const labels: Record<string, string> = {
    login_success: "Login success",
    login_failed: "Login failed",
    repeated_login_failed: "Repeated login failures",
    account_lockout: "Account lockout",
    password_reset_attempt: "Password reset attempt",
    connection_allowed: "Connection allowed",
    connection_blocked: "Connection blocked",
    connection_denied: "Connection denied",
    suspicious_port_scan: "Suspicious port scan",
  };

  return labels[eventType] ?? formatFallbackLabel(eventType);
}

export function formatNormalizedEventSeverityLabel(
  severity: NormalizedEventSeverity | null,
) {
  if (!severity) {
    return "Unscored";
  }

  const labels: Record<NormalizedEventSeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };

  return labels[severity];
}

export function formatLogOutcomeLabel(outcome: string) {
  const labels: Record<string, string> = {
    allowed: "Allowed",
    blocked: "Blocked",
    denied: "Denied",
    failure: "Failure",
    locked: "Locked",
    success: "Success",
  };

  return labels[outcome] ?? formatFallbackLabel(outcome);
}

export function formatNormalizedEventTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function useLogsLogic() {
  const { showNotification } = useNotifications();
  const [sourceTypeFilter, setSourceTypeFilter] = useState<LogSourceType | "all">(
    "all",
  );
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<
    NormalizedEventSeverity | "all"
  >("all");
  const [outcomeFilter, setOutcomeFilter] = useState<LogOutcomeFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEventRecord | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [lastLoadedEvents, setLastLoadedEvents] = useState<
    NormalizedEventRecord[]
  >([]);
  const [lastAlertKey, setLastAlertKey] = useState<string | null>(null);

  const queryResult = useQuery(api.queries.logs.listNormalizedEvents, {
    eventType: eventTypeFilter === "all" ? undefined : eventTypeFilter,
    outcome: outcomeFilter === "all" ? undefined : outcomeFilter,
    severity: severityFilter === "all" ? undefined : severityFilter,
    sourceType: sourceTypeFilter === "all" ? undefined : sourceTypeFilter,
  });
  const contextResult = useQuery(api.queries.logs.getLogIngestionContext);

  const liveEvents = useMemo<NormalizedEventRecord[]>(() => {
    if (!queryResult || queryResult.status !== "success") {
      return [];
    }

    return queryResult.events as NormalizedEventRecord[];
  }, [queryResult]);

  useEffect(() => {
    if (queryResult !== undefined && contextResult !== undefined) {
      setHasLoadedInitialData(true);
    }
  }, [contextResult, queryResult]);

  useEffect(() => {
    if (queryResult?.status === "success") {
      setLastLoadedEvents(queryResult.events as NormalizedEventRecord[]);
    }
  }, [queryResult]);

  useEffect(() => {
    if (contextResult === undefined && queryResult === undefined) {
      return;
    }

    const accessStatus = contextResult?.status;
    const queryStatus = queryResult?.status;

    if (accessStatus === "forbidden" || accessStatus === "unauthenticated") {
      const alertKey = `logs-access-${accessStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Your account cannot review normalized log events.",
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
      const alertKey = `logs-query-${queryStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Normalized log events could not be loaded. Try again.",
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

  const normalizedEvents =
    queryResult === undefined ? lastLoadedEvents : liveEvents;
  const isLoading = queryResult === undefined || contextResult === undefined;
  const isInitialLoading = !hasLoadedInitialData && isLoading;
  const isTableLoading = hasLoadedInitialData && queryResult === undefined;
  const hasAccess = contextResult?.status === "success";
  const capabilities = hasAccess ? contextResult.capabilities : null;
  const eventTypeOptions = useMemo(() => [...LOG_EVENT_TYPE_OPTIONS], []);

  function openEventDetails(event: NormalizedEventRecord) {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  }

  function closeEventDetails() {
    setIsDetailsOpen(false);
    setSelectedEvent(null);
  }

  function handleDetailsOpenChange(open: boolean) {
    if (!open) {
      closeEventDetails();
      return;
    }

    setIsDetailsOpen(true);
  }

  function getEventActions(event: NormalizedEventRecord): RowAction[] {
    return [
      {
        icon: Eye,
        label: "View details",
        onClick: () => openEventDetails(event),
      },
    ];
  }

  return {
    capabilities,
    eventTypeFilter,
    eventTypeOptions,
    handleDetailsOpenChange,
    getEventActions,
    hasAccess,
    isDetailsOpen,
    isInitialLoading,
    isTableLoading,
    normalizedEvents,
    outcomeFilter,
    selectedEvent,
    setEventTypeFilter,
    setOutcomeFilter,
    setSeverityFilter,
    setSourceTypeFilter,
    severityFilter,
    sourceTypeFilter,
  };
}

function formatFallbackLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}
