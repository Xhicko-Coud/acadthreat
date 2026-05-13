import {
  THREAT_INDICATOR_SEVERITIES,
  THREAT_INDICATOR_TYPES,
  type ThreatIndicatorSeverity,
  type ThreatIndicatorType,
} from "@convex/threatIndicators/helpers";

export const FEED_PROVIDERS = {
  abuseIpdb: "abuseipdb",
  misp: "misp",
  otx: "otx",
  phishtank: "phishtank",
  urlhaus: "urlhaus",
} as const;

export const FEED_PROVIDER_LABELS = {
  [FEED_PROVIDERS.abuseIpdb]: "AbuseIPDB",
  [FEED_PROVIDERS.misp]: "MISP",
  [FEED_PROVIDERS.otx]: "AlienVault OTX",
  [FEED_PROVIDERS.phishtank]: "PhishTank",
  [FEED_PROVIDERS.urlhaus]: "URLHaus",
} as const;

export const FEED_INDICATOR_TYPES = THREAT_INDICATOR_TYPES;

export const FEED_SYNC_STATUSES = {
  completed: "completed",
  failed: "failed",
  invalidInput: "invalid_input",
  providerFailed: "provider_failed",
  providerSkipped: "provider_skipped",
  unauthorized: "unauthorized",
} as const;

export type FeedProvider =
  (typeof FEED_PROVIDERS)[keyof typeof FEED_PROVIDERS];
export type FeedIndicatorType = ThreatIndicatorType;
export type FeedSyncStatus =
  (typeof FEED_SYNC_STATUSES)[keyof typeof FEED_SYNC_STATUSES];

export type FeedSyncCounts = {
  failed: number;
  fetched: number;
  inserted: number;
  normalized: number;
  skipped: number;
  updated: number;
};

const FEED_PROVIDER_ALIASES: Record<string, FeedProvider> = {
  "abuse-ipdb": FEED_PROVIDERS.abuseIpdb,
  abuseipdb: FEED_PROVIDERS.abuseIpdb,
  alienvault: FEED_PROVIDERS.otx,
  misp: FEED_PROVIDERS.misp,
  otx: FEED_PROVIDERS.otx,
  phishtank: FEED_PROVIDERS.phishtank,
  urlhaus: FEED_PROVIDERS.urlhaus,
};

const MAX_PROVIDER_TEXT_LENGTH = 1000;
const MAX_PROVIDER_URL_LENGTH = 500;
const MAX_TAG_COUNT = 10;
const MAX_TAG_LENGTH = 40;

export function isSupportedFeedProvider(
  provider: string,
): provider is FeedProvider {
  return normalizeFeedProvider(provider) !== undefined;
}

export function getFeedProviderLabel(provider: FeedProvider) {
  return FEED_PROVIDER_LABELS[provider];
}

export function normalizeFeedProvider(
  provider: string | null | undefined,
): FeedProvider | undefined {
  const normalizedProvider = provider?.trim().toLowerCase() ?? "";

  if (!normalizedProvider) {
    return undefined;
  }

  return FEED_PROVIDER_ALIASES[normalizedProvider];
}

export function isSupportedFeedIndicatorType(
  type: string,
): type is FeedIndicatorType {
  return Object.values(FEED_INDICATOR_TYPES).includes(
    type as FeedIndicatorType,
  );
}

export function clampFeedConfidence(confidence: number) {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(100, Math.max(0, confidence));
}

export function mapFeedSeverity(input: {
  confidence?: number | null;
  severity?: string | null;
}): ThreatIndicatorSeverity {
  const explicitSeverity = input.severity?.trim().toLowerCase();

  if (isSupportedFeedSeverity(explicitSeverity)) {
    return explicitSeverity;
  }

  const confidence = clampFeedConfidence(input.confidence ?? 0);

  if (confidence >= 95) {
    return THREAT_INDICATOR_SEVERITIES.critical;
  }

  if (confidence >= 80) {
    return THREAT_INDICATOR_SEVERITIES.high;
  }

  if (confidence >= 50) {
    return THREAT_INDICATOR_SEVERITIES.medium;
  }

  return THREAT_INDICATOR_SEVERITIES.low;
}

export function buildFeedSourceLabel(provider: FeedProvider) {
  return getFeedProviderLabel(provider);
}

export function sanitizeProviderText(value: string | null | undefined) {
  return sanitizeBoundedText(value, MAX_PROVIDER_TEXT_LENGTH);
}

export function sanitizeProviderUrl(value: string | null | undefined) {
  const sanitizedValue = sanitizeBoundedText(value, MAX_PROVIDER_URL_LENGTH);

  if (!sanitizedValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(sanitizedValue);

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return undefined;
    }

    return sanitizedValue;
  } catch {
    return undefined;
  }
}

export function normalizeProviderTags(tags: string[] | null | undefined) {
  const normalizedTags = new Set<string>();

  for (const tag of tags ?? []) {
    const normalizedTag = sanitizeBoundedText(tag, MAX_TAG_LENGTH)?.toLowerCase();

    if (normalizedTag) {
      normalizedTags.add(normalizedTag);
    }

    if (normalizedTags.size >= MAX_TAG_COUNT) {
      break;
    }
  }

  return Array.from(normalizedTags);
}

export function buildEmptyFeedSyncCounts(): FeedSyncCounts {
  return {
    failed: 0,
    fetched: 0,
    inserted: 0,
    normalized: 0,
    skipped: 0,
    updated: 0,
  };
}

function sanitizeBoundedText(
  value: string | null | undefined,
  maxLength: number,
) {
  const normalizedValue = value?.replace(/[\r\n\t]+/g, " ").trim() ?? "";
  const compactValue = normalizedValue.replace(/\s{2,}/g, " ");

  if (!compactValue) {
    return undefined;
  }

  return compactValue.slice(0, maxLength);
}

function isSupportedFeedSeverity(
  severity: string | undefined,
): severity is ThreatIndicatorSeverity {
  return Object.values(THREAT_INDICATOR_SEVERITIES).includes(
    severity as ThreatIndicatorSeverity,
  );
}
