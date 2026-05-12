import { v } from "convex/values";

import { internalMutation } from "@convex/_generated/server";
import {
  INGESTION_STATUSES,
  PARSE_STATUSES,
  buildIdempotencyKey,
  buildSafeErrorMessage,
  computeSha256Hex,
  logSourceTypeValidator,
  validateLogPayloadMetadata,
  validatePayloadString,
} from "@convex/logs/helpers";
import { normalizeLogPayload } from "@convex/logs/normalizers";

// ---------------------------------------------------------------------------
// Result Types
// ---------------------------------------------------------------------------

type IngestSingleLogResult =
  | {
      normalizedEventId: string;
      rawLogId: string;
      status: "ingested";
    }
  | {
      rawLogId: string;
      status: "duplicate";
    }
  | {
      rawLogId: string;
      status: "normalization_failed";
    }
  | {
      issues?: string[];
      status: "invalid_input";
    }
  | {
      status: "payload_too_large";
    }
  | {
      status: "failed";
    };

// ---------------------------------------------------------------------------
// Internal Mutation: Ingest Single Log
// ---------------------------------------------------------------------------

/**
 * Ingest a single raw log, store it, normalize it, and insert the
 * normalized event. Returns a safe status result.
 *
 * This is an internal mutation intended to be called by:
 * - Convex actions (HTTP ingestion with HMAC, seed/demo tools)
 * - Other internal mutations (simulation runners)
 *
 * Not callable from the client directly.
 */
