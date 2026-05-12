"use client";

import { IndicatorsSkeleton } from "./IndicatorsSkeleton";
import { useIndicatorsLogic } from "./IndicatorsLogic";
import { IndicatorsView } from "./IndicatorsView";

export function IndicatorsContainer() {
  const logic = useIndicatorsLogic();

  if (logic.isInitialLoading) {
    return <IndicatorsSkeleton />;
  }

  return <IndicatorsView {...logic} />;
}
