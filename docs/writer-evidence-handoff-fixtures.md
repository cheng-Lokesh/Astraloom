# Audit/Idempotency Evidence Handoff Fixtures

Current implementation status: fixture-only evidence handoff layer.

This document defines how future audit events and idempotency rows should reference request evidence after request hashing/redaction, but before any real persistence exists.

It is read-only and diagnostic-only.

## Active Routes

- `/server-writers/evidence`: bilingual evidence handoff fixture page.
- `/api/system-writers/evidence-handoff`: read-only evidence handoff API and blocked probe API.

## Current Safety State

The evidence handoff API currently returns:

- `safeMode=true`
- `readOnly=true`
- `handoffMode=fixture_only`
- `futureAuditTableName=writer_audit_events`
- `futureIdempotencyTableName=writer_idempotency_keys`
- `wouldPersistEvidence=false`
- `wouldStoreRawPayload=false`
- `wouldStorePrivateNarrative=false`
- `wouldStoreSecrets=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldWriteRows=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`

This means the app can show how future records should reference redacted request evidence, but it cannot store evidence, write audit rows, reserve idempotency keys, or execute a writer.

## Handoff Contents

Each fixture is derived from:

- Request hashing/redaction fixtures.
- The read-only audit event model.
- The read-only idempotency registry model.

Each handoff fixture includes:

- `requestHash`
- optional `userIdHash`
- `redactedEvidenceRef`
- `sourceRedactionFixtureRef`
- audit evidence draft for `writer_audit_events`
- idempotency evidence draft for `writer_idempotency_keys`
- target tables
- redaction counts
- forbidden-field checks
- write-block checks

The handoff layer references the redacted preview by deterministic ref. It does not copy raw request payloads.

## Probe Behavior

`POST /api/system-writers/evidence-handoff` accepts:

```json
{
  "contractId": "consent_event_record"
}
```

Expected result:

- `blocked=true`
- `handoffMode=fixture_only`
- `requestHash` is present.
- `redactedEvidenceRef` is present.
- `wouldPersistEvidence=false`
- `wouldStoreRawPayload=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKey=false`
- `wouldWriteIdempotencyRows=false`
- `wouldCreateServiceRoleClient=false`
- `wouldWriteRows=false`

The probe returns checks for the selected fixture. It does not persist evidence, reserve a key, create a service-role client, or execute a writer.

## Hard Rules

- Do not persist evidence.
- Do not store raw payloads.
- Do not store raw private narrative.
- Do not store secrets, tokens, provider keys, webhook secrets, or service-role values.
- Do not write audit rows.
- Do not reserve or mutate idempotency keys.
- Do not create a Supabase service-role client.
- Do not perform insert, update, upsert, delete, RPC, or storage operations.
- Do not call AI providers.
- Do not call Stripe.
- Do not unlock reports.
- Do not execute future writers.

## Implemented Migration Proposal Step

The audit/idempotency migration proposal is now defined at:

- `/server-writers/migration`
- `/api/system-writers/migration-proposal`
- `docs/writer-migration-proposal.md`

It drafts the future schema for:

- `writer_audit_events`
- `writer_idempotency_keys`

The proposal remains read-only. It does not create migration files, apply migrations, create tables, alter tables, write rows, reserve keys, or enable service-role writes.

## Implemented Migration Review Step

The audit/idempotency migration review checklist is now defined at:

- `/server-writers/migration-review`
- `/api/system-writers/migration-review`
- `docs/writer-migration-review-checklist.md`

It does not approve, create, or apply any migration.

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

It remains read-only and does not create tables, apply SQL, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

