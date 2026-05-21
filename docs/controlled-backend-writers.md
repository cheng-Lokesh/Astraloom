# Controlled Backend Writer Contracts

Current implementation status: read-only contract layer only.

This document is for Codex/VibeCoding execution. It defines the backend writer layer before any service-role writes, AI generation, Stripe writes, or report unlocks are implemented.

## Active Routes

- `/server-writers`: read-only status page for backend writer readiness.
- `/server-writers/contracts`: read-only contract page for system-owned writer design.
- `/api/system-writers/status`: safe status API that returns booleans only.
- `/api/system-writers/contracts`: safe contract API that returns writer metadata only.
- `/server-writers/dry-run`: safe validation page for testing writer request shape.
- `/api/system-writers/dry-run`: safe dry-run API for catalog and request validation.
- `/server-writers/guardrail`: safe policy page for future writer execution rules.
- `/api/system-writers/guardrail`: safe guardrail API for auth context, audit, idempotency, rollback, and rollout policy.
- `/server-writers/adapter`: disabled service-role adapter page.
- `/api/system-writers/service-role-adapter`: inert adapter API that never creates a client or writes rows.
- `/server-writers/audit`: read-only audit event model page.
- `/api/system-writers/audit`: read-only audit model API that never writes audit rows.
- `/server-writers/idempotency`: read-only idempotency registry model page.
- `/api/system-writers/idempotency`: read-only idempotency model API that never reserves keys.
- `/server-writers/rollback`: read-only rollback compensation model page.
- `/api/system-writers/rollback`: read-only rollback model API that never writes compensation rows or mutates history.
- `/server-writers/rollout`: read-only rollout checklist page.
- `/api/system-writers/rollout`: read-only rollout API that never enables writers, creates a service-role client, writes rows, calls AI, calls Stripe, or unlocks reports.
- `/server-writers/isolation`: diagnostic-only service-role isolation page.
- `/api/system-writers/service-role-isolation`: read-only isolation API that never imports writer modules, creates a service-role client, reads secret values, or writes rows.
- `/server-writers/stubs`: inert server-only writer module stubs page.
- `/api/system-writers/stubs`: read-only stubs API that imports inert `.server` modules but never imports real writer implementations, creates a service-role client, reads secrets, or writes rows.
- `/server-writers/payloads`: fixture-only payload parity page.
- `/api/system-writers/payload-parity`: read-only payload parity API that aligns dry-run samples, stub probes, and future writer request shapes without executing writers.
- `/server-writers/redaction`: fixture-only request hashing and redaction page.
- `/api/system-writers/request-redaction`: read-only redaction API that creates deterministic hashes and redacted previews without persisting request evidence.
- `/server-writers/evidence`: fixture-only audit/idempotency evidence handoff page.
- `/api/system-writers/evidence-handoff`: read-only evidence handoff API that prepares future audit and idempotency drafts without writing rows.
- `/server-writers/migration`: read-only audit/idempotency migration proposal page.
- `/api/system-writers/migration-proposal`: read-only migration proposal API that displays proposed SQL without creating migration files, applying SQL, creating tables, or writing rows.
- `/server-writers/migration-review`: read-only audit/idempotency migration review checklist page.
- `/api/system-writers/migration-review`: read-only migration review API that defines manual approval requirements without approving or applying SQL.
- `/server-writers/migration-runbook`: read-only manual migration application runbook page.
- `/api/system-writers/migration-runbook`: read-only runbook API that defines human execution steps without applying SQL.
- `/server-writers/schema-verification`: read-only applied-schema verification harness page.
- `/api/system-writers/schema-verification`: read-only schema verification API that uses public probes and manual checks without proving writer readiness.
- `/server-writers/persistence-dry-run`: read-only audit/idempotency persistence dry-run gate page.
- `/api/system-writers/persistence-dry-run`: read-only persistence gate API that classifies future audit, idempotency, and evidence persistence attempts while keeping them blocked.
- `/server-writers/persistence-adapter`: read-only persistence adapter design page.
- `/api/system-writers/persistence-adapter`: read-only adapter design API that defines future method shapes, transaction order, failure modes, and compensation handoff without implementing them.

These routes must never serialize `SUPABASE_SERVICE_ROLE_KEY`, provider API keys, Stripe secrets, access tokens, refresh tokens, or webhook secrets.

## Current Global Gate State

Keep these disabled until a later review:

