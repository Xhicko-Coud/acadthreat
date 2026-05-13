import {
  FEED_PROVIDERS,
  FEED_PROVIDER_LABELS,
  FEED_SYNC_STATUSES,
  buildEmptyFeedSyncCounts,
  normalizeProviderTags,
  sanitizeProviderText,
  sanitizeProviderUrl,
  type FeedSyncCounts,
} from "@convex/threatFeeds/helpers";
import {
  THREAT_INDICATOR_SEVERITIES,
  THREAT_INDICATOR_TYPES,
  normalizeThreatIndicatorValue,
  type ThreatIndicatorSeverity,
  type ThreatIndicatorType,
} from "@convex/threatIndicators/helpers";

export const URLHAUS_PROVIDER = FEED_PROVIDERS.urlhaus;
export const URLHAUS_PROVIDER_LABEL = FEED_PROVIDER_LABELS[URLHAUS_PROVIDER];
export const URLHAUS_BASE_URL = "https://urlhaus-api.abuse.ch";
export const URLHAUS_RECENT_URLS_ENDPOINT = `${URLHAUS_BASE_URL}/v1/urls/recent/`;
export const URLHAUS_AUTH_ENV = "URLHAUS_AUTH_KEY";

const URLHAUS_DEFAULT_LIMIT = 50;
const URLHAUS_MIN_LIMIT = 1;
const URLHAUS_MAX_LIMIT = 1000;

export type URLHausRecentUrlsResponse = {
  query_status: string;
  urls?: URLHausRecentUrlRecord[];
};

export type URLHausRecentUrlRecord = {
  blacklists?: unknown;
  date_added?: string;
  host?: string;
  id?: string | number;
  larted?: string | boolean;
  reporter?: string;
  tags?: string[];
  threat?: string;
  url?: string;
  url_status?: string;
  urlhaus_reference?: string;
};

export type NormalizedFeedIndicator = {
  confidence: number;
  description?: string;
  firstSeenAt?: number;
  lastSeenAt?: number;
  normalizedValue: string;
  provider: typeof URLHAUS_PROVIDER;
  providerIndicatorId?: string;
  severity: ThreatIndicatorSeverity;
  source: typeof URLHAUS_PROVIDER_LABEL;
  sourceUrl?: string;
  tags: string[];
  type: ThreatIndicatorType;
  value: string;
};

type NormalizeUrlhausRecordResult =
  | {
      indicator: NormalizedFeedIndicator;
      status: "normalized";
    }
  | {
      reason: string;
      status: "skipped";
    };

type FetchUrlhausRecentUrlsResult =
  | {
      counts: FeedSyncCounts;
      indicators: NormalizedFeedIndicator[];
      provider: typeof URLHAUS_PROVIDER;
      status: typeof FEED_SYNC_STATUSES.completed;
    }
  | {
      counts: FeedSyncCounts;
      indicators: [];
      provider: typeof URLHAUS_PROVIDER;
      reason: string;
      status:
        | typeof FEED_SYNC_STATUSES.providerFailed
        | typeof FEED_SYNC_STATUSES.providerSkipped;
    };

export function buildUrlhausRecentUrlsEndpoint(limit = URLHAUS_DEFAULT_LIMIT) {
  const safeLimit = normalizeUrlhausLimit(limit);

  return `${URLHAUS_RECENT_URLS_ENDPOINT}limit/${safeLimit}/`;
}

export function buildUrlhausRecentUrlsRequest(
  authKey: string,
  limit = URLHAUS_DEFAULT_LIMIT,
) {
  const normalizedAuthKey = authKey.trim();

  if (!normalizedAuthKey) {
    return null;
  }

  return {
    headers: {
      "Auth-Key": normalizedAuthKey,
    },
    method: "GET" as const,
    url: buildUrlhausRecentUrlsEndpoint(limit),
  };
}

export function isUrlhausRecentUrlsResponse(
  value: unknown,
): value is URLHausRecentUrlsResponse {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.query_status !== "string") {
    return false;
  }

  return value.urls === undefined || Array.isArray(value.urls);
}

export function normalizeUrlhausRecentUrlRecord(
  record: URLHausRecentUrlRecord,
  now: number,
): NormalizeUrlhausRecordResult {
  const value = sanitizeProviderUrl(record.url);

  if (!value) {
    return { reason: "invalid_url", status: "skipped" };
  }

  const observedAt = parseUrlhausDate(record.date_added);
  const providerIndicatorId = normalizeProviderIndicatorId(record.id);

  return {
    indicator: {
      confidence: getUrlhausConfidence(record),
      description: buildUrlhausDescription(record),
      ...(observedAt ? { firstSeenAt: observedAt, lastSeenAt: observedAt } : {}),
      normalizedValue: normalizeThreatIndicatorValue(
        THREAT_INDICATOR_TYPES.url,
        value,
      ),
      provider: URLHAUS_PROVIDER,
      ...(providerIndicatorId ? { providerIndicatorId } : {}),
      severity: getUrlhausSeverity(record),
      source: URLHAUS_PROVIDER_LABEL,
      sourceUrl: sanitizeProviderUrl(record.urlhaus_reference),
      tags: normalizeProviderTags(record.tags),
      type: THREAT_INDICATOR_TYPES.url,
      value,
    },
    status: "normalized",
  };
}

