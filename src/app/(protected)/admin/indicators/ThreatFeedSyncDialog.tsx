"use client";

import { DatabaseZap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ThreatFeedSyncLimit,
  ThreatFeedSyncProvider,
} from "./IndicatorsLogic";

type ThreatFeedSyncProviderOption = {
  isEnabled: boolean;
  label: string;
  value: ThreatFeedSyncProvider;
};

const providerOptions: ThreatFeedSyncProviderOption[] = [
  { isEnabled: true, label: "URLHaus", value: "urlhaus" },
  { isEnabled: false, label: "AbuseIPDB", value: "abuseipdb" },
  { isEnabled: false, label: "AlienVault OTX", value: "otx" },
  { isEnabled: false, label: "PhishTank", value: "phishtank" },
  { isEnabled: false, label: "MISP", value: "misp" },
];
const syncLimitOptions: ThreatFeedSyncLimit[] = [50, 100, 250];

export function ThreatFeedSyncDialog({
  isLoading,
  onConfirm,
  onOpenChange,
  onSelectLimit,
  onSelectProvider,
  open,
  selectedLimit,
  selectedProvider,
  selectedProviderLabel,
}: {
  isLoading: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onSelectLimit: (limit: ThreatFeedSyncLimit) => void;
  onSelectProvider: (provider: ThreatFeedSyncProvider) => void;
  open: boolean;
  selectedLimit: ThreatFeedSyncLimit;
  selectedProvider: ThreatFeedSyncProvider;
  selectedProviderLabel: string;
}) {
  const selectedOption = getProviderOption(selectedProvider);
  const isUrlhausSelected = selectedProvider === "urlhaus";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!isLoading}
      >
        <DialogHeader>
          <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
            <DatabaseZap className="size-6" />
          </span>
          <DialogTitle>Sync threat feed?</DialogTitle>
          <DialogDescription>
            This will fetch recent indicators from {selectedProviderLabel} and
            update the indicator repository. Provider secrets and raw responses
            will not be shown.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="threat-feed-provider"
            >
              Provider
            </label>
            <Select
              disabled={isLoading}
              onValueChange={(value) =>
                onSelectProvider(value as ThreatFeedSyncProvider)
              }
              value={selectedProvider}
            >
              <SelectTrigger
                className="h-10 w-full justify-between"
                id="threat-feed-provider"
              >
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    <span>{provider.label}</span>
                    {!provider.isEnabled ? (
                      <Badge className="ml-auto" variant="secondary">
                        Coming soon
                      </Badge>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="threat-feed-limit"
            >
              Indicators to sync
            </label>
            <Select
              disabled={isLoading || !isUrlhausSelected}
              onValueChange={(value) =>
                onSelectLimit(Number(value) as ThreatFeedSyncLimit)
              }
              value={String(selectedLimit)}
            >
              <SelectTrigger
                className="h-10 w-full justify-between"
                id="threat-feed-limit"
              >
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                {syncLimitOptions.map((limit) => (
                  <SelectItem key={limit} value={String(limit)}>
                    {limit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              This controls how many recent indicators AcadThreat asks the
              selected provider to return.
            </p>
          </div>

          {!selectedOption.isEnabled ? (
            <p className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-sm text-primary/75">
              {selectedOption.label} is not enabled in this MVP.
            </p>
          ) : null}
        </div>

        <DialogFooter className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <Button
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading || !isUrlhausSelected}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? "Syncing..." : "Sync indicators"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getProviderOption(provider: ThreatFeedSyncProvider) {
  return (
    providerOptions.find((option) => option.value === provider) ??
    providerOptions[0]
  );
}
