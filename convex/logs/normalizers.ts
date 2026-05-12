import {
  LOG_SOURCE_TYPES,
  NORMALIZED_EVENT_SEVERITIES,
  MAX_NORMALIZED_MESSAGE_LENGTH,
  normalizeOptionalText,
  truncateText,
  type LogSourceType,
  type NormalizedEventSeverity,
} from "@convex/logs/helpers";

// ---------------------------------------------------------------------------
// Normalizer Output Type
// ---------------------------------------------------------------------------

export type NormalizedEventFields = {
  eventType: string;
  eventTimestamp: number;
  actor?: string;
  srcIp?: string;
  destIp?: string;
  srcPort?: number;
  destPort?: number;
  protocol?: string;
  action?: string;
  outcome?: string;
  severity?: NormalizedEventSeverity;
  userAgent?: string;
  requestPath?: string;
  message?: string;
};

export type NormalizationResult =
  | {
      data: NormalizedEventFields;
      status: "success";
    }
  | {
      reason: string;
      status: "parse_error";
    };

// ---------------------------------------------------------------------------
// Authentication Log Event Types
// ---------------------------------------------------------------------------

export const AUTHENTICATION_EVENT_TYPES = {
  loginSuccess: "login_success",
  loginFailed: "login_failed",
  passwordResetAttempt: "password_reset_attempt",
  accountLockout: "account_lockout",
} as const;

// ---------------------------------------------------------------------------
// Firewall Log Event Types
// ---------------------------------------------------------------------------

export const FIREWALL_EVENT_TYPES = {
  connectionAllowed: "connection_allowed",
  connectionBlocked: "connection_blocked",
  connectionDenied: "connection_denied",
  suspiciousPortScan: "suspicious_port_scan",
} as const;

// ---------------------------------------------------------------------------
// Top-Level Normalizer
// ---------------------------------------------------------------------------

/**
 * Route a raw log payload to the correct source-type normalizer.
 *
 * @param sourceType - The log source type.
 * @param payload - The raw JSON payload string.
 * @param receivedAt - Server-side received timestamp (fallback for eventTimestamp).
 */
export function normalizeLogPayload(
  sourceType: LogSourceType,
  payload: string,
  receivedAt: number,
): NormalizationResult {
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return {
      reason: "Payload is not valid JSON.",
      status: "parse_error",
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      reason: "Payload must be a JSON object.",
      status: "parse_error",
    };
  }

  if (sourceType === LOG_SOURCE_TYPES.authentication) {
    return normalizeAuthenticationLogPayload(parsed, receivedAt);
  }

  if (sourceType === LOG_SOURCE_TYPES.firewall) {
    return normalizeFirewallLogPayload(parsed, receivedAt);
  }

  return {
    reason: `Unsupported source type: ${sourceType}.`,
    status: "parse_error",
  };
}

// ---------------------------------------------------------------------------
// Authentication Log Normalizer
// ---------------------------------------------------------------------------

/**
 * Normalize an authentication log payload into structured event fields.
 *
 * Expected payload shape (flexible, all fields optional except eventType):
 * ```json
 * {
 *   "eventType": "login_success" | "login_failed" | "password_reset_attempt" | "account_lockout",
 *   "timestamp": 1715500000000,
 *   "username": "jdoe",
 *   "srcIp": "192.168.1.100",
 *   "userAgent": "Mozilla/5.0 ...",
 *   "outcome": "success" | "failure",
 *   "message": "User jdoe logged in successfully"
 * }
 * ```
 */