```env
SUPABASE_SERVICE_ROLE_KEY=
ENABLE_SYSTEM_WRITERS=false
ENABLE_AI_GENERATION=false
ENABLE_STRIPE_WRITES=false
STRIPE_SECRET_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

The current contract layer can be inspected, but it cannot write data.

## Writer Contracts

### 1. Agent profile generation

- Contract id: `agent_profile_generation`
- Target table: `agent_profiles`
- Trigger: seed context and confirmed key people exist for the same user.
- Required flags: `ENABLE_SYSTEM_WRITERS`, `ENABLE_AI_GENERATION`
- Idempotency key: `agent_profile_generation:{userId}:{seedContextId}`
- Product purpose: create the user's digital self, optional parallel selves, and confirmed NPC profiles.
- MVP boundary: browser previews can exist locally, but persistent agent profiles are server-owned.

### 2. Relation edge generation

- Contract id: `relation_edge_generation`
- Target table: `relation_edges`
- Trigger: agent profiles exist for the active seed context.
- Required flags: `ENABLE_SYSTEM_WRITERS`, `ENABLE_AI_GENERATION`
- Idempotency key: `relation_edge_generation:{userId}:{seedContextId}`
- Product purpose: create read-only trust, friction, dependency, and influence edges.
- MVP boundary: no graph edge sliders, no manual trust/enemy scores, and no browser writes.

### 3. Simulation run creation

- Contract id: `simulation_run_create`
- Target table: `simulation_runs`
- Trigger: user starts an allowed simulation from an approved seed context.
- Required flags: `ENABLE_SYSTEM_WRITERS`, `ENABLE_AI_GENERATION`
- Idempotency key: `simulation_run_create:{userId}:{seedContextId}:{timeWindow}`
- Product purpose: create the run container for a micro-agent future simulation.
- MVP boundary: run creation stays blocked until cost, prompt, safety, and backend gates are complete.

### 4. Event tick append

- Contract id: `event_tick_append`
- Target table: `events`
- Trigger: server-owned simulation executor advances one tick.
- Required flags: `ENABLE_SYSTEM_WRITERS`, `ENABLE_AI_GENERATION`
- Idempotency key: `event_tick_append:{runId}:{tickIndex}`
- Product purpose: append ordered micro-events generated by agent interactions.
- MVP boundary: free daily weather must stay low-cost and cannot run background NPC scans.

### 5. Claim generation

- Contract id: `claim_generation`
- Target table: `claims`
- Trigger: a simulation run passes SafetyVerifier and report assembly begins.
- Required flags: `ENABLE_SYSTEM_WRITERS`, `ENABLE_AI_GENERATION`
- Idempotency key: `claim_generation:{runId}:{claimSchemaVersion}`
- Product purpose: produce evidence-backed report claims.
- MVP boundary: every claim needs evidence references and must avoid deterministic fate language.

### 6. Report generation

- Contract id: `report_generation`
- Target table: `reports`
- Trigger: claims, entitlement, and safety checks pass for a report.
- Required flags: `ENABLE_SYSTEM_WRITERS`, `ENABLE_AI_GENERATION`
- Idempotency key: `report_generation:{runId}:{reportTemplateVersion}`
- Product purpose: assemble locked or unlocked user reports.
- MVP boundary: browser sync cannot unlock reports or grant access.

### 7. Payment entitlement record

- Contract id: `payment_entitlement_record`
- Target table: `payments`
- Trigger: verified Stripe webhook or server-side payment callback.
- Required flags: `ENABLE_SYSTEM_WRITERS`, `ENABLE_STRIPE_WRITES`
- Idempotency key: `payment_entitlement_record:{stripeEventId}`
- Product purpose: record paid entitlement.
- MVP boundary: no browser-created entitlement records.

### 8. Consent event record

- Contract id: `consent_event_record`
- Target table: `consent_events`
- Trigger: user accepts, updates, exports, or revokes a privacy/safety consent state.
- Required flags: `ENABLE_SYSTEM_WRITERS`
- Idempotency key: `consent_event_record:{userId}:{consentType}:{policyVersion}`
- Product purpose: append privacy and consent audit events.
- MVP boundary: consent events are append-only and revocation does not delete audit history.

## Implemented Dry-run Behavior

The server-only dry-run endpoint now:

- Accepts test payloads for writer contracts.
- Validate user id, seed/run/report references, required fields, and feature flags.
- Returns `wouldWrite=false`.
- Returns structured validation failures.
- Rejects unknown contract ids.
- Rejects missing required input keys.
- Warns on unexpected input keys.
- Rejects sensitive input key names such as secret, token, password, API key, or service-role.
- Reports service-role and feature-flag gate blocks.
- Never initializes a service-role Supabase client while `SUPABASE_SERVICE_ROLE_KEY` is blank.
- Never calls AI model APIs.
- Never calls Stripe APIs.
- Never inserts, updates, deletes, unlocks reports, or grants entitlement.

## Implemented Guardrail Step

Before any real writer exists, the guardrail layer defines:

- Auth context requirements for each writer.
- Service-role client isolation rules.
- Audit log schema and retention behavior.
- Idempotency conflict behavior.
- Rollback and retry strategy.
- Operator rollout checklist for enabling one writer at a time.
- Exact rule that a writer can only move from dry-run to real write after safety, cost, RLS, and product gates are approved.

## Implemented Adapter Step

The disabled service-role adapter boundary exists and remains inert while service-role, system writer, AI, and Stripe gates are disabled.

## Implemented Audit Step

The audit event contracts for future writer attempts are defined as read-only metadata and sample blocked events. They do not write audit rows.

## Implemented Idempotency Step

The idempotency registry contracts are defined as read-only metadata and sample reserved records. They do not reserve keys.

## Implemented Rollback Step

The rollback compensation contracts are defined as read-only metadata and sample compensation records. They do not write compensation rows and do not mutate generated, payment, or consent history.

## Next Rollout Step

The rollout checklist is now defined as read-only metadata and per-writer launch plans. It does not enable writers, create a service-role client, write rows, call AI, call Stripe, or unlock reports.

## Implemented Service-role Isolation Step

The service-role isolation test harness is now defined as diagnostic-only metadata and blocked probes. It does not import real writer implementations, create a service-role client, read secret values, write rows, call AI, call Stripe, unlock reports, write audit rows, reserve idempotency keys, or write compensation rows.

## Implemented Server-only Stub Step

Inert server-only writer module stubs now exist for all eight contracts. They start with `import "server-only";`, return blocked metadata only, and do not create a privileged client or execute any write path.

## Implemented Payload Parity Step

Writer payload parity fixtures are now defined. They keep dry-run payloads, stub probes, and future writer request shapes aligned without creating real writers.

## Implemented Hashing and Redaction Step

Request hashing and redaction fixtures are now defined. They create deterministic SHA-256 hashes over redacted previews while avoiding raw private text, secrets, tokens, provider keys, and service-role values.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined. They show how future audit events and idempotency records reference request hashes and redacted evidence without writing rows.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined for `writer_audit_events` and `writer_idempotency_keys`. It displays SQL for review only and does not apply migrations, create tables, alter tables, create a service-role client, write audit rows, or reserve idempotency keys.

## Implemented Migration Review Step

The audit/idempotency migration review checklist is now defined. It states exactly what a human or future Codex task must verify before the proposal can become a real Supabase migration, but it does not approve the migration or apply SQL.

## Implemented Migration Runbook Step

The manual migration application runbook is now defined. It covers preflight, approval record, manual execution, post-checks, abort/rollback, and handoff steps without applying SQL.

## Implemented Applied-schema Verification Step

The applied-schema verification harness is now defined. It checks future manually applied audit/idempotency tables in public read-only probe mode and keeps database-level verification manual.

## Implemented Persistence Dry-run Step

The audit/idempotency persistence dry-run gate is now defined. It proves future audit writes, idempotency reservations, and evidence persistence remain blocked while schema verification, service-role isolation, rollout approval, and runtime implementation are incomplete.

## Implemented Persistence Adapter Design Step

The future server-only persistence adapter boundary, transaction order, failure behavior, and rollback behavior are now documented without writing audit rows, reserving idempotency keys, persisting evidence, or creating a service-role client.

## Next Persistence Adapter Review Step

The read-only persistence adapter implementation authorization remediation plan now exists and cites the no-go decision packet without making design-only code executable. The implementation authorization remediation review checklist now exists. The remediation review no-go packet now exists. The read-only implementation authorization reconsideration preflight checklist now exists. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next implementation step should define only a read-only external final decision archive remediation review no-go packet; design-only code must still not become executable.

## No-go Rules

- Do not add insert/update/delete RLS policies for generated/payment tables.
- Do not let browser code write `agent_profiles`, `relation_edges`, `simulation_runs`, `events`, `claims`, `reports`, `payments`, or `consent_events`.
- Do not implement paid deep simulation before cost controls, SafetyVerifier, and Stripe webhook idempotency are reviewed.
- Do not turn free daily weather into background NPC relationship scanning.
- Do not add graph edge weight editing in MVP.
- Do not apply the audit/idempotency migration proposal before the migration review checklist is complete.

