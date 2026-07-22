# Stage 8 V1 Migration And Async Execution TDD Evidence

## Repair cycle from `57e022f`

RED: the repaired suite failed against the prior implementation because it did
not accept a real `normalizeSeedContextDraft()` result, leaked arbitrary
finalization, and did not retain logical-source lineage. GREEN covers the
shared V1 strict contract, alias normalization/conflict rejection,
`A1 -> B1 -> A2` lineage, lease authority, forged binding rejection, and the
fixed canonical publication gate, including a Stage 6/7 official-fixture
`submit -> claim -> execute -> complete -> succeeded` path. This task requires one final repair commit,
so no intermediate Git checkpoint is created.

## Repository-backed Forecast Lock repair from `ccc9191`

RED was run after changing the Stage 8 test contract to pass only a persisted
Forecast Lock `{ streamId, version }` reference and its repository. The prior
executor treated the repository as the execute adapter, so the official
append -> submit -> claim -> execute path failed with `execution_failed`.
GREEN injects `OutcomeCalibrationRepositoryPortV2` into the fixed canonical
gate, loads the actual version and history, and recomputes the persistence,
request, Forecast Lock, and cross-stage bindings before publication. This task
requires one final repair commit, so the executable RED/GREEN evidence is kept
here instead of creating interim commits.

## Scope and non-goals

Journeys were derived from the confirmed Stage 8 boundary in
`docs/FUTURE_SIMULATOR_V2.md`. This implementation migrates only compatible
read-only V1 local drafts and supplies a controlled in-memory async job port.
It does not modify V1 data, introduce a production queue/database migration,
API route, privileged writer, network access, LLM, payment, UI, or any Stage 9
work.

## RED evidence

Command run before the repository-backed production change:

```text
npm run test:v2:migration-async-execution
```

Observed result: 8 tests executed; the official persisted-reference positive
case failed as `execution_failed` and the fake-bundle test received the same
error. This was the intended RED: the executor had no repository-backed Stage
7 trust boundary.

## GREEN evidence

Command run after implementation:

```text
npm run test:v2:migration-async-execution
```

Observed result: 1 test file passed, 14 tests passed. Coverage was Statements
92.94%, Branches 85.57%, Functions 100%, and Lines 99.23%.

| # | Guarantee | Test evidence | Result |
|---|---|---|---|
| 1 | Compatible V1 draft migration is deterministic, content-bound idempotent, lineaged, and destiny-isolated. | migration test 1 | PASS |
| 2 | Namespace-only V1 id aliases reuse the artifact; material source changes create a new version. | migration test 2 | PASS |
| 3 | Unknown versions/fields, corrupted nested values, historical V1 artifacts, cross-draft references, and hostile input fail atomically. | migration tests 3-4 | PASS |
| 4 | Submit is strict, server-controlled, idempotent by key plus content, and reads are defensive. | async test 5 | PASS |
| 5 | Concurrent workers lease at most one Job; duplicate delivery after completion is idle. | async test 6 | PASS |
| 6 | Executor failure, invalid canonical artifacts, hostile repository/worker input, and invalid canonical-validator input publish no result ids. | async tests 7, 11 | PASS |
| 7 | A self-consistent but unappended Forecast Lock cannot publish; only the actual Stage 7 repository record and history can satisfy the gate. | async tests 8-9 | PASS |
| 8 | Missing/wrong references, truncated or broken persistence chains, later Boundaries, final Worlds, and unrelated Stage 5/6/7 sources reject atomically. | async tests 9, 12, 13 | PASS |
| 9 | Lease expiry is millisecond-bounded; reclaim increments attempt and permanently invalidates the former worker/token/attempt. | async test 10 | PASS |

The separate test command enforces the Stage 8 threshold: Statements 90%,
Branches 85%, Functions 95%, Lines 90%.
