"use client";

import { useAction, useQuery } from "convex/react";
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
export type ProofLogProvider =
  | "urlhaus"
  | "abuseipdb"
  | "otx"
  | "phishtank"
  | "misp";
export type ProofLogCount = 1 | 5 | 10 | 25 | 50;
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

const PROOF_LOG_PROVIDER_LABELS: Record<ProofLogProvider, string> = {
  abuseipdb: "AbuseIPDB",
  misp: "MISP",
  otx: "AlienVault OTX",
  phishtank: "PhishTank",
  urlhaus: "URLHaus",
};

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

export function formatProofLogProviderLabel(provider: ProofLogProvider) {
  return PROOF_LOG_PROVIDER_LABELS[provider];
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
  const seedProviderProofLogOperation = useAction(
    api.logs.operations.seedProviderProofLogOperation,
  );
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
  const [selectedProofProvider, setSelectedProofProvider] =
    useState<ProofLogProvider>("urlhaus");
  const [selectedProofLogCount, setSelectedProofLogCount] =
    useState<ProofLogCount>(1);
  const [isProofSeedDialogOpen, setIsProofSeedDialogOpen] = useState(false);
  const [isSeedingProofLog, setIsSeedingProofLog] = useState(false);

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
  const role = hasAccess ? contextResult.role : null;
  const canSeedProofLogs = role === "admin";
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

  function openProofSeedDialog() {
    setIsProofSeedDialogOpen(true);
  }

  function closeProofSeedDialog() {
    if (isSeedingProofLog) {
      return;
    }

    setIsProofSeedDialogOpen(false);
  }

  function selectProofProvider(provider: ProofLogProvider) {
    setSelectedProofProvider(provider);
  }

  function selectProofLogCount(count: ProofLogCount) {
    setSelectedProofLogCount(count);
  }

  async function confirmSeedProofLog() {
    const providerLabel = formatProofLogProviderLabel(selectedProofProvider);

    if (selectedProofProvider !== "urlhaus") {
      showNotification({
        description: `${providerLabel} is not enabled in this MVP.`,
        title: "Provider not enabled",
        variant: "info",
      });
      return;
    }

    setIsSeedingProofLog(true);

    try {
      const result = await seedProviderProofLogOperation({
        count: selectedProofLogCount,
        provider: selectedProofProvider,
      });

      showNotification(getProofLogSeedNotification(result));

      if (result.status === "created" || result.status === "partial") {
        setIsProofSeedDialogOpen(false);
      }
    } catch {
      showNotification(getProofLogSeedNotification({ status: "failed" }));
    } finally {
      setIsSeedingProofLog(false);
    }
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
    canSeedProofLogs,
    closeProofSeedDialog,
    confirmSeedProofLog,
    eventTypeFilter,
    eventTypeOptions,
    handleDetailsOpenChange,
    getEventActions,
    hasAccess,
    isDetailsOpen,
    isInitialLoading,
    isProofSeedDialogOpen,
    isSeedingProofLog,
    isTableLoading,
    normalizedEvents,
    openProofSeedDialog,
    outcomeFilter,
    selectedEvent,
    selectedProofLogCount,
    selectedProofProvider,
    selectedProofProviderLabel: formatProofLogProviderLabel(selectedProofProvider),
    selectProofLogCount,
    selectProofProvider,
    setEventTypeFilter,
    setOutcomeFilter,
    setSeverityFilter,
    setSourceTypeFilter,
    severityFilter,
    sourceTypeFilter,
  };
}

function getProofLogSeedNotification(result: {
  createdCount?: number;
  normalizedEventCount?: number;
  providerLabel?: string;
  status:
    | "created"
    | "failed"
    | "forbidden"
    | "invalid_input"
    | "not_found"
    | "partial"
    | "provider_not_enabled"
    | "unauthenticated";
}) {
  if (result.status === "created") {
    return {
      description: `Seeded ${result.createdCount ?? 0} proof logs from ${result.providerLabel ?? "selected provider"}. ${result.normalizedEventCount ?? 0} normalized events created. Run correlation from Threat Events.`,
      title: "Proof logs seeded",
      variant: "success" as const,
    };
  }

  if (result.status === "partial") {
    return {
      description: `Seeded ${result.createdCount ?? 0} proof logs from ${result.providerLabel ?? "selected provider"}. ${result.normalizedEventCount ?? 0} normalized events created. Fewer indicators were available than requested.`,
      title: "Proof logs partially seeded",
      variant: "warning" as const,
    };
  }

  if (result.status === "provider_not_enabled") {
    return {
      description: `${result.providerLabel ?? "This provider"} is not enabled in this MVP.`,
      title: "Provider not enabled",
      variant: "info" as const,
    };
  }

  if (result.status === "not_found") {
    return {
      description: `No active indicator found for ${result.providerLabel ?? "the selected provider"}. Sync indicators for this provider first.`,
      title: "No matching indicator",
      variant: "warning" as const,
    };
  }

  if (result.status === "forbidden") {
    return {
      description: "Your account cannot seed proof logs.",
      title: "Access denied",
      variant: "error" as const,
    };
  }

  if (result.status === "unauthenticated") {
    return {
      description: "Please sign in to seed proof logs.",
      title: "Sign in required",
      variant: "error" as const,
    };
  }

  return {
    description: "Proof log seed failed. Please try again later.",
    title: "Seed failed",
    variant: "error" as const,
  };
}

function formatFallbackLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}
