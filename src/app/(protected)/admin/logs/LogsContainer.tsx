"use client";

import { AccessRestrictedState } from "@/components/auth/AccessRestrictedState";

import { LogsSkeleton } from "./LogsSkeleton";
import { useLogsLogic } from "./LogsLogic";
import { LogsView } from "./LogsView";

export function LogsContainer() {
  const logic = useLogsLogic();

  if (logic.isInitialLoading) {
    return <LogsSkeleton />;
  }

  if (!logic.hasAccess) {
    return (
      <AccessRestrictedState
        description="Your account does not have permission to view this section."
        title="Access restricted"
      />
    );
  }

  return <LogsView {...logic} />;
}
