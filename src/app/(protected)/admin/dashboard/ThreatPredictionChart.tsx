"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { DashboardPredictionChartPoint } from "./DashboardLogic";

type ThreatPredictionChartProps = {
  data: DashboardPredictionChartPoint[];
};

const chartConfig = {
  actual: {
    color: "#047857",
    label: "Actual threat events",
  },
  projected: {
    color: "#2563eb",
    label: "Projected threat events",
  },
} satisfies ChartConfig;

export function ThreatPredictionChart({ data }: ThreatPredictionChartProps) {
  const hasChartData = data.some(
    (point) => point.actual !== null || point.projected !== null,
  );

  if (!hasChartData) {
    return <ChartEmptyState />;
  }

  return (
    <ChartContainer className="h-72 w-full min-w-0" config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 8, right: 8, top: 12 }}
      >
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="date"
          interval="preserveStartEnd"
          minTickGap={8}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          connectNulls={false}
          dataKey="actual"
          fill="var(--color-actual)"
          fillOpacity={0.22}
          stroke="var(--color-actual)"
          strokeWidth={2}
          type="natural"
        />
        <Area
          connectNulls={false}
          dataKey="projected"
          fill="var(--color-projected)"
          fillOpacity={0.12}
          stroke="var(--color-projected)"
          strokeDasharray="5 5"
          strokeWidth={2}
          type="natural"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-primary/20 bg-primary/4 px-4 text-center text-sm leading-6 text-primary/70 sm:h-72">
      Not enough generated threat event data is available to estimate a reliable
      trend yet.
    </div>
  );
}
