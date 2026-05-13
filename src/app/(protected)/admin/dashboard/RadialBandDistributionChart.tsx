"use client";

import {
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

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

import type { DashboardDistributionPoint } from "./DashboardLogic";

type RadialBandDistributionChartProps = {
  data: DashboardDistributionPoint[];
  description: string;
  title: string;
};

export function RadialBandDistributionChart({
  data,
  description,
  title,
}: RadialBandDistributionChartProps) {
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const hasData = total > 0;
  const chartConfig = buildChartConfig(data);

  return (
    <Card className="min-w-0 rounded-lg border border-primary/10 bg-white py-0 shadow-sm">
      <CardHeader className="px-4 py-4 sm:px-5">
        <CardTitle className="text-base font-semibold text-primary">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-primary/70">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-5 sm:px-5">
        {!hasData ? (
          <ChartEmptyState />
        ) : (
          <div className="grid gap-4">
            <ChartContainer
              className="mx-auto h-64 w-full max-w-sm min-w-0"
              config={chartConfig}
            >
              <RadialBarChart
                accessibilityLayer
                data={data}
                endAngle={-270}
                innerRadius="24%"
                outerRadius="96%"
                startAngle={90}
              >
                <PolarAngleAxis
                  dataKey="count"
                  domain={[0, Math.max(total, 1)]}
                  tick={false}
                  type="number"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="key" />}
                />
                <RadialBar
                  background
                  cornerRadius={8}
                  dataKey="count"
                >
                  {data.map((point) => (
                    <Cell fill={point.fill} key={point.key} />
                  ))}
                </RadialBar>
              </RadialBarChart>
            </ChartContainer>
            <div className="grid gap-2">
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">{total}</p>
                <p className="text-xs font-medium uppercase tracking-normal text-primary/55">
                  Total events
                </p>
              </div>
              <div className="grid gap-2">
                {data.map((point) => (
                  <div
                    className="flex items-center justify-between gap-3 text-sm"
                    key={point.key}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2 text-primary/70">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: point.fill }}
                      />
                      <span className="truncate">{point.label}</span>
                    </span>
                    <span className="font-medium text-primary">
                      {point.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildChartConfig(data: DashboardDistributionPoint[]) {
  return data.reduce<ChartConfig>((config, point) => {
    config[point.key] = {
      color: point.fill,
      label: point.label,
    };

    return config;
  }, {});
}

function ChartEmptyState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-primary/20 bg-primary/4 px-4 text-center text-sm leading-6 text-primary/70">
      No chart data available yet.
    </div>
  );
}
