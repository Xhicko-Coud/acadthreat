"use client";

import { BarChart3, ChevronDown, GitMerge } from "lucide-react";

import { tableHeaderButtonClassName } from "@/components/admin/tableHeaderButtonStyles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ThreatEventAnalysisOperation } from "./ThreatEventsLogic";

export function ThreatEventsAnalysisActions({
  disabled,
  onSelectOperation,
}: {
  disabled?: boolean;
  onSelectOperation: (operation: ThreatEventAnalysisOperation) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Run threat event analysis"
          className={tableHeaderButtonClassName}
          disabled={disabled}
          size="lg"
          type="button"
        >
          <BarChart3 className="size-4" />
          Run analysis
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-foreground">
          Analysis operations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer px-3 py-2.5"
          onSelect={() => onSelectOperation("correlation")}
        >
          <GitMerge className="size-4 text-primary" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">Run correlation</p>
            <p className="text-xs text-muted-foreground">
              Check normalized logs against active indicators.
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer px-3 py-2.5"
          onSelect={() => onSelectOperation("severity_scoring")}
        >
          <BarChart3 className="size-4 text-primary" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">Run severity scoring</p>
            <p className="text-xs text-muted-foreground">
              Update score and priority for generated threat events.
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
