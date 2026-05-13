"use client";

import { AccessRestrictedState } from "@/components/auth/AccessRestrictedState";

import { useThreatEventsLogic } from "./ThreatEventsLogic";
import { ThreatEventsSkeleton } from "./ThreatEventsSkeleton";
import { ThreatEventsView } from "./ThreatEventsView";

export function ThreatEventsContainer() {
  const logic = useThreatEventsLogic();

  if (logic.isInitialLoading) {
    return <ThreatEventsSkeleton />;
  }

  if (!logic.hasAccess) {
    return (
      <AccessRestrictedState
        description="Your account does not have permission to view this section."
        title="Access restricted"
      />
    );
  }

  return <ThreatEventsView {...logic} />;
}
