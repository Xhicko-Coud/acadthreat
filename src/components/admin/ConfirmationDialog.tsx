"use client";

import { AlertTriangle, CheckCircle2, Loader2, ShieldX } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmationVariant = "default" | "destructive" | "success";

type ConfirmationDialogProps = {
  cancelText?: string;
  confirmText?: string;
  description: string;
  icon?: ReactNode;
  isLoading?: boolean;
  isOpen: boolean;
  loadingText?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  title: string;
  variant?: ConfirmationVariant;
};

function getIcon(variant: ConfirmationVariant, icon: ReactNode | undefined) {
  if (icon) return icon;
  if (variant === "destructive") {
    return <ShieldX className="size-7 text-red-600" />;
  }
  if (variant === "success") {
    return <CheckCircle2 className="size-7 text-emerald-600" />;
  }
  return <AlertTriangle className="size-7 text-primary" />;
}

function getMediaClassName(variant: ConfirmationVariant) {
  if (variant === "destructive") return "border border-red-200 bg-red-50";
  if (variant === "success") return "border border-emerald-200 bg-emerald-50";
  return "border border-primary/15 bg-primary/5";
}

function getActionClassName(variant: ConfirmationVariant) {
  if (variant === "destructive") return "bg-red-600 text-white hover:bg-red-700";
  if (variant === "success") return "bg-emerald-600 text-white hover:bg-emerald-700";
  return "bg-primary text-primary-foreground hover:bg-primary/90";
}

export function ConfirmationDialog({
  cancelText = "Cancel",
  confirmText = "Confirm",
  description,
  icon,
  isLoading = false,
  isOpen,
  loadingText = "Processing...",
  onConfirm,
  onOpenChange,
  title,
  variant = "default",
}: ConfirmationDialogProps) {
  function handleOpenChange(open: boolean) {
    if (!isLoading) {
      onOpenChange(open);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="!max-w-md border-primary/10 p-6 shadow-xl sm:!max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className={getMediaClassName(variant)}>
            {getIcon(variant, icon)}
          </AlertDialogMedia>
          <AlertDialogTitle className="text-foreground">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <AlertDialogCancel className="min-w-0" disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <Button
            className={cn(
              "min-w-0 gap-1.5 px-3 text-center",
              getActionClassName(variant),
            )}
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
