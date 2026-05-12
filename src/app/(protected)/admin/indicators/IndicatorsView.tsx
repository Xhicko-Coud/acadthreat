import { Filter, ShieldX } from "lucide-react";

import { AdminActionSheet } from "@/components/admin/AdminActionSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { IndicatorsDetails } from "./IndicatorsDetails";
import { IndicatorsTable } from "./IndicatorsTable";
import type { useIndicatorsLogic } from "./IndicatorsLogic";

type IndicatorsViewProps = ReturnType<typeof useIndicatorsLogic>;

export function IndicatorsView({
  getIndicatorActions,
  handleSheetOpenChange,
  hasAccess,
  indicators,
  isSheetOpen,
  isTableLoading,
  setSeverityFilter,
  setStatusFilter,
  setTypeFilter,
  severityFilter,
  sheetIndicator,
  statusFilter,
  typeFilter,
}: IndicatorsViewProps) {

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="grid gap-4 bg-primary px-6 py-8 text-primary-foreground md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">
              Threat Intelligence
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Indicators</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Manage threat indicators used to track suspicious IPs, domains,
              URLs, hashes, emails, and keywords.
            </p>
          </div>
        </div>
      </section>

      {!hasAccess ? (
        <EmptyState
          description="Your account does not currently have permission to review protected threat intelligence indicator records."
          icon={ShieldX}
          title="Indicator access restricted"
        />
      ) : null}

      {hasAccess ? (
        <IndicatorsTable
        actions={
          <>
            <Select
              onValueChange={(value) =>
                setStatusFilter(
                  value as "active" | "archived" | "false_positive" | "all",
                )
              }
              value={statusFilter}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-primary/20 bg-primary/[0.04] text-primary shadow-sm hover:border-primary/35 hover:bg-primary/[0.08] focus-visible:border-primary sm:w-44">
                <Filter className="size-4 text-primary/70" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-primary/10 shadow-xl">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="archived">Archived only</SelectItem>
                <SelectItem value="false_positive">False positive only</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                setTypeFilter(
                  value as
                    | "ip"
                    | "domain"
                    | "url"
                    | "hash"
                    | "email"
                    | "keyword"
                    | "all",
                )
              }
              value={typeFilter}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-primary/20 bg-primary/[0.04] text-primary shadow-sm hover:border-primary/35 hover:bg-primary/[0.08] focus-visible:border-primary sm:w-40">
                <Filter className="size-4 text-primary/70" />
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-primary/10 shadow-xl">
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="ip">IP</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="hash">Hash</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="keyword">Keyword</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                setSeverityFilter(
                  value as
                    | "low"
                    | "medium"
                    | "high"
                    | "critical"
                    | "all",
                )
              }
              value={severityFilter}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-primary/20 bg-primary/[0.04] text-primary shadow-sm hover:border-primary/35 hover:bg-primary/[0.08] focus-visible:border-primary sm:w-44">
                <Filter className="size-4 text-primary/70" />
                <SelectValue placeholder="Filter severity" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-primary/10 shadow-xl">
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        data={indicators}
        description="Protected indicator records available for review and lifecycle management."
        getIndicatorActions={getIndicatorActions}
        isLoading={isTableLoading}
        title="Indicator Directory"
        />
      ) : null}

      <AdminActionSheet
        cancelText="Close"
        description="Review the recorded threat intelligence indicator details."
        onCancel={() => handleSheetOpenChange(false)}
        onConfirm={() => handleSheetOpenChange(false)}
        onOpenChange={handleSheetOpenChange}
        open={isSheetOpen}
        showConfirmButton={false}
        title="Indicator details"
      >
        <IndicatorsDetails indicator={sheetIndicator} />
      </AdminActionSheet>
    </div>
  );
}
