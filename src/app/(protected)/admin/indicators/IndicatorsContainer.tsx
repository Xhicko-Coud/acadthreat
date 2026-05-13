"use client";

import { AccessRestrictedState } from "@/components/auth/AccessRestrictedState";

import { IndicatorsSkeleton } from "./IndicatorsSkeleton";
import { useIndicatorsLogic } from "./IndicatorsLogic";
import { IndicatorsView } from "./IndicatorsView";

export function IndicatorsContainer() {
  const logic = useIndicatorsLogic();

  if (logic.isInitialLoading) {
    return <IndicatorsSkeleton />;
  }

  if (!logic.hasAccess) {
    return (
      <AccessRestrictedState
        description="Your account does not have permission to view this section."
        title="Access restricted"
      />
    );
  }

  return <IndicatorsView {...logic} />;
}
