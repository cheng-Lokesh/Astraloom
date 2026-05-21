# Writer Rollback Compensation Model

Current implementation status: read-only rollback contract layer.

This document defines how future system writer attempts should compensate failed, unsafe, duplicate, refunded, or revoked outcomes before any real service-role write exists.

## Active Routes

- `/server-writers/rollback`: bilingual read-only rollback model page.
- `/api/system-writers/rollback`: read-only rollback model API.

## Current Safety State

The rollback model currently returns:

- `safeMode=true`
- `readOnly=true`
- `wouldWriteCompensationRows=false`
- `wouldMutateHistory=false`
- `migrationIncluded=false`
- `futureTableName=writer_compensation_events`

This means no migration is created, no compensation row is written, and no generated/payment/consent history is mutated.

## Future Table

Future table name:

```text
writer_compensation_events
```

Do not add this table until the rollout checklist, service-role adapter, audit writer, and idempotency reservation behavior are all reviewed together.

## Required Fields

Future compensation rows should include:

- `compensationEventId`
- `contractId`
- `strategy`
- `trigger`
- `originalResultRef`
- `replacementResultRef`
- `idempotencyKey`
- `auditEventId`
- `operatorReviewId`
- `createdAt`

References should be ids or hashes. Do not copy raw private narrative text, raw prompts, model outputs, Stripe webhook bodies, tokens, or secrets into compensation rows.

## Core Strategies

The read-only model defines these strategies:

- `soft_delete_generated`: hide or mark generated agent profiles as superseded after audit review.
- `supersede_version`: create a newer generated version instead of editing a previous artifact in place.
- `cancel_queued_run`: cancel a run only while it is still queued and before event ticks exist.
- `append_compensating_event`: append a later correction/invalidation event instead of deleting or reordering old ticks.
- `replacement_report`: create a replacement report version while preserving locked/unlocked history.
- `payment_reversal_event`: append payment refund/dispute state from verified Stripe evidence.
- `consent_revocation_event`: append consent revocation/update state while preserving previous consent history.

## Core Rules

- Rollback must prefer append-only compensation, version supersession, or soft deletion over destructive mutation.
- Payment and consent history must never be deleted.
- Simulation ticks must not be reordered or silently patched.
- Browser code must not perform rollback, compensation, report unlock, entitlement reversal, or consent mutation.
- Every future compensation event must reference audit and idempotency records.
- High-impact compensation requires operator/support review before production rollout.

## Writer-specific Behavior

- `agent_profile_generation`: use `soft_delete_generated` for bad or unsafe profile sets.
- `relation_edge_generation`: use `supersede_version`; do not manually patch individual edge weights.
- `simulation_run_create`: use `cancel_queued_run` only before event ticks exist.
- `event_tick_append`: use `append_compensating_event`; do not delete or reorder event history.
- `claim_generation`: use `supersede_version` and keep evidence references traceable.
- `report_generation`: use `replacement_report` and preserve report lock/unlock history.
- `payment_entitlement_record`: use `payment_reversal_event`; never delete payment rows.
- `consent_event_record`: use `consent_revocation_event`; never delete consent history.

## Forbidden Actions

- Do not hard-delete audit evidence.
- Do not erase idempotency history.
- Do not rewrite generated output in place.
- Do not patch relationship graph weights manually.
- Do not unlock reports from browser code.
- Do not grant or revoke payment entitlement from browser code.
- Do not bypass Stripe refund/dispute evidence for payment compensation.
- Do not delete or rewrite consent history.

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

- No production writer is enabled.
- No service-role client is created.
- No service-role secret value is read.
- No future writer module is imported.
- No AI provider is called.
- No Stripe provider is called.
- No compensation row, audit row, idempotency key, generated artifact, report, payment, or consent event is written.

## Implemented Stub Step

The inert server-only writer module stubs are now defined at:

- `/server-writers/stubs`
- `/api/system-writers/stubs`
- `docs/server-writer-module-stubs.md`

They do not write compensation rows or import any privileged client factory.

## Implemented Payload Parity Step

The writer payload parity fixtures are now defined at:

- `/server-writers/payloads`
- `/api/system-writers/payload-parity`
- `docs/writer-payload-parity-fixtures.md`

They do not write compensation rows or create real writer implementations.

## Implemented Request Evidence Step

Request hashing and redaction fixtures are now defined at:

- `/server-writers/redaction`
- `/api/system-writers/request-redaction`
- `docs/request-hashing-redaction-fixtures.md`

They do not write compensation rows or create real writer implementations.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at:

- `/server-writers/evidence`
- `/api/system-writers/evidence-handoff`
- `docs/writer-evidence-handoff-fixtures.md`

They do not write compensation rows, audit rows, or idempotency rows.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined at:

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

It does not create tables, apply SQL, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