export async function fetchUrlhausRecentUrls({
  authKey,
  limit = URLHAUS_DEFAULT_LIMIT,
  now = Date.now(),
}: {
  authKey?: string;
  limit?: number;
  now?: number;
}): Promise<FetchUrlhausRecentUrlsResult> {
  const request = buildUrlhausRecentUrlsRequest(authKey ?? "", limit);

  if (!request) {
    return buildUrlhausSkippedResult("missing_auth_key");
  }

  try {
    const response = await fetch(request.url, {
      headers: request.headers,
      method: request.method,
    });

    if (!response.ok) {
      return buildUrlhausFailedResult("provider_http_error");
    }

    const body: unknown = await response.json();

    if (!isUrlhausRecentUrlsResponse(body)) {
      return buildUrlhausFailedResult("invalid_provider_response");
    }

    return normalizeUrlhausResponse(body, now);
  } catch {
    return buildUrlhausFailedResult("provider_request_failed");
  }
}

function normalizeUrlhausResponse(
  response: URLHausRecentUrlsResponse,
  now: number,
): FetchUrlhausRecentUrlsResult {
  if (response.query_status === "no_results") {
    return {
      counts: buildEmptyFeedSyncCounts(),
      indicators: [],
      provider: URLHAUS_PROVIDER,
      status: FEED_SYNC_STATUSES.completed,
    };
  }

  if (response.query_status === "http_get_expected") {
    return buildUrlhausFailedResult("provider_expected_get");
  }

  if (response.query_status !== "ok") {
    return buildUrlhausFailedResult("provider_status_failed");
  }

  return normalizeUrlhausRecords(response.urls ?? [], now);
}

function normalizeUrlhausRecords(
  records: URLHausRecentUrlRecord[],
  now: number,
): FetchUrlhausRecentUrlsResult {
  const counts = buildEmptyFeedSyncCounts();
  const indicators: NormalizedFeedIndicator[] = [];

  counts.fetched = records.length;

  for (const record of records) {
    const result = normalizeUrlhausRecentUrlRecord(record, now);

    if (result.status === "normalized") {
      counts.normalized += 1;
      indicators.push(result.indicator);
    } else {
      counts.skipped += 1;
    }
  }

  return {
    counts,
    indicators,
    provider: URLHAUS_PROVIDER,
    status: FEED_SYNC_STATUSES.completed,
  };
}

function buildUrlhausSkippedResult(
  reason: string,
): FetchUrlhausRecentUrlsResult {
  return {
    counts: buildEmptyFeedSyncCounts(),
    indicators: [],
    provider: URLHAUS_PROVIDER,
    reason,
    status: FEED_SYNC_STATUSES.providerSkipped,
  };
}

function buildUrlhausFailedResult(
  reason: string,
): FetchUrlhausRecentUrlsResult {
  return {
    counts: buildEmptyFeedSyncCounts(),
    indicators: [],
    provider: URLHAUS_PROVIDER,
    reason,
    status: FEED_SYNC_STATUSES.providerFailed,
  };
}

function normalizeUrlhausLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return URLHAUS_DEFAULT_LIMIT;
  }

  return Math.min(
    URLHAUS_MAX_LIMIT,
    Math.max(URLHAUS_MIN_LIMIT, Math.trunc(limit)),
  );
}

function getUrlhausConfidence(record: URLHausRecentUrlRecord) {
  const urlStatus = record.url_status?.trim().toLowerCase();

  if (urlStatus === "online") {
    return 85;
  }

  if (urlStatus === "offline") {
    return 75;
  }

  return 80;
}

function getUrlhausSeverity(
  record: URLHausRecentUrlRecord,
): ThreatIndicatorSeverity {
  const urlStatus = record.url_status?.trim().toLowerCase();

  if (urlStatus === "offline") {
    return THREAT_INDICATOR_SEVERITIES.medium;
  }

  return THREAT_INDICATOR_SEVERITIES.high;
}

function buildUrlhausDescription(record: URLHausRecentUrlRecord) {
  const parts = [
    sanitizeProviderText(record.threat),
    sanitizeProviderText(record.url_status),
    sanitizeProviderText(record.host),
  ].filter(Boolean);

  if (parts.length === 0) {
    return "URLHaus recent malicious URL indicator.";
  }

  return sanitizeProviderText(`URLHaus recent URL: ${parts.join(" | ")}`);
}

function parseUrlhausDate(value: string | undefined) {
  const sanitizedValue = sanitizeProviderText(value);

  if (!sanitizedValue) {
    return undefined;
  }

  const timestamp = Date.parse(sanitizedValue.replace(" ", "T"));

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return timestamp;
}

function normalizeProviderIndicatorId(value: string | number | undefined) {
  return sanitizeProviderScalar(value);
}

function sanitizeProviderScalar(value: string | number | null | undefined) {
  return sanitizeProviderText(
    value === undefined || value === null ? undefined : String(value),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
