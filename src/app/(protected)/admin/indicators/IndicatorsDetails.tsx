import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
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
