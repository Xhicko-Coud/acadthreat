
````md
# AGENTS.md

This file defines repository rules, development discipline, security expectations, and agent cost-control behavior for the **AcadThreat** project.

All rules marked as **must** are mandatory.

---

# 0. Project Context

AcadThreat is a web-based Cyber Threat Intelligence dashboard for real-time monitoring of academic network threats.

The system is built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn UI
- Convex
- Better Auth with Convex integration
- Recharts where approved for dashboard charts

The system focuses on:

- secure admin login
- trusted internal user creation
- role-based dashboard access
- cyber threat intelligence indicators
- raw log ingestion
- log normalization
- threat correlation
- anomaly detection
- severity scoring
- threat visualization
- simulated security logs for academic demonstration

This project is an MVP and academic research artifact, not a full enterprise SIEM replacement.

---

# 1. Core Principle

This repository enforces:

- security-first implementation
- controlled admin access
- no public registration
- minimal sensitive data exposure
- Convex-only backend execution model
- structured admin UI architecture
- reusable patterns
- cost-conscious agent execution
- simple MVP-first development

All implementation must prioritize:

```txt
security → correctness → reuse → simplicity → cost control
````

Do not overbuild features beyond the approved module scope.

---

# 2. Operating Mode Rule

The agent must choose one operating mode before starting work.

The two modes are:

1. Strict Mode
2. Compact Mode

The agent must clearly state the selected mode before implementation.

---

## 2.1 Strict Mode

Use Strict Mode for:

* new protected admin features
* authentication changes
* authorization changes
* database/schema changes
* Convex schema changes
* log ingestion flows
* HMAC/API-client security flows
* threat detection logic
* threat scoring logic
* anomaly detection logic
* role management
* session handling
* security-sensitive dashboard queries
* multi-file features affecting more than 3 files
* unclear bugs with multiple possible causes
* architectural decisions
* shared utility design
* reusable pattern creation
* changes that may affect security, correctness, or data integrity

Strict Mode must follow the full workflow in this file.

---

## 2.2 Compact Mode

Use Compact Mode for:

* small UI changes
* text/copy changes
* import fixes
* TypeScript errors localized to 1–2 files
* styling adjustments
* small bug fixes with obvious cause
* localized component fixes
* small changes that do not affect security, database, authentication, authorization, or architecture

In Compact Mode:

1. read `AGENTS.md` and directly affected files only
2. list the task and affected files briefly
3. do not create full chunks unless needed
4. do not compare 3–4 solutions unless there is a real design decision
5. do not ask approval between tiny steps
6. do not install packages
7. do not run full verification commands unless explicitly requested
8. do not run repeated Git inspection commands
9. implement the smallest safe change
10. report changed files and recommended verification command

If a Compact Mode task becomes complex, switch to Strict Mode and explain why.

---

# 3. Read Order

For every task:

1. `AGENTS.md`
2. the current module overview/checklist/task file, if provided
3. directly affected source files

Also read docs and shared utilities when:

* creating a new feature
* reusing existing patterns
* touching authentication
* touching authorization
* touching security
* touching data flow
* changing Convex schema/API behavior
* changing log ingestion behavior
* changing threat detection/scoring logic
* the task is unclear
* Strict Mode is selected

Do not rely on memory when the repository can answer the question.

Do not inspect unrelated files unless necessary.

Do not scan the whole repository for small localized tasks.

---

# 4. UI Structure Rule: Protected Admin Segments

All protected admin features must follow a segmented UI architecture.

This rule is mandatory for complete protected admin features.

---

## 4.1 Directory Structure

All protected admin features must live under:

```txt
src/app/(protected)/admin/{feature}/
```

Examples:

```txt
src/app/(protected)/admin/dashboard/
src/app/(protected)/admin/threats/
src/app/(protected)/admin/indicators/
src/app/(protected)/admin/logs/
src/app/(protected)/admin/settings/
```

The login page is public and should live at:

```txt
src/app/login/
```

There must be no public registration page.

Users are created internally by trusted admins.

---

## 4.2 Required File Structure

A complete protected admin feature should implement only the files it actually needs.

Recommended structure:

```txt
page.tsx
{Feature}Container.tsx
{Feature}Logic.ts
{Feature}View.tsx
{Feature}Skeleton.tsx
{Feature}Table.tsx
{Feature}Form.tsx
{Feature}Dialogs.tsx
```

Example:

```txt
ThreatsContainer.tsx
ThreatsLogic.ts
ThreatsView.tsx
ThreatsSkeleton.tsx
ThreatsTable.tsx
ThreatsDialogs.tsx
```

---

## 4.3 File Creation Cost Rule

Do not create unused files.

Only create the full structure when building a complete protected admin feature.

For small additions inside an existing protected admin feature, modify only the files required by the change.

Do not create unused `Form`, `Table`, `Dialogs`, or `Skeleton` files unless the feature actually needs them.

Do not create placeholder files just to satisfy structure if they are not used yet.

---

## 4.4 Responsibility Contract

### `page.tsx`

Handles:

* route entry only
* renders the feature Container

Rules:

* must not contain business logic
* must not fetch data directly unless the project pattern explicitly requires it
* must not call Convex directly unless approved by module pattern

---

### `{Feature}Container.tsx`

Handles:

* data fetching
* loading state
* error state
* top-level orchestration

Rules:

* passes data to View
* must not contain complex UI layout logic
* must not contain business mutation logic unless the existing project pattern requires it

---

### `{Feature}Logic.ts`

Handles:

* state helpers
* event handlers
* mutations
* create/update/delete behavior
* business logic
* form submission handlers

Rules:

* no JSX allowed
* no UI rendering
* keep handlers small and explicit

---

### `{Feature}View.tsx`

Handles:

* pure UI composition
* layout composition
* receiving props
* passing props to child components

Rules:

* must not contain business logic
* must not fetch data
* must not call APIs directly
* must not perform mutations directly

---

### `{Feature}Skeleton.tsx`

Handles:

* loading UI

Rules:

* must match final layout
* do not use generic spinners when real skeletons are appropriate

---

### `{Feature}Table.tsx`

Handles:

* tabular data rendering
* row-level actions
* display formatting

Rules:

* no data fetching
* no API calls
* no mutation calls
* receives action handlers through props

---

### `{Feature}Form.tsx`

Handles:

* create/edit UI only
* form fields
* validation display
* submit button state

Rules:

* no API calls
* no mutation logic
* must call handlers passed from Logic/View layer

---

### `{Feature}Dialogs.tsx`

Handles:

* confirmation dialogs
* preview dialogs
* modal UI

Rules:

* no business logic
* no API calls
* receives open state and handlers through props

---

# 5. Data Flow Rule

Data must flow in one direction:

```txt
Container → Logic → View → Components
```

Rules:

1. View must not fetch data.
2. Components must not fetch data.
3. Logic must not render UI.
4. Container handles data fetching.
5. Mutations must be triggered through Logic.
6. UI components receive handlers through props.
7. Backend authorization must happen in Convex functions, not frontend components.
8. Client-side route checks are user experience helpers only, not security.

---

# 6. Authentication and Authorization Rules

This project uses Better Auth with Convex integration.

Rules:

1. There must be no public registration page.
2. Login is the only public auth entry point.
3. New users must be created internally by trusted admins.
4. Protected admin pages must require authentication.
5. Protected admin data must require backend authorization.
6. Do not rely on frontend-only role checks.
7. Users without backend-controlled roles must be denied.
8. Inactive users must not access protected admin features.
9. Protected access failures must provide safe user-facing feedback.
10. Do not expose authorization internals to users.

Recommended roles:

```txt
admin
analyst
viewer
```

Recommended access model:

```txt
admin   → full system management
analyst → investigate and update threat events
viewer  → read-only dashboard access
```

Do not invent new roles without module approval.

---

# 7. Security Rule

The system must not expose sensitive data.

Never expose:

* auth secrets
* API keys
* HMAC secrets
* session tokens
* password hashes
* Better Auth secrets
* Convex deployment secrets
* raw ingestion client secrets
* internal authorization internals
* unnecessary IP/device metadata
* large raw log payloads in dashboard summaries

Cybersecurity logs may contain sensitive operational details.

Rules:

1. Raw logs must only be visible to authorized users.
2. Dashboard summary queries must return aggregate data, not large raw datasets.
3. Recent activity feeds must return safe display fields only.
4. Secrets must never be hardcoded.
5. Secrets must never be pasted into chat.
6. Environment variables must use `.env.local`.
7. `.env.local.example` must contain empty placeholder values only.
8. Do not weaken authentication or authorization for convenience.
9. Do not expose stack traces or backend internals to users.

---

# 8. Convex Rules

Convex is the backend execution and data layer.

Rules:

1. Use Convex queries for reads.
2. Use Convex mutations for writes.
3. Use Convex actions only when external APIs or side effects require them.
4. Keep schema changes explicit and module-scoped.
5. Add indexes intentionally for query patterns.
6. Do not create unused tables.
7. Do not return full datasets to the client when aggregate data is enough.
8. Do not perform large client-side filtering over raw datasets.
9. Backend authorization must happen inside Convex functions.
10. Use existing auth/authorization helpers where available.

Convex files should be organized by domain:

```txt
convex/
  schema.ts

  auth/
  users/
  indicators/
  feedSources/
  apiClients/
  logs/
  normalization/
  detection/
  anomaly/
  scoring/
  threats/
  metrics/
  simulation/
  audit/
