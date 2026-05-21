# Persistence Adapter Implementation Review Checklist

This stage defines the evidence required before the design-only audit/idempotency persistence adapter can become executable server-only code.

It is intentionally review-only:

- It does not implement the adapter.
- It does not create a service-role Supabase client.
- It does not read service-role secrets.
- It does not apply migrations or create tables.
- It does not write audit rows, idempotency rows, compensation rows, evidence rows, generated artifacts, payments, consent records, or report unlocks.
- It does not call AI or Stripe.
- It does not record implementation approval.

## Surfaces

- Page: `/server-writers/persistence-review`
- API: `/api/system-writers/persistence-review`
- Source: `src/lib/server-writers/persistence-review.ts`
- Types: `src/types/writer-persistence-review.ts`

## Required Response Invariants

The GET payload must keep:

- `safeMode=true`
- `readOnly=true`
- `reviewMode=persistence_adapter_implementation_review_only`
- `sourceDesignMode=persistence_adapter_design_only`
- `schemaVerified=false`
- `adapterImplemented=false`
- `adapterImplementationApproved=false`
- `adapterImplementationAllowed=false`
- `implementationReviewComplete=false`
- `allBlockingEvidenceReady=false`
- `allRuntimeEffectsBlocked=true`

The dangerous effect flags must remain false:

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

## Checklist Categories

The review checklist covers:

- `schema_evidence`: manual proof that the future audit/idempotency schema exists and is safe.
- `service_role_isolation`: proof that privileged credentials stay server-only and are never serialized.
- `transaction_tests`: proof that future adapter phases execute in the approved order.
- `idempotency_tests`: proof for replay, conflict, expiration, retry, and failed-finalize behavior.
- `audit_redaction_tests`: proof that audit records store hashes and refs only, never raw payloads or secrets.
- `rollback_compensation_tests`: proof that compensation preserves generated, payment, consent, audit, and idempotency history.
- `rollout_approval`: explicit operator approval for exact writer scope, audience, abort conditions, and rollback.
- `observability_support`: support-facing blocked-code and escalation evidence.
- `no_go_security`: final security blocker before executable adapter code can be proposed.
- `source_invariants`: evidence that the current review and source adapter remain inert.

## Probe Behavior

POST accepts:

```json
{ "itemId": "schema_manual_evidence_package_missing" }
```

Every probe returns `blocked=true`. A known item returns that item and its required evidence. An unknown item or invalid body returns the full checklist. No probe creates approval, writes rows, reserves keys, reads secrets, calls AI, calls Stripe, or unlocks reports.

## Next Stage

The fixture harness now lives at `docs/writer-persistence-fixture-harness.md`, `/server-writers/persistence-fixtures`, and `/api/system-writers/persistence-fixtures`.

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds. It should verify remediation ownership, safe external evidence requirements, reviewer gates, blocked-code resolution paths, and redaction rules while still avoiding app-side approval storage, release decision writes, feature flags, deployments, production writer execution, patch acceptance, branch creation, file mutation, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, and report unlocks.

