# Writer Idempotency Registry Model

Current implementation status: read-only idempotency contract layer.

This document defines how future system writer attempts should reserve, reuse, reject, and expire idempotency keys before any real service-role write exists.

## Active Routes

- `/server-writers/idempotency`: bilingual read-only idempotency model page.
- `/api/system-writers/idempotency`: read-only idempotency model API.

## Current Safety State

The idempotency model currently returns:

- `safeMode=true`
- `readOnly=true`
- `wouldReserveKeys=false`
- `wouldWriteRegistryRows=false`
- `migrationIncluded=false`
- `futureTableName=writer_idempotency_keys`

This means no migration is created, no key is reserved, and no registry row is written.

## Future Table

Future table name:

```text
writer_idempotency_keys
```

Do not add this table until rollback/compensation behavior and rollout gates are also finalized.

## Required Fields

Future idempotency rows should include:

- `idempotencyKey`
- `contractId`
- `scope`
- `requestHash`
- `status`
- `lockedUntil`
- `resultRef`
- `auditEventId`
- `createdAt`
- `updatedAt`
- `expiresAt`

## Core Rules

- Keys must be generated or verified server-side from trusted context.
- A service-role write must never happen before the key is reserved.
- Same key and same request hash should replay the existing result.
- Same key and different request hash should be rejected as `conflict_detected`.
- Pending locks should return retry status until expired.
- Expired pending locks require audit review before retry.
- Payment and consent keys require stricter retention than ordinary generated artifact keys.
- Browser code must not reserve, mutate, or delete keys.

## Next Implementation Step

The read-only rollback compensation model is now defined at:

- `/server-writers/rollback`
- `/api/system-writers/rollback`
- `docs/writer-rollback-compensation-model.md`

The read-only writer rollout checklist is now defined at:

- `/server-writers/rollout`
- `/api/system-writers/rollout`
- `docs/writer-rollout-checklist.md`

## Next Implementation Step

The diagnostic service-role isolation test harness is now defined at:

- `/server-writers/isolation`
- `/api/system-writers/service-role-isolation`
- `docs/service-role-isolation-test-harness.md`

It remains inert:

- No rollback row is written.
- No generated artifact is mutated.
- No payment or consent history is deleted.
- No service-role client is created.
- No AI or Stripe call is made.

## Next Implementation Step

The inert server-only writer module stubs are now defined at:

- `/server-writers/stubs`
- `/api/system-writers/stubs`
- `docs/server-writer-module-stubs.md`

They do not reserve idempotency keys or import any privileged client factory.

## Implemented Payload Parity Step

The writer payload parity fixtures are now defined at:

- `/server-writers/payloads`
- `/api/system-writers/payload-parity`
- `docs/writer-payload-parity-fixtures.md`

They do not reserve idempotency keys or create real writer implementations.

## Implemented Request Evidence Step

Request hashing and redaction fixtures are now defined at:

- `/server-writers/redaction`
- `/api/system-writers/request-redaction`
- `docs/request-hashing-redaction-fixtures.md`

They do not reserve idempotency keys, but they prepare deterministic request-hash evidence.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at:

- `/server-writers/evidence`
- `/api/system-writers/evidence-handoff`
- `docs/writer-evidence-handoff-fixtures.md`

They do not reserve idempotency keys, but they show how future idempotency records compare `requestHash` values.

## Implemented Migration Proposal Step

The read-only migration proposal for `writer_audit_events` and `writer_idempotency_keys` is now defined at:

- `/server-writers/migration`
- `/api/system-writers/migration-proposal`
- `docs/writer-migration-proposal.md`

It does not create migration files, apply SQL, create tables, alter tables, write audit rows, reserve idempotency keys, create a service-role client, call AI, or call Stripe.

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

It does not create tables, apply SQL, reserve idempotency keys, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

