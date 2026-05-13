"use client";

import { CheckCircle2, RotateCcw, Search, ShieldX } from "lucide-react";

import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";

import {
  type PendingThreatEventStatusUpdate,
  type ThreatEventStatus,
} from "./ThreatEventsLogic";

type ThreatEventsDialogsProps = {
  cancelStatusUpdate: () => void;
  confirmStatusUpdate: () => void;
  isUpdatingStatus: boolean;
  pendingStatusUpdate: PendingThreatEventStatusUpdate | null;
};

export function ThreatEventsDialogs({
  cancelStatusUpdate,
  confirmStatusUpdate,
  isUpdatingStatus,
  pendingStatusUpdate,
}: ThreatEventsDialogsProps) {
  const nextStatus = pendingStatusUpdate?.nextStatus ?? "open";

  return (
    <ConfirmationDialog
      cancelText="Cancel"
      confirmText="Update status"
      description="This will update the generated threat event status. The original correlation evidence will remain unchanged."
      icon={getStatusIcon(nextStatus)}
      isLoading={isUpdatingStatus}
      isOpen={Boolean(pendingStatusUpdate)}
      loadingText="Updating status..."
      onConfirm={confirmStatusUpdate}
      onOpenChange={(open) => {
        if (!open) {
          cancelStatusUpdate();
        }
      }}
      title={getStatusDialogTitle(nextStatus)}
      variant={getStatusDialogVariant(nextStatus)}
    />
  );
}

function getStatusDialogTitle(status: ThreatEventStatus) {
  if (status === "resolved") {
    return "Mark as resolved?";
  }

  if (status === "false_positive") {
    return "Mark as false positive?";
  }

  if (status === "investigating") {
    return "Mark as investigating?";
  }

  return "Reopen threat event?";
}

function getStatusDialogVariant(status: ThreatEventStatus) {
  if (status === "resolved") {
    return "success";
  }

  if (status === "false_positive") {
    return "destructive";
  }

  return "default";
}

function getStatusIcon(status: ThreatEventStatus) {
  if (status === "resolved") {
    return <CheckCircle2 className="size-7 text-emerald-600" />;
  }

  if (status === "false_positive") {
    return <ShieldX className="size-7 text-red-600" />;
  }

  if (status === "investigating") {
    return <Search className="size-7 text-primary" />;
  }

  return <RotateCcw className="size-7 text-primary" />;
}
