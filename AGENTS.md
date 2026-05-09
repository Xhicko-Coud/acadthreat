
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
