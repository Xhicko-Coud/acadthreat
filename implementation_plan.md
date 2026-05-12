# Module 04: Log Ingestion and Normalization — Chunk 4A Architecture Plan

## 1. Selected Mode

**Strict Mode** — This module introduces new Convex schema tables, security-sensitive log ingestion, HMAC-protected API design, backend authorization for log access, and a new protected admin route.

---

## 2. Files Inspected

| Area | Files |
|---|---|
| Root | `AGENTS.md`, `package.json` |
| Convex schema | [schema.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/schema.ts) |
| Auth/authorization | [authorization.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/auth/authorization.ts) |
| Threat indicators backend | [helpers.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/threatIndicators/helpers.ts), [queries/threatIndicators.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/queries/threatIndicators.ts), [mutations/threatIndicators.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/mutations/threatIndicators.ts) |
| User management backend | [queries/userManagementApi.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/queries/userManagementApi.ts), [mutations/userManagement.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/mutations/userManagement.ts) |
| Navigation | [navigation.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/src/config/navigation.ts) |
| Indicators UI | `page.tsx`, `IndicatorsContainer.tsx`, `IndicatorsLogic.ts`, `IndicatorsView.tsx`, `IndicatorsTable.tsx`, `IndicatorsDetails.tsx`, `IndicatorsSkeleton.tsx` |
| Users UI | `page.tsx`, `UsersContainer.tsx`, `UsersLogic.ts`, `UsersView.tsx`, `UsersTable.tsx`, `UsersDialogs.tsx`, `UsersForm.tsx`, `UsersSkeleton.tsx` |
| Shared components | `AdminActionSheet.tsx`, `DataTable.tsx`, `DataTableRowActions.tsx`, `ConfirmationDialog.tsx`, `EmptyState.tsx`, `AppAlert.tsx`, `PageHeader.tsx` |
| Layout | `AppHeader.tsx`, `AppShell.tsx`, `AppSidebar.tsx` |
| HTTP router | [http.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/convex/http.ts) |

---

## 3. Recommended Module 04 V1 Scope

### In scope

| Concern | Detail |
|---|---|
| Raw log storage | `rawLogs` table with payload, hash, idempotency, status tracking |
| Normalized event storage | `normalizedEvents` table with structured security event fields |
| Backend ingestion planning | Convex HTTP action / internal mutation for trusted ingestion |
| HMAC / trusted ingestion design | Shared secret, signature header, timestamp/replay protection |
| Idempotency / deduplication | `payloadHash` and `idempotencyKey` to prevent duplicate raw logs |
| Normalization helpers | Parse raw log payload → structured normalized event |
| Simulated log seeding | Admin-triggered demo log injection for authentication & firewall scenarios |
| Protected admin logs UI | Read-only listing of normalized events, optional raw log detail |
| Backend authorization | Role-gated queries matching existing `requireRole` / `requireActiveProfile` pattern |

### Deferred (not in V1)

| Item | Reason |
|---|---|
| Correlation against indicators | Module 05 |
| Threat event creation | Module 05 |
| Severity scoring | Module 05+ |
| Anomaly detection | Module 05+ |
| Trend prediction | Module 06+ |
| Dashboard charts/metrics | Module 06+ |
| Live external feed sync | Module 06+ |
| AI analysis | Module 07+ |
| Audit trail logging | Future module |

---

## 4. Recommended Log Source Types

V1 should support all five source types in schema validators, but **seed/demo data should focus on `authentication` and `firewall` first**, adding `web_server` as a lightweight third. `system` and `application` can be seeded later or in V2.

```txt
authentication   ← V1 seed priority
firewall         ← V1 seed priority
web_server       ← V1 lightweight seed
system           ← schema-supported, seed later
application      ← schema-supported, seed later
```

**Rationale**: The project documentation emphasizes authentication and firewall logs. Including all five in the schema costs nothing and avoids a migration later.

---

