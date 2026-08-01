# Phase 2 Aggregate Vitest Stability TDD Evidence

## Source and scope

The stability journey and acceptance criteria were derived from the Phase 2
aggregate-test-stability request in this TDD run. No external plan file was
used.

As a maintainer, I want the complete Phase 2 suite to execute reproducibly
under its normal aggregate command, so that an otherwise-correct product change
is not reported as failed because concurrently scheduled test files contend for
the same local test-runner resources.

In scope:

- The Vitest runner configuration outside `src/lib/v2/**`.
- Factual RED/GREEN evidence for aggregate test stability.

Out of scope:

- Any Phase 2 product or test implementation in `src/lib/v2/**`.
- Skipping, disabling, or weakening tests; changing coverage thresholds; and
  increasing per-test timeouts.
- Database, localhost, browser, roadmap, acceptance, or decision-document
  changes.

## Baseline and configuration review

Before the RED checkpoint, the active branch was
`productization/phase-2-data-foundation` at
`fe79f50fd34816a50d5e1fc94ad2cb5ea6e878c1`; the worktree was clean, and
`git diff productization/phase-1-contract -- src/lib/v2` was empty.

The project uses Vitest `4.1.10` through `vitest run`. The existing
`vitest.config.ts` had no explicit file-level concurrency setting. Vitest 4's
documented `fileParallelism: false` option disables parallel execution between
test files and makes the effective worker count one; it does not alter test
execution within a file or the Node default 5000 ms test timeout.

## RED evidence

The following Runtime RED was observed in the immediately preceding independent
read-only regression from the same clean baseline. It is recorded here before
the runner configuration changes; it was not fabricated by editing a test.

| Aggregate command | Result | Intended signal |
|---|---|---|
| `npm test` | exit code 1; Vitest internal 5000 ms timeout at `src/lib/v2/outcome-calibration/forecast-lock.test.ts:140` | An affected test file can miss Vitest's default timeout only during aggregate scheduling. |
| `npm test` | exit code 1; Vitest internal 5000 ms timeout at `src/lib/v2/migration-async-execution/migration-async-execution.test.ts:396` | A second independent file exhibits the same aggregate-only scheduling sensitivity. |
| `npm run test:coverage` | exit code 1; same `forecast-lock` 5000 ms timeout | The failure is reproducible in the coverage aggregate as well. |

Control observations from that regression:

- Each of the two affected test targets passed in isolation (about 1.65 s and
  3.74 s respectively).
- All seven Phase 2 V2 script targets passed individually.
- A later `npm run check` passed all 42 files and 426 tests once.

Together these observations identify cross-file parallel scheduling/resource
contention as the fault boundary. They do not establish a product-logic defect,
an external-command timeout, or a need to increase the tests' 5000 ms timeout.

## RED to GREEN mapping

| Guarantee | RED evidence | Minimal intended fix | GREEN evidence required |
|---|---|---|---|
| Full-suite results do not depend on parallel file scheduling | The two independent aggregate-only 5000 ms failures above | Set Vitest `fileParallelism: false` | Two affected singleton targets, all seven V2 scripts, three consecutive `npm test` runs, and two consecutive coverage runs pass without skipped tests or threshold changes. |
| Product behavior and Phase 2 contract remain unchanged | Clean baseline and empty V2 diff | Change only runner configuration and this evidence report | V2 diff remains empty against `productization/phase-1-contract`; lint, type check, build, and aggregate checks pass. |

## GREEN evidence

Pending the configuration change and the required repeated regression runs.
