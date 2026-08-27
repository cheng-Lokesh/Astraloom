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
- Independent review blocked `2cdf61b` because `generate(K) -> lock(L) ->
  generate(K)` correctly replayed a locked Graph from the database, while the
  API response schema accepted only `graph_locked=false` with `locked_at=null`.
  `6d7682e` recorded the API RED (500 instead of 200) and the database
  lifecycle contract; the database behavior was already GREEN.
- After the base Graph migration had been applied under controller control, a
  real-database run exposed 153/156: assertions #120, #121, and #125 treated
  an absent `app.phase3_graph_rpc` GUC as text `off`. Failed RPC exception
  paths and savepoint rollbacks restore NULL (and later reset paths can expose
  an empty value). RLS's `= 'on'` predicate remains closed, but the two BEFORE
  UPDATE trigger guards used `<> 'on'`, for which NULL does not enter the
  `IF`. `ebdee95` first made the status checks explicitly normalize closed
  NULL/empty states, added database-owner direct Graph/Edge update probes after
  Graph creation, and required both trigger definitions to use
  `IS DISTINCT FROM 'on'`. The current applied database was RED 160/162: only
  those two new static guard contracts failed.

## GREEN evidence

| Guarantee | Command | Result |
|---|---|---|
| Graph schema, lock replay, owner/Seed/Agent/request/safety bindings, endpoint evidence, browser-read-only behavior, and `generate(K) -> lock(L) -> generate(K)` continuity | outer `BEGIN`, Graph migration, `phase3_graph_snapshots_test.sql`, `ROLLBACK` in one psql session | PASS 156/156 |
| Additive unset-guard repair | preview in an outer transaction, then controlled local apply followed by `phase3_graph_snapshots_test.sql` against the migrated database | PASS 162/162 both before and after apply |
| Graph GET/generate/lock input, redaction, safety projection, lock mapping, and locked generation replay | `npm test -- src/app/api/graph/route.phase3.test.ts src/app/api/graph/generate/route.phase3.test.ts src/app/api/graph/lock/route.phase3.test.ts` | PASS 31/31 |
| Step B Agent database regression | outer `BEGIN`, `phase3_agent_snapshots_test.sql`, `ROLLBACK` | PASS 174/174 |
| Step A database regression | outer `BEGIN`, `phase3_key_people_test.sql`, `ROLLBACK` | PASS 74/74 |
| Phase 2 database regressions | outer `BEGIN`, each Phase 2 pgTAP suite, `ROLLBACK` | PASS 7/7 and 10/10 |
| Agent and People API regression | `npm test --` focused Agent/People API targets | PASS 24/24 |
| Frozen V2 | `git diff --exit-code productization/phase-1-contract -- src/lib/v2` | PASS (zero diff) |

## Database safety

The controller first applied the base Graph migration
`20260802161000_phase3_graph_snapshot_persistence.sql`, whose recorded SHA-256
is `dcce6094565112737bd3f71066379dc7de42f74722e34b4a94f41e99c7858968`.
This repair did not edit that applied file. After independent review of the
preview candidate, the controller applied the additive migration
`20260827220000_phase3_graph_unset_guard_hardening.sql`, whose SHA-256 is
`7d3ef21aef82ac2c3ce27b9adba4de4a83cc54dcf3af43e34bd96f42fcc81b0a`.
Migration history contains both versions. The complete database regression was
then rerun against the migrated database and passed. Graph parents and receipts
were both zero after the transactional tests, while business counts remained
`seed_contexts=16`, `key_people=0`, `agent_profiles=0`, `relation_edges=0`,
and `consent_events=16`.

## Master long-command verification

The controller independently ran the long commands in a stable local session:
full Vitest passed **50 files / 494 tests**, lint passed, type-check passed, and
the Next production build passed with **108 pages**. This repair did not rerun
those commands because the desktop command bridge is limited to short-lived
parent processes; the focused API and database regressions above were rerun.