## 5. Recommended `rawLogs` Table

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `sourceType` | `v.union(...)` of 5 literals | Yes | `authentication`, `firewall`, `web_server`, `system`, `application` |
| `sourceName` | `v.optional(v.string())` | No | Free-text origin label, e.g. `"pfsense-fw-01"`, `"sshd"` |
| `receivedAt` | `v.number()` | Yes | Server-side `Date.now()` at ingestion time |
| `eventTimestamp` | `v.optional(v.number())` | No | Original timestamp from the log source, if provided |
| `payload` | `v.string()` | Yes | Stringified JSON of the raw log payload |
| `payloadHash` | `v.string()` | Yes | SHA-256 hex of `payload` for deduplication |
| `idempotencyKey` | `v.string()` | Yes | Stable composite key from source fields for dedup |
| `ingestionStatus` | `v.union(...)` | Yes | `received`, `normalized`, `normalization_failed` |
| `parseStatus` | `v.union(...)` | Yes | `pending`, `parsed`, `parse_error` |
| `errorMessage` | `v.optional(v.string())` | No | Safe error message if normalization/parsing failed |
| `clientId` | `v.optional(v.string())` | No | Identifier for the ingestion client/source system |
| `isSimulated` | `v.boolean()` | Yes | Whether this log came from the demo/simulation tool |
| `createdAt` | `v.number()` | Yes | Same as `receivedAt` for V1, kept for pattern consistency |

### Design decisions

> [!IMPORTANT]
> **`payload` as `v.string()` (stringified JSON), not `v.any()` or structured object.**
>
> Reasons:
> 1. Convex `v.any()` is not type-safe and cannot be indexed or validated at schema level.
> 2. Raw logs are heterogeneous — authentication logs have different fields than firewall logs.
> 3. Storing as stringified JSON preserves the original payload exactly as received.
> 4. Normalization extracts structured fields into `normalizedEvents`; the raw table is an immutable audit record.
> 5. Payload size limit (see validation rules) prevents storage abuse.

---

## 6. Recommended `normalizedEvents` Table

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `rawLogId` | `v.id("rawLogs")` | Yes | Foreign key to source raw log |
| `sourceType` | `v.union(...)` of 5 literals | Yes | Copied from raw log |
| `eventType` | `v.string()` | Yes | Normalized event category, e.g. `login_success`, `login_failed`, `connection_blocked`, `http_request` |
| `eventTimestamp` | `v.number()` | Yes | Normalized timestamp (from raw log or `receivedAt` fallback) |
| `actor` | `v.optional(v.string())` | No | Authenticated user or process name |
| `srcIp` | `v.optional(v.string())` | No | Source IP address |
| `destIp` | `v.optional(v.string())` | No | Destination IP address |
| `srcPort` | `v.optional(v.number())` | No | Source port |
| `destPort` | `v.optional(v.number())` | No | Destination port |
| `protocol` | `v.optional(v.string())` | No | Network protocol, e.g. `TCP`, `UDP`, `HTTP` |
| `action` | `v.optional(v.string())` | No | Action taken, e.g. `allow`, `block`, `deny`, `authenticate` |
| `outcome` | `v.optional(v.string())` | No | Result, e.g. `success`, `failure`, `dropped` |
| `severity` | `v.optional(v.union(...))` | No | `low`, `medium`, `high`, `critical` — assigned during normalization or left null for later scoring |
| `userAgent` | `v.optional(v.string())` | No | Browser/client user agent for web/auth logs |
| `requestPath` | `v.optional(v.string())` | No | HTTP request path for web server logs |
| `message` | `v.optional(v.string())` | No | Human-readable summary extracted from the log |
| `isSimulated` | `v.boolean()` | Yes | Inherited from raw log |
| `createdAt` | `v.number()` | Yes | Normalization timestamp |

### Design decisions