```

Do not create all folders early. Create folders only when the module needs them.

---

## 8.1 Convex Function Folder and Runtime Rule

Rules:

1. Do not create new files under `convex/actions` by default.
2. Convex actions can live in any folder.
3. Use neutral folders such as `convex/maintenance`, `convex/jobs`, or a domain folder for normal non-Node actions.
4. Use `"use node"` only when a regular action truly needs Node APIs or unsupported Node packages.
5. Files with `"use node"` must export only `action` or `internalAction` functions.
6. Do not export `query`, `mutation`, `internalQuery`, `internalMutation`, or `httpAction` from `"use node"` files.
7. HTTP actions must not live under `convex/actions`.
8. HTTP actions must not use `"use node"`.
9. HTTP actions should live in `convex/http` or another neutral folder.
10. Internal mutations should live in domain folders and be called through `ctx.runMutation`.
11. Maintenance runners should call internal mutations instead of doing broad database writes directly.
12. When writing future prompts, never suggest `convex/actions` for new runners unless Node runtime is explicitly required.

---

# 9. Log Ingestion Rules

Log ingestion is security-sensitive.

Use Strict Mode for all log ingestion work.

Rules:

1. Ingestion endpoints must authenticate trusted clients.
2. Use HMAC verification where required.
3. Reject invalid signatures.
4. Reject replayed or expired requests.
5. Use idempotency keys to prevent duplicates.
6. Store raw logs before transformation.
7. Failed normalization must not delete raw logs.
8. Invalid payloads must be safely rejected or marked failed.
9. Do not expose raw ingestion secrets to the frontend.
10. Do not accept unauthenticated public log ingestion.

Expected ingestion flow:

```txt
Request received
→ verify client
→ verify timestamp/signature
→ check idempotency
→ store raw log
→ normalize log
→ run correlation/anomaly checks
→ score severity
→ create threat event when threshold is met
```

---

## 9.1 Trusted Log Ingestion Rule

External log ingestion must use the HMAC-protected HTTP endpoint.

Rules:

1. Public unauthenticated ingestion is forbidden.
2. The HTTP endpoint must validate signature, timestamp, payload size, sourceType, and JSON body before calling the ingestion pipeline.
3. HMAC should sign `${timestamp}.${rawBody}`.
4. Timestamp replay window should be limited, default ±5 minutes.
5. HTTP ingestion must call the existing internal ingestion mutation and must not manually insert `rawLogs` or `normalizedEvents`.
6. Convex HTTP actions must not import Node APIs such as `node:crypto`.
7. Convex HTTP actions must not use `"use node"`.
8. HTTP action files must not be placed under `convex/actions`.
9. Do not use `convex/actions` for new normal non-Node maintenance runners.
10. HTTP actions should live in a neutral folder such as `convex/http/` or another non-actions folder.
11. Use Web Crypto APIs for HMAC inside HTTP actions.
12. `"use node"` is only for regular action files that export `action` functions.
13. Node runtime files must not export `httpAction`, `query`, `mutation`, or `internalMutation`.
14. Do not expose secrets, stack traces, raw parser errors, or raw payloads in responses.
15. Do not add ingestion UI unless explicitly approved.
16. Module 04 V1 supports authentication and firewall logs only.

---

# 10. Threat Intelligence Rules

Threat intelligence indicators must be normalized before storage and matching.

Indicator types:

```txt
ip
domain
url
hash
```

Rules:

1. Prevent duplicate indicators using type + normalized value.
2. Disabled indicators must not be used for detection.
3. Store feed source/provenance when available.
4. Store confidence/reputation when available.
5. Do not assume all feed data is accurate.
6. Do not over-trust external threat feeds.
7. Manual indicators must be clearly marked as manual.
8. External API integrations must be isolated and safely handled.

---

## 10.1 Threat Indicator Product Semantics Rule

Indicators represent IoCs collected from external feeds, simulated feed data, or later ingestion pipelines.

Rules:

1. The UI must not present indicators as manually created threats.
2. Avoid labels such as `Create threat`.
3. Manual indicator entry must not be exposed unless explicitly approved and must be worded as `Record indicator`, not `Create threat`.
4. Threats and events should be generated later by correlation and severity scoring modules, not manually invented in the Indicators UI.
5. For V1, the Indicators UI is read/list/view-first unless explicitly approved otherwise.

---

## 10.1.1 External Threat Feed Sync Rule

External feed sync pulls threat intelligence indicators into AcadThreat; it is not HMAC log ingestion.

Rules:

1. Do not hardcode provider API keys or secrets.
2. Store provider credentials only in Convex env.
3. URLHaus requires `URLHAUS_AUTH_KEY` from Convex env.
4. If `URLHAUS_AUTH_KEY` is missing, skip URLHaus with `provider_skipped`.
5. Do not attempt unauthenticated URLHaus requests.
6. URLHaus recent URL sync uses `GET /v1/urls/recent/limit/{limit}/`.
7. URLHaus V1 imports URL indicators only.
8. Do not use URLHaus malware sample download or payload download endpoints.
9. Do not store raw URLHaus responses.
10. Do not expose provider secrets, raw provider responses, headers, stack traces, or backend internals.
11. Feed sync must normalize indicators into the existing `threatIndicators` model.
12. Feed sync must dedupe by `type + normalizedValue` and optionally `provider + providerIndicatorId`.
13. Do not store raw provider payloads in `threatIndicators`.
14. Do not create files under `convex/actions` for feed sync runners.
15. Use `convex/maintenance` for manual maintenance runners.
16. Provider fetch should call internal mutations for database writes.
17. Start with bounded, manual sync before scheduler or cron.
18. Do not add automated remediation, IP blocking, or user disabling.
19. Database writes for feed sync must happen through internal mutations.
20. Feed upsert must dedupe by `type + normalizedValue` first.
21. Feed upsert must not automatically reactivate archived or false-positive indicators.
22. Feed upsert must not overwrite manually curated stronger data with weaker provider data.
23. Feed upsert must return safe statuses and counts only.
24. Manual feed sync runners must live under `convex/maintenance`, not `convex/actions`.
25. Manual feed sync runners must be protected by a maintenance seed/admin key.
26. Runners must read provider keys from Convex env.
27. Runners must call provider fetch functions and internal upsert mutations.
28. Runners must return safe count-only summaries.
29. Runners must not return raw provider records or secrets.
30. URLHaus normal default limit is 50.
31. URLHaus max limit is 1000.
32. Safe provider metadata may be displayed in indicator details.
33. Provider metadata UI must never expose API keys, raw provider responses, headers, or backend internals.
34. Do not add feed sync buttons or API-key settings UI unless explicitly approved.
35. Do not describe bounded manual feed sync as live or real-time feed streaming.

---

## 10.2 Threat Event Product Semantics Rule

Threat events represent detection/correlation results generated by AcadThreat.

Rules:

1. Threat events are generated by detection/correlation, not manually created by users.
2. Do not add `Create threat` UI.
3. Threat events must store safe evidence summaries, not raw payloads.
4. Raw log access remains restricted by log permissions.
5. Status updates must be explicitly approved and must use confirmation flows.
6. Correlation must be deterministic and explainable in V1.
7. Do not add AI/ML/anomaly scoring unless explicitly approved in a later module.
8. Apply this rule to Threat Events, Dashboard, Reports, and future security modules.

---

## 10.3 Threat Event Status Workflow Rule

Threat event status changes are investigation workflow updates, not threat event edits.

Rules:

1. Threat event status may be updated only by admin/analyst.
2. Viewer can view only.
3. Status updates must use confirmation dialogs.
4. Status updates must not modify correlation evidence.
5. Status updates must not expose raw logs or raw payloads.
6. Do not add edit/delete/create threat event actions.
7. Use global/top-center notifications for action result.
8. Keep detail sheets read-only unless explicitly approved otherwise.

---

## 10.4 Severity Scoring and Prioritization Rule

Severity scoring prioritizes detected threats for analyst review.

Rules:

1. Severity scoring must be deterministic and explainable in V1.
2. Do not use AI, ML, or opaque scoring unless explicitly approved in a later module.
3. Scoring prioritizes detected threats; it does not remediate attacks.
4. Do not add automated blocking, user disabling, or firewall changes.
5. Do not allow users to manually edit scores.
6. Scoring evidence must be safe and must not include raw payloads, secrets, tokens, stack traces, HMAC details, or backend internals.
7. Score range is 0-100.
8. Priority bands are low, medium, high, and critical.
9. UI may display score or priority later, but scoring logic must remain backend-generated.
10. Scoring runners are backend maintenance operations only unless explicitly approved for UI.
11. Normal UI must not expose `Score threat` actions.
12. Scoring mutations must update scoring fields and score-derived severity only, and must not alter correlation evidence.
13. Backend queries may expose safe score, priority, scoring status, scoring reason, and scored timestamp fields.
14. Full scoring factors belong in detail views, not table rows, unless compact and explicitly safe.
15. UI must not expose raw payloads or backend internals through scoring evidence.
16. Do not add manual score editing or normal UI scoring actions.

---

## 10.5 Threat Trend Prediction Rule

Trend prediction estimates future activity from processed generated threat events.

Rules:

1. Trend prediction must be deterministic and explainable in V1.
2. Do not claim AI/ML unless explicitly implemented.
3. Trend prediction must use processed `threatEvents` only.
4. Do not expose raw logs, raw payloads, `rawLogId`, `payloadHash`, `idempotencyKey`, secrets, tokens, HMAC details, parser errors, stack traces, or backend internals.
5. Trend prediction is an estimate, not a guarantee.
6. Use cautious wording such as `estimated`, `projected`, and `based on recent generated threat events`.
7. Do not add automated remediation, IP blocking, or user disabling.
8. Trend prediction dashboard sections must be visually separate from historical activity charts.
9. Trend prediction wording must remain cautious and explainable.
10. Do not render fake prediction values.
11. Do not add prediction charts until backend data and shell are stable.
12. Prediction charts must use a separate component from historical activity charts.
13. Do not reuse historical activity chart components directly when projected values are involved.
14. Historical and projected series must be visually distinguished.
15. Prediction must be described as estimated or projected, not guaranteed.
16. Projection chart data must come from the backend trend prediction query only.
17. Projection charts must distinguish historical and projected values when implemented.

---

# 11. Detection and Scoring Rules

Detection logic must be simple, traceable, and explainable.

For MVP:

* prefer rule-based anomaly detection
* avoid machine learning unless explicitly approved
* keep scoring transparent
* return explanations for threat events

Rules:

1. Correlation matches known indicators.
2. Anomaly checks detect suspicious behavior without known IoCs.
3. Severity scoring must be deterministic.
4. Threat events must include enough explanation for investigation.
5. Do not create black-box scoring logic.
6. Do not overcomplicate MVP detection.
7. Do not mark every anomaly as critical.
8. Avoid alert overload by applying thresholds.

Recommended severity levels:

```txt
low
medium
high
critical
```

Recommended threat statuses:

```txt
open
investigating
resolved
false_positive
```

---

# 12. Dashboard Rules

Dashboard features must be safe and aggregate-first.

Rules:

1. Dashboard data must come from Convex queries.
2. Dashboard queries must enforce backend authorization.
3. Dashboard summaries must return aggregate counts.
4. Charts must receive pre-shaped or lightly shaped data.
5. Recent feeds must be limited.
6. Do not return raw logs unless the page is specifically a log detail page.
7. Do not calculate security-critical metrics only on the client.
8. Do not build broad analytics outside the approved module scope.

Use Recharts only where approved by the module.

Do not install another chart package without approval.

## 12.1 Dashboard Chart Setup Rule

Dashboard charts should use the Shadcn chart pattern with Recharts.

Rules:

1. Do not add fake chart data.
2. Chart data must come from safe backend queries.
3. Do not install chart packages repeatedly.
4. Before adding chart UI, confirm `recharts` and `src/components/ui/chart.tsx` exist.
5. Use the current local chart component pattern and reference project only for chart composition guidance.
6. Charts must not expose raw logs, payloads, backend internals, secrets, tokens, cookies, HMAC details, or stack traces.
7. Charts must not imply prediction or forecasting unless trend prediction is explicitly implemented.

## 12.2 Dashboard Backend Data Rule

Dashboard queries must return processed, aggregated, safe data only.

Rules:

1. Dashboard queries must not return raw logs, raw payloads, rawLogId, payloadHash, idempotencyKey, HMAC details, tokens, cookies, secrets, stack traces, parser errors, or backend internals.
2. Dashboard charts must be based on backend query data, not fake frontend data.
3. Seven-day trend charts are historical summaries and must not be described as prediction.
4. Dashboard access must be backend-authorized.
5. Viewer may see safe summary data only if viewer access is consistent with threat event permissions.

## 12.3 Dashboard UI Shell Rule

Dashboard route UI must follow the protected module shell pattern.

Rules:

1. Dashboard route must follow the Container → Logic → View → Skeleton pattern.
2. Dashboard must not render placeholder `AppAlert` blocks for normal content.
3. Dashboard must not use fake metrics or fake chart data.
4. Dashboard denied access must use `AccessRestrictedState` and must replace normal dashboard content.
5. Dashboard wording must focus on monitoring, prioritization, and visibility, not remediation.
6. Dashboard must only visualize safe backend-processed data.

## 12.4 Dashboard Metric Card Rule

Dashboard metric cards must use safe backend summary data.

Rules:

1. Do not show fake numbers.
2. Do not treat missing data as zero unless the backend returns zero.
3. Do not expose raw logs, raw payloads, internal IDs, secrets, tokens, HMAC details, stack traces, or backend internals.
4. Metric wording must describe monitoring and prioritization, not remediation.
5. Metric cards should follow current local dashboard/card style and remain responsive.

## 12.5 Dashboard Layout Rule

Dashboard layouts must stay focused and scannable.

Rules:

1. Dashboard hero should carry contextual metadata like Last ingestion when appropriate.
2. Dashboard metric cards should be limited to the most important top-level signals.
3. Do not overload the dashboard with too many cards.
4. Dashboard 7-day activity should have its own full-width row after metric cards.
5. Dashboard distribution charts and recent lists should be separate full-width sections unless explicitly approved otherwise.
6. Recent dashboard tables should not include filters, search, or row action columns.

## 12.6 Dashboard Chart UI Rule

Dashboard charts must use the Shadcn chart/Recharts pattern.

Rules:

1. Use the reference project only for chart composition guidance, not domain logic.
2. Dashboard chart data must come from safe backend queries only.
3. Do not use fake chart data.
4. Show safe empty states when no chart data exists.
5. Seven-day trend charts are historical, not predictive.
6. Charts must not expose raw logs, raw payloads, internal IDs, secrets, tokens, HMAC details, stack traces, parser errors, or backend internals.
7. Do not add prediction or forecasting language unless the trend prediction module is implemented.
8. Use Recharts `RadialBarChart` for radial-band distribution charts.
9. Use `AreaChart` or line-style charts for historical time-series activity.
10. Do not use ApexCharts unless explicitly approved and installed.
11. Do not represent historical 7-day activity only as a radial distribution.

## 12.7 Dashboard Recent Threats Rule

Dashboard recent threat lists must use safe backend data only.

Rules:

1. Recent threat lists should be bounded, default max 10.
2. Dashboard recent threat lists must not include filters, search, or row action columns.
3. Dashboard recent threat lists should provide a header link to the full module page when needed.
4. Dashboard visualizations and recent lists should be separate full-width sections unless explicitly approved otherwise.
5. Do not expose raw logs, raw payloads, internal IDs, secrets, tokens, HMAC details, stack traces, parser errors, or backend internals.
6. Do not add remediation actions from dashboard summaries.

---

# 13. Simulation and Demo Data Rules

Simulation is allowed for academic demonstration.

Rules:

1. Simulated logs must be clearly marked as simulated.
2. Demo data must not be confused with real production logs.
3. Simulation tools must be admin-only.
4. Simulation should support common academic network threat scenarios.
5. Do not seed real malicious payloads that could be executed.
6. Do not include real institutional data.

Recommended scenarios:

```txt
brute force login attack
known malicious IP connection
phishing URL access
suspicious SQL injection-like request
firewall blocked traffic spike
```

## 13.1 Demo Proof Seed Rule

Demo/proof seeds are allowed only for development and defense demonstration.

Rules:

1. Demo/proof seeds must be protected by a maintenance seed/admin key.
2. Demo/proof seeds must live under `convex/maintenance`, not `convex/actions`.
3. Demo/proof seeds must use existing ingestion, correlation, and scoring pipelines where possible.
4. Demo/proof seeds must not bypass core pipeline tables by manually inserting final outputs.
5. Demo/proof seeds must not expose secrets, raw provider responses, raw payloads, stack traces, or backend internals.
6. URLHaus correlation proof seed must create a simulated log containing an existing imported URLHaus URL indicator, not create threatEvents directly.

---

# 14. Implementation Workflow Rule

All non-trivial work must follow a staged approach.

This full workflow applies in Strict Mode.

---

## 14.1 Before Coding in Strict Mode

Before coding:

1. identify the task
2. list affected files
3. list proposed chunks in implementation order
4. under each chunk, list checklist items
5. mark every listed checklist item as:

   * ✅ Done
   * ❌ Not done
6. identify the single chunk being started
7. break the approved chunk into internal slices when needed
8. keep internal slices to a maximum of 5 files
9. do not begin implementation until the current chunk and checklist items are clearly identified

Chunk format:

```md
Chunk 1: Route Shell And Structure

