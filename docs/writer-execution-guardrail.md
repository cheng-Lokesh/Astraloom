# Writer Execution Guardrail

Current implementation status: read-only policy layer only.

This guide defines the final boundary before any Project MiroFish system writer can become a real service-role writer.

## Active Routes

- `/server-writers/guardrail`: bilingual read-only guardrail page.
- `/api/system-writers/guardrail`: read-only guardrail API.
- `/server-writers/adapter`: disabled service-role adapter boundary page.
- `/api/system-writers/service-role-adapter`: safe adapter status and probe API.
- `/server-writers/audit`: read-only audit event model page.
- `/api/system-writers/audit`: read-only audit model API.
- `/server-writers/idempotency`: read-only idempotency registry model page.
- `/api/system-writers/idempotency`: read-only idempotency model API.
- `/server-writers/rollback`: read-only rollback compensation model page.
- `/api/system-writers/rollback`: read-only rollback model API.
- `/server-writers/rollout`: read-only rollout checklist page.
- `/api/system-writers/rollout`: read-only rollout checklist API.
- `/server-writers/isolation`: diagnostic-only service-role isolation page.
- `/api/system-writers/service-role-isolation`: read-only isolation harness API.
- `/server-writers/stubs`: inert server-only writer module stubs page.
- `/api/system-writers/stubs`: read-only stubs API.
- `/server-writers/payloads`: fixture-only writer payload parity page.
- `/api/system-writers/payload-parity`: read-only payload parity API.
- `/server-writers/redaction`: fixture-only request hashing and redaction page.
- `/api/system-writers/request-redaction`: read-only request redaction API.
- `/server-writers/evidence`: fixture-only audit/idempotency evidence handoff page.
- `/api/system-writers/evidence-handoff`: read-only evidence handoff API.
- `/server-writers/migration`: read-only audit/idempotency migration proposal page.
- `/api/system-writers/migration-proposal`: read-only migration proposal API.
- `/server-writers/migration-review`: read-only audit/idempotency migration review checklist page.
- `/api/system-writers/migration-review`: read-only migration review API.
- `/server-writers/migration-runbook`: read-only manual migration application runbook page.
- `/api/system-writers/migration-runbook`: read-only migration runbook API.
- `/server-writers/schema-verification`: read-only applied-schema verification harness page.
- `/api/system-writers/schema-verification`: read-only schema verification API.

These routes do not write data, do not initialize a Supabase service-role client, do not read service-role secret values, do not import real writer implementations, do not call AI models, do not call Stripe, and do not unlock reports.

## Current Safety State

The guardrail API must keep returning:

- `safeMode=true`
- `realWritesAllowed=false`
- `serviceRoleClientAllowed=false`
- `aiCallsAllowed=false`
- `stripeCallsAllowed=false`

If any of these changes before a reviewed rollout task, the implementation is outside MVP scope.

## Mandatory Execution Phases

Every future writer must pass these phases in order:

1. Receive request.
2. Authenticate trusted server context.
3. Validate contract shape.
4. Check feature gates.
5. Check idempotency.
6. Prepare audit evidence.
7. Perform service-role write.
8. Append post-write audit evidence.
9. Apply rollback or version-supersession review when needed.

In the current MVP, only request receipt, contract validation, and feature-gate checks are allowed. Service-role write remains forbidden.

## Auth Context Rules

- User-request writers must derive `userId` from the authenticated Supabase session, not from browser authority.
- Server-executor writers must verify run ownership before writing generated artifacts.
- Stripe writers must trust only verified webhook events and event ids.
- Consent writers must be append-only and tied to explicit policy versions.

## Service-role Isolation Rules

Future service-role code must:

- Live in server-only modules.
- Never be imported by client components.
- Never expose service-role keys, access tokens, refresh tokens, provider keys, or webhook secrets.
- Refuse to run unless `SUPABASE_SERVICE_ROLE_KEY` and `ENABLE_SYSTEM_WRITERS=true` are both present.
- Refuse AI-backed writers unless `ENABLE_AI_GENERATION=true`.
- Refuse payment writers unless `ENABLE_STRIPE_WRITES=true`.

## Audit Requirements

Every real writer attempt must create append-only audit evidence containing:

- Writer contract id.
- Actor context type.
- Target table names.
- Idempotency key.
- Request hash, not raw sensitive payload.
- Gate decision.
- Writer version.
- Written row ids after success.
- Failure or rollback reason after failure.

Audit events must never contain secrets, raw access tokens, refresh tokens, API keys, service-role values, or webhook secrets.

