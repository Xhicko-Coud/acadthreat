import {
  clampSeverityScore,
  getPriorityFromSeverityScore,
  getPriorityLabel,
  type ThreatEventMatchedField,
  type ThreatEventPriority,
  type ThreatEventSeverity,
} from "@convex/threatEvents/helpers";

type ThreatEventSourceType = "authentication" | "firewall";
type ThreatEventIndicatorType =
  | "ip"
  | "domain"
  | "url"
  | "hash"
  | "email"
  | "keyword";

export type SeverityScoringContribution = {
  label: string;
  reason: string;
  value: number;
};

export type SeverityScoringFactors = {
  eventType?: string;
  frequencyCount?: number;
  indicatorConfidence?: number;
  indicatorSeverity?: string;
  isSimulated?: boolean;
  matchedField?: string;
  outcome?: string;
  scoreContributions?: SeverityScoringContribution[];
  sourceType?: string;
};

export type SeverityScoringInput = {
  frequencyCount?: number;
  indicator?: {
    confidence?: number;
    severity?: ThreatEventSeverity;
    type?: ThreatEventIndicatorType;
  } | null;
  normalizedEvent?: {
    action?: string | null;
    actor?: string | null;
    destIp?: string | null;
    eventType?: string | null;
    message?: string | null;
    outcome?: string | null;
    sourceType?: ThreatEventSourceType;
    srcIp?: string | null;
  } | null;
  threatEvent: {
    confidence: number;
    eventType: string;
    isSimulated: boolean;
    matchedField: ThreatEventMatchedField;
    severity: ThreatEventSeverity;
    sourceType: ThreatEventSourceType;
  };
};

export type SeverityScoringResult = {
  priority: ThreatEventPriority;
  scoringFactors: SeverityScoringFactors;
  scoringReason: string;
  severityScore: number;
};

export function calculateThreatEventSeverityScore(
  input: SeverityScoringInput,
): SeverityScoringResult {
  const scoringFactors = buildSeverityScoringFactors(input);
  const rawScore = scoringFactors.scoreContributions?.reduce(
    (total, contribution) => total + contribution.value,
    0,
  ) ?? 0;
  const cappedScore = applyScoreCaps(input, rawScore, scoringFactors);
  const severityScore = clampSeverityScore(cappedScore);
  const priority = getPriorityFromSeverityScore(severityScore);
  const scoringReason = buildSeverityScoringReason(input, {
    priority,
    severityScore,
  });

  return {
    priority,
    scoringFactors,
    scoringReason,
    severityScore,
  };
}

export function buildSeverityScoringFactors(
  input: SeverityScoringInput,
): SeverityScoringFactors {
  const normalizedEventType = normalizeScoreText(
    input.normalizedEvent?.eventType,
  );
  const eventType =
    normalizedEventType || normalizeScoreText(input.threatEvent.eventType);
  const outcome = normalizeScoreText(input.normalizedEvent?.outcome);
  const action = normalizeScoreText(input.normalizedEvent?.action);
  const confidence = clampConfidence(
    input.indicator?.confidence ?? input.threatEvent.confidence,
  );
  const frequencyCount = normalizeFrequencyCount(input.frequencyCount);
  const contributions = [
    buildIndicatorSeverityContribution(
      input.indicator?.severity ?? input.threatEvent.severity,
    ),
    buildIndicatorConfidenceContribution(confidence),
    buildMatchedFieldContribution(input.threatEvent.matchedField),
    buildEventTypeContribution(eventType),
    buildOutcomeActionContribution(outcome, action),
    buildSourceTypeContribution(
      input.normalizedEvent?.sourceType ?? input.threatEvent.sourceType,
    ),
    buildFrequencyContribution(frequencyCount, input.threatEvent.isSimulated),
  ];
  const capContribution = buildCapContribution(input, confidence);

  if (capContribution) {
    contributions.push(capContribution);
  }

  return {
    eventType,
    frequencyCount,
    indicatorConfidence: confidence,
    indicatorSeverity: input.indicator?.severity ?? input.threatEvent.severity,
    isSimulated: input.threatEvent.isSimulated,
    matchedField: input.threatEvent.matchedField,
    outcome: outcome || undefined,
    scoreContributions: contributions,
    sourceType:
      input.normalizedEvent?.sourceType ?? input.threatEvent.sourceType,
  };
}

