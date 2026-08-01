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

The only runtime configuration change is `fileParallelism: false` in
`vitest.config.ts`. This serializes test *files* through one worker; it does
not skip tests, disable isolation, change test code, increase a timeout, or
change any coverage threshold.

### Affected singleton targets

| Command | Exit | Result | Wall time |
|---|---:|---|---:|
| `npm test -- src/lib/v2/outcome-calibration/forecast-lock.test.ts` | 0 | 1 file, 10 tests passed | 14.60 s |
| `npm test -- src/lib/v2/migration-async-execution/migration-async-execution.test.ts` | 0 | 1 file, 22 tests passed | 19.29 s |

### Phase 2 V2 gates

| Command | Exit | Result | Wall time |
|---|---:|---|---:|
| `npm run test:v2:evidence` | 0 | 5 files, 83 tests passed | 5.13 s |
| `npm run test:v2:world` | 0 | 6 files, 116 tests passed | 7.58 s |
| `npm run test:v2:trajectory` | 0 | 4 files, 63 tests passed | 5.52 s |
| `npm run test:v2:analysis` | 0 | 4 files, 47 tests passed; coverage S 91.13%, B 85.24%, F 97.22%, L 97.31% | 9.59 s |
| `npm run test:v2:claims-reports` | 0 | 2 files, 23 tests passed; coverage S 91.10%, B 85.26%, F 95.94%, L 96.34% | 24.27 s |
| `npm run test:v2:outcome-calibration` | 0 | 4 files, 40 tests passed; coverage S 90.58%, B 86.61%, F 97.54%, L 94.23% | 65.69 s |
| `npm run test:v2:migration-async-execution` | 0 | 1 file, 22 tests passed; coverage S 92.25%, B 86.17%, F 100%, L 98.62% | 22.79 s |

### Repeated aggregate stability gates

| Command | Exit | Result | Wall time |
|---|---:|---|---:|
| `npm test` (run 1) | 0 | 42 files, 426 tests passed | 109.06 s |
| `npm test` (run 2) | 0 | 42 files, 426 tests passed | 109.15 s |
| `npm test` (run 3) | 0 | 42 files, 426 tests passed | 109.90 s |
| `npm run test:coverage` (run 1) | 0 | 42 files, 426 tests passed; coverage S 90.82%, B 81.21%, F 95.44%, L 93.52% | 143.40 s |
| `npm run test:coverage` (run 2) | 0 | 42 files, 426 tests passed; coverage S 90.82%, B 81.21%, F 95.44%, L 93.52% | 146.79 s |

The unchanged aggregate thresholds are statements 80%, lines 80%, functions
80%, and branches 60%. Both coverage runs exceeded every threshold.

### Project gates

| Command | Exit | Result | Wall time |
|---|---:|---|---:|
| `npm run lint` | 0 | ESLint passed | 51.77 s |
| `npm run type-check` | 0 | Next route types and TypeScript passed | 12.50 s |
| `npm run build` | 0 | Production build passed | 95.23 s |
| `npm run check` | 0 | 42 files, 426 tests; lint; type check; and production build passed | 314.34 s |

`npm run check:ci` was intentionally not run: its exact components are one
coverage aggregate plus lint, type check, and build, all of which were already
run successfully above (including two coverage aggregates). A further identical
composition would add no distinct stability evidence.

## Final guarantees and boundary checks

- Three consecutive normal aggregates and two consecutive coverage aggregates
  passed without a 5000 ms timeout or any skipped/disabled test.
- The passing V2 gates, singleton targets, and project checks establish that
  file-level serialization resolves the observed scheduling-sensitive runner
  failure while preserving all existing behavior checks.
- `src/lib/v2/**` remains unchanged relative to
  `productization/phase-1-contract`; the final diff is limited to this evidence
  report and `vitest.config.ts`.
- No database, localhost service, browser, Phase 2 roadmap/acceptance/decision
  document, or Phase 3 work was changed.