export function normalizeAuthenticationLogPayload(
  parsed: Record<string, unknown>,
  receivedAt: number,
): NormalizationResult {
  const eventType = extractString(parsed, "eventType");

  if (!eventType) {
    return {
      reason: "Authentication log missing required field: eventType.",
      status: "parse_error",
    };
  }

  if (!isKnownAuthenticationEventType(eventType)) {
    return {
      reason: `Unknown authentication event type: ${sanitizeForMessage(eventType)}.`,
      status: "parse_error",
    };
  }

  const eventTimestamp = extractTimestamp(parsed) ?? receivedAt;
  const actor = normalizeOptionalText(extractString(parsed, "username"));
  const srcIp = normalizeOptionalText(extractString(parsed, "srcIp"));
  const userAgent = normalizeOptionalText(extractString(parsed, "userAgent"));
  const outcome = normalizeOptionalText(extractString(parsed, "outcome"));
  const rawMessage = normalizeOptionalText(extractString(parsed, "message"));
  const message = rawMessage
    ? truncateText(rawMessage, MAX_NORMALIZED_MESSAGE_LENGTH)
    : buildAuthenticationMessage(eventType, actor);

  const severity = inferAuthenticationSeverity(eventType);

  return {
    data: {
      eventType,
      eventTimestamp,
      ...(actor ? { actor } : {}),
      ...(srcIp ? { srcIp } : {}),
      action: "authenticate",
      ...(outcome ? { outcome } : {}),
      ...(severity ? { severity } : {}),
      ...(userAgent ? { userAgent } : {}),
      ...(message ? { message } : {}),
    },
    status: "success",
  };
}

// ---------------------------------------------------------------------------
// Firewall Log Normalizer
// ---------------------------------------------------------------------------

/**
 * Normalize a firewall log payload into structured event fields.
 *
 * Expected payload shape (flexible, all fields optional except eventType):
 * ```json
 * {
 *   "eventType": "connection_allowed" | "connection_blocked" | "connection_denied" | "suspicious_port_scan",
 *   "timestamp": 1715500000000,
 *   "srcIp": "10.0.0.5",
 *   "destIp": "192.168.1.1",
 *   "srcPort": 54321,
 *   "destPort": 443,
 *   "protocol": "TCP",
 *   "action": "allow" | "block" | "deny",
 *   "outcome": "allowed" | "blocked" | "denied",
 *   "message": "Blocked incoming connection from 10.0.0.5 to port 443"
 * }
 * ```
 */
export function normalizeFirewallLogPayload(
  parsed: Record<string, unknown>,
  receivedAt: number,
): NormalizationResult {
  const eventType = extractString(parsed, "eventType");

  if (!eventType) {
    return {
      reason: "Firewall log missing required field: eventType.",
      status: "parse_error",
    };
  }

  if (!isKnownFirewallEventType(eventType)) {
    return {
      reason: `Unknown firewall event type: ${sanitizeForMessage(eventType)}.`,
      status: "parse_error",
    };
  }

  const eventTimestamp = extractTimestamp(parsed) ?? receivedAt;
  const srcIp = normalizeOptionalText(extractString(parsed, "srcIp"));
  const destIp = normalizeOptionalText(extractString(parsed, "destIp"));
  const srcPort = extractPort(parsed, "srcPort");
  const destPort = extractPort(parsed, "destPort");
  const protocol = normalizeOptionalText(extractString(parsed, "protocol"));
  const action = normalizeOptionalText(extractString(parsed, "action"));
  const outcome = normalizeOptionalText(extractString(parsed, "outcome"));
  const rawMessage = normalizeOptionalText(extractString(parsed, "message"));
  const message = rawMessage
    ? truncateText(rawMessage, MAX_NORMALIZED_MESSAGE_LENGTH)
    : buildFirewallMessage(eventType, srcIp, destIp, destPort);

  const severity = inferFirewallSeverity(eventType);

  return {
    data: {
      eventType,
      eventTimestamp,
      ...(srcIp ? { srcIp } : {}),
      ...(destIp ? { destIp } : {}),
      ...(srcPort != null ? { srcPort } : {}),
      ...(destPort != null ? { destPort } : {}),
      ...(protocol ? { protocol } : {}),
      ...(action ? { action } : {}),
      ...(outcome ? { outcome } : {}),
      ...(severity ? { severity } : {}),
      ...(message ? { message } : {}),
    },
    status: "success",
  };
}

// ---------------------------------------------------------------------------
// Severity Inference (Basic V1)
// ---------------------------------------------------------------------------

function inferAuthenticationSeverity(
  eventType: string,
): NormalizedEventSeverity | undefined {
  switch (eventType) {
    case AUTHENTICATION_EVENT_TYPES.loginSuccess:
      return NORMALIZED_EVENT_SEVERITIES.low;
    case AUTHENTICATION_EVENT_TYPES.loginFailed:
      return NORMALIZED_EVENT_SEVERITIES.medium;
    case AUTHENTICATION_EVENT_TYPES.passwordResetAttempt:
      return NORMALIZED_EVENT_SEVERITIES.medium;
    case AUTHENTICATION_EVENT_TYPES.accountLockout:
      return NORMALIZED_EVENT_SEVERITIES.high;
    default:
      return undefined;
  }
}

