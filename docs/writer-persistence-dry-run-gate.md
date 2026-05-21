# Audit/idempotency Persistence Dry-run Gate

Current implementation status: read-only persistence gate with all real persistence blocked.

This document defines how the app classifies future audit writes, idempotency key reservations, and evidence persistence before any real server-owned write path exists. It consumes existing schema verification, audit model, idempotency model, and evidence handoff fixtures, but it does not persist anything.

## Active Routes

- `/server-writers/persistence-dry-run`: bilingual persistence dry-run gate page.
- `/api/system-writers/persistence-dry-run`: read-only persistence gate API and blocked probe API.

## Current Safety State

The persistence dry-run API currently returns:

- `safeMode=true`
- `readOnly=true`
- `gateMode=audit_idempotency_persistence_dry_run_only`
- `schemaVerified=false`
- `readyForWriterImplementation=false`
- `manualDatabaseCheckRequired=true`
- `auditPersistenceAllowed=false`
- `idempotencyReservationAllowed=false`
- `evidencePersistenceAllowed=false`
- `allPersistenceAttemptsBlocked=true`
- `wouldPersistEvidence=false`
- `wouldStoreRawPayload=false`
- `wouldStorePrivateNarrative=false`
- `wouldStoreSecrets=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`

This means the app can show the future persistence decision points, but it cannot execute audit persistence, idempotency reservation, evidence persistence, schema changes, privileged database access, AI calls, Stripe calls, or report unlocking.

## Dry-run Operations

The gate exposes three operation classes:

- `audit_event_write`: future append-only event write to `writer_audit_events`.
- `idempotency_key_reservation`: future reservation/mutation path for `writer_idempotency_keys`.
- `evidence_persistence`: future persistence of redacted evidence references that link request hashes, audit evidence, and idempotency evidence.

Every operation returns:

- `blocked=true`
- `persistenceAllowed=false`
- `manualDatabaseCheckRequired=true`
- `schemaVerified=false`
- `readyForWriterImplementation=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKey=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldCreateServiceRoleClient=false`

## Source Dependencies

This gate depends on earlier read-only stages:

- `/api/system-writers/schema-verification`: public read-only signal source for future writer tables.
- `/api/system-writers/audit`: future audit event model, still inert.
- `/api/system-writers/idempotency`: future idempotency registry model, still inert.
- `/api/system-writers/evidence-handoff`: fixture-only evidence handoff, still inert.

The gate treats all of these as evidence sources only. It does not promote them to write capability.

## Probe Behavior

`POST /api/system-writers/persistence-dry-run` accepts:

```json
{
  "operation": "audit_event_write"
}
```

Allowed operation names:

- `audit_event_write`
- `idempotency_key_reservation`
- `evidence_persistence`

Expected result:

- `blocked=true`
- `gateMode=audit_idempotency_persistence_dry_run_only`
- `allPersistenceAttemptsBlocked=true`
- `persistenceAllowed=false`
- `auditPersistenceAllowed=false`
- `idempotencyReservationAllowed=false`
- `evidencePersistenceAllowed=false`
- `schemaVerified=false`
- `readyForWriterImplementation=false`
- `wouldPersistEvidence=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKey=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`

Invalid request bodies or unknown operations are also blocked and do not execute persistence.

## Blocking Reasons

The gate intentionally returns these blocking codes:

- `manual_schema_verification_required`
- `schema_not_verified`
- `writer_implementation_not_ready`
- `persistence_adapter_not_implemented`
- `service_role_client_forbidden`
- `rollout_approval_missing`

These are not errors. They are the current required state.

## Hard Rules

- Do not create a new `supabase/migrations/*.sql` file in this stage.
- Do not apply SQL.
- Do not create tables.
- Do not alter existing tables.
- Do not use or create a service-role client.
- Do not read or serialize service-role secret values.
- Do not persist request hashes, redacted previews, evidence refs, audit evidence, or idempotency evidence.
- Do not write audit rows.
- Do not reserve, insert, update, upsert, delete, or mutate idempotency keys.
- Do not write idempotency rows.
- Do not call AI providers.
- Do not call Stripe.
- Do not unlock reports.
- Do not treat this gate as production readiness.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

The persistence adapter design, implementation review checklist, fixture harness, no-go packet, implementation proposal scaffold, acceptance test matrix, approval packet, branch preflight checklist, dry-run diff contract, patch review packet, owner signoff packet, release no-go packet, human go/no-go runbook, and external approval archive checklist now exist. The implementation authorization no-go decision packet now exists. The next step should still be read-only and should define an implementation authorization remediation plan before any executable adapter code can be written.

