# Phase 3 Step C TDD evidence

## Scope and user journeys

- A signed-in owner generates a read-only Graph from the current safe Agent
  snapshot, with every Edge anchored to `user_core` and backed by endpoint
  evidence.
- The owner locks that exact Graph parent once; its Edge set remains attached
  and the same lock idempotency key replays the same parent.
- Browser table access cannot create, mutate, unlock, or alter Graph state
  outside the guarded RPC boundary.

## RED checkpoints

- `d72c7bd` added lock continuity, time-ordering, column privilege, RLS,
  trigger, endpoint, evidence, and deterministic-weight contracts. Running the
  migration preview plus pgTAP showed the intended failures: no in-place lock,
  no lock-only UPDATE grant/guard, no endpoint composite binding, and fabricated
  evidence/placeholder weights.
- `a24db98` added Graph API projection and error-mapping cases. The focused
  API run was RED for parent/Edge safety disagreement and `graph_locked` being
  mapped to 500.
- `e3d4166` made the generate API fixture use the persisted
  `seed_context:<uuid>:<16-hex>` evidence form. It was RED (500 instead of
  201) before the safe projection accepted that exact persisted format.

## GREEN evidence

| Guarantee | Command | Result |
|---|---|---|
| Graph schema, lock replay, owner/Seed/Agent/request/safety bindings, endpoint evidence, and browser-read-only behavior | outer `BEGIN`, Graph migration, `phase3_graph_snapshots_test.sql`, `ROLLBACK` in one psql session | PASS 152/152 |
| Graph GET/generate/lock input, redaction, safety projection, and lock mapping | `npm test -- src/app/api/graph/route.phase3.test.ts src/app/api/graph/generate/route.phase3.test.ts src/app/api/graph/lock/route.phase3.test.ts` | PASS 30/30 |
| Step B Agent database regression | outer `BEGIN`, `phase3_agent_snapshots_test.sql`, `ROLLBACK` | PASS 174/174 |
| Step A database regression | outer `BEGIN`, `phase3_key_people_test.sql`, `ROLLBACK` | PASS 74/74 |
| Phase 2 database regressions | outer `BEGIN`, each Phase 2 pgTAP suite, `ROLLBACK` | PASS 7/7 and 10/10 |
| Agent and People API regression | `npm test --` focused Agent/People API targets | PASS 24/24 |
| Frozen V2 | `git diff --exit-code productization/phase-1-contract -- src/lib/v2` | PASS (zero diff) |

## Database safety

The Graph migration was never applied to the real database. After preview
rollbacks, `relation_graph_snapshots` and
`relation_graph_idempotency_receipts` were absent. Business counts remained
`seed_contexts=16`, `key_people=0`, `agent_profiles=0`,
`relation_edges=0`, and `consent_events=16`.

## Known validation gap

The desktop command bridge terminates long-running npm parent processes after
about 30 seconds while leaving Vitest/ESLint child processes detached. It did
not return a final aggregate result for full Vitest, lint, type-check, or build
in this task. These commands must be re-run from a stable terminal before
formal Step C acceptance; no PASS is claimed for them here.
