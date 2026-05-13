import { AdminActionSheet } from "@/components/admin/AdminActionSheet";
import { FilterDropdownMenu } from "@/components/admin/FilterDropdownMenu";

import { ThreatEventDetails } from "./ThreatEventDetails";
import type { useThreatEventsLogic } from "./ThreatEventsLogic";
import {
  formatThreatEventIndicatorTypeLabel,
  formatThreatEventSeverityLabel,
  formatThreatEventSourceLabel,
  formatThreatEventStatusLabel,
} from "./ThreatEventsLogic";
import { ThreatEventsTable } from "./ThreatEventsTable";

type ThreatEventsViewProps = ReturnType<typeof useThreatEventsLogic>;

export function ThreatEventsView({
  detailedThreatEvent,
  getThreatEventActions,
  handleDetailsOpenChange,
  indicatorTypeFilter,
  isDetailsLoading,
  isDetailsOpen,
  isTableLoading,
  setIndicatorTypeFilter,
  setSeverityFilter,
  setSourceTypeFilter,
  setStatusFilter,
  severityFilter,
  sourceTypeFilter,
  statusFilter,
  threatEvents,
}: ThreatEventsViewProps) {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="grid gap-4 bg-primary px-6 py-8 text-primary-foreground md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">
              Detection Pipeline
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Threat Events</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Review correlated security events generated from normalized logs
              and threat intelligence indicators.
            </p>
          </div>
        </div>
      </section>

      <ThreatEventsTable
        actions={
          <FilterDropdownMenu
            groups={[
              {
                key: "status",
                label: "Status",
                onSelect: (value) =>
                  setStatusFilter(
                    value as
                      | "all"
                      | "open"
                      | "investigating"
                      | "resolved"
                      | "false_positive",
                  ),
                options: [
                  { label: "All statuses", value: "all" },
                  { label: "Open", value: "open" },
                  { label: "Investigating", value: "investigating" },
                  { label: "Resolved", value: "resolved" },
                  { label: "False positive", value: "false_positive" },
                ],
                value: statusFilter,
                valueLabel:
                  statusFilter === "all"
                    ? "All statuses"
                    : formatThreatEventStatusLabel(statusFilter),
              },
              {
                key: "severity",
                label: "Severity",
                onSelect: (value) =>
                  setSeverityFilter(
                    value as "all" | "low" | "medium" | "high" | "critical",
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
                    : formatThreatEventSeverityLabel(severityFilter),
              },
              {
                key: "sourceType",
                label: "Source",
                onSelect: (value) =>
                  setSourceTypeFilter(
                    value as "all" | "authentication" | "firewall",
                  ),
                options: [
                  { label: "All sources", value: "all" },
                  { label: "Authentication", value: "authentication" },
                  { label: "Firewall", value: "firewall" },
                ],
                value: sourceTypeFilter,
                valueLabel:
                  sourceTypeFilter === "all"
                    ? "All sources"
                    : formatThreatEventSourceLabel(sourceTypeFilter),
              },
              {
                key: "indicatorType",
                label: "Indicator Type",
                onSelect: (value) =>
                  setIndicatorTypeFilter(
                    value as
                      | "all"
                      | "ip"
                      | "domain"
                      | "url"
                      | "hash"
                      | "email"
                      | "keyword",
                  ),
                options: [
                  { label: "All indicator types", value: "all" },
                  { label: "IP", value: "ip" },
                  { label: "Domain", value: "domain" },
                  { label: "URL", value: "url" },
                  { label: "Hash", value: "hash" },
                  { label: "Email", value: "email" },
                  { label: "Keyword", value: "keyword" },
                ],
                value: indicatorTypeFilter,
                valueLabel:
                  indicatorTypeFilter === "all"
                    ? "All indicator types"
                    : formatThreatEventIndicatorTypeLabel(indicatorTypeFilter),
              },
            ]}
          />
        }
        data={threatEvents}
        description="Generated correlation results available for review."
        getThreatEventActions={getThreatEventActions}
        isLoading={isTableLoading}
        title="Threat Event Directory"
      />

      <AdminActionSheet
        cancelText="Close"
        description="Review the correlation evidence for this generated threat event."
        onCancel={() => handleDetailsOpenChange(false)}
        onConfirm={() => handleDetailsOpenChange(false)}
        onOpenChange={handleDetailsOpenChange}
        open={isDetailsOpen}
        showConfirmButton={false}
        title="Threat event details"
      >
        <ThreatEventDetails
          isLoading={isDetailsLoading}
          threatEvent={detailedThreatEvent}
        />
      </AdminActionSheet>
    </div>
  );
}
