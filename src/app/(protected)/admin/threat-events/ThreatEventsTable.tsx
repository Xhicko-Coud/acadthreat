import type { ColumnDef } from "@tanstack/react-table";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable } from "@/components/admin/DataTable";
import {
  DataTableRowActions,
  type RowAction,
} from "@/components/admin/DataTableRowActions";
import { TableCellText } from "@/components/admin/TableCellText";
import { Badge } from "@/components/ui/badge";

import {
  formatThreatEventIndicatorTypeLabel,
  formatThreatEventMatchedFieldLabel,
  formatThreatEventPriorityLabel,
  formatThreatEventSourceLabel,
  formatThreatEventScoringStatusLabel,
  formatThreatEventStatusLabel,
  formatThreatEventTime,
  formatThreatEventTypeLabel,
  type ThreatEventPriority,
  type ThreatEventRecord,
} from "./ThreatEventsLogic";

export function ThreatEventsTable({
  actions,
  data,
  description,
  getThreatEventActions,
  isLoading,
  title,
}: {
  actions?: ReactNode;
  data: ThreatEventRecord[];
  description?: string;
  getThreatEventActions: (event: ThreatEventRecord) => RowAction[];
  isLoading?: boolean;
  title?: string;
}) {
  const columns: ColumnDef<ThreatEventRecord>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "eventType",
      header: "Event Type",
      cell: ({ row }) => (
        <TableCellText className="font-medium text-foreground">
          {formatThreatEventTypeLabel(row.original.eventType)}
        </TableCellText>
      ),
    },
    {
      accessorKey: "sourceType",
      header: "Source",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatThreatEventSourceLabel(row.original.sourceType)}
        </span>
      ),
    },
    {
      accessorKey: "indicatorValue",
      header: "Indicator",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {`${formatThreatEventIndicatorTypeLabel(row.original.indicatorType)}: ${row.original.indicatorValue}`}
        </TableCellText>
      ),
    },
    {
      accessorKey: "matchedField",
      header: "Matched Field",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatThreatEventMatchedFieldLabel(row.original.matchedField)}
        </span>
      ),
    },
    {
      accessorKey: "severityScore",
      header: "Score",
      cell: ({ row }) => {
        if (row.original.scoringStatus === "unscored") {
          return (
            <span className="whitespace-nowrap text-muted-foreground">
              {formatThreatEventScoringStatusLabel(row.original.scoringStatus)}
            </span>
          );
        }

        return (
          <span className="whitespace-nowrap font-medium text-primary">
            {row.original.severityScore}/100
          </span>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;

        if (!priority) {
          return (
            <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
              Unscored
            </Badge>
          );
        }

        return (
          <Badge
            className={`rounded-full px-2.5 py-0.5 ${getPriorityBadgeClassName(priority)}`}
          >
            {formatThreatEventPriorityLabel(priority)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const className =
          status === "open"
            ? "bg-red-50 text-red-700"
            : status === "investigating"
              ? "bg-amber-50 text-amber-700"
              : status === "resolved"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-700";

        return (
          <Badge className={`rounded-full px-2.5 py-0.5 ${className}`}>
            {formatThreatEventStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "detectedAt",
      header: "Detected At",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-primary/80">
          {formatThreatEventTime(row.original.detectedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <DataTableRowActions actions={getThreatEventActions(row.original)} />
      ),
    },
  ];

  return (
    <DataTable
      actions={actions}
      columns={columns}
      data={data}
      description={description}
      emptyMessage="No threat events have been generated yet. Run correlation after logs and indicators are available."
      emptyStateIcon={<ShieldAlert className="size-5" />}
      isLoading={isLoading}
      loadingMessage="Loading threat events..."
      pageSize={10}
      title={title}
    />
  );
}

function getPriorityBadgeClassName(priority: ThreatEventPriority) {
  if (priority === "critical") {
    return "bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "bg-amber-50 text-amber-700";
  }

  if (priority === "medium") {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-emerald-50 text-emerald-700";
}
