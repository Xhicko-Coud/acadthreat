"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { DashboardTrendPoint } from "./DashboardLogic";

type ThreatActivityTrendChartProps = {
  data: DashboardTrendPoint[];
};

const chartConfig = {
  count: {
    color: "#047857",
    label: "Threat events",
  },
} satisfies ChartConfig;

export function ThreatActivityTrendChart({
  data,
}: ThreatActivityTrendChartProps) {
  const hasData = data.some((point) => point.count > 0);

  return (
    <Card className="min-w-0 rounded-lg border border-primary/10 bg-white py-0 shadow-sm">
      <CardHeader className="px-4 py-4 sm:px-5">
        <CardTitle className="text-base font-semibold text-primary">
          7-day threat activity
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-primary/70">
          Historical count of generated threat events over the last seven days.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-5 sm:px-5">
        {data.length === 0 || !hasData ? (
          <ChartEmptyState />
        ) : (
          <ChartContainer
            className="h-72 w-full min-w-0"
            config={chartConfig}
          >
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
                dataKey="count"
                fill="var(--color-count)"
                fillOpacity={0.28}
                stroke="var(--color-count)"
                type="natural"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-primary/20 bg-primary/4 px-4 text-center text-sm leading-6 text-primary/70 sm:h-72">
      No chart data available yet.
    </div>
  );
}