## Rollback Rules

- Prefer version supersession, compensating rows, or soft deletion.
- Do not reorder event ticks.
- Do not mutate relationship edge weights manually.
- Do not delete payment history.
- Do not delete consent history; append revocation or update events.
- Do not let browser sync unlock reports or rewrite generated reports.

## Rollout Gates

No real writer can launch until all are true:

- Remote schema verified.
- RLS boundary verified.
- Dry-run validation passes for the exact writer payload shape.
- Service-role isolation implemented and tested.
- Audit writing implemented and tested.
- SafetyVerifier, cost caps, and prompt gates reviewed for AI-backed writers.
- Stripe webhook signature verification and event idempotency reviewed for payment writers.
- Manual rollback path documented for the writer.

## Implemented Adapter Step

The disabled service-role adapter boundary now exists and remains inert:

- No Supabase service-role client is created.
- No writer executes insert, upsert, update, delete, or append operations.
- Adapter probes return `wouldCreateClient=false` and `wouldWrite=false`.
- Adapter plans expose target tables and planned operations as metadata only.

## Implemented Audit Step

The read-only audit event model now defines:

- Future table name `writer_audit_events`.
- Base audit fields.
- Redaction rules.
- Forbidden fields.
- Event lifecycles.
- Per-writer event types.
- Sample blocked events.
- Retention rules.

It does not create a migration and does not write audit rows.

## Implemented Idempotency Step

The read-only idempotency registry model now defines:

- Future table name `writer_idempotency_keys`.
- Key templates per writer.
- Collision scopes.
- Replay behavior.
- Conflict behavior.
- TTL and retention policy.
- Sample reserved records.

It does not create a migration and does not reserve keys.

## Implemented Rollback Step

The read-only rollback compensation model now defines:

- Future table name `writer_compensation_events`.
- Base compensation fields.
- Per-writer compensation strategies.
- Allowed rollback triggers.
- Forbidden destructive actions.
- History preservation rules.
- Operator/support review requirements.
- Sample compensation records.

It does not create a migration, write compensation rows, mutate history, or execute rollback actions.

## Next Implementation Step

The read-only writer rollout checklist now defines:

- Global production gates.
- Current no-write safety state.
- Release sequence.
- Per-writer candidate order.
- Per-writer canary plans.
- Per-writer abort conditions.
- Explicit production blockers.

It does not enable writers, create a service-role client, write rows, call AI, call Stripe, or unlock reports.

## Next Implementation Step

The diagnostic service-role isolation test harness now defines:

- Metadata-only planned module labels.
- Global server-only boundary checks.
- Per-writer checks for `.server` module labels.
- Blocked probe behavior.
- Explicit `wouldImportServerWriter=false`, `wouldCreateServiceRoleClient=false`, `wouldReadServiceRoleSecret=false`, and `wouldWriteRows=false`.

It stays inert:

- No generated history is mutated.
- No service-role write method executes.
- No privileged Supabase client is created.
- No service-role secret value is read.
- No future writer module is imported.
- No AI provider is called.
- No Stripe provider is called.
- Responses remain safe booleans and structured blocked reasons.

## Implemented Stub Step

Inert server-only writer module stubs now exist for all eight contracts. They start with `import "server-only";`, return blocked metadata only, and do not import a privileged client factory.

## Implemented Payload Parity Step

Writer payload parity fixtures now keep dry-run validation, stub probes, and future writer request shapes aligned while remaining read-only.

## Implemented Request Evidence Step

Request hashing and redaction fixtures now prepare audit-safe and idempotency-safe request evidence without writing audit rows or reserving keys.

## Implemented Evidence Handoff Step

Audit/idempotency evidence handoff fixtures are now defined for future writer attempts. They remain read-only and do not write audit rows or reserve keys.

## Implemented Migration Proposal Step

The read-only audit/idempotency migration proposal is now defined for `writer_audit_events` and `writer_idempotency_keys`. It does not create migration files, apply SQL, create tables, alter tables, write rows, write audit rows, reserve idempotency keys, or enable writers.

## Implemented Migration Review Step

The audit/idempotency migration review checklist is now defined before any proposed SQL becomes a real Supabase migration. It does not approve, create, or apply any migration.

## Implemented Migration Runbook Step

The manual migration application runbook is now defined before any proposed SQL is applied. It does not create, approve, or apply any migration.

## Implemented Applied-schema Verification Step

The applied-schema verification harness is now defined before any writer implementation proceeds. It does not create tables, apply SQL, write rows, or create a service-role client.

## Next Implementation Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds.

