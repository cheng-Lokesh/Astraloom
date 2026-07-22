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

## Scope and non-goals

Journeys were derived from the confirmed Stage 8 boundary in
`docs/FUTURE_SIMULATOR_V2.md`. This implementation migrates only compatible
read-only V1 local drafts and supplies a controlled in-memory async job port.
It does not modify V1 data, introduce a production queue/database migration,
API route, privileged writer, network access, LLM, payment, UI, or any Stage 9
work.

## RED evidence

Command run before production implementation:

```text
npm exec vitest run src/lib/v2/migration-async-execution/migration-async-execution.test.ts --coverage=false
```

Observed result: the new suite loaded zero tests and failed because
`./index` did not exist. This is the intended compile-time RED for the missing
Stage 8 migration and async-execution module.

## GREEN evidence

Command run after implementation:

```text
npm run test:v2:migration-async-execution
```

Observed result: 1 test file passed, 7 tests passed. Coverage was Statements
90.62%, Branches 85.71%, Functions 100%, and Lines 92.85%.

| # | Guarantee | Test evidence | Result |
|---|---|---|---|
| 1 | Compatible V1 draft migration is deterministic, content-bound idempotent, lineaged, and destiny-isolated. | migration test 1 | PASS |
| 2 | Namespace-only V1 id aliases reuse the artifact; material source changes create a new version. | migration test 2 | PASS |
| 3 | Unknown versions/fields, corrupted nested values, historical V1 artifacts, cross-draft references, and hostile input fail atomically. | migration tests 3-4 | PASS |
| 4 | Submit is strict, server-controlled, idempotent by key plus content, and reads are defensive. | async test 5 | PASS |
| 5 | Concurrent workers lease at most one Job; duplicate delivery after completion is idle. | async test 6 | PASS |
| 6 | Executor failure, invalid canonical artifacts, hostile repository/worker input, and invalid canonical-validator input publish no result ids. | async test 7 | PASS |

The separate test command enforces the Stage 8 threshold: Statements 90%,
Branches 85%, Functions 95%, Lines 90%.
