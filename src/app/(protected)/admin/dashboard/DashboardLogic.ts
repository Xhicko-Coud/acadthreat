"use client";

import { useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  GaugeIcon,
  ListFilterIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { api } from "@convex/_generated/api";

export type DashboardMetric = {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

export type DashboardTrendPoint = {
  count: number;
  date: string;
};

export type DashboardDistributionPoint = {
  count: number;
  fill: string;
  key: string;
  label: string;
};

export type DashboardChartData = {
  priorityDistribution: DashboardDistributionPoint[];
  sourceTypeDistribution: DashboardDistributionPoint[];
  statusDistribution: DashboardDistributionPoint[];
};

export type DashboardHeroMeta = {
  lastIngestion: string;
};

export type DashboardRecentThreat = {
  detectedAt: string;
  eventType: string;
  id: string;
  indicator: string;
  priority: "low" | "medium" | "high" | "critical";
  priorityLabel: string;
  score: string;
  source: string;
  status: "open" | "investigating" | "resolved" | "false_positive";
  statusLabel: string;
};

export type DashboardTrendPredictionStatus =
  | "loading"
  | "success"
  | "failed"
  | "forbidden"
  | "unauthenticated";

export type DashboardTrendPrediction = {
  chartData: DashboardPredictionChartPoint[];
  confidence: "low" | "medium" | "high";
  confidenceLabel: string;
  priorityTrend: DashboardPriorityTrendPoint[];
  summary: string;
  trendDirection: "increasing" | "decreasing" | "stable" | "insufficient_data";
  trendDirectionLabel: string;
};

export type DashboardPredictionChartPoint = {
  actual: number | null;
  date: string;
  projected: number | null;
};

export type DashboardPriorityTrendPoint = {
  change: number;
  changeLabel: string;
  current: number;
  previous: number;
  priority: "low" | "medium" | "high" | "critical";
  priorityLabel: string;
};

export function useDashboardLogic() {
  const overviewResult = useQuery(api.queries.dashboard.getDashboardOverview);
  const trendPredictionResult = useQuery(
    api.queries.trendPrediction.getThreatTrendPrediction,
  );

  const isInitialLoading = overviewResult === undefined;
  const isRestricted =
    overviewResult?.status === "forbidden" ||
    overviewResult?.status === "unauthenticated";
  const overview =
    overviewResult?.status === "success" ? overviewResult : null;
  const metrics = formatDashboardMetrics(overview?.summary ?? null);
  const charts = formatDashboardCharts(overview);
  const heroMeta = formatDashboardHeroMeta(overview?.summary ?? null);
  const threatActivityTrend = formatThreatActivityTrend(overview);
  const recentHighPriorityThreats = formatRecentHighPriorityThreats(overview);
  const trendPrediction = formatTrendPrediction(trendPredictionResult);
  const trendPredictionStatus =
    getTrendPredictionStatus(trendPredictionResult);

  return {
    charts,
    heroMeta,
    isInitialLoading,
    isRestricted,
    isTrendPredictionLoading: trendPredictionResult === undefined,
    metrics,
    overview,
    recentHighPriorityThreats,
    threatActivityTrend,
    trendPrediction,
    trendPredictionStatus,
  };
}

function formatDashboardHeroMeta(
  summary:
    | {
        lastIngestionAt: number | null;
      }
    | null,
): DashboardHeroMeta {
  return {
    lastIngestion: summary
      ? formatLastIngestion(summary.lastIngestionAt)
      : "Unavailable",
  };
}

function formatDashboardMetrics(
  summary:
    | {
        activeIndicators: number;
        highPriorityThreatEvents: number;
        normalizedEventsToday: number;
        openThreatEvents: number;
      }
    | null,
): DashboardMetric[] {
  return [
    {
      description:
        "Threat intelligence records currently available for correlation.",
      icon: ListFilterIcon,
      label: "Active indicators",
      value: summary ? formatCount(summary.activeIndicators) : "Unavailable",
    },
    {
      description:
        "Normalized authentication and firewall events processed today.",
      icon: ActivityIcon,
      label: "Events today",
      value: summary
        ? formatCount(summary.normalizedEventsToday)
        : "Unavailable",
    },
    {
      description: "Generated threat events still open for review.",
      icon: ShieldAlertIcon,
      label: "Open threats",
      value: summary ? formatCount(summary.openThreatEvents) : "Unavailable",
    },
    {
      description: "Threat events currently ranked high or critical.",
      icon: GaugeIcon,
      label: "High priority",
      value: summary
        ? formatCount(summary.highPriorityThreatEvents)
        : "Unavailable",
    },
  ];
}

function formatDashboardCharts(
  overview:
    | {
        priorityDistribution: Array<{
          count: number;
          priority: "low" | "medium" | "high" | "critical";
        }>;
        sourceTypeDistribution: Array<{
          count: number;
          sourceType: "authentication" | "firewall";
        }>;
        statusDistribution: Array<{
          count: number;
          status: "open" | "investigating" | "resolved" | "false_positive";
        }>;
      }
    | null,
): DashboardChartData {
  if (!overview) {
    return {
      priorityDistribution: [],
      sourceTypeDistribution: [],
      statusDistribution: [],
    };
  }

  return {
    priorityDistribution: overview.priorityDistribution.map((item) => ({
      count: item.count,
      fill: getPriorityColor(item.priority),
      key: item.priority,
      label: formatPriorityLabel(item.priority),
    })),
    sourceTypeDistribution: overview.sourceTypeDistribution.map((item) => ({
      count: item.count,
      fill: getSourceTypeColor(item.sourceType),
      key: item.sourceType,
      label: formatSourceTypeLabel(item.sourceType),
    })),
    statusDistribution: overview.statusDistribution.map((item) => ({
      count: item.count,
      fill: getStatusColor(item.status),
      key: item.status,
      label: formatStatusLabel(item.status),
    })),
  };
}

function formatThreatActivityTrend(
  overview:
    | {
        sevenDayThreatTrend: Array<{
          count: number;
          date: string;
        }>;
      }
    | null,
): DashboardTrendPoint[] {
  if (!overview) {
    return [];
  }

  return overview.sevenDayThreatTrend.map((item) => ({
    count: item.count,
    date: item.date,
  }));
}

function formatRecentHighPriorityThreats(
  overview:
    | {
        recentHighPriorityThreats: Array<{
          detectedAt: number;
          eventType: string;
          id: string;
          indicatorType: string;
          indicatorValue: string;
          priority: "low" | "medium" | "high" | "critical";
          scoringStatus: "unscored" | "scored";
          severityScore: number;
          sourceType: "authentication" | "firewall";
          status: "open" | "investigating" | "resolved" | "false_positive";
        }>;
      }
    | null,
): DashboardRecentThreat[] {
  if (!overview) {
    return [];
  }

  return overview.recentHighPriorityThreats.slice(0, 10).map((threat) => ({
    detectedAt: formatDetectedAt(threat.detectedAt),
    eventType: formatEventTypeLabel(threat.eventType),
    id: threat.id,
    indicator: `${formatIndicatorTypeLabel(threat.indicatorType)}: ${
      threat.indicatorValue
    }`,
    priority: threat.priority,
    priorityLabel: formatPriorityLabel(threat.priority),
    score:
      threat.scoringStatus === "unscored"
        ? "Unscored"
        : `${threat.severityScore}/100`,
    source: formatSourceTypeLabel(threat.sourceType),
    status: threat.status,
    statusLabel: formatStatusLabel(threat.status),
  }));
}

function getTrendPredictionStatus(
  result:
    | {
        status:
          | "success"
          | "failed"
          | "forbidden"
          | "unauthenticated";
      }
    | undefined,
): DashboardTrendPredictionStatus {
  return result?.status ?? "loading";
}

function formatTrendPrediction(
  result:
    | {
        confidence: "low" | "medium" | "high";
        historicalSeries: Array<{
          count: number;
          date: string;
        }>;
        priorityTrend: Array<{
          change: number;
          current: number;
          previous: number;
          priority: "low" | "medium" | "high" | "critical";
        }>;
        projectedSeries: Array<{
          count: number;
          date: string;
          projected: true;
        }>;
        status: "success";
        summary: string;
        trendDirection:
          | "increasing"
          | "decreasing"
          | "stable"
          | "insufficient_data";
      }
    | { status: "failed" | "forbidden" | "unauthenticated" }
    | undefined,
): DashboardTrendPrediction | null {
  if (!result || result.status !== "success") {
    return null;
  }

  return {
    chartData: formatPredictionChartData({
      historicalSeries: result.historicalSeries,
      projectedSeries: result.projectedSeries,
    }),
    confidence: result.confidence,
    confidenceLabel: formatTrendConfidenceLabel(result.confidence),
    priorityTrend: result.priorityTrend.map((item) => ({
      change: item.change,
      changeLabel: formatTrendChange(item.change),
      current: item.current,
      previous: item.previous,
      priority: item.priority,
      priorityLabel: formatPriorityLabel(item.priority),
    })),
    summary: result.summary,
    trendDirection: result.trendDirection,
    trendDirectionLabel: formatTrendDirectionLabel(result.trendDirection),
  };
}

function formatPredictionChartData({
  historicalSeries,
  projectedSeries,
}: {
  historicalSeries: Array<{
    count: number;
    date: string;
  }>;
  projectedSeries: Array<{
    count: number;
    date: string;
  }>;
}): DashboardPredictionChartPoint[] {
  const historicalPoints = historicalSeries.map((point) => ({
    actual: point.count,
    date: point.date,
    projected: null,
  }));
  const projectedPoints = projectedSeries.map((point) => ({
    actual: null,
    date: point.date,
    projected: point.count,
  }));

  return [...historicalPoints, ...projectedPoints];
}

function formatEventTypeLabel(eventType: string) {
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

function formatTrendDirectionLabel(
  trendDirection:
    | "increasing"
    | "decreasing"
    | "stable"
    | "insufficient_data",
) {
  const labels = {
    decreasing: "Decreasing",
    increasing: "Increasing",
    insufficient_data: "Insufficient data",
    stable: "Stable",
  } as const;

  return labels[trendDirection];
}

function formatTrendConfidenceLabel(confidence: "low" | "medium" | "high") {
  const labels = {
    high: "High confidence",
    low: "Low confidence",
    medium: "Medium confidence",
  } as const;

  return labels[confidence];
}

function formatTrendChange(change: number) {
  if (change > 0) {
    return `+${formatCount(change)}`;
  }

  return formatCount(change);
}

function formatIndicatorTypeLabel(indicatorType: string) {
  const labels: Record<string, string> = {
    domain: "Domain",
    email: "Email",
    hash: "Hash",
    ip: "IP",
    keyword: "Keyword",
    url: "URL",
  };

  return labels[indicatorType] ?? formatFallbackLabel(indicatorType);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatLastIngestion(timestamp: number | null) {
  if (timestamp === null) {
    return "No ingestion yet.";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPriorityLabel(priority: "low" | "medium" | "high" | "critical") {
  const labels = {
    critical: "Critical",
    high: "High",
    low: "Low",
    medium: "Medium",
  } as const;

  return labels[priority];
}

function formatStatusLabel(
  status: "open" | "investigating" | "resolved" | "false_positive",
) {
  const labels = {
    false_positive: "False positive",
    investigating: "Investigating",
    open: "Open",
    resolved: "Resolved",
  } as const;

  return labels[status];
}

function formatSourceTypeLabel(sourceType: "authentication" | "firewall") {
  const labels = {
    authentication: "Authentication",
    firewall: "Firewall",
  } as const;

  return labels[sourceType];
}

function formatDetectedAt(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFallbackLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function getPriorityColor(priority: "low" | "medium" | "high" | "critical") {
  const colors = {
    critical: "#dc2626",
    high: "#d97706",
    low: "#059669",
    medium: "#ca8a04",
  } as const;

  return colors[priority];
}

function getStatusColor(
  status: "open" | "investigating" | "resolved" | "false_positive",
) {
  const colors = {
    false_positive: "#64748b",
    investigating: "#d97706",
    open: "#dc2626",
    resolved: "#059669",
  } as const;

  return colors[status];
}

function getSourceTypeColor(sourceType: "authentication" | "firewall") {
  const colors = {
    authentication: "#047857",
    firewall: "#2563eb",
  } as const;

  return colors[sourceType];
}