> [!NOTE]
> - `username` is merged into `actor` — a single field for the authenticated user, process, or service name. More flexible than a dedicated `username` field.
> - `normalizedSummary` from the task spec is replaced by `message` — a cleaner name that follows syslog/SIEM conventions.
> - `severity` is optional at this stage. Module 04 normalization may assign a basic severity for obviously categorized events (e.g. `login_failed` → `medium`), but full scoring is deferred to Module 05.

---

## 7. Recommended Indexes

### `rawLogs` indexes

| Index name | Fields | Purpose |
|---|---|---|
| `by_idempotencyKey` | `["idempotencyKey"]` | Duplicate detection during ingestion |
| `by_sourceType` | `["sourceType"]` | Filter by log source category |
| `by_ingestionStatus` | `["ingestionStatus"]` | Filter by processing state |
| `by_receivedAt` | `["receivedAt"]` | Chronological listing |
| `by_sourceType_and_receivedAt` | `["sourceType", "receivedAt"]` | Filtered chronological listing |

### `normalizedEvents` indexes

| Index name | Fields | Purpose |
|---|---|---|
| `by_rawLogId` | `["rawLogId"]` | Link back to raw log |
| `by_sourceType` | `["sourceType"]` | Filter by source category |
| `by_eventType` | `["eventType"]` | Filter by event category |
| `by_eventTimestamp` | `["eventTimestamp"]` | Chronological listing |
| `by_sourceType_and_eventTimestamp` | `["sourceType", "eventTimestamp"]` | Filtered chronological listing |
| `by_srcIp` | `["srcIp"]` | IP-based investigation (future correlation) |

---

## 8. Recommended Idempotency Strategy

### `payloadHash`

- SHA-256 of the entire `payload` string.
- Serves as a content-addressable fingerprint.
- Not the primary dedup key because the same payload could legitimately appear from different sources.

### `idempotencyKey`

- Composite key generated from stable fields:

```txt
idempotencyKey = SHA-256(sourceType + "|" + eventTimestamp + "|" + srcIp + "|" + actor + "|" + action + "|" + message)
```

- If `eventTimestamp` is missing, use `payloadHash` as fallback component.
- For simulation-generated logs, include a simulation run ID or unique nonce to avoid cross-run collisions.

### Deduplication flow

```txt
1. Compute idempotencyKey from incoming payload
2. Query rawLogs.by_idempotencyKey
3. If match found → return { status: "duplicate" }
4. If no match → insert raw log → proceed to normalization
```

> [!TIP]
> The `by_idempotencyKey` index on `rawLogs` makes the duplicate check a single indexed lookup — O(1) per ingestion.

---

## 9. Recommended HMAC / Trusted Ingestion Strategy

### Architecture

- **Convex HTTP action** registered on `convex/http.ts` (e.g. `POST /api/ingest/logs`).
- The HTTP action validates the request, then calls an internal mutation to store the raw log.

### Authentication flow

```txt
1. Client sends POST request with:
   - Header: X-Ingest-Signature: HMAC-SHA256(payload, shared_secret)
   - Header: X-Ingest-Timestamp: Unix epoch seconds
   - Body: JSON payload

2. Server validates:
   a. X-Ingest-Timestamp within ±5 minutes of server time (replay protection)
   b. Recompute HMAC-SHA256(body, INGEST_SHARED_SECRET)
   c. Compare computed signature with X-Ingest-Signature (timing-safe)
   d. If mismatch → 403 { status: "invalid_signature" }
   e. If expired → 403 { status: "request_expired" }

3. On success → parse body → call internal ingestion mutation
```

### Environment variable

```txt
INGEST_SHARED_SECRET=  # in .env.local only, never committed
```

> [!WARNING]
> For V1, the simulation/seed tool will bypass HMAC by calling the internal mutation directly (it runs server-side within Convex). HMAC validation applies only to the external HTTP ingestion path.

### Payload size limit

- Maximum raw payload: **64 KB** per log entry.
- Batch ingestion (if implemented): maximum **50 entries** per request.

