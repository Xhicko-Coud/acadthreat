import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable } from "@/components/admin/DataTable";
import {
  DataTableRowActions,
  type RowAction,
} from "@/components/admin/DataTableRowActions";

import { formatRoleLabel, type UserRecord } from "./UsersLogic";

export function UsersTable({
  actions,
  data,
  getUserActions,
  title,
  description,
}: {
  actions?: ReactNode;
  data: UserRecord[];
  description?: string;
  getUserActions: (user: UserRecord) => RowAction[];
  title?: string;
}) {
  const columns: ColumnDef<UserRecord>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.name || "Unknown"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {formatRoleLabel(row.original.role)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status === "active";

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
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
        <DataTableRowActions actions={getUserActions(row.original)} />
      ),
    },
  ];

  return (
    <DataTable
      actions={actions}
      columns={columns}
      data={data}
      description={description}
      emptyMessage="No users match this filter."
      emptyStateIcon={<Users className="size-5" />}
      pageSize={10}
      title={title}
    />
  );
}
