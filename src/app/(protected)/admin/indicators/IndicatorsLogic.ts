"use client";

import { useQuery } from "convex/react";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "@convex/_generated/api";
import type { RowAction } from "@/components/admin/DataTableRowActions";
import { useNotifications } from "@/hooks/use-notifications";

export type ThreatIndicatorType =
  | "ip"
  | "domain"
  | "url"
  | "hash"
  | "email"
  | "keyword";

export type ThreatIndicatorSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ThreatIndicatorStatus =
  | "active"
  | "archived"
  | "false_positive";

export type IndicatorProviderFilter = "all" | "urlhaus" | "internal";

export type IndicatorRecord = {
  id: string;
  confidence: number;
  createdAt: number;
  createdByEmail: string;
  description: string | null;
  firstSeenAt: number | null;
  lastSeenAt: number | null;
  lastSyncedAt: number | null;
  provider: string | null;
  providerIndicatorId?: string | null;
  severity: ThreatIndicatorSeverity;
  source: string | null;
  sourceUrl?: string | null;
  status: ThreatIndicatorStatus;
  tags: string[];
  type: ThreatIndicatorType;
  updatedAt: number;
  updatedByEmail: string;
  value: string;
};

export type IndicatorSheetMode = "view";

export function formatIndicatorTypeLabel(type: ThreatIndicatorType) {
  const labels: Record<ThreatIndicatorType, string> = {
    ip: "IP",
    domain: "Domain",
    url: "URL",
    hash: "Hash",
    email: "Email",
    keyword: "Keyword",
  };

  return labels[type];
}

export function formatIndicatorSeverityLabel(
  severity: ThreatIndicatorSeverity,
) {
  const labels: Record<ThreatIndicatorSeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };

  return labels[severity];
}

export function formatIndicatorStatusLabel(status: ThreatIndicatorStatus) {
  const labels: Record<ThreatIndicatorStatus, string> = {
    active: "Active",
    archived: "Archived",
    false_positive: "False positive",
  };

  return labels[status];
}

export function formatIndicatorProviderLabel(provider: string | null) {
  if (provider === "urlhaus") {
    return "URLHaus";
  }

  return "Internal/Demo";
}

export function useIndicatorsLogic() {
  const { showNotification } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<ThreatIndicatorStatus | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<ThreatIndicatorType | "all">(
    "all",
  );
  const [severityFilter, setSeverityFilter] = useState<
    ThreatIndicatorSeverity | "all"
  >("all");
  const [providerFilter, setProviderFilter] =
    useState<IndicatorProviderFilter>("all");
  const [sheetMode, setSheetMode] = useState<IndicatorSheetMode>("view");
  const [sheetIndicator, setSheetIndicator] = useState<IndicatorRecord | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [lastLoadedIndicators, setLastLoadedIndicators] = useState<IndicatorRecord[]>(
    [],
  );
  const [lastAlertKey, setLastAlertKey] = useState<string | null>(null);

  const queryResult = useQuery(api.queries.threatIndicators.listThreatIndicators, {
    provider: providerFilter === "all" ? undefined : providerFilter,
    severity: severityFilter === "all" ? undefined : severityFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  const contextResult = useQuery(
    api.queries.threatIndicators.getThreatIndicatorContext,
  );

  const isLoading = queryResult === undefined || contextResult === undefined;
  const hasAccess = contextResult?.status === "success";

  const liveIndicators = useMemo<IndicatorRecord[]>(() => {
    if (!queryResult || queryResult.status !== "success") {
      return [];
    }

    return queryResult.indicators as IndicatorRecord[];
  }, [queryResult]);

  useEffect(() => {
    if (queryResult !== undefined && contextResult !== undefined) {
      setHasLoadedInitialData(true);
    }
  }, [contextResult, queryResult]);

  useEffect(() => {
    if (queryResult?.status === "success") {
      setLastLoadedIndicators(queryResult.indicators as IndicatorRecord[]);
    }
  }, [queryResult]);

  useEffect(() => {
    if (contextResult === undefined && queryResult === undefined) {
      return;
    }

    const accessStatus = contextResult?.status;
    const queryStatus = queryResult?.status;

    if (accessStatus === "forbidden" || accessStatus === "unauthenticated") {
      const alertKey = `indicators-access-${accessStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Your account cannot access threat indicator management.",
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
      const alertKey = `indicators-query-${queryStatus}`;

      if (lastAlertKey === alertKey) {
        return;
      }

      showNotification({
        description: "Threat indicator records could not be loaded. Try again.",
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

  const indicators = queryResult === undefined ? lastLoadedIndicators : liveIndicators;
  const isInitialLoading = !hasLoadedInitialData && isLoading;
  const isTableLoading = hasLoadedInitialData && queryResult === undefined;

  function openViewSheet(indicator: IndicatorRecord) {
    setSheetMode("view");
    setSheetIndicator(indicator);
    setIsSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open);

    if (!open) {
      setSheetMode("view");
      setSheetIndicator(null);
    }
  }

  function getIndicatorActions(indicator: IndicatorRecord): RowAction[] {
    return [
      {
        icon: Eye,
        label: "View details",
        onClick: () => openViewSheet(indicator),
      },
    ];
  }

  return {
    getIndicatorActions,
    handleSheetOpenChange,
    hasAccess,
    indicators,
    isInitialLoading,
    isSheetOpen,
    isTableLoading,
    setSeverityFilter,
    setProviderFilter,
    setStatusFilter,
    setTypeFilter,
    severityFilter,
    providerFilter,
    sheetIndicator,
    sheetMode,
    statusFilter,
    typeFilter,
  };
}
