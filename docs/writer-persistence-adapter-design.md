# Audit/idempotency Persistence Adapter Design

Current implementation status: design-only adapter boundary with all runtime effects blocked.

This document defines the future server-only persistence adapter shape for audit events, idempotency reservations, writer result commits, and compensation handoff. It is intentionally not executable.

## Active Routes

- `/server-writers/persistence-adapter`: bilingual persistence adapter design page.
- `/api/system-writers/persistence-adapter`: read-only adapter design API and blocked probe API.

## Current Safety State

The persistence adapter design API currently returns:

- `safeMode=true`
- `readOnly=true`
- `designMode=persistence_adapter_design_only`
- `schemaVerified=false`
- `readyForWriterImplementation=false`
- `manualDatabaseCheckRequired=true`
- `adapterImplemented=false`
- `adapterCanRun=false`
- `transactionImplementationAllowed=false`
- `allRuntimeEffectsBlocked=true`
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

This means the page can describe the future adapter, but it cannot run a transaction, write data, reserve a key, append audit evidence, create a privileged client, or enable writers.

## Future Adapter Methods

The design defines six future methods:

- `start_persistence_attempt`: validate trusted context, contract id, request hash, idempotency key, and evidence refs before side effects.
- `reserve_idempotency_key`: future atomic reservation/replay/conflict decision for `writer_idempotency_keys`.
- `append_audit_attempt`: future append-only attempt or blocked event for `writer_audit_events`.
- `commit_future_writer_result`: future placeholder boundary for the actual generated/payment/consent/report writer body.
- `finalize_idempotency_result`: future transition from reserved to completed, failed, expired, or conflict_detected.
- `record_compensation_required`: future data-preserving rollback/compensation handoff.

Every method currently returns:

- `canRunNow=false`
- `wouldImportRealWriterImplementation=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldPersistEvidence=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldWriteCompensationRows=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`

## Transaction Order

The future transaction order is documented as:

1. Preflight validation.
2. Idempotency reservation.
3. Attempt audit append.
4. Future writer body.
5. Result audit append.
6. Idempotency finalize.
7. Compensation handoff when needed.

This order is not implemented. The current stage only defines the required ordering so a future implementation can be reviewed against it.

## Failure Modes

The design documents these failure modes:

- `schema_not_verified`
- `duplicate_request`
- `conflicting_request`
- `idempotency_reservation_failed`
- `audit_append_failed`
- `future_writer_failed`
- `compensation_required`
- `rollout_not_approved`

All failure modes are currently `documented_only` and return `wouldWriteRows=false`.

## Probe Behavior

`POST /api/system-writers/persistence-adapter` accepts:

```json
{
  "methodId": "reserve_idempotency_key"
}
```

Allowed method ids:

- `start_persistence_attempt`
- `reserve_idempotency_key`
- `append_audit_attempt`
- `commit_future_writer_result`
- `finalize_idempotency_result`
- `record_compensation_required`

Expected result:

- `blocked=true`
- `designMode=persistence_adapter_design_only`
- `adapterImplemented=false`
- `adapterCanRun=false`
- `transactionImplementationAllowed=false`
- `allRuntimeEffectsBlocked=true`
- `wouldImportRealWriterImplementation=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldPersistEvidence=false`
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

Invalid request bodies or unknown methods are also blocked and do not execute adapter behavior.

## Hard Rules

- Do not create a service-role client in this stage.
- Do not read or serialize service-role secret values.
- Do not implement `persistence-adapter.server.ts` yet.
- Do not import real writer implementations.
- Do not run database transactions.
- Do not insert, update, upsert, delete, or reserve anything.
- Do not persist request hashes, redacted previews, audit evidence, idempotency evidence, or compensation evidence.
- Do not write audit rows.
- Do not reserve or mutate idempotency keys.
- Do not write compensation rows.
- Do not apply SQL or create tables.
- Do not enable writers.
- Do not call AI providers or Stripe.
- Do not unlock reports.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

The implementation review checklist, fixture harness, and no-go packet now live at `docs/writer-persistence-adapter-review-checklist.md`, `docs/writer-persistence-fixture-harness.md`, `docs/writer-persistence-no-go-evidence-packet.md`, `/server-writers/persistence-review`, `/server-writers/persistence-fixtures`, `/server-writers/persistence-no-go`, `/api/system-writers/persistence-review`, `/api/system-writers/persistence-fixtures`, and `/api/system-writers/persistence-no-go`.

The fixture harness now lives at `docs/writer-persistence-fixture-harness.md`, `/server-writers/persistence-fixtures`, and `/api/system-writers/persistence-fixtures`.

The next step should remain read-only and should aggregate review blockers plus fixture assertions before the design-only adapter can become executable server-only code.