- ❌ Not done: Add protected admin dashboard route
- ❌ Not done: Add page.tsx
- ❌ Not done: Add DashboardContainer.tsx

Chunk 2: Backend Query

- ❌ Not done: Add Convex dashboard query
- ❌ Not done: Enforce backend authorization
```

---

## 14.2 During Implementation in Strict Mode

During implementation:

1. work on one approved chunk at a time
2. do not mix concerns across chunks
3. do not implement later chunks while the current chunk is awaiting verification or approval
4. if internal slices are used, keep them within the approved chunk only
5. stop after the approved chunk unless the user explicitly approved continuation

---

## 14.3 After Each Chunk in Strict Mode

After each chunk:

1. verify changes only if agent verification is allowed
2. report:

   * ✅ Done
   * ❌ Not done
3. include:

   * chunk name
   * files changed in that chunk
   * verification command/result, or state that verification was delegated to the user
   * checklist items completed
   * checklist items still not done
   * all completed chunks so far
4. ask for approval before starting the next chunk
5. stop until approval is given

Do not proceed without explicit approval for the next chunk when Strict Mode chunking is active.

---

## 14.4 Compact Mode Workflow

For Compact Mode:

1. state the task briefly
2. state affected files briefly
3. make the smallest safe change
4. do not create chunks unless needed
5. do not run full verification unless explicitly requested
6. do not run repeated Git inspection commands
7. do not install packages
8. provide compact final report

Compact Mode final report format:

```md
Mode: Compact Mode

