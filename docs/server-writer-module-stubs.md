# Server-only Writer Module Stubs

Current implementation status: inert `.server` module stubs.

This document defines the first concrete server-only writer module files for Project MiroFish. They are not real writers. They exist to reserve future implementation boundaries while proving that every contract has a server-only module path.

## Active Routes

- `/server-writers/stubs`: bilingual status page for inert writer module stubs.
- `/api/system-writers/stubs`: read-only API for stub catalog and blocked probe results.

## Implemented Stub Files

- `src/lib/server-writers/adapters/agent-profile-writer.server.ts`
- `src/lib/server-writers/adapters/relation-edge-writer.server.ts`
- `src/lib/server-writers/adapters/simulation-run-writer.server.ts`
- `src/lib/server-writers/adapters/event-writer.server.ts`
- `src/lib/server-writers/adapters/claim-writer.server.ts`
- `src/lib/server-writers/adapters/report-writer.server.ts`
- `src/lib/server-writers/adapters/payment-entitlement-writer.server.ts`
- `src/lib/server-writers/adapters/consent-writer.server.ts`

Each file starts with:

```ts
import "server-only";
```

## Current Safety State

The stub API currently returns:

- `safeMode=true`
- `readOnly=true`
- `stubMode=inert_server_only_stub`
- `importsInertServerOnlyStubs=true`
- `wouldImportRealWriterImplementation=false`
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

This means server routes can import the stubs as inert metadata, but no privileged operation can occur.

## Probe Behavior

`POST /api/system-writers/stubs` accepts:

```json
{
  "contractId": "consent_event_record"
}
```

Expected result:

- `blocked=true`
- `reasonCode=inert_stub_noop`
- `importsInertServerOnlyStub=true`
- `wouldImportRealWriterImplementation=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldWriteRows=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`

The probe imports the inert `.server` stub and returns a blocked result. It does not create a client, read a secret, write a row, reserve a key, write audit evidence, write compensation evidence, call AI, call Stripe, or unlock reports.

## Hard Rules

- Do not replace a stub with real writer code in this stage.
- Do not import a Supabase service-role client factory.
- Do not read or serialize service-role secret values.
- Do not add insert, update, upsert, delete, RPC, or storage operations.
- Do not add AI provider calls.
- Do not add Stripe calls.
- Do not grant payment entitlement.
- Do not unlock reports.
- Do not write audit rows.
- Do not reserve idempotency keys.
- Do not write compensation rows.
- Do not import `.server` stubs from client components.

## Implemented Payload Parity Step

The writer payload parity fixtures are now defined at:

- `/server-writers/payloads`
- `/api/system-writers/payload-parity`
- `docs/writer-payload-parity-fixtures.md`

They prove that:

- Dry-run request shapes and stub probe request shapes use the same contract ids.
- Required input keys stay aligned with the controlled writer contracts.
- Sensitive key names remain rejected before any real writer exists.
- Future writer functions can share validated request schemas without executing writes.

## Implemented Request Evidence Step

Request hashing and redaction fixtures are now defined at:

- `/server-writers/redaction`
- `/api/system-writers/request-redaction`
- `docs/request-hashing-redaction-fixtures.md`

They prepare deterministic request hashes and redacted payload previews for future audit and idempotency records.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined at:

- `/server-writers/evidence`
- `/api/system-writers/evidence-handoff`
- `docs/writer-evidence-handoff-fixtures.md`

They link redacted request evidence to future audit/idempotency drafts without executing writes.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined at:

- `/server-writers/migration`
- `/api/system-writers/migration-proposal`
- `docs/writer-migration-proposal.md`

It remains proposal-only and does not create migration files, apply SQL, create tables, write rows, write audit rows, reserve idempotency keys, or create a service-role client.

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

Real service-role client creation and real writer execution remain out of scope.

