# Stage 7 Outcome Calibration TDD Evidence

## Source and scope

The user journeys and guarantees were derived from the Stage 7 request in this
TDD run. No external plan file was used.

In scope:

- Real-world Outcome capture from Stage 2 validated Real Evidence.
- Canonical Stage 6 Claim/Report backtesting with Run, sample, version, Outcome,
  and Reality Boundary bindings.
- Deterministic versioned calibration with an insufficient-data state.
- An explicit repository port and deterministic in-memory append-only adapter.

Out of scope:

- V1 or Stage 2-6 production changes.
- Database migrations, production APIs, UI, asynchronous jobs, queues, network,
  or LLM capability.
- Stage 8 migration or server execution.

## User journeys

1. As an evaluator, I want to record what actually happened from validated
   Real Evidence so a Simulation Event can never masquerade as reality.
2. As an evaluator, I want a backtest to replay and revalidate the canonical
   Stage 6 Claim/Report chain so a modified Run, sample, Claim, Report, Outcome,
   version, Seed, or Ledger is rejected atomically.
3. As a product owner, I want deterministic calibration that discloses its
   method, sample count, and limits, so insufficient samples remain labelled
   simulation frequency and no result is promoted to causation or certainty.
4. As a repository client, I want append-only immutable versions with optimistic
   concurrency and content-bound idempotency so historical artifacts cannot be
   rewritten and failed writes leave no partial version.

## RED evidence

Command executed before any Stage 7 production module was created:

```text
npm run test:v2:outcome-calibration
```

Observed result: **RED** (exit code 1).

```text
Test Files  3 failed (3)
Tests  no tests
Error: Cannot find module './backtesting'
Error: Cannot find module './outcome-capture'
```

The test target transformed and loaded the three new Stage 7 test suites. The
failure is the intended compile/import-time RED signal: the tests reference the
missing Outcome, Backtest, Calibration, and repository implementation modules.
It is not caused by an unrelated test, dependency, or environment failure.

## Task report

| Behavior | RED command | GREEN command | Result and evidence |
|---|---|---|---|
| Outcome capture and strict real-evidence boundary | `npm run test:v2:outcome-calibration` | `npm run test:v2:outcome-calibration` | RED: missing `./outcome-capture`; GREEN: 23 tests passed |
| Canonical Stage 6 backtesting and calibration | `npm run test:v2:outcome-calibration` | `npm run test:v2:outcome-calibration` | RED: missing `./backtesting`; GREEN: canonical replay and calibration tests passed |
| Versioned in-memory persistence | `npm run test:v2:outcome-calibration` | `npm run test:v2:outcome-calibration` | RED: missing `./in-memory-repository`; GREEN: repository integration tests passed |

## Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Outcome requires validated Real Evidence, observed/recorded time, source, and uncertainty | `outcome-capture.test.ts` | unit/boundary | PASS | `npm run test:v2:outcome-calibration` |
| 2 | Unknown fields, illegal ids, version drift, cross-Seed/cross-Ledger input, and corrupt nesting are rejected without partial artifacts | Stage 7 test directory | boundary/integration | PASS | 23/23 tests passed |
| 3 | Backtest revalidates the Stage 6 Claim, Report, canonical Claim Set, Run, sample, Outcome, and Reality Boundary | `backtesting-calibration.test.ts` | integration | PASS | Canonical replay test passed |
| 4 | Insufficient calibration remains simulation frequency and sufficient calibration discloses deterministic Brier scoring and limitations | `backtesting-calibration.test.ts` | unit/integration | PASS | Insufficient and five-Outcome cases passed |
| 5 | Versioned persistence is append-only, optimistic, idempotent, defensive, dependency-aware, and atomic | `repository.test.ts` | repository integration | PASS | Four repository integration cases passed |

## GREEN evidence

Command:

```text
npm run test:v2:outcome-calibration
```

Final GREEN result after the implementation and coverage-boundary additions:

```text
Test Files  3 passed (3)
Tests  23 passed (23)
Statements 91.77% (357/389)
Branches   87.32% (248/284)
Functions  96.55% (84/87)
Lines      94.09% (303/322)
```

The same implementation also passed `npm run type-check` after Next.js route
type generation and TypeScript compilation.

## Stage 7 repair RED/GREEN evidence

The repair started from accepted commit
`eab22da1d9964b4214e946013f6c3fba6d0453a6`. Tests and fixtures were changed
before any Stage 7 production implementation. The first repair run was:

```text
npm run test:v2:outcome-calibration
Exit code: 1
Test Files  3 failed (3)
Tests       26 failed | 2 passed (28)
```

This executable RED showed that the old strict public schema rejected the new
window fields and could not represent `did_not_occur` without `occurredAt`.
The attack cases also required strict later revisions and independent
observation/forecast unit signatures that the old Backtest and Calibration did
not expose.

The final repair GREEN is:

```text
npm run test:v2:outcome-calibration
Exit code: 0
Test Files  3 passed (3)
Tests       29 passed (29)
Statements 92.05% (394/428)
Branches   87.34% (283/324)
Functions  98.88% (89/90)
Lines      94.44% (340/360)
```

The repair cases cover an occurred Outcome one millisecond outside the window,
an incomplete-window `did_not_occur`, an `occurredAt` semantic conflict, a
same-revision boundary increment, historical boundary rewriting, primary
Evidence already present at forecast time, pre-lock Evidence capture, the same
Evidence under a new id, and distinct observations aliased to one forecast
target. The calibrated five-sample fixture now uses five separate, pre-locked
Run/Claim/Cluster forecast units rather than five Outcomes for one Claim/Run.

## Coverage and known gaps

The independent Stage 7 command enforces 90% statements, 85% branches, 95%
functions, and 90% lines. All four gates passed. Deliberately untested defensive
catch branches remain only where validated, in-memory inputs cannot normally
throw. No Stage 8 production persistence or delivery surface is included.

## Full regression evidence

All requested commands passed on the final Stage 7 implementation:

| Command | Result |
|---|---|
| `npm run test:v2:evidence` | PASS: 83 tests |
| `npm run test:v2:world` | PASS: 116 tests |
| `npm run test:v2:trajectory` | PASS: 63 tests |
| `npm run test:v2:analysis` | PASS: 47 tests and Stage 5 coverage gates |
| `npm run test:v2:claims-reports` | PASS: 23 tests and Stage 6 coverage gates |
| `npm run test:v2:outcome-calibration` | PASS: 29 tests and Stage 7 coverage gates |
| `npm test` | PASS: 378 tests in 34 files |
| `npm run test:unit` | PASS: 375 tests in 33 files |
| `npm run test:golden` | PASS: 3 tests covering exactly eight V1 Golden Cases |
| `npm run test:coverage` | PASS: statements 90.83%, branches 80.28%, functions 95.15%, lines 93.18% |
| `npm run check` | PASS: full tests, lint, type-check, and production build |
| `npm run check:ci` | PASS: coverage, lint, type-check, and production build |
| `git diff --check` | PASS |

The final diff contains only the new Stage 7 module/tests, the Stage 7 data and
TDD documentation, the new package command, and global coverage inclusion. It
does not modify V1 or Stage 2-6 production code, and it does not modify
`docs/FUTURE_SIMULATOR_V2.md`.
