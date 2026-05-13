"use client";

import { Check, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterGroup = {
  key: string;
  label: string;
  onSelect: (value: string) => void;
  options: FilterOption[];
  value: string;
  valueLabel?: string;
};

type FilterDropdownMenuProps = {
  disabled?: boolean;
  groups: FilterGroup[];
  label?: string;
};

export function FilterDropdownMenu({
  disabled = false,
  groups,
  label = "Filter",
}: FilterDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  const activeGroup = useMemo(
    () => groups.find((group) => group.key === activeGroupKey) ?? null,
    [activeGroupKey, groups],
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveGroupKey(null);
    }
  }, [isOpen]);

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${label} table records`}
          className={tableHeaderButtonClassName}
          disabled={disabled}
          size="lg"
          type="button"
        >
          <Filter className="size-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        {activeGroup ? (
          <>
            <DropdownMenuItem
              className="cursor-pointer px-3 py-2.5"
              onSelect={(event) => {
                event.preventDefault();
                setActiveGroupKey(null);
              }}
            >
              <ChevronLeft className="size-4" />
              <span className="font-medium">Back</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-foreground">
              {activeGroup.label}
            </DropdownMenuLabel>
            {activeGroup.options.map((option) => {
              const isSelected = option.value === activeGroup.value;

              return (
                <DropdownMenuItem
                  className="cursor-pointer px-3 py-2.5"
                  key={option.value}
                  onSelect={() => {
                    activeGroup.onSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-medium">{option.label}</span>
                  {isSelected ? (
                    <Check className="ml-auto size-4 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </>
        ) : (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-foreground">
              Filters
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {groups.map((group) => (
              <DropdownMenuItem
                className="cursor-pointer px-3 py-2.5"
                key={group.key}
                onSelect={(event) => {
                  event.preventDefault();
                  setActiveGroupKey(group.key);
                }}
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{group.label}</p>
                  {group.valueLabel ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {group.valueLabel}
                    </p>
                  ) : null}
                </div>
                <ChevronRight className="ml-auto size-4 text-muted-foreground" />
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
