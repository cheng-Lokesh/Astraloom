# Request Hashing and Redaction Fixtures

Current implementation status: fixture-only request evidence layer.

This document defines how future writer attempts should prepare audit-safe and idempotency-safe request evidence before any real persistence exists.

It is read-only and diagnostic-only.

## Active Routes

- `/server-writers/redaction`: bilingual request hashing and redaction fixture page.
- `/api/system-writers/request-redaction`: read-only request redaction API and blocked probe API.

## Current Safety State

The request redaction API currently returns:

- `safeMode=true`
- `readOnly=true`
- `redactionMode=fixture_only`
- `hashAlgorithm=sha256`
- `canonicalizationVersion=stable_json_v1`
- `wouldPersistRequestHash=false`
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

This means the app can show deterministic request hashes and redacted previews, but it cannot store them or use them to execute a writer.

## Redaction Rules

Each fixture is derived from the existing payload parity dry-run sample for one writer contract.

The redaction layer:

- Serializes redacted previews with stable sorted-key JSON before hashing.
- Creates `sha256:<hex>` request hashes.
- Hashes identifiers such as user ids, run ids, seed context ids, Stripe ids, and claim ids.
- Hashes evidence references, snapshots, and state references.
- Keeps reviewed safe metadata such as contract id, track, time window, versions, SKU, currency, amount, consent type, and policy version.
- Replaces free-text or prompt-like values with short redacted markers.
- Replaces secret, token, password, API key, service-role, and webhook-like keys with `[redacted:sensitive]`.
- Stores no raw request payload, private narrative, secret, token, or provider key.

## Probe Behavior

`POST /api/system-writers/request-redaction` accepts:

```json
{
  "contractId": "consent_event_record"
}
```

Expected result:

- `blocked=true`
- `redactionMode=fixture_only`
- `requestHash` is present.
- `wouldPersistRequestHash=false`
- `wouldStoreRawPayload=false`
- `wouldStorePrivateNarrative=false`
- `wouldStoreSecrets=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKey=false`
- `wouldCreateServiceRoleClient=false`
- `wouldWriteRows=false`

The probe returns the fixture checks for that contract. It does not persist the hash, reserve a key, create a service-role client, or execute a writer.

## Hard Rules

- Do not store raw request payloads.
- Do not store raw private narrative text.
- Do not store secrets, tokens, provider keys, webhook secrets, or service-role values.
- Do not write audit rows.
- Do not reserve or mutate idempotency keys.
- Do not create a Supabase service-role client.
- Do not perform insert, update, upsert, delete, RPC, or storage operations.
- Do not call AI providers.
- Do not call Stripe.
- Do not unlock reports.
- Do not execute future writers.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at `/server-writers/evidence` and `/api/system-writers/evidence-handoff`.

They prove how future audit events and idempotency rows will reference:

- `requestHash`
- `userIdHash`
- redacted evidence preview references
- writer contract id
- idempotency key template
- blocked attempt summary

Real audit persistence, idempotency persistence, service-role client creation, and real writer execution remain out of scope.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined at `/server-writers/migration` and `/api/system-writers/migration-proposal`.

It proposes future schemas for `writer_audit_events` and `writer_idempotency_keys` without creating a migration file, applying SQL, creating tables, writing audit rows, reserving idempotency keys, or enabling writers.

## Implemented Migration Review Step

The audit/idempotency migration review checklist is now defined at `/server-writers/migration-review` and `/api/system-writers/migration-review`.

It remains read-only and does not approve, create, or apply any migration.

## Implemented Migration Runbook Step

The manual migration application runbook is now defined at `/server-writers/migration-runbook` and `/api/system-writers/migration-runbook`.

It remains read-only and does not create, approve, or apply any migration.

## Implemented Applied-schema Verification Step

The applied-schema verification harness is now defined at `/server-writers/schema-verification` and `/api/system-writers/schema-verification`.

It remains read-only and does not create tables, apply SQL, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

