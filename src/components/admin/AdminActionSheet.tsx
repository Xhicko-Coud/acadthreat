"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AdminActionSheetProps = {
  cancelText?: string;
  children: ReactNode;
  confirmDisabled?: boolean;
  confirmText?: string;
  description?: string;
  isLoading?: boolean;
  loadingText?: string;
  maxWidthClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showConfirmButton?: boolean;
  title: string;
};

export function AdminActionSheet({
  cancelText = "Cancel",
  children,
  confirmDisabled = false,
  confirmText = "Save",
  description,
  isLoading = false,
  loadingText = "Saving...",
  maxWidthClassName = "sm:max-w-[34rem]",
  onCancel,
  onConfirm,
  onOpenChange,
  open,
  showConfirmButton = true,
  title,
}: AdminActionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn("w-full border-none p-0", maxWidthClassName)}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="sticky top-0 z-10 bg-primary px-5 py-4 text-primary-foreground">
            <SheetTitle className="text-primary-foreground">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="text-primary-foreground/75">
                {description}
              </SheetDescription>
            ) : null}
          </SheetHeader>

          <Separator className="bg-primary" />

          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>

          <Separator className="bg-primary/10" />

          <SheetFooter className="sticky bottom-0 z-10 mt-0 flex-row justify-end gap-2 bg-white px-4 py-3">
            <Button
              className="border-primary/30 text-primary hover:bg-primary/5"
              disabled={isLoading}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              {cancelText}
            </Button>
            {showConfirmButton ? (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || confirmDisabled}
                onClick={onConfirm}
                type="button"
              >
                {isLoading ? loadingText : confirmText}
              </Button>
            ) : null}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
