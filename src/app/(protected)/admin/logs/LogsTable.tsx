import type { ColumnDef } from "@tanstack/react-table";
import { Activity } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable } from "@/components/admin/DataTable";
import {
  DataTableRowActions,
  type RowAction,
} from "@/components/admin/DataTableRowActions";
import { TableCellText } from "@/components/admin/TableCellText";
import { Badge } from "@/components/ui/badge";

import {
  formatLogSourceTypeLabel,
  formatNormalizedEventSeverityLabel,
  formatNormalizedEventTime,
  formatNormalizedEventTypeLabel,
  type NormalizedEventRecord,
} from "./LogsLogic";

export function LogsTable({
  actions,
  data,
  description,
  getEventActions,
  isLoading,
  title,
}: {
  actions?: ReactNode;
  data: NormalizedEventRecord[];
  description?: string;
  getEventActions: (event: NormalizedEventRecord) => RowAction[];
  isLoading?: boolean;
  title?: string;
}) {
  const columns: ColumnDef<NormalizedEventRecord>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "sourceType",
      header: "Source",
      cell: ({ row }) => (
        <TableCellText className="font-medium text-foreground">
          {formatLogSourceTypeLabel(row.original.sourceType)}
        </TableCellText>
      ),
    },
    {
      accessorKey: "eventType",
      header: "Event Type",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {formatNormalizedEventTypeLabel(row.original.eventType)}
        </TableCellText>
      ),
    },
    {
      accessorKey: "actor",
      header: "Actor",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {row.original.actor}
        </TableCellText>
      ),
    },
    {
      accessorKey: "srcIp",
      header: "Source IP",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {row.original.srcIp}
        </TableCellText>
      ),
    },
    {
      accessorKey: "destIp",
      header: "Destination IP",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {row.original.destIp}
        </TableCellText>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {row.original.action}
        </TableCellText>
      ),
    },
    {
      accessorKey: "outcome",
      header: "Outcome",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {row.original.outcome}
        </TableCellText>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const severity = row.original.severity;

        if (!severity) {
          return (
            <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
              {formatNormalizedEventSeverityLabel(severity)}
            </Badge>
          );
        }

        const className =
          severity === "critical"
            ? "bg-red-50 text-red-700"
            : severity === "high"
              ? "bg-amber-50 text-amber-700"
              : severity === "medium"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-emerald-50 text-emerald-700";

        return (
          <Badge className={`rounded-full px-2.5 py-0.5 ${className}`}>
            {formatNormalizedEventSeverityLabel(severity)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "eventTimestamp",
      header: "Event Time",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-primary/80">
          {formatNormalizedEventTime(row.original.eventTimestamp)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <DataTableRowActions actions={getEventActions(row.original)} />
      ),
    },
  ];

  return (
    <DataTable
      actions={actions}
      columns={columns}
      data={data}
      description={description}
      emptyMessage="No normalized events match this filter."
      emptyStateIcon={<Activity className="size-5" />}
      isLoading={isLoading}
      pageSize={10}
      title={title}
    />
  );
}