Changed files:
- file/path.tsx

Verification:
- Not run by agent
- User should run: npx tsc --noEmit

Unresolved issues:
- None known
```

---

# 15. Debugging Rule

When an issue occurs:

1. do not jump to a fix
2. trace the full flow when the bug is complex or unclear:

```txt
UI → Container → Logic → Convex/API → DB
```

3. identify root cause
4. generate at least 2 fixes for complex or unclear bugs
5. choose the safest fix

Do not patch symptoms.

For stateful UI, auth flows, overlays, loaders, dropdowns, dialogs, and navigation-driven behavior:

1. trace ownership of the relevant state
2. trace where the component mounts and unmounts
3. trace what happens across route changes
4. compare the full working lifecycle with the reference before extracting state to a new provider or shared component

Do not jump into a fix before understanding the end-to-end lifecycle.

---

## 15.1 Localized Debugging Exception

For obvious localized errors, such as:

* missing import
* incorrect prop type
* simple TypeScript mismatch
* typo
* wrong file path
* small UI issue
* one-file runtime error

Use Compact Mode.

In Compact Mode, identify the direct cause and apply the smallest safe fix.

Do not generate multiple fixes unless there is a real design choice.

---

# 16. Naming Rule

Use clear, descriptive names.

Avoid vague names such as:

```txt
handle()
processData()
fn()
dataHandler()
thing()
stuff()
```

Good examples:

```txt
createThreatIndicator()
normalizeFirewallLog()
calculateThreatSeverity()
runCorrelationCheck()
createThreatEvent()
logIngestionFailure()
```

File names must match the feature or responsibility.

Do not use misleading names.

---

# 17. Import Alias Rule

All internal application imports must use configured path aliases.

Rules:

1. Use `@/` for imports from `src/`.
2. Use `@convex/` for imports from `convex/` if configured.
3. Do not use relative parent imports such as:

```txt
../../components/example
../lib/example
../_generated/server
```

4. Relative imports are allowed only for files in the same directory when clearer.
5. Keep imports consistent with `tsconfig.json` and `convex/tsconfig.json`.

---

# 17.1 Interactive Cursor Rule

All interactive controls that users are expected to click or tap must use the pointer cursor.

Rules:

1. Apply `cursor-pointer` to buttons, links styled as buttons, toggles, selects, menu triggers, clickable icons, and similar interactive controls.
2. Do not leave clickable UI with the default text or arrow cursor unless the control is disabled.
3. Disabled controls should keep a non-interactive cursor state when appropriate.
4. Check interactive cursor behavior during UI updates, not only visual styling.

---

# 17.2 Reference Project Parity Rule

When using the SCPC reference for an approved feature, the agent must follow the working reference pattern exactly where relevant.

Rules:

1. Compare the exact working SCPC implementation pattern before changing code.
2. Match the reference implementation pattern exactly where relevant.
3. Only adapt what must differ for AcadThreat-specific branding, routes, roles, module scope, or intentionally excluded features.
4. Do not invent hardening changes, alternative wiring, or different implementation patterns unless the reference cannot apply because of AcadThreat-specific constraints.
5. If deviating from the reference, state why before implementing.
6. Do not copy unrelated SCPC domain logic such as identity, QR, token, payment, certificate, MFA, OTP, step-up, or verification logic unless explicitly approved for AcadThreat.
7. Do not add future-module features early.
8. No public registration is allowed.
9. Auth users are created internally by trusted admin or seed flows.
10. Sensitive values must never be committed, logged, printed, or pasted into chat.
11. For Better Auth with Convex comparisons, include `convex/http.ts` and do not compare only `auth-client`, `auth-server`, and `route.ts`.

---

# 17.3 Convex Better Auth HTTP Router Rule

Any project using Better Auth with Convex and Next.js must include `convex/http.ts`.

Rules:

1. `convex/http.ts` must create and export a Convex HTTP router.
2. Better Auth routes must be registered on that HTTP router.
3. If `/api/auth/get-session` or `/api/auth/sign-in/email` returns `404`, test the direct Convex site URL:

```txt
https://<deployment>.convex.site/api/auth/get-session
```

4. If the direct `.site` URL says `This Convex deployment does not have HTTP actions enabled`, the likely missing piece is `convex/http.ts`.
5. When using SCPC as a reference, compare `convex/http.ts` against the working project.
6. Verify both:

```txt
NEXT_PUBLIC_CONVEX_URL           → matching .convex.cloud URL
NEXT_PUBLIC_CONVEX_SITE_URL      → matching .convex.site URL
```

7. Do not keep debugging seed, password, or login UI behavior until HTTP actions are confirmed working.
8. Do not expose env values, secrets, cookies, tokens, or passwords.

---

# 17.4 Auth Bridge Loader Rule

When using the SCPC reference for authentication UX, include the sign-in and sign-out bridge loader pattern where relevant.

Rules:

1. Successful sign-in should queue the safe post-navigation notification first, then show the sign-in bridge loader, then redirect.
2. Sign-out should show the sign-out bridge loader as soon as logout begins and keep it visible until redirect or failure.
3. If sign-in or sign-out fails, the bridge loader must hide and existing safe error handling must continue.
4. Bridge loaders must be full-screen, accessible, and use safe status messaging only.
5. Bridge loaders must not expose auth internals, raw errors, cookies, tokens, passwords, or backend details.
6. Bridge loaders should follow the SCPC `AuthGateBackdrop` and centered status-card pattern, adapted to AcadThreat branding and green accent styling.
7. When comparing SCPC auth UX, include:

```txt
landing-auth-form.tsx
sign-out-button.tsx
auth-gate-backdrop.tsx
notification-provider.tsx
use-notifications.ts
```

8. Do not remove or weaken safe notification-after-navigation behavior when adding bridge loaders.

---

## 17.4.1 Auth Provider Boundary Rule

Public routes such as `/login` must remain lightweight.

Rules:

1. Do not mount protected admin shell, protected Convex queries, or unnecessary Convex auth-token fetching on public routes.
2. Auth/session checks on `/login` must be minimal and intentional.
3. Avoid duplicate `useSession` or `useConvexAuth` calls across login container, view, or provider layers.
4. Convex authenticated providers and protected profile or role queries should live at the protected route boundary unless the working local or reference pattern requires otherwise.
5. Protected route enforcement must remain server or backend enforced; moving providers must not weaken authorization.
6. Before changing auth provider placement, compare with the working local or reference auth boundary.
7. Do not add public route auth polling or repeated session checks.

---

## 17.4.2 Protected Module Access Guard Rule

Restricted users must not see normal protected module page content.

Rules:

1. Do not render `access denied` or `access restricted` messages as embedded cards inside the normal table or page layout.
2. Use `AccessRestrictedState` as the dedicated route or page guard screen unless an approved shared replacement exists.
3. `AccessRestrictedState` must replace the protected module page content, not appear inside it.
4. Guard screens should provide safe next actions such as `Go to dashboard` and `Sign out`.
5. Never mention internal roadmap or chunk language in user-facing restricted screens.
6. Backend authorization must still enforce access; frontend guards are UX only.
7. Apply this pattern to Logs, Users, Indicators, Threat Events, Settings, and future protected modules.
8. Do not use embedded `AppAlert` for restricted access.

---

## 17.4.3 Restricted Access UI Rule

Rules:

1. Never render restricted or access-denied messages as embedded cards inside normal protected module pages.
2. Never use copy like `Log access restricted`, `Your account does not currently have permission to review log events`, or `Additional dashboard modules will connect data and actions here in later implementation chunks`.
3. Never mention implementation chunks, future chunks, internal roadmap, or development status in user-facing restricted-access UI.
4. Restricted users must not see normal protected module page content.
5. Use `AccessRestrictedState` for restricted protected modules.
6. `AccessRestrictedState` must replace the module page content, not appear inside it.
7. `AccessRestrictedState` should provide safe next actions: `Go to dashboard` and `Sign out`.
8. Backend authorization must still enforce access.
9. Apply this rule to Logs, Users, Indicators, Dashboard, Threat Events, Settings, and all future protected modules.
10. Do not use embedded `AppAlert` for restricted access.

---

# 17.5 Form Validation Rule

All newly created forms and any materially rebuilt forms must use `react-hook-form` with `zod` validation through `zodResolver`.

Rules:

1. Colocate or clearly pair each form with an explicit `zod` schema.
2. Use `react-hook-form` for form state, validation, submission, and dirty-state tracking.
3. Use `zodResolver` for schema-backed validation.
4. Required forms must not allow empty submission.
5. Confirmation dialogs must open only after schema validation passes.
6. Pure form components must remain presentational and must not call backend APIs directly.
7. Submit handlers, mutation calls, confirmation state, and discard state must stay in the feature Logic layer.
8. If a form uses a sheet, dialog, or footer action button outside the `<form>`, wire it so it still submits through the `react-hook-form` handler.
9. If the required form dependencies are missing, state the package requirement and get approval before installing them.

---

## 17.6 AppAlert Usage Rule

Do not use `AppAlert` for permanent page descriptions, static guidance, onboarding copy, workspace introductions, or normal informational page text.

Rules:

1. Page descriptions must live in `PageHeader`, section headers, card descriptions, helper text, or empty-state copy.
2. `AppAlert` is only for real stateful alerts such as access denied, query or load failure, action success or failure when the existing notification pattern requires `AppAlert`, validation warnings, system warnings, or session/auth/access-state messages.
3. Do not render an `info` `AppAlert` just because a page loaded successfully.
4. Do not add page-level `AppAlert` blocks unless the current local pattern already uses `AppAlert` for that exact state.
5. Before adding `AppAlert`, compare with the existing `UsersView` and other completed local views.
6. For normal guidance, use plain page copy instead of `AppAlert`.
7. This rule applies to all future admin pages, including Indicators, Logs, Threat Events, Dashboard, and Settings.

---

## 17.7 Table Loading and Filter UX Rule

Table filtering, searching, sorting, and pagination must not cause a full-page reload or full-page skeleton after the initial page load.

Rules:

1. Initial page load may use the page skeleton.
2. After the page has mounted, query refetches caused by table controls must show table-level loading only.
3. Keep page header, layout, navigation, filters, and action buttons stable while table data reloads.
4. Prefer a table-body loading row or subtle overlay with a spinner such as `Loader2`.
5. Do not unmount the whole view when only table data is loading.
6. Do not reset open sheets or dialogs because a table filter changes.
7. Apply this rule to Users, Indicators, Logs, Threat Events, and future admin data pages.

---

## 17.8 Global Alert Placement Rule

Do not embed `AppAlert` directly inside page views for access denied, info, success, warning, or error messages.

Rules:

1. `AppAlert` and notification messages must be triggered through the existing global or top-center alert system.
2. Page views should use `PageHeader`, section copy, card descriptions, helper text, or `EmptyState` for normal static content.
3. Access denied, query failed, action success, and action failure messages should be global alerts, not embedded JSX blocks.
4. Do not render permanent `AppAlert` blocks inside admin pages.
5. Do not render an `info` `AppAlert` just because a page loaded successfully.
6. Prevent repeated alert spam on re-renders.
7. Before adding alert logic, compare with the existing completed local pattern.
8. This applies to Users, Indicators, Logs, Threat Events, Dashboard, Settings, and all future admin pages.

---

## 17.9 Admin Table Search Rule

Do not add table search controls to admin pages by default.

Rules:

1. Do not add search inputs to admin table pages by default.
2. Admin tables should use structured filters through `FilterDropdownMenu`.
3. Search may only be added when explicitly approved for that specific page and justified by the data volume/use case.
4. Do not add search just because a backend query supports a search parameter.
5. Do not clutter table headers with search fields.
6. If search is approved later, it must follow the table-level loading rule and must not cause full-page skeleton reloads.
7. This applies to Users, Indicators, Logs, Threat Events, Dashboard drilldowns, Reports, Settings, and future admin data pages.

---

## 17.10 Admin Table Filter UX Rule

Admin table filters must stay compact and reusable.

Rules:

1. Admin tables with more than 2 filters must use the reusable `FilterDropdownMenu` pattern.
2. On mobile and constrained layouts, all admin table filters must collapse into `FilterDropdownMenu`, even if there are only 1–2 filters.
3. Do not crowd page headers or table control rows with many visible select boxes.
4. Do not allow filters to wrap into messy multi-row desktop or tablet layouts.
5. Header and action areas should stay stable; filter controls should collapse before they break the layout.
6. Search is not part of the default admin table pattern and requires explicit approval.
7. The first level of `FilterDropdownMenu` must show filter categories.
8. The forward or right arrow means the category opens a second-level option list.
9. The second level must list all available options for that filter, not only the current selected value.
10. Clicking an option must apply it immediately to the table.
11. The selected option should be visibly marked.
12. `value` means the current selected value; `options` means all selectable values. Do not confuse them.
13. `FilterDropdownMenu` should show filter categories first, then drill into options using a forward-arrow pattern.
14. Filter changes must use table-level loading only.
15. Reuse this pattern for Users, Indicators, Logs, Threat Events, and future admin data pages.

---

## 17.11 Admin Table Header Button Rule

Table-header action buttons must use one shared visual standard.

Rules:

1. Table-header action buttons must use the same visual standard as the Users `Create User` button.
2. Buttons in `DataTable` header or action areas must have consistent height, radius, padding, background color, text color, icon spacing, and hover or focus states.
3. Use the shared table-header button style or component when available.
4. Button width should be consistent by default, but may expand if content needs more space.
5. `FilterDropdownMenu` trigger buttons must visually align with other table-header action buttons.
6. Do not invent new table-header button styles per page.
7. Apply this rule to Users, Indicators, Logs, Threat Events, and future admin data pages.

---

# 18. Reuse Rule

Before creating anything new:

1. check shared components when relevant
2. check `src/lib` when relevant
3. check `src/config` when relevant
4. check existing feature Logic files when relevant
5. check existing Convex helpers when relevant

Do not duplicate logic or UI patterns.

In Compact Mode, check reuse only when the affected file or task clearly suggests an existing reusable pattern.

---

# 19. Function Design Rule

Functions must remain small, explicit, and single-purpose.

---

## 19.1 Single Responsibility

Each function must perform one task only.

Do not combine:

* validation
* transformation
* persistence
* UI state updates
* security checks
* logging side effects

Split into smaller functions when responsibilities differ.

---

## 19.2 Size Rule

Functions must remain small.

Guideline:

```txt
aim for ≤ 30 lines
```

If logic becomes hard to scan, split it.

---

## 19.3 Explicit Inputs and Outputs

Functions must:

* accept explicit parameters
* return clear outputs

Do not:

* rely on hidden globals
* mutate external state silently

---

## 19.4 No Mixed Concerns

Do not mix unrelated responsibilities.

Bad:

```txt
validate input + save to DB + update UI + log audit event
```

Better:

```txt
validateInput()
saveToDatabase()
writeAuditLog()
updateUiState()
```

---

## 19.5 Side Effect Rule

Separate pure logic from side effects.

Side effects include:

* API calls
* DB writes
* logging
* mutation calls
* navigation
* file operations

Do not hide side effects.

---

## 19.6 Async Rule

Async functions must:

* use async/await
* avoid mixing async/await with `.then()` chains
* handle failure paths
* avoid unnecessary parallel calls

---

## 19.7 Early Return Rule

Use early returns to reduce nesting.

Bad:

```ts
if (condition) {
  if (anotherCondition) {
    // deep nesting
  }
}
```

Good:

```ts
if (!condition) return;
if (!anotherCondition) return;
```

---

# 20. Package Installation Rule

The agent must not install new packages without approval.

Before installing any new package, the agent must briefly state:

```txt
Package:
Reason:
Existing alternative checked:
Command:
Expected files affected:
```

The agent must wait for approval before running install commands.

---

## 20.1 Existing Dependency Exception

If the dependency already exists in `package.json` but is missing from `node_modules`, the agent may run the normal project install command after stating:

```txt
No new dependency is being added.
The package already exists in package.json.
Recommended command: npm install
```

---

## 20.2 Package File Change Rule

If `package.json` or `package-lock.json` changes:

1. state exactly why it changed
2. show the dependency/script change
3. do not attempt Git index repair commands
4. ask the user to review before continuing if the change was not explicitly requested

Do not modify package files silently.

---

# 21. Verification Rule

A task is complete only if:

1. code runs without errors
2. feature works correctly
3. no rule is violated

If verification is blocked:

* state the blocker
* do not mark complete

---

## 21.1 User-Handled Verification Rule

For token-saving purposes, the agent must not run full verification commands unless explicitly requested.

After implementation, the agent should provide:

1. changed files
2. recommended verification command
3. what result to expect

The user will run:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Use these as appropriate:

* `npx tsc --noEmit` for TypeScript checks
* `npm run lint` when lint-sensitive files changed
* `npm run build` before deployment
* `npm run dev` for local manual testing

The agent must not mark verification as passed unless it actually ran the command.

If verification is delegated to the user, report it as:

```txt
Verification not run by agent.
User should run: npx tsc --noEmit
```

---

## 21.2 Verification Cost Control Rule

The agent must use minimal verification commands.

Default verification order when verification is explicitly requested:

1. run the most targeted check available
2. run `npx tsc --noEmit` only when TypeScript files changed
3. run `npm run lint` only when lint-sensitive files changed or when requested
4. run `npm run build` only for release/deployment confidence or when requested
5. run `git status --short` once at the end only if a changed-file summary is needed
6. run `git diff --stat` once only when useful

Do not run repeated Git diff/status/index commands unless diagnosing a real Git issue.

Do not run:

```bash
git update-index --refresh
```

unless the user specifically asks or Git status is clearly incorrect.

---

# 22. Git Usage Rule

The agent should not perform heavy Git inspection unless necessary.

Allowed lightweight Git commands:

```bash
git status --short
git diff --stat
```

Use each at most once at the end when useful.

Avoid repeated use of:

```bash
git diff
git diff --quiet
git diff --summary
git update-index --refresh
```

Do not run Git index repair commands unless explicitly requested.

Do not attempt to fix Git metadata, file-system, or index errors unless the user specifically asks.

If Git reports a read-only file system or index error, stop and report the blocker.

---

# 23. Agent Cost-Control Rule

The agent must minimize unnecessary token usage.

Rules:

1. do not inspect unrelated files
2. do not create checklists unless requested or Strict Mode requires it
3. do not perform architecture decisions when the user already provided an approved plan
4. do not redesign the module unless requested
5. do not run verification commands unless requested
6. do not install packages without approval
7. do not repeatedly inspect Git status/diffs
8. do not produce long reports when a compact report is enough
9. do not continue to future chunks without approval in Strict Mode
10. stop after completing the requested task
11. avoid re-reading files already inspected during the same task unless needed
12. avoid broad repo exploration for small tasks
13. keep implementation aligned with the current module only

---

# 24. User Planning Rule

When the user provides a module plan or checklist, the agent must follow it.

The agent must not recreate the checklist unless:

* the checklist is incomplete
* the checklist violates repository rules
* the checklist is unsafe
* the user asks for review or improvement

If the plan has a problem, state the issue briefly and recommend the smallest correction.

---

# 25. Default Agent Behavior

Unless the user says otherwise, the agent should behave as follows:

1. use Compact Mode for small/local tasks
2. use Strict Mode for security, architecture, database, auth, log ingestion, detection, scoring, or large feature tasks
3. do not install packages
4. do not run TypeScript checks
5. do not run lint/build
6. do not perform heavy Git inspection
7. do not create a new checklist if one is already provided
8. edit only the requested scope
9. report changed files and recommended verification command

Default verification instruction:

```txt
Verification not run by agent.
User should run: npx tsc --noEmit
```

---

# 26. Safe Agent Prompt Pattern

For most implementation tasks, the user may say:

```txt
Use Compact Mode unless this task clearly requires Strict Mode.

