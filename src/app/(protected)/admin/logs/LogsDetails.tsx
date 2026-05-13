import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  formatLogOutcomeLabel,
  formatLogSourceTypeLabel,
  formatNormalizedEventSeverityLabel,
  formatNormalizedEventTime,
  formatNormalizedEventTypeLabel,
  type NormalizedEventRecord,
} from "./LogsLogic";

export function LogsDetails({
  event,
}: {
  event: NormalizedEventRecord | null;
}) {
  const eventTime = event ? formatNormalizedEventTime(event.eventTimestamp) : "";
  const createdAt = event ? formatNormalizedEventTime(event.createdAt) : "";

  return (
    <div className="grid gap-5 py-4">
      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-source">
          Source
        </Label>
        <Input
          disabled
          id="event-source"
          readOnly
          value={event ? formatLogSourceTypeLabel(event.sourceType) : ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-type">
          Event Type
        </Label>
        <Input
          disabled
          id="event-type"
          readOnly
          value={event ? formatNormalizedEventTypeLabel(event.eventType) : ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-time">
          Event Time
        </Label>
        <Input
          disabled
          id="event-time"
          readOnly
          value={eventTime}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-actor">
          Actor
        </Label>
        <Input
          disabled
          id="event-actor"
          readOnly
          value={event?.actor ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-src-ip">
          Source IP
        </Label>
        <Input
          disabled
          id="event-src-ip"
          readOnly
          value={event?.srcIp ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-dest-ip">
          Destination IP
        </Label>
        <Input
          disabled
          id="event-dest-ip"
          readOnly
          value={event?.destIp ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-src-port">
          Source Port
        </Label>
        <Input
          disabled
          id="event-src-port"
          readOnly
          value={event?.srcPort != null ? String(event.srcPort) : "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-dest-port">
          Destination Port
        </Label>
        <Input
          disabled
          id="event-dest-port"
          readOnly
          value={event?.destPort != null ? String(event.destPort) : "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-protocol">
          Protocol
        </Label>
        <Input
          disabled
          id="event-protocol"
          readOnly
          value={event?.protocol ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-action">
          Action
        </Label>
        <Input
          disabled
          id="event-action"
          readOnly
          value={event?.action ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-outcome">
          Outcome
        </Label>
        <Input
          disabled
          id="event-outcome"
          readOnly
          value={event?.outcome ? formatLogOutcomeLabel(event.outcome) : "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-severity">
          Severity
        </Label>
        <Input
          disabled
          id="event-severity"
          readOnly
          value={formatNormalizedEventSeverityLabel(event?.severity ?? null)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-user-agent">
          User Agent
        </Label>
        <Input
          disabled
          id="event-user-agent"
          readOnly
          value={event?.userAgent ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-request-path">
          Request Path
        </Label>
        <Input
          disabled
          id="event-request-path"
          readOnly
          value={event?.requestPath ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-message">
          Message
        </Label>
        <Textarea
          disabled
          id="event-message"
          readOnly
          value={event?.message ?? "-"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-simulated">
          Simulated
        </Label>
        <Input
          disabled
          id="event-simulated"
          readOnly
          value={event ? (event.isSimulated ? "Yes" : "No") : ""}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm font-medium text-primary" htmlFor="event-created-at">
          Created At
        </Label>
        <Input
          disabled
          id="event-created-at"
          readOnly
          value={createdAt}
        />
      </div>

      <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
        Safe normalized event details are shown here in read-only mode.
      </p>
    </div>
  );
}