---

## 10. Recommended Validation Rules

| Rule | Detail |
|---|---|
| `payload` required | Must be a non-empty string |
| `sourceType` required | Must be one of the 5 allowed literals |
| `sourceName` optional | Max 120 characters |
| `eventTimestamp` optional | Must be a valid epoch number if provided |
| Allowed `sourceType` only | Reject unknown source types |
| Max payload size | 64 KB per entry |
| No secrets in payload | Strip or reject payloads containing obvious password/token patterns (best-effort, not a guarantee) |
| Normalize safe fields only | Only extract known safe fields into normalized events |
| Invalid payloads | Store raw log with `parseStatus: "parse_error"`, do not delete |
| Empty payload | Reject with `invalid_input` |

---

## 11. Recommended Role Permissions

| Role | Raw logs | Normalized events | Notes |
|---|---|---|---|
| `admin` | ✅ View list + detail | ✅ View list + detail | Full access |
| `analyst` | ✅ View list + detail | ✅ View list + detail | Investigation access |
| `viewer` | ❌ No access | ✅ View list only (no raw payload) | Normalized summaries only |
| `inactive` / missing | ❌ Denied | ❌ Denied | — |

> [!IMPORTANT]
> **Raw logs are restricted to admin and analyst only.** Raw payloads may contain sensitive operational data (IPs, usernames, request paths, user agents). Viewers see only structured normalized events with safe display fields.

### Backend helpers

```ts
// Reuse existing pattern from convex/auth/authorization.ts
const LOG_READ_ROLES = ["admin", "analyst", "viewer"] as const;
const LOG_RAW_READ_ROLES = ["admin", "analyst"] as const;  // raw log access
```

---

## 12. Recommended Backend Functions

### Convex domain folder: `convex/logs/`

| File | Functions | Type | Notes |
|---|---|---|---|
| `helpers.ts` | Validators, constants, `LOG_SOURCE_TYPES`, `INGESTION_STATUSES`, `PARSE_STATUSES`, role arrays, normalization parsers | Pure helpers | No JSX, no Convex runtime |
| `normalizers.ts` | `normalizeAuthenticationLog()`, `normalizeFirewallLog()`, `normalizeWebServerLog()`, `normalizeGenericLog()` | Pure helpers | Per-source-type normalization logic |

### Convex queries: `convex/queries/logs.ts`

| Function | Purpose |
|---|---|
| `listNormalizedEvents` | Paginated/filtered list of normalized events (all read roles) |
| `getNormalizedEventDetail` | Single normalized event with safe fields (all read roles) |
| `listRawLogs` | Paginated/filtered list of raw logs (admin + analyst only) |
| `getRawLogDetail` | Single raw log with full payload (admin + analyst only) |
| `getLogIngestionContext` | Current user's log-viewing permissions for UI capability flags |

### Convex mutations / actions

| File | Function | Type | Purpose |
|---|---|---|---|
| `convex/logs/ingestLog.ts` | `ingestSingleLog` | `internalMutation` | Store raw log + trigger normalization |
| `convex/logs/ingestLog.ts` | `normalizeRawLog` | `internalMutation` | Parse raw payload → insert normalized event |
| `convex/actions/ingestLogHttp.ts` | HTTP action handler | `httpAction` | HMAC validation → call `ingestSingleLog` |
| `convex/logs/seedDemoLogs.ts` | `seedDemoLogsInternal` | `internalMutation` | Generate simulated logs for demo |
| `convex/actions/seedDemoLogs.ts` | `seedDemoLogs` | `action` | Admin-triggered simulation (calls internal mutation) |

---

## 13. Recommended Safe Statuses

Aligned with the existing AcadThreat status pattern (`{ status: "..." } as const`):