Do not install packages.
Do not run TypeScript checks.
Do not run lint/build.
Do not run repeated Git commands.
Do not recreate the checklist.
Implement only the task I provide.
After editing, report only changed files and what command I should run.
```

For Strict Mode tasks, the user may say:

```txt
Use Strict Mode.

Follow AGENTS.md full chunk workflow.
Stop after the current approved chunk.
Do not proceed to the next chunk without approval.
```

---

# 27. Security Escalation Rule

If a Compact Mode task touches any of the following, switch to Strict Mode:

* authentication
* authorization
* admin permissions
* database schema
* Convex schema
* log ingestion
* HMAC verification
* API client secrets
* threat detection
* anomaly detection
* severity scoring
* raw logs
* audit logging
* session handling
* role management
* protected route behavior
* secrets

The agent must state:

```txt
Switching to Strict Mode because this task affects security-sensitive logic.
```

---

# 28. Package Alternatives Rule

Before suggesting a new dependency, the agent must check whether the task can be solved using:

1. existing project dependency
2. built-in JavaScript/TypeScript feature
3. built-in browser API
4. built-in Node.js API
5. existing utility in `src/lib`
6. existing component/pattern in the codebase

Only suggest a new package if the existing project cannot reasonably solve the problem.

---

# 29. Scope Control Rule

The agent must stay inside the requested scope.

If the task is:

```txt
Fix this TypeScript error.
```

The agent must not:

* redesign the component
* refactor unrelated logic
* install packages
* change routing
* change auth
* change schema
* change shared utilities unless necessary

If a broader change is required, the agent must stop and explain why.

---

# 30. Reporting Detail Rule

The agent’s final report should be short.

Preferred format:

```md
Mode: Compact Mode