export function buildSeverityScoringReason(
  input: SeverityScoringInput,
  result?: {
    priority?: ThreatEventPriority;
    severityScore?: number;
  },
) {
  const score = result?.severityScore ?? calculateScoreOnly(input);
  const priority = result?.priority ?? getPriorityFromSeverityScore(score);
  const priorityLabel = getPriorityLabel(priority);
  const confidence = clampConfidence(
    input.indicator?.confidence ?? input.threatEvent.confidence,
  );
  const indicatorType = input.indicator?.type ?? "indicator";
  const matchedField = formatMatchedFieldLabel(input.threatEvent.matchedField);
  const eventType = formatEventTypeLabel(
    input.normalizedEvent?.eventType ?? input.threatEvent.eventType,
  );
  const outcome = normalizeScoreText(input.normalizedEvent?.outcome);

  if (priority === "critical" && outcome) {
    return `${priorityLabel} priority because a ${input.threatEvent.severity} ${indicatorType} indicator matched ${matchedField} in a ${eventType} event involving ${formatEventTypeLabel(outcome)} traffic.`;
  }

  if (
    indicatorType === "keyword" &&
    input.threatEvent.matchedField === "message"
  ) {
    return `${priorityLabel} priority because a keyword indicator matched the event message with ${formatConfidenceLevel(confidence)} confidence.`;
  }

  return `${priorityLabel} priority because a ${formatConfidenceLabel(confidence)} ${indicatorType} indicator matched ${matchedField} of a ${eventType} event.`;
}

function calculateScoreOnly(input: SeverityScoringInput) {
  const factors = buildSeverityScoringFactors(input);
  const rawScore = factors.scoreContributions?.reduce(
    (total, contribution) => total + contribution.value,
    0,
  ) ?? 0;

  return clampSeverityScore(applyScoreCaps(input, rawScore, factors));
}

function buildIndicatorSeverityContribution(severity: ThreatEventSeverity) {
  const values: Record<ThreatEventSeverity, number> = {
    critical: 85,
    high: 65,
    low: 20,
    medium: 40,
  };

  return {
    label: "Indicator severity",
    reason: `${formatEventTypeLabel(severity)} indicator severity sets the base risk.`,
    value: values[severity],
  };
}

function buildIndicatorConfidenceContribution(confidence: number) {
  return {
    label: "Indicator confidence",
    reason: "Indicator confidence contributes up to 10 points.",
    value: Math.round(confidence / 10),
  };
}

function buildMatchedFieldContribution(matchedField: ThreatEventMatchedField) {
  const values: Record<ThreatEventMatchedField, number> = {
    action: 4,
    actor: 5,
    destIp: 8,
    eventType: 4,
    message: 3,
    other: 2,
    outcome: 4,
    requestPath: 6,
    srcIp: 8,
  };

  return {
    label: "Matched field",
    reason: `${formatMatchedFieldLabel(matchedField)} match strength contributes to priority.`,
    value: values[matchedField],
  };
}

function buildEventTypeContribution(eventType: string) {
  const values: Record<string, number> = {
    account_lockout: 10,
    connection_allowed: 2,
    connection_blocked: 6,
    connection_denied: 6,
    login_failed: 5,
    login_success: 1,
    password_reset_attempt: 4,
    repeated_login_failed: 8,
    suspicious_port_scan: 10,
  };

  return {
    label: "Event type",
    reason: `${formatEventTypeLabel(eventType || "unknown")} event context contributes to priority.`,
    value: values[eventType] ?? 0,
  };
}

function buildOutcomeActionContribution(outcome: string, action: string) {
  const values: Record<string, number> = {
    allowed: 1,
    block: 5,
    blocked: 5,
    denied: 5,
    deny: 5,
    failure: 4,
    locked: 6,
    success: 0,
  };
  const outcomeValue = values[outcome] ?? 0;
  const actionValue = values[action] ?? 0;
  const selectedValue = Math.max(outcomeValue, actionValue);
  const selectedLabel = outcomeValue >= actionValue ? outcome : action;

  return {
    label: "Outcome or action",
    reason: selectedLabel
      ? `${formatEventTypeLabel(selectedLabel)} outcome or action affects urgency.`
      : "No risky outcome or action was available.",
    value: selectedValue,
  };
}

