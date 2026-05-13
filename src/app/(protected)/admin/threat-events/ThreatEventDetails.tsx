import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  formatThreatEventIndicatorTypeLabel,
  formatThreatEventMatchedFieldLabel,
  formatThreatEventPriorityLabel,
  formatThreatEventScoringStatusLabel,
  formatThreatEventSeverityLabel,
  formatThreatEventSourceLabel,
  formatThreatEventStatusLabel,
  formatThreatEventTime,
  formatThreatEventTypeLabel,
  type ThreatEventDetailRecord,
  type ThreatEventRecord,
  type ThreatEventScoringFactors,
} from "./ThreatEventsLogic";

export function ThreatEventDetails({
  isLoading,
  threatEvent,
}: {
  isLoading?: boolean;
  threatEvent: ThreatEventDetailRecord | ThreatEventRecord | null;
}) {
  const normalizedEvent =
    threatEvent && "normalizedEvent" in threatEvent
      ? threatEvent.normalizedEvent
      : null;
  const indicator =
    threatEvent && "indicator" in threatEvent ? threatEvent.indicator : null;
  const scoringFactors =
    threatEvent && "scoringFactors" in threatEvent
      ? threatEvent.scoringFactors
      : null;

  return (
    <div className="grid gap-6 py-4">
      {isLoading ? (
        <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
          Loading safe threat event context...
        </p>
      ) : null}

      <section className="grid gap-5">
        <SectionHeading title="Threat event" />
        <ReadOnlyField
          id="threat-event-type"
          label="Event Type"
          value={
            threatEvent ? formatThreatEventTypeLabel(threatEvent.eventType) : ""
          }
        />
        <ReadOnlyField
          id="threat-source"
          label="Source"
          value={
            threatEvent ? formatThreatEventSourceLabel(threatEvent.sourceType) : ""
          }
        />
        <ReadOnlyField
          id="threat-indicator-type"
          label="Indicator Type"
          value={
            threatEvent
              ? formatThreatEventIndicatorTypeLabel(threatEvent.indicatorType)
              : ""
          }
        />
        <ReadOnlyField
          id="threat-indicator-value"
          label="Indicator Value"
          value={threatEvent?.indicatorValue ?? ""}
        />
        <ReadOnlyField
          id="threat-matched-field"
          label="Matched Field"
          value={
            threatEvent
              ? formatThreatEventMatchedFieldLabel(threatEvent.matchedField)
              : ""
          }
        />
        <ReadOnlyField
          id="threat-severity"
          label="Severity"
          value={
            threatEvent
              ? formatThreatEventSeverityLabel(threatEvent.severity)
              : ""
          }
        />
        <ReadOnlyField
          id="threat-confidence"
          label="Confidence"
          value={threatEvent ? String(threatEvent.confidence) : ""}
        />
        <ReadOnlyField
          id="threat-status"
          label="Status"
          value={
            threatEvent ? formatThreatEventStatusLabel(threatEvent.status) : ""
          }
        />
        <ReadOnlyField
          id="threat-priority"
          label="Priority"
          value={formatPriorityValue(threatEvent)}
        />
        <ReadOnlyTextArea
          id="threat-correlation-reason"
          label="Correlation Reason"
          value={threatEvent?.correlationReason ?? ""}
        />
        <ReadOnlyTextArea
          id="threat-evidence-summary"
          label="Evidence Summary"
          value={threatEvent?.evidenceSummary ?? ""}
        />
        <ReadOnlyField
          id="threat-simulated"
          label="Simulated"
          value={threatEvent ? (threatEvent.isSimulated ? "Yes" : "No") : ""}
        />
        <ReadOnlyField
          id="threat-detected-at"
          label="Detected At"
          value={
            threatEvent ? formatThreatEventTime(threatEvent.detectedAt) : ""
          }
        />
        <ReadOnlyField
          id="threat-created-at"
          label="Created At"
          value={threatEvent ? formatThreatEventTime(threatEvent.createdAt) : ""}
        />
        <ReadOnlyField
          id="threat-updated-at"
          label="Updated At"
          value={threatEvent ? formatThreatEventTime(threatEvent.updatedAt) : ""}
        />
      </section>

      <section className="grid gap-5 border-t border-primary/10 pt-5">
        <SectionHeading title="Severity scoring" />
        <ReadOnlyField
          id="scoring-score"
          label="Score"
          value={formatScoreValue(threatEvent)}
        />
        <ReadOnlyField
          id="scoring-priority"
          label="Priority"
          value={formatPriorityValue(threatEvent)}
        />
        <ReadOnlyField
          id="scoring-status"
          label="Scoring Status"
          value={
            threatEvent
              ? formatThreatEventScoringStatusLabel(threatEvent.scoringStatus)
              : ""
          }
        />
        <ReadOnlyTextArea
          id="scoring-reason"
          label="Scoring Reason"
          value={getScoringReason(threatEvent)}
        />
        <ReadOnlyField
          id="scoring-scored-at"
          label="Scored At"
          value={
            threatEvent?.scoredAt
              ? formatThreatEventTime(threatEvent.scoredAt)
              : "Not scored"
          }
        />
        <ScoringFactorsView scoringFactors={scoringFactors} />
      </section>

      {normalizedEvent ? (
        <section className="grid gap-5 border-t border-primary/10 pt-5">
          <SectionHeading title="Normalized event context" />
          <ReadOnlyField
            id="context-event-type"
            label="Event Type"
            value={formatThreatEventTypeLabel(normalizedEvent.eventType)}
          />
          <ReadOnlyField
            id="context-event-time"
            label="Event Time"
            value={formatThreatEventTime(normalizedEvent.eventTimestamp)}
          />
          <ReadOnlyField
            id="context-actor"
            label="Actor"
            value={normalizedEvent.actor ?? "-"}
          />
          <ReadOnlyField
            id="context-src-ip"
            label="Source IP"
            value={normalizedEvent.srcIp ?? "-"}
          />
          <ReadOnlyField
            id="context-dest-ip"
            label="Destination IP"
            value={normalizedEvent.destIp ?? "-"}
          />
          <ReadOnlyField
            id="context-src-port"
            label="Source Port"
            value={
              normalizedEvent.srcPort != null
                ? String(normalizedEvent.srcPort)
                : "-"
            }
          />
          <ReadOnlyField
            id="context-dest-port"
            label="Destination Port"
            value={
              normalizedEvent.destPort != null
                ? String(normalizedEvent.destPort)
                : "-"
            }
          />
          <ReadOnlyField
            id="context-protocol"
            label="Protocol"
            value={normalizedEvent.protocol ?? "-"}
          />
          <ReadOnlyField
            id="context-action"
            label="Action"
            value={normalizedEvent.action ?? "-"}
          />
          <ReadOnlyField
            id="context-outcome"
            label="Outcome"
            value={normalizedEvent.outcome ?? "-"}
          />
          <ReadOnlyField
            id="context-severity"
            label="Severity"
            value={
              normalizedEvent.severity
                ? formatThreatEventSeverityLabel(normalizedEvent.severity)
                : "-"
            }
          />
          <ReadOnlyField
            id="context-user-agent"
            label="User Agent"
            value={normalizedEvent.userAgent ?? "-"}
          />
          <ReadOnlyField
            id="context-request-path"
            label="Request Path"
            value={normalizedEvent.requestPath ?? "-"}
          />
          <ReadOnlyTextArea
            id="context-message"
            label="Message"
            value={normalizedEvent.message ?? "-"}
          />
        </section>
      ) : null}

      {indicator ? (
        <section className="grid gap-5 border-t border-primary/10 pt-5">
          <SectionHeading title="Matched indicator context" />
          <ReadOnlyField
            id="indicator-value"
            label="Value"
            value={indicator.value}
          />
          <ReadOnlyField
            id="indicator-type"
            label="Type"
            value={formatThreatEventIndicatorTypeLabel(indicator.type)}
          />
          <ReadOnlyField
            id="indicator-severity"
            label="Severity"
            value={formatThreatEventSeverityLabel(indicator.severity)}
          />
          <ReadOnlyField
            id="indicator-confidence"
            label="Confidence"
            value={String(indicator.confidence)}
          />
          <ReadOnlyField
            id="indicator-source"
            label="Source"
            value={indicator.source ?? "-"}
          />
          <ReadOnlyTextArea
            id="indicator-description"
            label="Description"
            value={indicator.description ?? "-"}
          />
          <ReadOnlyField
            id="indicator-status"
            label="Status"
            value={formatIndicatorStatusLabel(indicator.status)}
          />
        </section>
      ) : null}

      <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
        Safe generated threat event details are shown here in read-only mode.
      </p>
    </div>
  );
}