| Status | When returned |
|---|---|
| `success` | Successful query/operation |
| `ingested` | Log successfully stored and normalized |
| `duplicate` | Idempotency key already exists, log skipped |
| `invalid_input` | Payload failed validation |
| `invalid_signature` | HMAC verification failed |
| `request_expired` | Timestamp outside replay window |
| `payload_too_large` | Payload exceeds 64 KB limit |
| `normalization_failed` | Raw log stored but normalization failed |
| `forbidden` | User lacks required role |
| `unauthenticated` | No authenticated session |
| `not_found` | Requested log/event does not exist |

---

## 14. Recommended UI Route and File Structure

### Route

```txt
src/app/(protected)/admin/logs/
```

### File structure

| File | Responsibility |
|---|---|
| `page.tsx` | Route entry → renders `LogsContainer` |
| `LogsContainer.tsx` | Data fetching, loading/error state, orchestration |
| `LogsLogic.ts` | State helpers, filter state, sheet state, formatters, row actions |
| `LogsView.tsx` | Layout composition, hero section, filter controls, table + detail sheet |
| `LogsSkeleton.tsx` | Loading skeleton matching final layout |
| `LogsTable.tsx` | Normalized events table with columns, severity/outcome badges |
| `LogsDetails.tsx` | Read-only detail sheet for a single normalized event |
| `LogsDialogs.tsx` | **Deferred** — not created unless V1 needs confirmation dialogs |

### Navigation update

