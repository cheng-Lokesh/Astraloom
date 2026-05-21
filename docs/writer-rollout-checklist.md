# Writer Rollout Checklist

Current implementation status: read-only rollout gate layer plus diagnostic isolation harness and inert server-only writer stubs.

This document defines the exact gates that must pass before any Project MiroFish system writer can perform service-role writes, AI calls, Stripe writes, or report unlocks.

## Active Routes

- `/server-writers/rollout`: bilingual read-only rollout checklist page.
- `/api/system-writers/rollout`: read-only rollout checklist API.
- `/server-writers/isolation`: bilingual diagnostic-only service-role isolation page.
- `/api/system-writers/service-role-isolation`: read-only isolation harness API.
- `/server-writers/stubs`: bilingual inert server-only writer module stubs page.
- `/api/system-writers/stubs`: read-only stubs API.
- `/server-writers/payloads`: bilingual fixture-only payload parity page.
- `/api/system-writers/payload-parity`: read-only payload parity API.
- `/server-writers/redaction`: bilingual fixture-only request hashing and redaction page.
- `/api/system-writers/request-redaction`: read-only redaction API.
- `/server-writers/evidence`: bilingual fixture-only audit/idempotency evidence handoff page.
- `/api/system-writers/evidence-handoff`: read-only evidence handoff API.
- `/server-writers/migration`: bilingual read-only audit/idempotency migration proposal page.
- `/api/system-writers/migration-proposal`: read-only migration proposal API.
- `/server-writers/migration-review`: bilingual read-only audit/idempotency migration review checklist page.
- `/api/system-writers/migration-review`: read-only migration review API.
- `/server-writers/migration-runbook`: bilingual read-only manual migration application runbook page.
- `/api/system-writers/migration-runbook`: read-only migration runbook API.
- `/server-writers/schema-verification`: bilingual read-only applied-schema verification harness page.
- `/api/system-writers/schema-verification`: read-only schema verification API.

## Current Safety State

The rollout checklist currently returns:

- `safeMode=true`
- `readOnly=true`
- `wouldEnableWriters=false`
- `wouldCreateServiceRoleClient=false`
- `wouldWriteRows=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`
- `approvedForProduction=false`
- `allRequiredGatesPassed=false`

This means no production writer is enabled and no privileged operation is performed.

The service-role isolation harness additionally returns:

- `harnessMode=diagnostic_only`
- `wouldImportServerWriter=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldWriteRows=false`

This confirms the current implementation can inspect planned module labels without importing writer modules or creating a privileged client.

The server-only writer stubs additionally return:

- `stubMode=inert_server_only_stub`
- `importsInertServerOnlyStubs=true`
- `wouldImportRealWriterImplementation=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldWriteRows=false`

This confirms every planned writer has a `.server` stub while real writer logic remains absent.

The payload parity layer additionally returns:

- `parityMode=fixture_only`
- `allFixturesAligned=true`
- `wouldExecuteFutureWriter=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldWriteRows=false`

This confirms dry-run samples, inert stub probe requests, and future writer request shapes are aligned before any writer can execute.

The request hashing and redaction layer additionally returns:

- `redactionMode=fixture_only`
- `hashAlgorithm=sha256`
- `canonicalizationVersion=stable_json_v1`
- `wouldPersistRequestHash=false`
- `wouldStoreRawPayload=false`
- `wouldStoreSecrets=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldCreateServiceRoleClient=false`
- `wouldWriteRows=false`

This confirms request evidence can be prepared for review without storing hashes, raw payloads, audit rows, or idempotency rows.

The evidence handoff layer additionally returns:

- `handoffMode=fixture_only`
- `allFixturesReady=true`
- `wouldPersistEvidence=false`
- `wouldStoreRawPayload=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldCreateServiceRoleClient=false`
- `wouldWriteRows=false`

This confirms future audit and idempotency drafts can reference redacted evidence without persisting evidence or enabling writers.

The migration proposal layer additionally returns:

- `proposalMode=proposal_only`
- `allChecksPassed=true`
- `proposedTableCount=2`
- `proposedPolicyCount=0`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`

This confirms future audit and idempotency tables can be reviewed as SQL text without creating any database object.

The migration review layer additionally returns:

- `checklistMode=review_checklist_only`
- `manualApprovalRequired=true`
- `approvedForMigration=false`
- `readyToApplyMigration=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`

This confirms the app can define manual review requirements without approving or applying SQL.

The migration runbook layer additionally returns:

- `runbookMode=manual_application_runbook_only`
- `humanOperatorRequired=true`
- `appCanApplyMigration=false`
- `approvedToApplyMigration=false`
- `shouldApplyMigrationNow=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`

This confirms the app can define manual execution steps without creating, approving, or applying a migration.

The applied-schema verification layer additionally returns:

- `verificationMode=public_readonly_probe_only`
- `manualDatabaseCheckRequired=true`
- `schemaVerified=false`
- `readyForWriterImplementation=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`

This confirms the app can inspect public signals without proving privileged schema state or enabling writer implementation.

## Blocking Gates

No real writer can launch until all blocking gates pass:

- Diagnostic service-role isolation harness is implemented and tested.
- Inert server-only writer module stubs are implemented and tested.
- Dry-run, stub probe, and future writer payload shapes are proven to match through fixture-only checks.
- Request hashing and redaction fixtures are implemented before audit or idempotency persistence.
- Audit/idempotency evidence handoff fixtures are implemented before audit or idempotency persistence.
- Read-only audit/idempotency migration proposal is reviewed before any migration is applied.
- Audit/idempotency migration review checklist is completed before any migration is applied.
- Dry-run payload and real writer payload use the same schema.
- Idempotency reservation is implemented before writes.
- Append-only audit persistence is implemented.
- Rollback or compensation persistence is implemented.
- AI prompt, model, cost, and SafetyVerifier gates are reviewed.
- Stripe webhook signature verification and event idempotency are tested.
- Support, refund, deletion, unsafe-output, and rollback runbooks exist.
- Observability, cost tracking, failure alerts, and manual review queues exist.
- Operator approval records the exact writer, audience, flags, date, rollback path, and abort conditions.

## First Writer Candidate

The checklist treats `consent_event_record` as the lowest-risk future pilot candidate because it is append-only and does not require AI generation, Stripe writes, report unlock, or simulation execution.

This is not an approval to launch it. It only means that, after all shared gates pass, consent event recording should be considered before generated simulation/report writers.

## Explicit Non-goals

- Do not enable service-role writes.
- Do not create a real service-role client.
- Do not reserve idempotency keys.
- Do not write audit rows.
- Do not write compensation rows.
- Do not call AI providers.
- Do not call Stripe.
- Do not unlock reports.
- Do not add browser insert/update/delete policies for generated or payment-owned tables.

## Implemented Request Evidence Step

Request hashing and redaction fixtures are now defined.

They remain inert:

- They add deterministic request hash examples and redacted payload previews.
- They add sensitive-key removal diagnostics for future audit and idempotency records.
- They do not create a privileged Supabase client.
- They do not perform insert, update, upsert, delete, RPC, storage, AI, Stripe, or report-unlock operations.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined without writing audit rows or reserving keys.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined without applying migrations or enabling writes.

## Implemented Migration Review Step

The audit/idempotency migration review checklist is now defined before any proposed SQL is applied.

## Implemented Migration Runbook Step

The manual migration application runbook is now defined before any proposed SQL is applied.

## Implemented Applied-schema Verification Step

The applied-schema verification harness is now defined before any writer implementation proceeds.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

