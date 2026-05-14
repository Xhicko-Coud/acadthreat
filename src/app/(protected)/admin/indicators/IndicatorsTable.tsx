import type { ColumnDef } from "@tanstack/react-table";
import { ListFilter } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable } from "@/components/admin/DataTable";
import {
  DataTableRowActions,
  type RowAction,
} from "@/components/admin/DataTableRowActions";
import { TableCellText } from "@/components/admin/TableCellText";

import {
  formatIndicatorSeverityLabel,
  formatIndicatorStatusLabel,
  formatIndicatorTypeLabel,
  formatIndicatorProviderLabel,
  type IndicatorRecord,
} from "./IndicatorsLogic";

export function IndicatorsTable({
  actions,
  data,
  description,
  getIndicatorActions,
  isLoading,
  title,
}: {
  actions?: ReactNode;
  data: IndicatorRecord[];
  description?: string;
  getIndicatorActions: (indicator: IndicatorRecord) => RowAction[];
  isLoading?: boolean;
  title?: string;
}) {
  const columns: ColumnDef<IndicatorRecord>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => (
        <TableCellText className="font-medium text-foreground">
          {row.original.value}
        </TableCellText>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {formatIndicatorTypeLabel(row.original.type)}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const severity = row.original.severity;
        const severityClassName =
          severity === "critical"
            ? "bg-red-50 text-red-700"
            : severity === "high"
              ? "bg-amber-50 text-amber-700"
              : severity === "medium"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-emerald-50 text-emerald-700";

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityClassName}`}
          >
            {formatIndicatorSeverityLabel(severity)}
          </span>
        );
      },
    },
    {
      accessorKey: "confidence",
      header: "Confidence",
      cell: ({ row }) => (
        <span className="text-primary/80">{row.original.confidence}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusClassName =
          status === "active"
            ? "bg-emerald-50 text-emerald-700"
            : status === "archived"
              ? "bg-slate-100 text-slate-700"
              : "bg-red-50 text-red-700";

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName}`}
          >
            {formatIndicatorStatusLabel(status)}
          </span>
        );
      },
    },
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatIndicatorProviderLabel(row.original.provider)}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <TableCellText className="text-muted-foreground">
          {row.original.source}
        </TableCellText>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt);

        return (
          <span className="whitespace-nowrap text-primary/80">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <DataTableRowActions actions={getIndicatorActions(row.original)} />
      ),
    },
  ];

  return (
    <DataTable
      actions={actions}
      columns={columns}
      data={data}
      description={description}
      emptyMessage="No indicators match this filter."
      emptyStateIcon={<ListFilter className="size-5" />}
      isLoading={isLoading}
      pageSize={10}
      title={title}
    />
  );
}
