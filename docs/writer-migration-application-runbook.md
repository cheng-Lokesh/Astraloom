# Manual Migration Application Runbook

Current implementation status: read-only runbook.

This document defines how a human operator would apply the reviewed audit/idempotency SQL outside the app. It is not an approval record, not a migration file, and not an execution tool.

## Active Routes

- `/server-writers/migration-runbook`: bilingual manual migration application runbook page.
- `/api/system-writers/migration-runbook`: read-only runbook API and blocked probe API.

## Current Safety State

The migration runbook API currently returns:

- `safeMode=true`
- `readOnly=true`
- `runbookMode=manual_application_runbook_only`
- `humanOperatorRequired=true`
- `appCanApplyMigration=false`
- `approvedToApplyMigration=false`
- `shouldApplyMigrationNow=false`
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

This means the app can display the runbook, source SQL hash, and manual boundaries, but it cannot apply SQL or approve execution.

## Runbook Phases

The runbook has six phases:

- Preflight freeze.
- Approval record.
- Manual execution.
- Post-migration checks.
- Abort and rollback.
- Post-run handoff.

All steps are `manualOnly=true` and `status=not_started`. The runbook cannot change database state.

## Probe Behavior

`POST /api/system-writers/migration-runbook` accepts:

```json
{
  "phaseId": "preflight"
}
```

Expected result:

- `blocked=true`
- `runbookMode=manual_application_runbook_only`
- `appCanApplyMigration=false`
- `approvedToApplyMigration=false`
- `shouldApplyMigrationNow=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldCreateServiceRoleClient=false`

The probe returns manual steps for the selected phase. It does not create a migration file, run SQL, create tables, or write rows.

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
- Do not unlock reports.
- Do not treat the runbook as approval to run the migration.

## Next Implementation Step

The applied-schema verification harness is now defined at:

- `/server-writers/schema-verification`
- `/api/system-writers/schema-verification`
- `docs/writer-applied-schema-verification-harness.md`

It is read-only and uses a public REST probe plus manual SQL checklist to verify future audit/idempotency tables. It does not apply SQL, create tables, prove privileged database state, or approve writer implementation.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

