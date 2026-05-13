"use client";

import { AccessRestrictedState } from "@/components/auth/AccessRestrictedState";

import { DashboardSkeleton } from "./DashboardSkeleton";
import { useDashboardLogic } from "./DashboardLogic";
import { DashboardView } from "./DashboardView";

export function DashboardContainer() {
  const logic = useDashboardLogic();

  if (logic.isInitialLoading) {
    return <DashboardSkeleton />;
  }

  if (logic.isRestricted) {
    return (
      <AccessRestrictedState
        description="Your account does not have permission to view this section."
        title="Access restricted"
      />
    );
  }

  return <DashboardView {...logic} />;
}
