# Service-role Isolation Test Harness

Current implementation status: diagnostic-only isolation harness.

This document defines the boundary test layer that sits between the disabled service-role adapter and any future server-only writer modules. It is intentionally inert.

## Active Routes

- `/server-writers/isolation`: bilingual diagnostic page for planned writer module isolation.
- `/api/system-writers/service-role-isolation`: read-only isolation harness API and blocked probe API.

## Current Safety State

The isolation harness currently returns:

- `safeMode=true`
- `readOnly=true`
- `harnessMode=diagnostic_only`
- `wouldImportServerWriter=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldExposeServiceRoleSecret=false`
- `wouldWriteRows=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`

This means the harness proves planned boundaries through metadata only. It may inspect inert stubs, but it does not import real writer implementations, create a privileged client, read secret values, or execute writes.

## What the Harness Checks

For each system writer contract, the harness exposes:

- Contract id.
- Writer category.
- Target table names.
- Intended future operation.
- Planned server-only module label.
- Whether the module label ends in `.server`.
- Whether client imports are forbidden.
- Whether browser bundle inclusion is forbidden.
- Whether runtime module import is blocked.
- Whether service-role client creation is blocked.
- Whether write paths are blocked.

The per-writer `server_only_import_required` check now passes because the inert `.server` module stubs exist and start with `import "server-only";`.

## Probe Behavior

`POST /api/system-writers/service-role-isolation` accepts:

```json
{
  "contractId": "consent_event_record"
}
```

Expected result:

- `safeMode=true`
- `readOnly=true`
- `blocked=true`
- `wouldImportServerWriter=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldWriteRows=false`
- planned module label is returned as metadata
- structured checks are returned

The probe identifies the planned module label only. It does not dynamically import the module and cannot run writer code.

## Hard Rules

- Do not create a Supabase service-role client in this harness.
- Do not import future writer implementation modules from this harness.
- Do not read, serialize, log, or return service-role secret values.
- Do not perform insert, update, upsert, delete, RPC, or storage operations.
- Do not call AI providers.
- Do not call Stripe.
- Do not grant payment entitlement.
- Do not unlock reports.
- Do not write audit rows.
- Do not reserve idempotency keys.
- Do not write compensation rows.

## Next Implementation Step

The inert server-only writer module stubs are now defined at:

- `/server-writers/stubs`
- `/api/system-writers/stubs`
- `docs/server-writer-module-stubs.md`

Those stubs:

- Live in `.server.ts` files.
- Start with `import "server-only";`.
- Export blocked metadata or blocked probe functions only.
- Return `wouldCreateServiceRoleClient=false` and `wouldWrite=false`.
- Avoid importing any Supabase service-role client factory.
- Avoid insert, update, upsert, delete, RPC, storage, AI, Stripe, entitlement, audit, idempotency, rollback, and report-unlock operations.

## Implemented Payload Parity Step

The writer payload parity fixtures are now defined at:

- `/server-writers/payloads`
- `/api/system-writers/payload-parity`
- `docs/writer-payload-parity-fixtures.md`

## Implemented Request Evidence Step

Request hashing and redaction fixtures are now defined at:

- `/server-writers/redaction`
- `/api/system-writers/request-redaction`
- `docs/request-hashing-redaction-fixtures.md`

They let future audit and idempotency records reference request evidence without storing raw private text or secrets.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at:

- `/server-writers/evidence`
- `/api/system-writers/evidence-handoff`
- `docs/writer-evidence-handoff-fixtures.md`

They do not create a service-role client or execute writers.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined at:

- `/server-writers/migration`
- `/api/system-writers/migration-proposal`
- `docs/writer-migration-proposal.md`

It remains proposal-only and cannot create migration files, apply SQL, create tables, alter tables, write rows, write audit rows, reserve idempotency keys, or create a service-role client.

## Implemented Migration Review Step

The audit/idempotency migration review checklist is now defined at:

- `/server-writers/migration-review`
- `/api/system-writers/migration-review`
- `docs/writer-migration-review-checklist.md`

It remains read-only and does not approve, create, or apply any migration.

## Implemented Migration Runbook Step

The manual migration application runbook is now defined at:

- `/server-writers/migration-runbook`
- `/api/system-writers/migration-runbook`
- `docs/writer-migration-application-runbook.md`

It remains read-only and does not create, approve, or apply any migration.

## Implemented Applied-schema Verification Step

The applied-schema verification harness is now defined at:

- `/server-writers/schema-verification`
- `/api/system-writers/schema-verification`
- `docs/writer-applied-schema-verification-harness.md`

It remains read-only and does not create tables, apply SQL, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

Real service-role client creation and real writer execution remain out of scope until the full review gate is passed.

