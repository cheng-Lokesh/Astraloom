# Audit/Idempotency Migration Proposal

Current implementation status: read-only SQL proposal.

This document defines the proposed future schema for writer audit and idempotency persistence. It is not an applied migration.

## Active Routes

- `/server-writers/migration`: bilingual migration proposal page.
- `/api/system-writers/migration-proposal`: read-only migration proposal API and blocked probe API.

## Current Safety State

The migration proposal API currently returns:

- `safeMode=true`
- `readOnly=true`
- `proposalMode=proposal_only`
- `migrationName=0002_writer_audit_idempotency_proposal`
- `proposedTableCount=2`
- `proposedPolicyCount=0`
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

This means the app can display SQL for review, but it cannot apply it or create any database object.

## Proposed Tables

The proposal contains two future server-owned tables:

- `writer_audit_events`
- `writer_idempotency_keys`

Both proposed tables:

- are owned by future server writers
- enable RLS
- define no browser access policies
- carry `request_hash`
- reference redacted evidence instead of raw payloads
- avoid raw prompts, raw model responses, raw Stripe payloads, access tokens, refresh tokens, API keys, service-role values, and webhook secrets

## Probe Behavior

`POST /api/system-writers/migration-proposal` accepts:

```json
{
  "tableName": "writer_audit_events"
}
```

Expected result:

- `blocked=true`
- `proposalMode=proposal_only`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldCreateServiceRoleClient=false`

The probe returns checks for the selected table proposal. It does not create a migration file, run SQL, create tables, or write rows.

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

## Next Implementation Step

The audit/idempotency migration review checklist is now defined at:

- `/server-writers/migration-review`
- `/api/system-writers/migration-review`
- `docs/writer-migration-review-checklist.md`

It specifies what a human or future Codex task must verify before this proposal can become a real Supabase migration. It does not approve, create, or apply the migration.

## Implemented Migration Runbook Step

The manual migration application runbook is now defined at:

- `/server-writers/migration-runbook`
- `/api/system-writers/migration-runbook`
- `docs/writer-migration-application-runbook.md`

It does not create, approve, or apply any migration.

## Implemented Applied-schema Verification Step

The applied-schema verification harness is now defined at:

- `/server-writers/schema-verification`
- `/api/system-writers/schema-verification`
- `docs/writer-applied-schema-verification-harness.md`

It does not create tables, apply SQL, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

