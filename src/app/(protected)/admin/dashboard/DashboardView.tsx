import { ActivityIcon } from "lucide-react";

import { AppAlert } from "@/components/shared/AppAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export function DashboardView() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Protected Admin"
        title="Dashboard shell placeholder"
        description="This dashboard confirms the protected admin structure for Module 01 while keeping access control, analytics, and threat data out of scope for this chunk."
      />

      <div className="grid gap-4">
        <AppAlert
          variant="success"
          title="Foundation ready"
          description="The admin shell is prepared for future cybersecurity modules."
        />
        <AppAlert
          variant="info"
          title="Protected access pending"
          description="Real authentication and authorization enforcement will be added in Module 02."
        />
        <AppAlert
          variant="warning"
          title="Threat metrics pending"
          description="Threat metrics will be added in later modules."
        />
      </div>

      <EmptyState
        icon={ActivityIcon}
        title="No dashboard metrics yet"
        description="This admin area is currently a shell only. Live threat counts, charts, and recent activity feeds are not implemented in Module 01."
      />
    </div>
  );
}
