# Writer Audit Event Model

Current implementation status: read-only audit contract layer.

This document defines how future system writer attempts should be audited before any real service-role write is enabled.

## Active Routes

- `/server-writers/audit`: bilingual read-only audit model page.
- `/api/system-writers/audit`: read-only audit model API.

## Current Safety State

The audit model currently returns:

- `safeMode=true`
- `readOnly=true`
- `wouldWriteAuditRows=false`
- `migrationIncluded=false`
- `futureTableName=writer_audit_events`

This means no migration is created and no audit row is written.

## Future Table

Future table name:

```text
writer_audit_events
```

Do not add this table until the idempotency registry and rollout gates are also defined.

## Required Audit Fields

Future audit rows should include:

- `auditEventId`
- `contractId`
- `lifecycle`
- `actorContext`
- `userIdHash`
- `idempotencyKey`
- `requestHash`
- `targetTables`
- `gateDecision`
- `blockedCodes`
- `writerVersion`
- `createdAt`

## Redaction Rules

Audit rows must store hashes and metadata, not raw sensitive payloads.

Forbidden audit content:

- Access tokens.
- Refresh tokens.
- Passwords.
- API keys.
- Service-role keys or values.
- Webhook secrets.
- Raw prompts.
- Raw model responses.
- Raw Stripe webhook payloads.
- Full private narrative text copied from the user's seed context.

Use:

- `requestHash` instead of raw request payload.
- `userIdHash` instead of raw user id when possible.
- Evidence ids or hashes instead of full private text.
- Stripe event id and SKU instead of raw webhook body.
- Prompt/model version ids instead of full prompt and raw model output.

## Event Lifecycles

Each future writer should support these audit lifecycle events:

- `attempt_received`
- `gate_blocked`
- `adapter_probe`
- `write_succeeded`
- `write_failed`
- `rollback_recorded`

Current implementation only provides sample blocked events. It does not persist them.

## Next Implementation Step

The read-only idempotency registry model is now defined at:

- `/server-writers/idempotency`
- `/api/system-writers/idempotency`
- `docs/writer-idempotency-registry-model.md`

## Next Implementation Step

The read-only rollback compensation model is now defined at:

- `/server-writers/rollback`
- `/api/system-writers/rollback`
- `docs/writer-rollback-compensation-model.md`

## Next Implementation Step

The read-only writer rollout checklist is now defined at:

- `/server-writers/rollout`
- `/api/system-writers/rollout`
- `docs/writer-rollout-checklist.md`

## Next Implementation Step

The diagnostic service-role isolation test harness is now defined at:

- `/server-writers/isolation`
- `/api/system-writers/service-role-isolation`
- `docs/service-role-isolation-test-harness.md`

It remains read-only:

- No rollback row is written.
- No generated artifact is mutated.
- No service-role client is created.
- No writer executes.
- No audit row is written.
- No AI or Stripe call is made.

## Next Implementation Step

The inert server-only writer module stubs are now defined at:

- `/server-writers/stubs`
- `/api/system-writers/stubs`
- `docs/server-writer-module-stubs.md`

They do not write audit rows or import any privileged client factory.

## Implemented Payload Parity Step

The writer payload parity fixtures are now defined at:

- `/server-writers/payloads`
- `/api/system-writers/payload-parity`
- `docs/writer-payload-parity-fixtures.md`

They do not write audit rows or create real writer implementations.

## Implemented Request Evidence Step

Request hashing and redaction fixtures are now defined at:

- `/server-writers/redaction`
- `/api/system-writers/request-redaction`
- `docs/request-hashing-redaction-fixtures.md`

They do not write audit rows, but they prepare audit-safe request evidence.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at:

- `/server-writers/evidence`
- `/api/system-writers/evidence-handoff`
- `docs/writer-evidence-handoff-fixtures.md`

They do not write audit rows, but they show how future audit events reference `requestHash` and redacted evidence.

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

It does not create tables, apply SQL, write audit rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

