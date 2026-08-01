# Phase 3 Step A TDD evidence

Source: the authorized Phase 3 README user journey, converted directly into
route and database guarantees during this implementation. No UI/browser work,
LLM, service-role client, Agent/Edge writer, Track B, or V2 code was included.

## Journeys and checkpoints

| Journey | RED evidence | GREEN evidence | Guarantee |
|---|---|---|---|
| Current user extracts people from an owned submitted Seed | `npm test -- src/app/api/key-people/extract/route.phase3.test.ts` failed 3 assertions because the legacy route rejected the selector and did not call the Phase 3 RPC. | The same focused route suite passes. | The API accepts only selector + UUID key, DB-re-reads the submitted Seed, uses the deterministic extractor, and persists through one RPC. |
| Current user recovers and manages people | Missing GET/confirm route imports were part of RED; the test checkpoint was committed before implementation. | `18` focused route assertions pass. | GET hides foreign/missing Seeds as `404 seed_not_found`; confirm/rename/delete/merge/supplement use strict batches and stable errors. |
| Isolation, replay, atomicity, and formal provenance | `supabase/tests/phase3_key_people_test.sql` was added before migration/RPC implementation. | `36/36` pgTAP checks pass in a rollback fixture. | RLS, submitted-Seed gates, same-key replay/conflict, transaction rollback, merge union, status transitions, cross-user/Cross-Seed denial, and no Agent/Edge DML expansion hold. |

RED checkpoint commit: `744c0f0 test: add Phase 3 key people contract`.

## Automated results

| Check | Result |
|---|---|
| Focused route tests | PASS — 18 tests, 3 files |
| Focused coverage | PASS — statements 98.96%, branches 91.66%, functions 95%, lines 100% |
| Phase 3 pgTAP | PASS — 36/36, inside `BEGIN … ROLLBACK` |
| Phase 2 pgTAP regression | PASS — 17/17, inside `BEGIN … ROLLBACK` |
| Database function lint | PASS — `plpgsql_check` reported no findings for both Phase 3 RPCs |
| Lint / type check | PASS |
| V2 comparison | PASS — `git diff productization/phase-1-contract -- src/lib/v2` is empty |

## Non-destructive database evidence

The additive migration ran on the local Supabase database after recording table
counts. Before and after the rollback fixtures: `seed_contexts=16`,
`key_people=0`, `agent_profiles=0`, `relation_edges=0`, and
`consent_events=16`; `key_people_idempotency_receipts=0` after the fixture.
No reset, delete, or data rewrite was used.

## Known boundary

The transaction-local `app.phase3_key_people_rpc` RLS guard is required because
the RPCs intentionally use `SECURITY INVOKER`: authenticated needs ordinary
table privileges for PostgreSQL to execute an invoker function, while direct
REST writes remain RLS-denied unless the narrow RPC sets the local guard. The
functions re-read `auth.uid()` and submitted ownership before setting it.
