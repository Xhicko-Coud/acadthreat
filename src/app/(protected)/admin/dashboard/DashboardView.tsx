import { ActivityIcon } from "lucide-react";

import { AppAlert } from "@/components/shared/AppAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function DashboardView() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Protected Admin"
        title="Dashboard overview"
        description="Monitor the protected threat intelligence workspace from a single admin dashboard."
      />

      <div className="grid gap-4">
        <AppAlert
          variant="success"
          title="Foundation ready"
          description="The protected admin workspace is ready for dashboard integrations."
        />
        <AppAlert
          variant="info"
          title="Protected access active"
          description="Authenticated workspace access is enforced before dashboard content is shown."
        />
        <AppAlert
          variant="warning"
          title="Metrics not yet available"
          description="Threat counts, charts, and recent activity will appear here when dashboard data is connected."
        />
      </div>

      <EmptyState
        icon={ActivityIcon}
        title="No dashboard metrics yet"
        description="Live threat counts, charts, and recent activity are not available yet."
      />
    </div>
  );
}
