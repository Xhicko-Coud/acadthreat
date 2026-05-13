import { DashboardCharts } from "./DashboardCharts";
import { DashboardMetricCard } from "./DashboardMetricCard";
import type { useDashboardLogic } from "./DashboardLogic";
import { RecentHighPriorityThreats } from "./RecentHighPriorityThreats";
import { ThreatActivityTrendChart } from "./ThreatActivityTrendChart";
import { ThreatTrendPredictionSection } from "./ThreatTrendPredictionSection";

type DashboardViewProps = ReturnType<typeof useDashboardLogic>;

export function DashboardView({
  charts,
  heroMeta,
  metrics,
  overview,
  recentHighPriorityThreats,
  threatActivityTrend,
  isTrendPredictionLoading,
  trendPrediction,
  trendPredictionStatus,
}: DashboardViewProps) {
  return (
    <div className="grid gap-4" data-dashboard-ready={overview ? "true" : "false"}>
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="grid gap-6 bg-primary px-6 py-8 text-primary-foreground md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">
              Threat Visibility
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Monitor generated threat events and priority signals from
              normalized logs and threat intelligence indicators.
            </p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-4 md:min-w-64 md:text-right">
            <p className="text-xs font-medium uppercase tracking-normal text-primary-foreground/65">
              Last ingestion
            </p>
            <p className="mt-2 text-sm font-semibold text-primary-foreground">
              {heroMeta.lastIngestion}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricCard
            description={metric.description}
            icon={metric.icon}
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </section>

      <section className="grid gap-4">
        <ThreatActivityTrendChart data={threatActivityTrend} />
      </section>

      <DashboardCharts charts={charts} />

      <ThreatTrendPredictionSection
        isLoading={isTrendPredictionLoading}
        prediction={trendPrediction}
        status={trendPredictionStatus}
      />

      <RecentHighPriorityThreats threats={recentHighPriorityThreats} />
    </div>
  );
}
