"use client";

import { RadialBandDistributionChart } from "./RadialBandDistributionChart";
import type { DashboardChartData } from "./DashboardLogic";

type DashboardChartsProps = {
  charts: DashboardChartData;
};

export function DashboardCharts({ charts }: DashboardChartsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <RadialBandDistributionChart
        data={charts.priorityDistribution}
        description="Generated threat events grouped by backend-calculated priority."
        title="Threat priority distribution"
      />
      <RadialBandDistributionChart
        data={charts.sourceTypeDistribution}
        description="Threat events grouped by authentication and firewall sources."
        title="Source type breakdown"
      />
      <RadialBandDistributionChart
        data={charts.statusDistribution}
        description="Generated threat events grouped by review status."
        title="Threat status distribution"
      />
    </section>
  );
}
