import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  formatIndicatorProviderLabel,
  formatIndicatorSeverityLabel,
  formatIndicatorStatusLabel,
  formatIndicatorTypeLabel,
  type IndicatorRecord,
} from "./IndicatorsLogic";

export function IndicatorsDetails({
  indicator,
}: {
  indicator: IndicatorRecord | null;
}) {
  const createdAt = indicator
    ? new Date(indicator.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const updatedAt = indicator
    ? new Date(indicator.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const hasFeedMetadata = Boolean(
    indicator?.provider ||
      indicator?.providerIndicatorId ||
      indicator?.firstSeenAt ||
      indicator?.lastSeenAt ||
      indicator?.lastSyncedAt ||
      indicator?.sourceUrl ||
      indicator?.tags.length,
  );
  const safeSourceUrl = getSafeSourceUrl(indicator?.sourceUrl);

  return (
    <div className="grid gap-5 py-4">
      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-value">
          Value
        </Label>
        <Input
          disabled
          id="indicator-value"
          readOnly
          value={indicator?.value ?? ""}
        />
      </div>

      {hasFeedMetadata ? (
        <div className="grid gap-4 rounded-lg border border-primary/10 bg-primary/5 p-4">
          <div>
            <h3 className="text-sm font-semibold text-primary">
              Feed metadata
            </h3>
            <p className="mt-1 text-xs leading-5 text-primary/70">
              Imported indicator metadata is shown for review only.
            </p>
          </div>

          <FeedMetadataField
            id="indicator-provider"
            label="Provider"
            value={formatIndicatorProviderLabel(indicator?.provider ?? null)}
          />
          <FeedMetadataField
            id="indicator-provider-id"
            label="Provider Indicator ID"
            value={indicator?.providerIndicatorId ?? "-"}
          />
          <FeedMetadataField
            id="indicator-first-seen"
            label="First Seen"
            value={formatOptionalDateTime(indicator?.firstSeenAt)}
          />
          <FeedMetadataField
            id="indicator-last-seen"
            label="Last Seen"
            value={formatOptionalDateTime(indicator?.lastSeenAt)}
          />
          <FeedMetadataField
            id="indicator-last-synced"
            label="Last synced"
            value={formatOptionalDateTime(indicator?.lastSyncedAt)}
          />

          <div className="grid gap-1.5">
            <Label
              className="text-sm font-medium text-primary"
              htmlFor="indicator-source-url"
            >
              Source URL
            </Label>
            {safeSourceUrl ? (
              <a
                className="break-all rounded-3xl bg-input/50 px-3 py-2 text-sm text-primary underline-offset-4 hover:underline"
                href={safeSourceUrl}
                id="indicator-source-url"
                rel="noreferrer"
                target="_blank"
              >
                {safeSourceUrl}
              </a>
            ) : (
              <Input disabled id="indicator-source-url" readOnly value="-" />
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-sm font-medium text-primary">Tags</Label>
            {indicator?.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {indicator.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <Input disabled readOnly value="-" />
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-type">
          Type
        </Label>
        <Input
          disabled
          id="indicator-type"
          readOnly
          value={indicator ? formatIndicatorTypeLabel(indicator.type) : ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-severity">
          Severity
        </Label>
        <Input
          disabled
          id="indicator-severity"
          readOnly
          value={
            indicator ? formatIndicatorSeverityLabel(indicator.severity) : ""
          }
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-confidence">
          Confidence
        </Label>
        <Input
          disabled
          id="indicator-confidence"
          readOnly
          value={indicator ? String(indicator.confidence) : ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-status">
          Status
        </Label>
        <Input
          disabled
          id="indicator-status"
          readOnly
          value={indicator ? formatIndicatorStatusLabel(indicator.status) : ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-source">
          Source
        </Label>
        <Input
          disabled
          id="indicator-source"
          readOnly
          value={indicator?.source ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-description">
          Description
        </Label>
        <Textarea
          disabled
          id="indicator-description"
          readOnly
          value={indicator?.description ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-created-by">
          Created by
        </Label>
        <Input
          disabled
          id="indicator-created-by"
          readOnly
          value={indicator?.createdByEmail ?? ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-updated-by">
          Updated by
        </Label>
        <Input
          disabled
          id="indicator-updated-by"
          readOnly
          value={indicator?.updatedByEmail ?? ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-created-at">
          Created at
        </Label>
        <Input
          disabled
          id="indicator-created-at"
          readOnly
          value={createdAt}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="indicator-updated-at">
          Updated at
        </Label>
        <Input
          disabled
          id="indicator-updated-at"
          readOnly
          value={updatedAt}
        />
      </div>

      <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
        Recorded threat intelligence indicator details are shown here in read-only
        mode.
      </p>
    </div>
  );
}

function FeedMetadataField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium text-primary" htmlFor={id}>
        {label}
      </Label>
      <Input disabled id={id} readOnly value={value} />
    </div>
  );
}

function formatOptionalDateTime(timestamp: number | null | undefined) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSafeSourceUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}
