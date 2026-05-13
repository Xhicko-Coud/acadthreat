"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  actions?: ReactNode;
  canLoadMore?: boolean;
  className?: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  description?: string;
  emptyMessage?: string;
  emptyStateIcon?: ReactNode;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  loadingMessage?: string;
  loadingRowCount?: number;
  onLoadMore?: () => void;
  pageSize?: number;
  title?: string;
};

function getVisiblePages(totalPages: number, currentPage: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);

  return Array.from(pages).sort((first, second) => first - second);
}

export function DataTable<TData>({
  actions,
  canLoadMore = false,
  className,
  columns,
  data,
  description,
  emptyMessage = "No records available.",
  emptyStateIcon,
  isLoading = false,
  isLoadingMore = false,
  loadingMessage = "Loading table data...",
  loadingRowCount,
  onLoadMore,
  pageSize = 10,
  title,
}: DataTableProps<TData>) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [data, table]);

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = Math.max(1, table.getPageCount());
  const visiblePages = useMemo(
    () => getVisiblePages(totalPages, currentPage),
    [currentPage, totalPages],
  );
  const resolvedLoadingRowCount = Math.max(1, loadingRowCount ?? pageSize);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm",
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-col gap-4 border-b border-primary/10 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
          {title ? (
            <div className="max-w-3xl lg:min-w-0 lg:flex-1">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm text-primary/65">{description}</p>
              ) : null}
            </div>
          ) : null}
          {actions ? (
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:flex-none lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-primary text-primary-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="whitespace-nowrap px-4 py-3 font-medium"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: resolvedLoadingRowCount }, (_, rowIndex) => (
                <tr className="border-t border-primary/10" key={rowIndex}>
                  {columns.map((column, columnIndex) => (
                    <td
                      className="px-4 py-3"
                      key={`${rowIndex}-${column.id ?? columnIndex}`}
                    >
                      <Skeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  className="border-t border-primary/10 transition hover:bg-primary/5"
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className="whitespace-nowrap px-4 py-3 align-middle"
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="h-24 px-4 py-3 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  <div className="grid justify-items-center gap-2">
                    {emptyStateIcon ? (
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                        {emptyStateIcon}
                      </span>
                    ) : null}
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>{loadingMessage}</span>
            </div>
          </div>
        ) : null}
      </div>

      {!isLoading ? (
        <div className="flex items-center justify-end gap-2 border-t border-primary/10 bg-primary p-3">
          {canLoadMore ? (
            <Button
              className="mr-auto bg-white/10 text-white hover:bg-white/20"
              disabled={isLoadingMore}
              onClick={onLoadMore}
              size="sm"
              type="button"
            >
              {isLoadingMore ? "Loading..." : "Load More Records"}
            </Button>
          ) : null}
          <Button
            aria-label="Previous page"
            className="bg-white text-primary hover:bg-white/90"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="icon-sm"
            type="button"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1];
            const showGap = previousPage && page - previousPage > 1;

            return (
              <div className="flex items-center gap-2" key={page}>
                {showGap ? <span className="text-white/70">...</span> : null}
                <Button
                  className={cn(
                    "text-white hover:bg-white/15",
                    page === currentPage && "bg-white text-primary",
                  )}
                  onClick={() => table.setPageIndex(page - 1)}
                  size="icon-sm"
                  type="button"
                  variant={page === currentPage ? "default" : "ghost"}
                >
                  {page}
                </Button>
              </div>
            );
          })}
          <Button
            aria-label="Next page"
            className="bg-white text-primary hover:bg-white/90"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="icon-sm"
            type="button"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
