import { DatabaseZap } from "lucide-react";

import { AdminActionSheet } from "@/components/admin/AdminActionSheet";
import { FilterDropdownMenu } from "@/components/admin/FilterDropdownMenu";
import { tableHeaderButtonClassName } from "@/components/admin/tableHeaderButtonStyles";
import { Button } from "@/components/ui/button";

import { IndicatorsDetails } from "./IndicatorsDetails";
import { IndicatorsTable } from "./IndicatorsTable";
import type { useIndicatorsLogic } from "./IndicatorsLogic";
import {
  formatIndicatorSeverityLabel,
  formatIndicatorStatusLabel,
  formatIndicatorTypeLabel,
} from "./IndicatorsLogic";
import { ThreatFeedSyncDialog } from "./ThreatFeedSyncDialog";

type IndicatorsViewProps = ReturnType<typeof useIndicatorsLogic>;

export function IndicatorsView({
  closeSyncDialog,
  confirmThreatFeedSync,
  getIndicatorActions,
  handleSheetOpenChange,
  indicators,
  isSheetOpen,
  isSyncDialogOpen,
  isSyncing,
  isTableLoading,
  openSyncDialog,
  providerFilter,
  selectSyncLimit,
  selectSyncProvider,
  selectedSyncLimit,
  selectedSyncProvider,
  selectedSyncProviderLabel,
  setProviderFilter,
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

      <IndicatorsTable
        actions={
          <>
            <Button
              className={tableHeaderButtonClassName}
              disabled={isSyncing}
              onClick={openSyncDialog}
              size="lg"
              type="button"
            >
              <DatabaseZap className="size-4" />
              Sync threat feed
            </Button>
            <FilterDropdownMenu
              groups={[
                {
                  key: "provider",
                  label: "Provider",
                  onSelect: (value) =>
                    setProviderFilter(value as "all" | "urlhaus" | "internal"),
                  options: [
                    { label: "All providers", value: "all" },
                    { label: "URLHaus", value: "urlhaus" },
                    { label: "Internal/Demo", value: "internal" },
                  ],
                  value: providerFilter,
                  valueLabel:
                    providerFilter === "all"
                      ? "All providers"
                      : providerFilter === "urlhaus"
                        ? "URLHaus"
                        : "Internal/Demo",
                },
                {
                  key: "status",
                  label: "Status",
                  onSelect: (value) =>
                    setStatusFilter(
                      value as
                        | "active"
                        | "archived"
                        | "false_positive"
                        | "all",
                    ),
                  options: [
                    { label: "All statuses", value: "all" },
                    { label: "Active only", value: "active" },
                    { label: "Archived only", value: "archived" },
                    { label: "False positive only", value: "false_positive" },
                  ],
                  value: statusFilter,
                  valueLabel:
                    statusFilter === "all"
                      ? "All statuses"
                      : formatIndicatorStatusLabel(statusFilter),
                },
                {
                  key: "type",
                  label: "Type",
                  onSelect: (value) =>
                    setTypeFilter(
                      value as
                        | "ip"
                        | "domain"
                        | "url"
                        | "hash"
                        | "email"
                        | "keyword"
                        | "all",
                    ),
                  options: [
                    { label: "All types", value: "all" },
                    { label: "IP", value: "ip" },
                    { label: "Domain", value: "domain" },
                    { label: "URL", value: "url" },
                    { label: "Hash", value: "hash" },
                    { label: "Email", value: "email" },
                    { label: "Keyword", value: "keyword" },
                  ],
                  value: typeFilter,
                  valueLabel:
                    typeFilter === "all"
                      ? "All types"
                      : formatIndicatorTypeLabel(typeFilter),
                },
                {
                  key: "severity",
                  label: "Severity",
                  onSelect: (value) =>
                    setSeverityFilter(
                      value as
                        | "low"
                        | "medium"
                        | "high"
                        | "critical"
                        | "all",
                    ),
                  options: [
                    { label: "All severities", value: "all" },
                    { label: "Low", value: "low" },
                    { label: "Medium", value: "medium" },
                    { label: "High", value: "high" },
                    { label: "Critical", value: "critical" },
                  ],
                  value: severityFilter,
                  valueLabel:
                    severityFilter === "all"
                      ? "All severities"
                      : formatIndicatorSeverityLabel(severityFilter),
                },
              ]}
            />
          </>
        }
        data={indicators}
        description="Protected indicator records available for review and lifecycle management."
        getIndicatorActions={getIndicatorActions}
        isLoading={isTableLoading}
        title="Indicator Directory"
      />

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

      <ThreatFeedSyncDialog
        isLoading={isSyncing}
        onConfirm={confirmThreatFeedSync}
        onOpenChange={(open) => {
          if (open) {
            openSyncDialog();
            return;
          }

          closeSyncDialog();
        }}
        onSelectLimit={selectSyncLimit}
        onSelectProvider={selectSyncProvider}
        open={isSyncDialogOpen}
        selectedLimit={selectedSyncLimit}
        selectedProvider={selectedSyncProvider}
        selectedProviderLabel={selectedSyncProviderLabel}
      />
    </div>
  );
}
