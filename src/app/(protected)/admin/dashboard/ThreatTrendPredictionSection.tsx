import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type {
  DashboardPriorityTrendPoint,
  DashboardTrendPrediction,
  DashboardTrendPredictionStatus,
} from "./DashboardLogic";
import { ThreatPredictionChart } from "./ThreatPredictionChart";

type ThreatTrendPredictionSectionProps = {
  isLoading: boolean;
  prediction: DashboardTrendPrediction | null;
  status: DashboardTrendPredictionStatus;
};

export function ThreatTrendPredictionSection({
  isLoading,
  prediction,
  status,
}: ThreatTrendPredictionSectionProps) {
  return (
    <section className="grid gap-4">
      <Card className="min-w-0 rounded-lg border border-primary/10 bg-white py-0 shadow-sm">
        <CardHeader className="px-4 py-4 sm:px-5">
          <CardTitle className="text-base font-semibold text-primary">
            Threat trend prediction
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-primary/70">
            Estimated threat activity direction based on recent generated
            threat events.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-5 sm:px-5">
          {isLoading ? (
            <TrendPredictionLoadingState />
          ) : (
            <TrendPredictionContent prediction={prediction} status={status} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function TrendPredictionContent({
  prediction,
  status,
}: {
  prediction: DashboardTrendPrediction | null;
  status: DashboardTrendPredictionStatus;
}) {
  if (status !== "success" || !prediction) {
    return <TrendPredictionUnavailableState />;
  }

  if (prediction.trendDirection === "insufficient_data") {
    return (
      <TrendPredictionState
        chartData={prediction.chartData}
        confidenceLabel={prediction.confidenceLabel}
        priorityTrend={prediction.priorityTrend}
        summary="Not enough generated threat event data is available to estimate a reliable trend yet."
        trendDirection={prediction.trendDirection}
        trendDirectionLabel={prediction.trendDirectionLabel}
      />
    );
  }

  return (
    <TrendPredictionState
      chartData={prediction.chartData}
      confidenceLabel={prediction.confidenceLabel}
      priorityTrend={prediction.priorityTrend}
      summary={`${prediction.summary} This estimate may change as new events are ingested.`}
      trendDirection={prediction.trendDirection}
      trendDirectionLabel={prediction.trendDirectionLabel}
    />
  );
}

function TrendPredictionState({
  chartData,
  confidenceLabel,
  priorityTrend,
  summary,
  trendDirection,
  trendDirectionLabel,
}: {
  chartData: DashboardTrendPrediction["chartData"];
  confidenceLabel: string;
  priorityTrend: DashboardTrendPrediction["priorityTrend"];
  summary: string;
  trendDirection: DashboardTrendPrediction["trendDirection"];
  trendDirectionLabel: string;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
        <div className="rounded-lg border border-dashed border-primary/15 bg-primary/4 p-4">
          <p className="text-sm leading-6 text-primary/75">{summary}</p>
        </div>
        <div className="grid gap-3 rounded-lg border border-primary/10 bg-white p-4">
          <TrendPredictionMetaRow
            label="Estimated trend"
            value={
              <Badge
                className={`rounded-full px-2.5 py-0.5 ${getTrendDirectionBadgeClassName(
                  trendDirection,
                )}`}
              >
                {trendDirectionLabel}
              </Badge>
            }
          />
          <TrendPredictionMetaRow
            label="Confidence"
            value={
              <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                {confidenceLabel}
              </Badge>
            }
          />
        </div>
      </div>

      <div className="rounded-lg border border-primary/10 bg-white p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-primary">
            Threat trend projection
          </h3>
          <p className="mt-1 text-sm leading-6 text-primary/70">
            Estimated activity direction based on recent generated threat
            events.
          </p>
        </div>
        {trendDirection === "insufficient_data" ? (
          <TrendPredictionInsufficientDataState />
        ) : (
          <ThreatPredictionChart data={chartData} />
        )}
      </div>

      <PriorityTrendSummary priorityTrend={priorityTrend} />
    </div>
  );
}

function TrendPredictionMetaRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-primary/65">{label}</span>
      {value}
    </div>
  );
}

function TrendPredictionLoadingState() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div className="rounded-lg border border-dashed border-primary/15 bg-primary/4 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
        </div>
        <div className="grid gap-3 rounded-lg border border-primary/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-primary/10 bg-white p-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <Skeleton className="mt-4 h-72 w-full rounded-lg" />
      </div>
    </div>
  );
}

function TrendPredictionUnavailableState() {
  return (
    <div className="rounded-lg border border-dashed border-primary/20 bg-primary/4 px-4 py-8 text-center text-sm leading-6 text-primary/70">
      Trend prediction is unavailable right now.
    </div>
  );
}

function TrendPredictionInsufficientDataState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-primary/20 bg-primary/4 px-4 text-center text-sm leading-6 text-primary/70 sm:h-72">
      Not enough generated threat event data is available to estimate a reliable
      trend yet.
    </div>
  );
}

function PriorityTrendSummary({
  priorityTrend,
}: {
  priorityTrend: DashboardPriorityTrendPoint[];
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-primary/10 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-primary">
          Priority trend summary
        </h3>
        <p className="mt-1 text-sm leading-6 text-primary/70">
          Current seven-day counts compared with the previous seven days.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {priorityTrend.map((item) => (
          <div
            className="rounded-lg border border-primary/10 bg-primary/4 p-3"
            key={item.priority}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-primary">
                {item.priorityLabel}
              </span>
              <span
                className={`text-sm font-semibold ${getPriorityTrendChangeClassName(
                  item.change,
                )}`}
              >
                {item.changeLabel}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-primary/65">
              Current {item.current} &middot; Previous {item.previous}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPriorityTrendChangeClassName(change: number) {
  if (change > 0) {
    return "text-amber-700";
  }

  if (change < 0) {
    return "text-emerald-700";
  }

  return "text-slate-600";
}

function getTrendDirectionBadgeClassName(
  trendDirection: DashboardTrendPrediction["trendDirection"],
) {
  if (trendDirection === "increasing") {
    return "bg-amber-50 text-amber-700";
  }

  if (trendDirection === "decreasing") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (trendDirection === "stable") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}
