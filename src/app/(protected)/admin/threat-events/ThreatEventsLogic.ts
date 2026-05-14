"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { CheckCircle2, Eye, RotateCcw, Search, ShieldX } from "lucide-react";
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
export type ThreatEventPriority = "low" | "medium" | "high" | "critical";
export type ThreatEventScoringStatus = "unscored" | "scored";
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
  priority: ThreatEventPriority | null;
  scoredAt: number | null;
  scoringReason: string;
  scoringStatus: ThreatEventScoringStatus;
  severity: ThreatEventSeverity;
  severityScore: number;
  sourceType: ThreatEventSourceType;
  status: ThreatEventStatus;
  updatedAt: number;
};

export type ThreatEventScoreContribution = {
  label: string;
  reason: string;
  value: number;
};

export type ThreatEventScoringFactors = {
  eventType?: string;
  frequencyCount?: number;
  indicatorConfidence?: number;
  indicatorSeverity?: string;
  isSimulated?: boolean;
  matchedField?: string;
  outcome?: string;
  scoreContributions?: ThreatEventScoreContribution[];
  sourceType?: string;
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
  scoringFactors: ThreatEventScoringFactors | null;
};

export type PendingThreatEventStatusUpdate = {
  nextStatus: ThreatEventStatus;
  threatEvent: ThreatEventRecord;
};

export type ThreatEventAnalysisOperation = "correlation" | "severity_scoring";

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

export function formatThreatEventPriorityLabel(priority: ThreatEventPriority) {
  const labels: Record<ThreatEventPriority, string> = {
    critical: "Critical",
    high: "High",
    low: "Low",
    medium: "Medium",
  };

  return labels[priority];
}

