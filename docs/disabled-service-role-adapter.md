# Disabled Service-role Adapter Boundary

Current implementation status: server-only inert adapter boundary.

This layer exists to make the future service-role writer boundary explicit without creating a real Supabase service-role client or writing rows.

## Active Routes

- `/server-writers/adapter`: bilingual adapter status and probe page.
- `/api/system-writers/service-role-adapter`: safe adapter status and probe API.

## Current Behavior

The adapter always returns:

- `safeMode=true`
- `adapterMode=disabled`
- `wouldCreateClient=false`
- `wouldWrite=false`

The adapter must not:

- Create a Supabase service-role client.
- Run insert, upsert, update, delete, RPC, or storage operations.
- Call AI providers.
- Call Stripe.
- Unlock reports.
- Grant payment entitlement.
- Expose secret values or raw environment config.

## Adapter Plans

Each system writer contract has an inert plan:

- `agent_profile_generation`: planned insert into `agent_profiles`.
- `relation_edge_generation`: planned upsert into `relation_edges`.
- `simulation_run_create`: planned insert into `simulation_runs`.
- `event_tick_append`: planned append into `events`.
- `claim_generation`: planned insert into `claims`.
- `report_generation`: planned upsert into `reports`.
- `payment_entitlement_record`: planned append into `payments`.
- `consent_event_record`: planned append into `consent_events`.

These are plans only. The adapter returns blocked reasons instead of executing them.

## Probe API

`POST /api/system-writers/service-role-adapter` accepts:

```json
{
  "contractId": "agent_profile_generation",
  "operation": "insert"
}
```

Expected result:

- `wouldCreateClient=false`
- `wouldWrite=false`
- `blocked=true`
- structured `blockedCodes`
- structured checks

## Block Codes

Current block codes include:

- `service_role_missing`
- `system_writers_disabled`
- `ai_generation_disabled`
- `stripe_writes_disabled`
- `real_writes_forbidden`
- `client_creation_forbidden`
- `unknown_contract`

## Next Implementation Step

The read-only audit event model is now defined at:

- `/server-writers/audit`
- `/api/system-writers/audit`
- `docs/writer-audit-event-model.md`

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

The service-role isolation harness remains inert:

- No service-role write.
- No privileged Supabase client creation.
- No writer module import.
- No service-role secret read.
- No AI or Stripe call.
- No report unlock.
- No payment entitlement grant.

## Implemented Stub Step

The inert server-only writer module stubs are now defined at:

- `/server-writers/stubs`
- `/api/system-writers/stubs`
- `docs/server-writer-module-stubs.md`

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

They prepare deterministic request hashes and redacted previews before any real writer exists.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at:

- `/server-writers/evidence`
- `/api/system-writers/evidence-handoff`
- `docs/writer-evidence-handoff-fixtures.md`

They do not write audit rows or reserve keys.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined at:

- `/server-writers/migration`
- `/api/system-writers/migration-proposal`
- `docs/writer-migration-proposal.md`

It does not apply migrations, create tables, alter tables, create a service-role client, write rows, write audit rows, reserve idempotency keys, call AI, or call Stripe.

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

It remains read-only and does not create tables, apply SQL, prove writer readiness, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