function inferFirewallSeverity(
  eventType: string,
): NormalizedEventSeverity | undefined {
  switch (eventType) {
    case FIREWALL_EVENT_TYPES.connectionAllowed:
      return NORMALIZED_EVENT_SEVERITIES.low;
    case FIREWALL_EVENT_TYPES.connectionBlocked:
      return NORMALIZED_EVENT_SEVERITIES.medium;
    case FIREWALL_EVENT_TYPES.connectionDenied:
      return NORMALIZED_EVENT_SEVERITIES.medium;
    case FIREWALL_EVENT_TYPES.suspiciousPortScan:
      return NORMALIZED_EVENT_SEVERITIES.high;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Default Message Builders
// ---------------------------------------------------------------------------

function buildAuthenticationMessage(
  eventType: string,
  actor?: string,
): string {
  const actorLabel = actor ?? "Unknown user";

  switch (eventType) {
    case AUTHENTICATION_EVENT_TYPES.loginSuccess:
      return `${actorLabel} logged in successfully.`;
    case AUTHENTICATION_EVENT_TYPES.loginFailed:
      return `Failed login attempt for ${actorLabel}.`;
    case AUTHENTICATION_EVENT_TYPES.passwordResetAttempt:
      return `Password reset attempted for ${actorLabel}.`;
    case AUTHENTICATION_EVENT_TYPES.accountLockout:
      return `Account locked out for ${actorLabel}.`;
    default:
      return `Authentication event: ${eventType}.`;
  }
}

function buildFirewallMessage(
  eventType: string,
  srcIp?: string,
  destIp?: string,
  destPort?: number,
): string {
  const srcLabel = srcIp ?? "unknown source";
  const destLabel = destIp
    ? destPort != null
      ? `${destIp}:${destPort}`
      : destIp
    : "unknown destination";

  switch (eventType) {
    case FIREWALL_EVENT_TYPES.connectionAllowed:
      return `Connection allowed from ${srcLabel} to ${destLabel}.`;
    case FIREWALL_EVENT_TYPES.connectionBlocked:
      return `Connection blocked from ${srcLabel} to ${destLabel}.`;
    case FIREWALL_EVENT_TYPES.connectionDenied:
      return `Connection denied from ${srcLabel} to ${destLabel}.`;
    case FIREWALL_EVENT_TYPES.suspiciousPortScan:
      return `Suspicious port scan detected from ${srcLabel}.`;
    default:
      return `Firewall event: ${eventType}.`;
  }
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

function isKnownAuthenticationEventType(value: string): boolean {
  return Object.values(AUTHENTICATION_EVENT_TYPES).includes(
    value as (typeof AUTHENTICATION_EVENT_TYPES)[keyof typeof AUTHENTICATION_EVENT_TYPES],
  );
}

function isKnownFirewallEventType(value: string): boolean {
  return Object.values(FIREWALL_EVENT_TYPES).includes(
    value as (typeof FIREWALL_EVENT_TYPES)[keyof typeof FIREWALL_EVENT_TYPES],
  );
}

// ---------------------------------------------------------------------------
// Field Extraction Helpers
// ---------------------------------------------------------------------------

function extractString(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = obj[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

function extractTimestamp(obj: Record<string, unknown>): number | undefined {
  const value = obj["timestamp"] ?? obj["eventTimestamp"];

  if (typeof value === "number" && !Number.isNaN(value) && value > 0) {
    return value;
  }

  return undefined;
}

function extractPort(
  obj: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = obj[key];

  if (
    typeof value === "number" &&
    !Number.isNaN(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 65535
  ) {
    return value;
  }

  return undefined;
}

/**
 * Sanitize a value for safe inclusion in error messages.
 * Prevents injection of stack traces or overly long strings.
 */
function sanitizeForMessage(value: string): string {
  const cleaned = value.replace(/[\n\r]/g, " ").trim();
  return cleaned.length > 80 ? cleaned.slice(0, 77) + "..." : cleaned;
}
