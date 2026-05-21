# Writer Payload Parity Fixtures

Current implementation status: fixture-only payload parity layer.

This document defines the request-shape alignment layer before any real service-role writer exists. It connects:

- Dry-run sample requests.
- Inert server-only stub probe requests.
- Future writer request shapes.

It is read-only and diagnostic-only.

## Active Routes

- `/server-writers/payloads`: bilingual payload parity fixture page.
- `/api/system-writers/payload-parity`: read-only payload parity API and blocked probe API.

## Current Safety State

The payload parity API currently returns:

- `safeMode=true`
- `readOnly=true`
- `parityMode=fixture_only`
- `wouldRunDryRunValidation=true`
- `wouldProbeInertStubs=true`
- `wouldExecuteFutureWriter=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldExposeServiceRoleSecret=false`
- `wouldWriteRows=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteCompensationRows=false`

This means the system may validate shape through existing dry-run logic and compare inert stub probes, but it cannot execute a future writer.

## Fixture Contents

Each fixture includes:

- Contract id.
- Target tables.
- Required feature flags.
- Required input keys.
- Optional input keys.
- Dry-run sample request.
- Stub probe request.
- Future writer request shape.
- Idempotency key template.
- Shape checks.
- Sensitive-key checks.
- Gate-alignment checks.

The future writer request shape is derived from the dry-run required and optional input keys. It is not an executable writer function.

## Probe Behavior

`POST /api/system-writers/payload-parity` accepts:

```json
{
  "contractId": "consent_event_record"
}
```

Expected result:

- `blocked=true`
- `parityMode=fixture_only`
- `wouldRunDryRunValidation=true`
- `wouldProbeInertStub=true`
- `wouldExecuteFutureWriter=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldWriteRows=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`

The probe compares the fixture shape and returns checks. It does not execute a writer.

## Hard Rules

- Do not create real writer request handlers.
- Do not create a Supabase service-role client.
- Do not read or serialize service-role secret values.
- Do not perform insert, update, upsert, delete, RPC, or storage operations.
- Do not call AI providers.
- Do not call Stripe.
- Do not unlock reports.
- Do not write audit rows.
- Do not reserve idempotency keys.
- Do not write compensation rows.
- Do not store raw private narrative text in parity fixtures.

## Implemented Request Evidence Step

Request hashing and redaction fixtures are now defined at `/server-writers/redaction` and `/api/system-writers/request-redaction`.

They prove that future audit and idempotency records can reference:

- Deterministic request hashes.
- Redacted payload previews.
- Sensitive-key removal.
- Private narrative text omission.
- Contract id, target table, and idempotency metadata.

Real audit persistence, idempotency persistence, service-role client creation, and real writer execution remain out of scope.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at `/server-writers/evidence` and `/api/system-writers/evidence-handoff` without persisting evidence or reserving keys.

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

