import { AdminActionSheet } from "@/components/admin/AdminActionSheet";
import { FilterDropdownMenu } from "@/components/admin/FilterDropdownMenu";

import { LogsDetails } from "./LogsDetails";
import { LogsTable } from "./LogsTable";
import {
  formatLogOutcomeLabel,
  formatLogSourceTypeLabel,
  formatNormalizedEventSeverityLabel,
  formatNormalizedEventTypeLabel,
} from "./LogsLogic";
import type { useLogsLogic } from "./LogsLogic";

type LogsViewProps = ReturnType<typeof useLogsLogic>;

export function LogsView({
  capabilities,
  eventTypeFilter,
  eventTypeOptions,
  handleDetailsOpenChange,
  getEventActions,
  isDetailsOpen,
  isTableLoading,
  normalizedEvents,
  outcomeFilter,
  selectedEvent,
  setEventTypeFilter,
  setOutcomeFilter,
  setSeverityFilter,
  setSourceTypeFilter,
  severityFilter,
  sourceTypeFilter,
}: LogsViewProps) {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="grid gap-4 bg-primary px-6 py-8 text-primary-foreground md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">
              Monitoring Pipeline
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Logs</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Review normalized authentication and firewall events collected
              through the log ingestion pipeline.
            </p>
          </div>
        </div>
      </section>

      <LogsTable
        actions={
          <FilterDropdownMenu
            groups={[
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
                    : formatLogSourceTypeLabel(sourceTypeFilter),
              },
              {
                key: "eventType",
                label: "Event Type",
                onSelect: setEventTypeFilter,
                options: [
                  { label: "All event types", value: "all" },
                  ...eventTypeOptions,
                ],
                value: eventTypeFilter,
                valueLabel:
                  eventTypeFilter === "all"
                    ? "All event types"
                    : formatNormalizedEventTypeLabel(eventTypeFilter),
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
                    : formatNormalizedEventSeverityLabel(severityFilter),
              },
              {
                key: "outcome",
                label: "Outcome",
                onSelect: (value) =>
                  setOutcomeFilter(
                    value as
                      | "all"
                      | "allowed"
                      | "blocked"
                      | "denied"
                      | "failure"
                      | "locked"
                      | "success",
                  ),
                options: [
                  { label: "All outcomes", value: "all" },
                  { label: "Success", value: "success" },
                  { label: "Failure", value: "failure" },
                  { label: "Allowed", value: "allowed" },
                  { label: "Blocked", value: "blocked" },
                  { label: "Denied", value: "denied" },
                  { label: "Locked", value: "locked" },
                ],
                value: outcomeFilter,
                valueLabel:
                  outcomeFilter === "all"
                    ? "All outcomes"
                    : formatLogOutcomeLabel(outcomeFilter),
              },
            ]}
          />
        }
        data={normalizedEvents}
        description={
          capabilities?.canViewNormalizedEvents
            ? "Safe normalized authentication and firewall events available for review."
            : "Normalized event visibility is currently unavailable."
        }
        getEventActions={getEventActions}
        isLoading={isTableLoading}
        title="Normalized Event Directory"
      />

      <AdminActionSheet
        cancelText="Close"
        description="Review the normalized security event captured by the log ingestion pipeline."
        onCancel={() => handleDetailsOpenChange(false)}
        onConfirm={() => handleDetailsOpenChange(false)}
        onOpenChange={handleDetailsOpenChange}
        open={isDetailsOpen}
        showConfirmButton={false}
        title="Event details"
      >
        <LogsDetails event={selectedEvent} />
      </AdminActionSheet>
    </div>
  );
}
