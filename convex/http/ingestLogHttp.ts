import { internal } from "@convex/_generated/api";
import { httpAction } from "@convex/_generated/server";
import {
  MAX_PAYLOAD_SIZE_BYTES,
  isLogSourceType,
  validatePayloadString,
} from "@convex/logs/helpers";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
const MAX_HTTP_BODY_SIZE_BYTES = MAX_PAYLOAD_SIZE_BYTES + 16_384;

type IngestHttpRequestBody = {
  clientId?: string;
  eventTimestamp?: number;
  payload?: string;
  sourceName?: string;
  sourceType?: string;
};

type SafeIngestHttpStatus =
  | "ingested"
  | "duplicate"
  | "invalid_input"
  | "invalid_signature"
  | "request_expired"
  | "payload_too_large"
  | "normalization_failed"
  | "failed";

export const ingestLogHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return jsonResponse(400, { status: "invalid_input" });
  }

  const signature = getHeader(request, "x-ingest-signature");
  const timestampHeader = getHeader(request, "x-ingest-timestamp");
  const headerClientId = getHeader(request, "x-ingest-client");

  if (!timestampHeader) {
    return jsonResponse(400, { status: "invalid_input" });
  }

  if (!signature) {
    return jsonResponse(403, { status: "invalid_signature" });
  }

  const contentLengthHeader = getHeader(request, "content-length");

  if (isRequestBodyTooLarge(contentLengthHeader)) {
    return jsonResponse(400, { status: "payload_too_large" });
  }

  const timestamp = parseTimestamp(timestampHeader);

  if (timestamp === null) {
    return jsonResponse(400, { status: "invalid_input" });
  }

  if (isRequestExpired(timestamp)) {
    return jsonResponse(400, { status: "request_expired" });
  }

  const secret = getRequiredEnv("INGEST_SHARED_SECRET");

  if (!secret) {
    return jsonResponse(500, { status: "failed" });
  }

  let rawBody = "";

  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse(400, { status: "invalid_input" });
  }

  if (getByteLength(rawBody) === 0) {
    return jsonResponse(400, { status: "invalid_input" });
  }

  if (getByteLength(rawBody) > MAX_HTTP_BODY_SIZE_BYTES) {
    return jsonResponse(400, { status: "payload_too_large" });
  }

  if (
    !(await verifyIngestSignature(signature, timestampHeader, rawBody, secret))
  ) {
    return jsonResponse(403, { status: "invalid_signature" });
  }

  let parsedBody: IngestHttpRequestBody;

  try {
    parsedBody = JSON.parse(rawBody) as IngestHttpRequestBody;
  } catch {
    return jsonResponse(400, { status: "invalid_input" });
  }

  const requestBody = validateRequestBody(parsedBody, headerClientId);

  if (requestBody.status !== "success") {
    return jsonResponse(requestBody.httpStatus, {
      status: requestBody.status,
    });
  }

  try {
    const result = await ctx.runMutation(
      internal.logs.ingestLog.ingestSingleLogInternal,
      {
        clientId: requestBody.clientId,
        eventTimestamp: requestBody.eventTimestamp,
        isSimulated: false,
        payload: requestBody.payload,
        sourceName: requestBody.sourceName,
        sourceType: requestBody.sourceType,
      },
    );

    switch (result.status) {
      case "ingested":
        return jsonResponse(200, {
          normalizedEventId: result.normalizedEventId,
          rawLogId: result.rawLogId,
          status: "ingested",
        });
      case "duplicate":
        return jsonResponse(200, {
          rawLogId: result.rawLogId,
          status: "duplicate",
        });
      case "normalization_failed":
        return jsonResponse(200, {
          rawLogId: result.rawLogId,
          status: "normalization_failed",
        });
      case "invalid_input":
        return jsonResponse(400, { status: "invalid_input" });
      case "payload_too_large":
        return jsonResponse(400, { status: "payload_too_large" });
      case "failed":
      default:
        return jsonResponse(500, { status: "failed" });
    }
  } catch {
    return jsonResponse(500, { status: "failed" });
  }
});

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    status: statusCode,
  });
}

