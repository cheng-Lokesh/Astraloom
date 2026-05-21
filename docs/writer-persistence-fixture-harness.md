# Persistence Adapter Fixture Test Harness

This stage defines static fixtures for the implementation-review evidence required before a future audit/idempotency persistence adapter can become executable.

It is intentionally fixture-only:

- It does not implement the adapter.
- It does not run database transactions.
- It does not create a privileged Supabase client.
- It does not read privileged secrets.
- It does not apply migrations or create tables.
- It does not write audit rows, idempotency rows, compensation rows, evidence rows, generated artifacts, payments, consent records, or report unlocks.
- It does not call AI or Stripe.
- It does not approve implementation.

## Surfaces

- Page: `/server-writers/persistence-fixtures`
- API: `/api/system-writers/persistence-fixtures`
- Source: `src/lib/server-writers/persistence-fixtures.ts`
- Types: `src/types/writer-persistence-fixture-harness.ts`

## Required Response Invariants

The GET payload must keep:

- `safeMode=true`
- `readOnly=true`
- `fixtureMode=persistence_adapter_fixture_harness_only`
- `sourceReviewMode=persistence_adapter_implementation_review_only`
- `fixtureHarnessReady=true`
- `fixtureEvidenceOnly=true`
- `schemaVerified=false`
- `adapterImplemented=false`
- `adapterImplementationApproved=false`
- `adapterImplementationAllowed=false`
- `implementationReviewComplete=false`
- `allBlockingEvidenceReady=false`
- `allRuntimeEffectsBlocked=true`

The dangerous effect flags must remain false:

- `wouldRunTransaction=false`
- `wouldImportRealWriterImplementation=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldPersistEvidence=false`
- `wouldStoreRawPayload=false`
- `wouldStoreSecrets=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldWriteCompensationRows=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldEnableWriters=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`

## Fixture Coverage

The harness defines fixtures for:

- `transaction_order_success_path_fixture`: future phase order for preflight, idempotency, audit, writer body, result audit, and finalize.
- `idempotency_replay_fixture`: same logical key plus same request hash replays existing result.
- `idempotency_conflict_fixture`: same logical key plus different request hash blocks target writes.
- `audit_redaction_fixture`: future audit fields use hashes and references only.
- `rollback_compensation_fixture`: failed writer results route into data-preserving compensation review.
- `rollout_gate_fixture`: writer execution remains blocked until exact rollout scope is approved.
- `service_role_isolation_fixture`: privileged credential access must remain server-only and unbundled.
- `observability_support_fixture`: blocked codes and customer-safe support diagnostics are defined.
- `security_no_go_fixture`: final no-go checks keep implementation blocked until all evidence is approved together.

Every fixture points back to implementation-review item ids from `/api/system-writers/persistence-review`. This prevents fixtures from becoming a separate approval path.

## Probe Behavior

POST accepts:

```json
{ "fixtureId": "transaction_order_success_path_fixture" }
```

Every probe returns `blocked=true`. A known fixture returns that fixture and its assertions. An unknown fixture or invalid body returns the full fixture list. No probe runs adapter code, opens a transaction, creates a privileged client, writes rows, reserves keys, applies migrations, calls AI, calls Stripe, or unlocks reports.

## Next Stage

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds. It should verify remediation ownership, safe external evidence requirements, reviewer gates, blocked-code resolution paths, and redaction rules while still avoiding app-side approval storage, release decision writes, feature flags, deployments, production writer execution, patch acceptance, branch creation, file mutation, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, and report unlocks.