Update [navigation.ts](file:///c:/Users/otaga/Desktop/XT/acadthreat/src/config/navigation.ts): remove `disabled: true` and `badge: "Coming soon"` from the Logs entry.

---

## 15. Recommended UI Behavior (V1)

| Behavior | Plan |
|---|---|
| Default view | Normalized events list (not raw logs) |
| Raw logs | Separate tab or secondary section, only visible to admin/analyst |
| Detail view | Read-only `AdminActionSheet` (matches Indicators pattern) |
| Create/edit UI | None — logs are ingested programmatically, not created via UI |
| Filters | Source type, event type, severity (optional) |
| Pagination | Reuse `DataTable` with `pageSize={10}` |
| Sorting | Chronological descending by `eventTimestamp` |

---

## 16. Security Rules

1. **No public unverified ingestion** — all external ingestion must be HMAC-authenticated.
2. **Backend authorization required** — all log queries enforce `requireRole()` at the Convex function level.
3. **Raw logs restricted** — only admin and analyst can view raw log payloads.
4. **No secrets in UI** — passwords, tokens, HMAC secrets never rendered.
5. **Reject oversized payloads** — 64 KB max per log entry.
6. **No stack traces exposed** — safe error messages only.
7. **Table filtering uses table-level loading** — matches existing Indicators pattern (shimmer on data area, not full page reload).
8. **Notifications use global pattern** — `showNotification` from `useNotifications` hook, not inline alerts.
9. **Simulated logs clearly marked** — `isSimulated: true` flag on both raw and normalized records.
10. **Failed normalization preserves raw log** — never delete raw logs on parse error.

---

## 17. Proposed Implementation Chunks

### Chunk 4B: Schema and Backend Helpers

- ❌ Not done: Add `rawLogs` table to `convex/schema.ts`
- ❌ Not done: Add `normalizedEvents` table to `convex/schema.ts`
- ❌ Not done: Add all recommended indexes
- ❌ Not done: Create `convex/logs/helpers.ts` with validators, constants, role arrays
- ❌ Not done: Create `convex/logs/normalizers.ts` with per-source-type normalization functions

---

### Chunk 4C: Ingestion Backend Foundation

- ❌ Not done: Create `convex/logs/ingestLog.ts` with `ingestSingleLog` internal mutation
- ❌ Not done: Add `normalizeRawLog` internal mutation
- ❌ Not done: Implement idempotency check using `by_idempotencyKey` index
- ❌ Not done: Implement payload validation
- ❌ Not done: Create `convex/actions/ingestLogHttp.ts` HTTP action with HMAC validation
- ❌ Not done: Register HTTP route in `convex/http.ts`

---

### Chunk 4D: Simulated Log Seeding

- ❌ Not done: Create `convex/logs/seedDemoLogs.ts` with simulated authentication + firewall logs
- ❌ Not done: Create `convex/actions/seedDemoLogs.ts` admin-only action
- ❌ Not done: Verify simulated logs are stored with `isSimulated: true`
- ❌ Not done: Verify normalization runs on seeded raw logs

---

### Chunk 4E: Backend Queries

- ❌ Not done: Create `convex/queries/logs.ts`
- ❌ Not done: Implement `listNormalizedEvents` with filters and authorization
- ❌ Not done: Implement `getNormalizedEventDetail`
- ❌ Not done: Implement `listRawLogs` (admin/analyst only)
- ❌ Not done: Implement `getRawLogDetail` (admin/analyst only)
- ❌ Not done: Implement `getLogIngestionContext`

---

### Chunk 4F: Logs Route Shell, Navigation, and Skeleton

- ❌ Not done: Create `src/app/(protected)/admin/logs/page.tsx`
- ❌ Not done: Create `LogsContainer.tsx`
- ❌ Not done: Create `LogsLogic.ts` (initial state, formatters)
- ❌ Not done: Create `LogsSkeleton.tsx`
- ❌ Not done: Update `navigation.ts` to enable Logs route

---

### Chunk 4G: Normalized Events Table and List

- ❌ Not done: Create `LogsView.tsx` with hero section and filter controls
- ❌ Not done: Create `LogsTable.tsx` with normalized event columns
- ❌ Not done: Wire `LogsContainer` → `LogsLogic` → `LogsView` → `LogsTable`
- ❌ Not done: Implement source type and event type filters

---

### Chunk 4H: Event Detail Read-Only Sheet

- ❌ Not done: Create `LogsDetails.tsx` with read-only normalized event detail
- ❌ Not done: Wire detail sheet via `AdminActionSheet`
- ❌ Not done: Add "View details" row action

---

### Chunk 4I: Raw Log Restricted View (if approved)

- ❌ Not done: Add raw log tab/section visible to admin/analyst only
- ❌ Not done: Add raw log detail sheet with payload display
- ❌ Not done: Ensure viewer role cannot access raw log data

---

### Chunk 4J: Module 04 Final Validation

- ❌ Not done: Run `npx tsc --noEmit`
- ❌ Not done: Verify seed/demo logs appear in normalized events table
- ❌ Not done: Verify raw logs restricted to admin/analyst
- ❌ Not done: Verify HMAC ingestion path rejects invalid signatures
- ❌ Not done: Verify duplicate ingestion returns `duplicate` status
- ❌ Not done: Verify viewer sees normalized events only
- ❌ Not done: End-to-end browser walkthrough

---

## 18. First Implementation Chunk After Approval

**Chunk 4B: Schema and Backend Helpers** — schema tables, indexes, validators, constants, and normalization helpers.

---

## 19. Code Change Confirmation

> [!IMPORTANT]
> **No code was changed during Chunk 4A.** This artifact is a planning document only. All files were read, not modified.

---

## Open Questions

1. **Raw log viewer for viewer role**: Should viewers be permanently denied raw log access, or should a future permission upgrade be planned? Current recommendation: **deny for V1**.

2. **Batch ingestion**: Should `ingestLogBatch` (up to 50 entries per request) be included in Chunk 4C, or should V1 start with `ingestSingleLog` only and defer batch to V2?

3. **Seed trigger UI**: Should the demo log seeding tool have a button in the Logs UI (admin-only), or should it remain a Convex dashboard-only action for V1?

4. **Raw log tab placement**: Should raw logs be a second tab within `/admin/logs`, a collapsible section below normalized events, or a separate route like `/admin/logs/raw`? Current recommendation: **tab within the same page**.

5. **Chunk 4I scope**: Confirm whether raw log restricted view should be included in Module 04 V1, or deferred entirely.
