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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DASHBOARD_RANGE_OPTIONS,
  formatDashboardRangeLabel,
  type DashboardActivityRange,
  type DashboardTrendPoint,
} from "./DashboardLogic";

type ThreatActivityTrendChartProps = {
  data: DashboardTrendPoint[];
  isLoading: boolean;
  onRangeChange: (range: DashboardActivityRange) => void;
  range: DashboardActivityRange;
};

const chartConfig = {
  count: {
    color: "#047857",
    label: "Threat events",
  },
} satisfies ChartConfig;

export function ThreatActivityTrendChart({
  data,
  isLoading,
  onRangeChange,
  range,
}: ThreatActivityTrendChartProps) {
  const hasData = data.some((point) => point.count > 0);
  const rangeLabel = formatDashboardRangeLabel(range);

  return (
    <Card className="min-w-0 rounded-lg border border-primary/10 bg-white py-0 shadow-sm">
      <CardHeader className="gap-4 px-4 py-4 sm:px-5 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-primary">
            Threat activity
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-primary/70">
            Historical count of generated threat events for {rangeLabel.toLowerCase()}.
          </CardDescription>
        </div>
        <Select
          onValueChange={(value) =>
            onRangeChange(Number(value) as DashboardActivityRange)
          }
          value={String(range)}
        >
          <SelectTrigger className="h-9 w-full md:w-44">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-4 pb-5 sm:px-5">
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-lg" />
        ) : data.length === 0 || !hasData ? (
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