export const ingestSingleLogInternal = internalMutation({
  args: {
    sourceType: logSourceTypeValidator,
    sourceName: v.optional(v.string()),
    eventTimestamp: v.optional(v.number()),
    payload: v.string(),
    clientId: v.optional(v.string()),
    isSimulated: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<IngestSingleLogResult> => {
    try {
      // -----------------------------------------------------------------
      // 1. Validate metadata
      // -----------------------------------------------------------------
      const metadataValidation = validateLogPayloadMetadata({
        sourceType: args.sourceType,
        sourceName: args.sourceName,
        eventTimestamp: args.eventTimestamp,
        clientId: args.clientId,
        isSimulated: args.isSimulated,
      });

      if (!metadataValidation.isValid) {
        return {
          issues: metadataValidation.issues,
          status: "invalid_input",
        };
      }

      // -----------------------------------------------------------------
      // 2. Validate payload string
      // -----------------------------------------------------------------
      const payloadValidation = validatePayloadString(args.payload);

      if (!payloadValidation.isValid) {
        if (
          payloadValidation.issue &&
          payloadValidation.issue.includes("exceeds maximum size")
        ) {
          return { status: "payload_too_large" };
        }

        return {
          issues: payloadValidation.issue ? [payloadValidation.issue] : [],
          status: "invalid_input",
        };
      }

      // -----------------------------------------------------------------
      // 3. Compute payload hash and idempotency key
      // -----------------------------------------------------------------
      const payloadHash = await computeSha256Hex(args.payload);

      const idempotencyKey = await buildIdempotencyKey({
        sourceType: metadataValidation.data.sourceType,
        eventTimestamp: metadataValidation.data.eventTimestamp,
        payloadHash,
      });

      // -----------------------------------------------------------------
      // 4. Check for duplicate via idempotency key
      // -----------------------------------------------------------------
      const existingRawLog = await ctx.db
        .query("rawLogs")
        .withIndex("by_idempotencyKey", (lookup) =>
          lookup.eq("idempotencyKey", idempotencyKey),
        )
        .unique();

      if (existingRawLog) {
        return {
          rawLogId: existingRawLog._id,
          status: "duplicate",
        };
      }

      // -----------------------------------------------------------------
      // 5. Insert raw log
      // -----------------------------------------------------------------
      const now = Date.now();
      const isSimulated = metadataValidation.data.isSimulated;

      const rawLogId = await ctx.db.insert("rawLogs", {
        sourceType: metadataValidation.data.sourceType,
        ...(metadataValidation.data.sourceName
          ? { sourceName: metadataValidation.data.sourceName }
          : {}),
        receivedAt: now,
        ...(metadataValidation.data.eventTimestamp != null
          ? { eventTimestamp: metadataValidation.data.eventTimestamp }
          : {}),
        payload: args.payload,
        payloadHash,
        idempotencyKey,
        ingestionStatus: INGESTION_STATUSES.received,
        parseStatus: PARSE_STATUSES.pending,
        ...(metadataValidation.data.clientId
          ? { clientId: metadataValidation.data.clientId }
          : {}),
        isSimulated,
        createdAt: now,
      });

      // -----------------------------------------------------------------
      // 6. Normalize the raw payload
      // -----------------------------------------------------------------
      const normalizationResult = normalizeLogPayload(
        metadataValidation.data.sourceType,
        args.payload,
        now,
      );

      // -----------------------------------------------------------------
      // 7. Handle normalization failure
      // -----------------------------------------------------------------
      if (normalizationResult.status === "parse_error") {
        await ctx.db.patch(rawLogId, {
          ingestionStatus: INGESTION_STATUSES.normalizationFailed,
          parseStatus: PARSE_STATUSES.parseError,
          errorMessage: normalizationResult.reason,
        });

        return {
          rawLogId,
          status: "normalization_failed",
        };
      }

      // -----------------------------------------------------------------
      // 8. Insert normalized event
      // -----------------------------------------------------------------
      const normalizedFields = normalizationResult.data;

      const normalizedEventId = await ctx.db.insert("normalizedEvents", {
        rawLogId,
        sourceType: metadataValidation.data.sourceType,
        eventType: normalizedFields.eventType,
        eventTimestamp: normalizedFields.eventTimestamp,
        ...(normalizedFields.actor ? { actor: normalizedFields.actor } : {}),
        ...(normalizedFields.srcIp ? { srcIp: normalizedFields.srcIp } : {}),
        ...(normalizedFields.destIp
          ? { destIp: normalizedFields.destIp }
          : {}),
        ...(normalizedFields.srcPort != null
          ? { srcPort: normalizedFields.srcPort }
          : {}),
        ...(normalizedFields.destPort != null
          ? { destPort: normalizedFields.destPort }
          : {}),
        ...(normalizedFields.protocol
          ? { protocol: normalizedFields.protocol }
          : {}),
        ...(normalizedFields.action
          ? { action: normalizedFields.action }
          : {}),
        ...(normalizedFields.outcome
          ? { outcome: normalizedFields.outcome }
          : {}),
        ...(normalizedFields.severity
          ? { severity: normalizedFields.severity }
          : {}),
        ...(normalizedFields.userAgent
          ? { userAgent: normalizedFields.userAgent }
          : {}),
        ...(normalizedFields.requestPath
          ? { requestPath: normalizedFields.requestPath }
          : {}),
        ...(normalizedFields.message
          ? { message: normalizedFields.message }
          : {}),
        isSimulated,
        createdAt: now,
      });

      // -----------------------------------------------------------------
      // 9. Update raw log status to normalized
      // -----------------------------------------------------------------
      await ctx.db.patch(rawLogId, {
        ingestionStatus: INGESTION_STATUSES.normalized,
        parseStatus: PARSE_STATUSES.parsed,
      });

      return {
        normalizedEventId,
        rawLogId,
        status: "ingested",
      };
    } catch (error) {
      // -----------------------------------------------------------------
      // 10. Catch-all: safe failure status
      // -----------------------------------------------------------------
      // Log processing failed unexpectedly. Do not expose internals.
      // The raw log may or may not have been inserted depending on
      // where the failure occurred. This is acceptable for V1.
      console.error(
        "Log ingestion failed:",
        buildSafeErrorMessage(error),
      );

      return { status: "failed" };
    }
  },
});
