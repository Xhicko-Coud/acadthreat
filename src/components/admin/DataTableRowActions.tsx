import { EllipsisVertical, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowAction = {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "success";
};

export function DataTableRowActions({ actions }: { actions: RowAction[] }) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open actions menu"
          className="size-8 p-0 text-primary hover:bg-primary/5"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <DropdownMenuItem
              className={cn(
                "cursor-pointer px-3 py-2.5",
                action.variant === "destructive"
                  ? "text-red-600 focus:bg-red-50 focus:text-red-600"
                  : action.variant === "success"
                    ? "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600"
                    : "text-primary focus:bg-primary/10 focus:text-primary",
              )}
              disabled={action.disabled}
              key={index}
              onClick={action.onClick}
            >
              <Icon className="mr-3 size-4" />
              <span className="font-medium">{action.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