Changed files:
- src/example/file.tsx

Verification:
- Not run by agent
- User should run: npx tsc --noEmit

Unresolved issues:
- None known
```

Do not include long command transcripts unless requested.

Do not claim verification passed unless verification actually ran.

---

# 31. Checklist Ownership Rule

The preferred workflow is:

```txt
ChatGPT creates the module plan and checklist.
Codex implements the approved checklist.
User runs verification.
```

The agent must not recreate the plan unless:

* the plan is unsafe
* the plan is incomplete
* the plan violates repository rules
* the user asks for improvement

---

# 32. Completion Honesty Rule

The agent must be honest about what was done.

Allowed statements:

```txt
Verification not run by agent.
User should run: npx tsc --noEmit.
```

```txt
Implementation completed, but build was not run.
```

```txt
Unable to verify because the environment blocked command execution.
```

Forbidden statements:

```txt
Verified successfully.
```

when verification was not actually run.

---

# 33. Forbidden Default Behaviors

The agent must not do these by default:

1. install packages without approval
2. run `npm install` without explaining why
3. modify `package.json` silently
4. modify `package-lock.json` silently
5. run repeated Git status/diff commands
6. run Git index repair commands
7. run full verification unless requested
8. create architecture plans when the user gave an approved plan
9. refactor unrelated files
10. scan unrelated folders
11. continue to future chunks without approval in Strict Mode
12. claim verification passed when verification was delegated to the user
13. create public registration
14. create public threat dashboards
15. expose raw logs broadly
16. implement future modules early

---

# END

```

```
