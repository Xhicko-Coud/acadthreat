"use client";

import {
  CheckCircle2Icon,
  CircleXIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AppAlertVariant = "success" | "info" | "warning" | "error";
type AppAlertPlacement = "inline" | "top-center";

type AppAlertProps = {
  variant: AppAlertVariant;
  title: string;
  description?: string;
  className?: string;
  placement?: AppAlertPlacement;
};

const variantStyles: Record<AppAlertVariant, string> = {
  success:
    "border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-100 [&_[data-slot=alert-description]]:text-green-800 dark:[&_[data-slot=alert-description]]:text-green-200",
  info: "border-border bg-card text-card-foreground",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 [&_[data-slot=alert-description]]:text-amber-800 dark:[&_[data-slot=alert-description]]:text-amber-200",
  error:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100 [&_[data-slot=alert-description]]:text-red-800 dark:[&_[data-slot=alert-description]]:text-red-200",
};

const variantIcons = {
  success: CheckCircle2Icon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: CircleXIcon,
} satisfies Record<AppAlertVariant, React.ComponentType<{ className?: string }>>;

export function AppAlert({
  variant,
  title,
  description,
  className,
  placement = "inline",
}: AppAlertProps) {
  const Icon = variantIcons[variant];
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, [description, placement, title, variant]);

  useEffect(() => {
    if (placement !== "top-center" || isHovered || !isVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isHovered, isVisible, placement]);

  if (placement === "top-center") {
    if (!isVisible) {
      return null;
    }

    return (
      <div className="cursor-pointer fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6">
        <Alert
          className={cn(
            "pointer-events-auto w-full max-w-md shadow-lg",
            variantStyles[variant],
            className,
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Icon className="size-4" />
          <AlertTitle>{title}</AlertTitle>
          {description ? <AlertDescription>{description}</AlertDescription> : null}
        </Alert>
      </div>
    );
  }

  return (
    <Alert className={cn(variantStyles[variant], className)}>
      <Icon className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
    </Alert>
  );
}
