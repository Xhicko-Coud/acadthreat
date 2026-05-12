import { Activity, ShieldX } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

type LogsViewProps = {
  capabilities: {
    canViewNormalizedEvents: boolean;
    canViewRawLogs: boolean;
    canViewRawPayload: boolean;
  } | null;
  hasAccess: boolean;
};

export function LogsView({ capabilities, hasAccess }: LogsViewProps) {
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

      {!hasAccess ? (
        <EmptyState
          description="Your account does not currently have permission to review log events."
          icon={ShieldX}
          title="Log access restricted"
        />
      ) : null}

      {hasAccess ? (
        <EmptyState
          description="Normalized event records will appear here once the logs table is available."
          icon={Activity}
          title="Normalized events"
        />
      ) : null}
    </div>
  );
}
