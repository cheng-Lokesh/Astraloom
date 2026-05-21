# Applied-schema Verification Harness

Current implementation status: public read-only probe plus manual verification checklist.

This document defines how the app can safely inspect signals after a future human applies the audit/idempotency migration. It does not apply SQL and does not prove privileged database state by itself.

## Active Routes

- `/server-writers/schema-verification`: bilingual applied-schema verification page.
- `/api/system-writers/schema-verification`: read-only schema verification API and blocked probe API.

## Current Safety State

The schema verification API currently returns:

- `safeMode=true`
- `readOnly=true`
- `verificationMode=public_readonly_probe_only`
- `manualDatabaseCheckRequired=true`
- `publicProbeCanProveTablePresence=false`
- `publicProbeCanProveRls=false`
- `publicProbeCanProvePolicyAbsence=false`
- `publicProbeCanProveZeroRows=false`
- `schemaVerified=false`
- `readyForWriterImplementation=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldAlterExistingTables=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`

This means the app can run a public Supabase REST signal check, but it cannot verify privileged schema state or approve writer implementation.

## What It Can Check

Using only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the harness can attempt a non-privileged REST probe for:

- `writer_audit_events`
- `writer_idempotency_keys`

The probe result is a signal only:

- `not_detected`: the table was not found through public REST, or the migration has not been applied.
- `blocked_or_unknown`: the public path was blocked or ambiguous.
- `detected_publicly_reachable`: the table endpoint responded publicly and requires manual RLS/policy review.
- `network_error`: the public probe failed due to network or timeout.

## What Still Requires Manual Database Evidence

The harness cannot prove these with a publishable key:

- Table existence in `public`.
- RLS enabled on both writer-owned tables.
- Zero browser policies.
- Zero rows before real writer implementation.

The page displays manual SQL checks for a human database reviewer. Those SQL snippets are not executed by the app.

## Probe Behavior

`POST /api/system-writers/schema-verification` accepts:

```json
{
  "tableName": "writer_audit_events"
}
```

Expected result:

- `blocked=true`
- `verificationMode=public_readonly_probe_only`
- `manualDatabaseCheckRequired=true`
- `schemaVerified=false`
- `readyForWriterImplementation=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldCreateServiceRoleClient=false`

The probe returns public signals and manual checks. It does not create tables, apply SQL, write rows, or use a service-role client.

## Hard Rules

- Do not create a new `supabase/migrations/*.sql` file in this stage.
- Do not apply SQL.
- Do not create tables.
- Do not alter existing tables.
- Do not use a service-role client.
- Do not read or serialize service-role secret values.
- Do not write audit rows.
- Do not reserve or mutate idempotency keys.
- Do not call AI providers.
- Do not call Stripe.
- Do not treat a public REST signal as production readiness.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

The persistence dry-run gate, persistence adapter design, implementation review checklist, fixture harness, no-go packet, implementation proposal scaffold, acceptance test matrix, approval packet, branch preflight checklist, dry-run diff contract, patch review packet, owner signoff packet, release no-go packet, human go/no-go runbook, and external approval archive checklist now exist. The implementation authorization no-go decision packet now exists. The next step should remain read-only and should define an implementation authorization remediation plan before any adapter code can write audit rows, reserve idempotency keys, create a service-role client, or apply SQL.

