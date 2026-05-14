"use client";

import { FlaskConical } from "lucide-react";

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

import type { ProofLogCount, ProofLogProvider } from "./LogsLogic";

type ProofLogProviderOption = {
  isEnabled: boolean;
  label: string;
  value: ProofLogProvider;
};

const providerOptions: ProofLogProviderOption[] = [
  { isEnabled: true, label: "URLHaus", value: "urlhaus" },
  { isEnabled: false, label: "AbuseIPDB", value: "abuseipdb" },
  { isEnabled: false, label: "AlienVault OTX", value: "otx" },
  { isEnabled: false, label: "PhishTank", value: "phishtank" },
  { isEnabled: false, label: "MISP", value: "misp" },
];
const proofLogCountOptions: ProofLogCount[] = [1, 5, 10, 25, 50];

export function LogsProofSeedDialog({
  isLoading,
  onConfirm,
  onOpenChange,
  onSelectCount,
  onSelectProvider,
  open,
  selectedCount,
  selectedProvider,
  selectedProviderLabel,
}: {
  isLoading: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onSelectCount: (count: ProofLogCount) => void;
  onSelectProvider: (provider: ProofLogProvider) => void;
  open: boolean;
  selectedCount: ProofLogCount;
  selectedProvider: ProofLogProvider;
  selectedProviderLabel: string;
}) {
  const selectedOption = getProviderOption(selectedProvider);
  const isUrlhausSelected = selectedProvider === "urlhaus";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isLoading}>
        <DialogHeader>
          <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
            <FlaskConical className="size-6" />
          </span>
          <DialogTitle>Seed proof logs?</DialogTitle>
          <DialogDescription>
            This will create simulated firewall logs containing imported
            indicators from {selectedProviderLabel}. It is for demo/testing and
            does not create threat events directly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="proof-log-provider"
            >
              Provider
            </label>
            <Select
              disabled={isLoading}
              onValueChange={(value) => onSelectProvider(value as ProofLogProvider)}
              value={selectedProvider}
            >
              <SelectTrigger
                className="h-10 w-full justify-between"
                id="proof-log-provider"
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
              htmlFor="proof-log-count"
            >
              Proof logs to seed
            </label>
            <Select
              disabled={isLoading || !isUrlhausSelected}
              onValueChange={(value) => onSelectCount(Number(value) as ProofLogCount)}
              value={String(selectedCount)}
            >
              <SelectTrigger
                className="h-10 w-full justify-between"
                id="proof-log-count"
              >
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                {proofLogCountOptions.map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              Each proof log uses one imported indicator from the selected
              provider.
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
            {isLoading ? "Seeding..." : "Seed proof logs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getProviderOption(provider: ProofLogProvider) {
  return (
    providerOptions.find((option) => option.value === provider) ??
    providerOptions[0]
  );
}
