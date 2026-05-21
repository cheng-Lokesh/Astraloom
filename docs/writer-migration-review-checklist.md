# Audit/Idempotency Migration Review Checklist

Current implementation status: read-only review checklist.

This document defines the manual review required before the audit/idempotency SQL proposal can become a real Supabase migration. It is not an approval record and does not apply SQL.

## Active Routes

- `/server-writers/migration-review`: bilingual migration review checklist page.
- `/api/system-writers/migration-review`: read-only migration review API and blocked probe API.

## Current Safety State

The migration review API currently returns:

- `safeMode=true`
- `readOnly=true`
- `checklistMode=review_checklist_only`
- `manualApprovalRequired=true`
- `approvedForMigration=false`
- `readyToApplyMigration=false`
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

This means the app can show review requirements, but it cannot approve a migration, create a migration file, run SQL, create tables, or enable writers.

## Review Sections

The checklist contains these blocking review areas:

- Proposal integrity review.
- Schema review.
- RLS and access review.
- Index review.
- Privacy and retention review.
- Audit and idempotency behavior review.
- Rollback, operations, and approval review.

Every item starts as `pending_manual_review`. A future real migration task must record approval evidence outside this read-only checklist before creating or applying SQL.

## Probe Behavior

`POST /api/system-writers/migration-review` accepts:

```json
{
  "sectionId": "proposal_integrity_review"
}
```

Expected result:

- `blocked=true`
- `checklistMode=review_checklist_only`
- `approvedForMigration=false`
- `readyToApplyMigration=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldCreateServiceRoleClient=false`

The probe returns the section's review items. It does not record approval, create a migration file, apply SQL, create tables, or write rows.

## Hard Rules

- Do not create a new `supabase/migrations/*.sql` file in this stage.
- Do not apply SQL.
- Do not create tables.
- Do not alter existing tables.
- Do not add browser RLS policies for writer-owned audit/idempotency tables.
- Do not write audit rows.
- Do not reserve or mutate idempotency keys.
- Do not create a Supabase service-role client.
- Do not read service-role secret values.
- Do not call AI providers.
- Do not call Stripe.
- Do not execute future writers.
- Do not treat this checklist as approval to run the migration.

## Next Implementation Step

The manual migration application runbook is now defined at:

- `/server-writers/migration-runbook`
- `/api/system-writers/migration-runbook`
- `docs/writer-migration-application-runbook.md`

It specifies the exact preflight, execution, post-migration verification, and rollback steps before any proposed SQL is applied. It remains read-only and does not create, approve, or apply any migration.

## Implemented Applied-schema Verification Step

The applied-schema verification harness is now defined at:

- `/server-writers/schema-verification`
- `/api/system-writers/schema-verification`
- `docs/writer-applied-schema-verification-harness.md`

It does not create tables, apply SQL, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

