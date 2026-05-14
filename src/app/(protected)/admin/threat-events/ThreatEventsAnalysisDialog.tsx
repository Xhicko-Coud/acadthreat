"use client";

import { BarChart3, GitMerge } from "lucide-react";

import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import type { ThreatEventAnalysisOperation } from "./ThreatEventsLogic";

export function ThreatEventsAnalysisDialog({
  isLoading,
  onCancel,
  onConfirm,
  operation,
}: {
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  operation: ThreatEventAnalysisOperation | null;
}) {
  return (
    <ConfirmationDialog
      cancelText="Cancel"
      confirmText={getConfirmText(operation)}
      description={getDescription(operation)}
      icon={getIcon(operation)}
      isLoading={isLoading}
      isOpen={Boolean(operation)}
      loadingText="Running..."
      onConfirm={onConfirm}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      title={getTitle(operation)}
    />
  );
}

function getTitle(operation: ThreatEventAnalysisOperation | null) {
  if (operation === "severity_scoring") {
    return "Run severity scoring?";
  }

  return "Run correlation?";
}

function getDescription(operation: ThreatEventAnalysisOperation | null) {
  if (operation === "severity_scoring") {
    return "This will update score and priority fields for generated threat events using the deterministic scoring rules.";
  }

  return "This will check recent normalized logs against active threat indicators and create new generated threat events where matches are found.";
}

function getConfirmText(operation: ThreatEventAnalysisOperation | null) {
  if (operation === "severity_scoring") {
    return "Run scoring";
  }

  return "Run correlation";
}

function getIcon(operation: ThreatEventAnalysisOperation | null) {
  if (operation === "severity_scoring") {
    return <BarChart3 className="size-7 text-primary" />;
  }

  return <GitMerge className="size-7 text-primary" />;
}