function getHeader(request: Request, name: string) {
  const value = request.headers.get(name);
  return value?.trim() || undefined;
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function isRequestBodyTooLarge(contentLengthHeader?: string) {
  if (!contentLengthHeader) {
    return false;
  }

  const contentLength = Number(contentLengthHeader);

  return (
    Number.isFinite(contentLength) && contentLength > MAX_HTTP_BODY_SIZE_BYTES
  );
}

function parseTimestamp(value: string) {
  if (!/^\d{13}$/.test(value)) {
    return null;
  }

  const timestamp = Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return null;
  }

  return timestamp;
}

function isRequestExpired(timestamp: number) {
  return Math.abs(Date.now() - timestamp) > FIVE_MINUTES_IN_MS;
}

function getByteLength(value: string) {
  return Buffer.byteLength(value, "utf8");
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

async function verifyIngestSignature(
  signature: string,
  timestamp: string,
  rawBody: string,
  secret: string,
) {
  const normalizedProvidedSignature = normalizeSignature(signature);

  if (!normalizedProvidedSignature) {
    return false;
  }

  const expectedSignature = await hmacSha256Hex(
    secret,
    `${timestamp}.${rawBody}`,
  );

  return constantTimeEqualHex(expectedSignature, normalizedProvidedSignature);
}

async function hmacSha256Hex(
  secret: string,
  message: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeSignature(signature: string): string | null {
  const trimmedSignature = signature.trim().toLowerCase();
  const normalizedSignature = trimmedSignature.startsWith("sha256=")
    ? trimmedSignature.slice("sha256=".length)
    : trimmedSignature;

  return /^[a-f0-9]{64}$/.test(normalizedSignature)
    ? normalizedSignature
    : null;
}

function validateRequestBody(
  input: IngestHttpRequestBody,
  headerClientId?: string,
):
  | {
      status: "success";
      clientId?: string;
      eventTimestamp: number;
      payload: string;
      sourceName: string;
      sourceType: "authentication" | "firewall";
      httpStatus: 200;
    }
  | {
      status: Exclude<
        SafeIngestHttpStatus,
        "ingested" | "duplicate" | "normalization_failed" | "failed"
      >;
      httpStatus: 400 | 403;
    } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { httpStatus: 400, status: "invalid_input" };
  }

  if (
    typeof input.sourceType !== "string" ||
    !isLogSourceType(input.sourceType)
  ) {
    return { httpStatus: 400, status: "invalid_input" };
  }

  if (
    typeof input.sourceName !== "string" ||
    input.sourceName.trim().length === 0
  ) {
    return { httpStatus: 400, status: "invalid_input" };
  }

  if (
    typeof input.eventTimestamp !== "number" ||
    !Number.isFinite(input.eventTimestamp) ||
    input.eventTimestamp <= 0
  ) {
    return { httpStatus: 400, status: "invalid_input" };
  }

  if (typeof input.payload !== "string") {
    return { httpStatus: 400, status: "invalid_input" };
  }

  const payloadValidation = validatePayloadString(input.payload);

  if (!payloadValidation.isValid) {
    return {
      httpStatus: 400,
      status: payloadValidation.issue?.includes("exceeds maximum size")
        ? "payload_too_large"
        : "invalid_input",
    };
  }

  const bodyClientId = normalizeOptionalString(input.clientId);
  const normalizedHeaderClientId = normalizeOptionalString(headerClientId);

  if (
    bodyClientId &&
    normalizedHeaderClientId &&
    bodyClientId !== normalizedHeaderClientId
  ) {
    return { httpStatus: 400, status: "invalid_input" };
  }

  const resolvedClientId = bodyClientId ?? normalizedHeaderClientId;

  return {
    clientId: resolvedClientId,
    eventTimestamp: input.eventTimestamp,
    httpStatus: 200,
    payload: input.payload,
    sourceName: input.sourceName.trim(),
    sourceType: input.sourceType,
    status: "success",
  };
}

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