export function formatThreatEventScoringStatusLabel(
  scoringStatus: ThreatEventScoringStatus,
) {
  const labels: Record<ThreatEventScoringStatus, string> = {
    scored: "Scored",
    unscored: "Unscored",
  };

  return labels[scoringStatus];
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
  const runCorrelationOperation = useAction(
    api.threatEvents.operations.runCorrelationOperation,
  );
  const runSeverityScoringOperation = useAction(
    api.threatEvents.operations.runSeverityScoringOperation,
  );
  const updateThreatEventStatusMutation = useMutation(
    api.mutations.threatEvents.updateThreatEventStatus,
  );
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
  const [priorityFilter, setPriorityFilter] = useState<
    ThreatEventPriority | "all"
  >("all");
  const [scoringStatusFilter, setScoringStatusFilter] = useState<
    ThreatEventScoringStatus | "all"
  >("all");
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [lastLoadedThreatEvents, setLastLoadedThreatEvents] = useState<
    ThreatEventRecord[]
  >([]);
  const [lastAlertKey, setLastAlertKey] = useState<string | null>(null);
  const [selectedThreatEvent, setSelectedThreatEvent] =
    useState<ThreatEventRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] =
    useState<PendingThreatEventStatusUpdate | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingAnalysisOperation, setPendingAnalysisOperation] =
    useState<ThreatEventAnalysisOperation | null>(null);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  const queryResult = useQuery(api.queries.threatEvents.listThreatEvents, {
    indicatorType:
      indicatorTypeFilter === "all" ? undefined : indicatorTypeFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    scoringStatus:
      scoringStatusFilter === "all" ? undefined : scoringStatusFilter,
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
  const capabilities =
    contextResult?.status === "success" ? contextResult.capabilities : null;
  const detailedThreatEvent =
    detailResult?.status === "success"
      ? (detailResult.threatEvent as ThreatEventDetailRecord)
      : selectedThreatEvent;
  const isDetailsLoading = isDetailsOpen && detailResult === undefined;
  const canUpdateThreatEventStatus =
    capabilities?.canUpdateThreatEventStatus ?? false;

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

  function requestStatusUpdate(
    threatEvent: ThreatEventRecord,
    nextStatus: ThreatEventStatus,
  ) {
    if (!canUpdateThreatEventStatus || threatEvent.status === nextStatus) {
      return;
    }

    setPendingStatusUpdate({ nextStatus, threatEvent });
  }

  function cancelStatusUpdate() {
    setPendingStatusUpdate(null);
  }

  async function confirmStatusUpdate() {
    if (!pendingStatusUpdate) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const result = await updateThreatEventStatusMutation({
        status: pendingStatusUpdate.nextStatus,
        threatEventId: pendingStatusUpdate.threatEvent.id as Id<"threatEvents">,
      });

      if (result.status === "updated") {
        showNotification({
          description: "The threat event status was updated.",
          title: "Status updated",
          variant: "success",
        });
        setPendingStatusUpdate(null);
        return;
      }

      showNotification(getStatusUpdateNotification(result.status));

      if (result.status === "unchanged") {
        setPendingStatusUpdate(null);
      }
    } catch {
      showNotification(getStatusUpdateNotification("failed"));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function openAnalysisConfirmation(operation: ThreatEventAnalysisOperation) {
    setPendingAnalysisOperation(operation);
  }

  function closeAnalysisConfirmation() {
    if (!isRunningAnalysis) {
      setPendingAnalysisOperation(null);
    }
  }

  async function confirmAnalysisOperation() {
    if (!pendingAnalysisOperation) {
      return;
    }

    setIsRunningAnalysis(true);

    try {
      if (pendingAnalysisOperation === "correlation") {
        const result = await runCorrelationOperation({ limit: 100 });

        showNotification(getCorrelationOperationNotification(result));

        if (result.status === "completed") {
          setPendingAnalysisOperation(null);
        }

        return;
      }

      const result = await runSeverityScoringOperation({ limit: 100 });

      showNotification(getSeverityScoringOperationNotification(result));

      if (result.status === "completed") {
        setPendingAnalysisOperation(null);
      }
    } catch {
      showNotification(getAnalysisOperationFailureNotification());
    } finally {
      setIsRunningAnalysis(false);
    }
  }

  function getThreatEventActions(event: ThreatEventRecord): RowAction[] {
    const actions: RowAction[] = [
      {
        icon: Eye,
        label: "View details",
        onClick: () => openThreatEventDetails(event),
      },
    ];

    if (!canUpdateThreatEventStatus) {
      return actions;
    }

    if (event.status !== "open") {
      actions.push({
        icon: RotateCcw,
        label: "Reopen",
        onClick: () => requestStatusUpdate(event, "open"),
      });
    }

    if (event.status !== "investigating") {
      actions.push({
        icon: Search,
        label: "Mark as investigating",
        onClick: () => requestStatusUpdate(event, "investigating"),
      });
    }

    if (event.status !== "resolved") {
      actions.push({
        icon: CheckCircle2,
        label: "Mark as resolved",
        onClick: () => requestStatusUpdate(event, "resolved"),
        variant: "success",
      });
    }

    if (event.status !== "false_positive") {
      actions.push({
        icon: ShieldX,
        label: "Mark as false positive",
        onClick: () => requestStatusUpdate(event, "false_positive"),
        variant: "destructive",
      });
    }

    return actions;
  }

  return {
    closeAnalysisConfirmation,
    cancelStatusUpdate,
    confirmAnalysisOperation,
    canUpdateThreatEventStatus,
    confirmStatusUpdate,
    detailedThreatEvent,
    getThreatEventActions,
    handleDetailsOpenChange,
    hasAccess,
    indicatorTypeFilter,
    isDetailsLoading,
    isDetailsOpen,
    isInitialLoading,
    isRunningAnalysis,
    isTableLoading,
    isUpdatingStatus,
    openAnalysisConfirmation,
    pendingAnalysisOperation,
    pendingStatusUpdate,
    priorityFilter,
    scoringStatusFilter,
    selectedThreatEvent,
    setIndicatorTypeFilter,
    setPriorityFilter,
    setScoringStatusFilter,
    setSeverityFilter,
    setSourceTypeFilter,
    setStatusFilter,
    severityFilter,
    sourceTypeFilter,
    statusFilter,
    threatEvents,
  };
}

function getCorrelationOperationNotification(result: {
  counts: {
    created: number;
    processed: number;
    skipped: number;
  };
  status: string;
}) {
  if (result.status === "completed") {
    return {
      description: `${result.counts.processed} processed, ${result.counts.created} created, ${result.counts.skipped} skipped.`,
      title: "Correlation completed",
      variant: "success" as const,
    };
  }

  return getAnalysisOperationNotification(result.status);
}

function getSeverityScoringOperationNotification(result: {
  counts: {
    processed: number;
    scored: number;
  };
  status: string;
}) {
  if (result.status === "completed") {
    return {
      description: `${result.counts.processed} processed, ${result.counts.scored} scored.`,
      title: "Severity scoring completed",
      variant: "success" as const,
    };
  }

  return getAnalysisOperationNotification(result.status);
}

function getAnalysisOperationNotification(status: string) {
  if (status === "forbidden") {
    return {
      description: "Your account cannot run this analysis operation.",
      title: "Action not allowed",
      variant: "error" as const,
    };
  }

  if (status === "unauthenticated") {
    return {
      description: "Please sign in to run this operation.",
      title: "Sign in required",
      variant: "error" as const,
    };
  }

  return getAnalysisOperationFailureNotification();
}

function getAnalysisOperationFailureNotification() {
  return {
    description: "Analysis operation failed. Please try again later.",
    title: "Analysis failed",
    variant: "error" as const,
  };
}

function getStatusUpdateNotification(status: string) {
  const messages: Record<
    string,
    { description: string; title: string; variant: "error" | "info" | "success" }
  > = {
    failed: {
      description: "The threat event status could not be updated. Try again.",
      title: "Status update failed",
      variant: "error",
    },
    forbidden: {
      description: "Your account cannot update threat event statuses.",
      title: "Action not allowed",
      variant: "error",
    },
    invalid_input: {
      description: "The requested threat event status is not valid.",
      title: "Invalid status",
      variant: "error",
    },
    not_found: {
      description: "The selected threat event could not be found.",
      title: "Threat event not found",
      variant: "error",
    },
    unchanged: {
      description: "The threat event already has that status.",
      title: "No change needed",
      variant: "info",
    },
    unauthenticated: {
      description: "Your session is not authorized to update threat events.",
      title: "Action not allowed",
      variant: "error",
    },
  };

  return messages[status] ?? messages.failed;
}

function formatFallbackLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}