function buildSourceTypeContribution(sourceType: ThreatEventSourceType) {
  return {
    label: "Source type",
    reason: `${formatEventTypeLabel(sourceType)} source context contributes modestly.`,
    value: 3,
  };
}

function buildFrequencyContribution(
  frequencyCount: number,
  isSimulated: boolean,
) {
  if (isSimulated) {
    return {
      label: "Frequency",
      reason: "Simulated events do not receive frequency inflation.",
      value: 0,
    };
  }

  if (frequencyCount >= 7) {
    return {
      label: "Frequency",
      reason: "Seven or more related events add the capped frequency boost.",
      value: 10,
    };
  }

  if (frequencyCount >= 4) {
    return {
      label: "Frequency",
      reason: "Four to six related events add a moderate frequency boost.",
      value: 6,
    };
  }

  if (frequencyCount >= 2) {
    return {
      label: "Frequency",
      reason: "Two to three related events add a small frequency boost.",
      value: 3,
    };
  }

  return {
    label: "Frequency",
    reason: "No repeated related activity boost was applied.",
    value: 0,
  };
}

function buildCapContribution(
  input: SeverityScoringInput,
  confidence: number,
): SeverityScoringContribution | null {
  if (isLowConfidenceKeywordMessageMatch(input, confidence)) {
    return {
      label: "Score cap",
      reason: "Low-confidence keyword message matches are capped below critical priority.",
      value: 0,
    };
  }

  if (shouldApplyLowConfidenceCap(input, confidence)) {
    return {
      label: "Score cap",
      reason: "Low-confidence matches are capped at medium unless supported by a critical IP field match.",
      value: 0,
    };
  }

  return null;
}

function applyScoreCaps(
  input: SeverityScoringInput,
  rawScore: number,
  factors: SeverityScoringFactors,
) {
  const confidence =
    factors.indicatorConfidence ??
    clampConfidence(input.indicator?.confidence ?? input.threatEvent.confidence);
  let cappedScore = rawScore;

  if (isLowConfidenceKeywordMessageMatch(input, confidence)) {
    cappedScore = Math.min(cappedScore, 89);
  }

  if (shouldApplyLowConfidenceCap(input, confidence)) {
    cappedScore = Math.min(cappedScore, 69);
  }

  return cappedScore;
}

function isLowConfidenceKeywordMessageMatch(
  input: SeverityScoringInput,
  confidence: number,
) {
  return (
    input.indicator?.type === "keyword" &&
    input.threatEvent.matchedField === "message" &&
    confidence < 70
  );
}

function shouldApplyLowConfidenceCap(
  input: SeverityScoringInput,
  confidence: number,
) {
  if (confidence >= 40) {
    return false;
  }

  return !(
    input.threatEvent.severity === "critical" &&
    (input.threatEvent.matchedField === "srcIp" ||
      input.threatEvent.matchedField === "destIp")
  );
}

function clampConfidence(confidence: number | undefined) {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    return 0;
  }

  return clampSeverityScore(confidence);
}

function normalizeFrequencyCount(frequencyCount: number | undefined) {
  if (typeof frequencyCount !== "number" || !Number.isFinite(frequencyCount)) {
    return 0;
  }

  return Math.max(0, Math.floor(frequencyCount));
}

function normalizeScoreText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function formatMatchedFieldLabel(matchedField: ThreatEventMatchedField) {
  const labels: Record<ThreatEventMatchedField, string> = {
    action: "the event action",
    actor: "the actor",
    destIp: "the destination IP",
    eventType: "the event type",
    message: "the event message",
    other: "an event field",
    outcome: "the event outcome",
    requestPath: "the request path",
    srcIp: "the source IP",
  };

  return labels[matchedField];
}

function formatConfidenceLabel(confidence: number) {
  if (confidence >= 70) {
    return "high-confidence";
  }

  if (confidence >= 40) {
    return "moderate-confidence";
  }

  return "limited-confidence";
}

function formatConfidenceLevel(confidence: number) {
  if (confidence >= 70) {
    return "high";
  }

  if (confidence >= 40) {
    return "moderate";
  }

  return "limited";
}

function formatEventTypeLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ")
    .toLowerCase();
}
