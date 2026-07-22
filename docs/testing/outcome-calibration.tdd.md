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

## Forecast Lock and semantic-unit repair RED/GREEN evidence

The next repair started from
`c2272c5ff294ca000f647306fc9448152e99eee9`. Forecast Lock, namespace-alias,
late-lock, tampering, and repository-order tests were added before production
code.

Initial RED command and result:

```text
npm run test:v2:outcome-calibration
Exit code: 1
Test Files  4 failed (4)
Tests       no tests
Error: Cannot find module './forecast-lock'
```

This is the intended compile-time RED: the new tests referenced the missing
Forecast Lock artifact and builder. It was not an unrelated dependency or
environment failure.

GREEN after implementation:

```text
npm run test:v2:outcome-calibration
Exit code: 0
Test Files  4 passed (4)
Tests       33 passed (33)
Statements 90.87% (538/592)
Branches   86.71% (385/444)
Functions  97.52% (118/121)
Lines      94.35% (468/496)
```

The tests prove that namespace-only Run/Claim/Report aliases share one semantic
forecast-unit signature; five such aliases cannot reach calibration minimum.
They also prove full Run/Claim Set/Claims/Report lock replay, strict lock
schemas, lock and persistence time before Evidence capture, tamper detection,
and repository ordering of Forecast Lock -> Outcome -> Backtest -> Calibration.
The sufficient five-sample fixture verifies each pre-locked Forecast/Outcome
pair against its exact evaluation window.

## Repository-bound Forecast Target repair RED/GREEN evidence

Starting from `ba6be57ddb452bca6fb7994206185fc52b7dcd68`, RED tests proved
that lock time and persistence aliases changed `forecastUnitSignature`, two
Outcome aliases could evade target-level de-duplication, a lock after window
start was accepted, and Backtest accepted a caller-assembled receipt instead
of loading a repository version. `npm run test:v2:outcome-calibration` failed
with those four intended assertions before production code changed.

GREEN result after the repair:

```text
npm run test:v2:outcome-calibration
Exit code: 0
Test Files  4 passed (4)
Tests       39 passed (39)
Statements 90.36% (563/623)
Branches   86.68% (423/488)
Functions 97.52% (118/121)
Lines     94.08% (493/524)
```

The repaired Backtest accepts only a strict Lock stream/version reference,
loads the exact stored record through the repository port, and persists the
loaded record in its immutable snapshot. Forecast signatures omit `lockedAt`,
Lock identity, and persistence identity; Calibration additionally rejects a
duplicate semantic forecast target for the same evaluation window. Locks and
persistence must predate the window start, and occurred Outcomes additionally
require `lockedAt < occurredAt`. The five-sample GREEN fixture now uses five
semantic forecast targets with distinct trajectory-seed cohorts and paired
Outcomes, never lock-time or persistence-version aliases.

The final RED adds a hash-self-consistent receipt returned by `loadVersion` but
absent from `loadHistory`; it fails before the chain guard exists. GREEN now
requires the exact stored record at the requested stream/version and validates
the contiguous parent/version chain, request fingerprint, persistence id, and
integrity signature before a Backtest can be constructed. The public-index test
also imports the Forecast Lock builder and validator directly from Stage 7.

## Forecast Lock write-before-window repair RED/GREEN evidence

Starting from `285172a8e432dc1f276e591f83582c017e6b21df`, executable RED tests
were added before the Stage 7 implementation changed. The focused command was:

```text
npm run test:v2:outcome-calibration -- --run src/lib/v2/outcome-calibration/forecast-lock.test.ts src/lib/v2/outcome-calibration/repository.test.ts
Exit code: 1
Test Files  2 failed | 2 passed (4)
Tests       2 failed | 39 passed (41)
```

RED demonstrated that a lock at the revalidated evaluation-window start was
buildable and that the repository appended a `forecast_lock` version at that
same start instant. The tests also cover a post-start lock, post-start
`persistedAt`, `persistedAt < lockedAt`, a self-consistent but late persistence
envelope, atomic empty-history/idempotency behavior, and a legal pre-window
append.

GREEN after the time-gate implementation was:

```text
npm run test:v2:outcome-calibration -- --run src/lib/v2/outcome-calibration/forecast-lock.test.ts src/lib/v2/outcome-calibration/repository.test.ts
Exit code: 0
Test Files  4 passed (4)
Tests       40 passed (40)
Statements 90.58% (577/637)
Branches   86.61% (440/508)
Functions 97.54% (119/122)
Lines     94.23% (507/538)
```

The implementation derives each Forecast Unit window from the revalidated Run
with Stage 4 millisecond-safe timestamps. It rejects build/parse locks unless
`boundary.updatedAt <= lockedAt < window.startAt`, and rejects persistence
unless `boundary.updatedAt <= lockedAt <= persistedAt < window.startAt`. The
repository checks this before append mutation, so failed requests retain empty
history and may reuse their idempotency key with a valid request. The former
2028 leap-date append fixture now uses a valid pre-window 2026 persistence time
instead of violating the Forecast time contract.

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
| `npm run test:v2:outcome-calibration` | PASS: 39 tests in 4 files and Stage 7 coverage gates |
| `npm test` | PASS: 388 tests in 35 files |
| `npm run test:unit` | PASS: 385 tests in 34 files |
| `npm run test:golden` | PASS: 3 tests covering exactly eight V1 Golden Cases |
| `npm run test:coverage` | PASS: statements 90.62%, branches 80.55%, functions 95.10%, lines 93.19% |
| `npm run check` | PASS: full tests, lint, type-check, and production build |
| `npm run check:ci` | PASS: coverage, lint, type-check, and production build |
| `git diff --check` | PASS |

The final diff contains only Stage 7 implementation/tests and the permitted
Stage 7 data/TDD documentation. It does not modify V1 or Stage 2-6 production
code, and it does not modify `docs/FUTURE_SIMULATOR_V2.md`.