function ScoringFactorsView({
  scoringFactors,
}: {
  scoringFactors: ThreatEventScoringFactors | null;
}) {
  if (!scoringFactors) {
    return (
      <ReadOnlyTextArea
        id="scoring-factors-empty"
        label="Scoring Factors"
        value="No scoring factors are available yet."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ReadOnlyField
          id="factor-indicator-severity"
          label="Indicator Severity"
          value={scoringFactors.indicatorSeverity ?? "-"}
        />
        <ReadOnlyField
          id="factor-indicator-confidence"
          label="Indicator Confidence"
          value={formatOptionalNumber(scoringFactors.indicatorConfidence)}
        />
        <ReadOnlyField
          id="factor-matched-field"
          label="Matched Field"
          value={scoringFactors.matchedField ?? "-"}
        />
        <ReadOnlyField
          id="factor-event-type"
          label="Event Type"
          value={
            scoringFactors.eventType
              ? formatThreatEventTypeLabel(scoringFactors.eventType)
              : "-"
          }
        />
        <ReadOnlyField
          id="factor-outcome"
          label="Outcome"
          value={scoringFactors.outcome ?? "-"}
        />
        <ReadOnlyField
          id="factor-source-type"
          label="Source Type"
          value={scoringFactors.sourceType ?? "-"}
        />
        <ReadOnlyField
          id="factor-frequency-count"
          label="Frequency Count"
          value={formatOptionalNumber(scoringFactors.frequencyCount)}
        />
        <ReadOnlyField
          id="factor-simulated"
          label="Simulated"
          value={
            typeof scoringFactors.isSimulated === "boolean"
              ? scoringFactors.isSimulated
                ? "Yes"
                : "No"
              : "-"
          }
        />
      </div>

      <div className="grid gap-2">
        <SectionHeading title="Contributions" />
        {scoringFactors.scoreContributions?.length ? (
          scoringFactors.scoreContributions.map((contribution, index) => (
            <div
              className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2"
              key={`${contribution.label}-${index}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-primary">
                  {contribution.label}
                </p>
                <span className="text-sm font-semibold text-primary">
                  {contribution.value}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-primary/70">
                {contribution.reason}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary/80">
            No contribution details are available yet.
          </p>
        )}
      </div>
    </div>
  );
}

function formatScoreValue(
  threatEvent: ThreatEventDetailRecord | ThreatEventRecord | null,
) {
  if (!threatEvent || threatEvent.scoringStatus === "unscored") {
    return "Unscored";
  }

  return `${threatEvent.severityScore}/100`;
}

function formatPriorityValue(
  threatEvent: ThreatEventDetailRecord | ThreatEventRecord | null,
) {
  if (!threatEvent?.priority) {
    return "-";
  }

  return formatThreatEventPriorityLabel(threatEvent.priority);
}

function getScoringReason(
  threatEvent: ThreatEventDetailRecord | ThreatEventRecord | null,
) {
  if (!threatEvent || threatEvent.scoringStatus === "unscored") {
    return "This threat event has not been scored yet.";
  }

  return threatEvent.scoringReason || "No scoring reason is available.";
}

function formatOptionalNumber(value: number | undefined) {
  return typeof value === "number" ? String(value) : "-";
}

function SectionHeading({ title }: { title: string }) {
  return <h3 className="text-sm font-semibold text-primary">{title}</h3>;
}

function ReadOnlyField({
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

function ReadOnlyTextArea({
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
      <Textarea disabled id={id} readOnly value={value} />
    </div>
  );
}

function formatIndicatorStatusLabel(status: "active" | "archived" | "false_positive") {
  const labels = {
    active: "Active",
    archived: "Archived",
    false_positive: "False positive",
  } satisfies Record<"active" | "archived" | "false_positive", string>;

  return labels[status];
}
