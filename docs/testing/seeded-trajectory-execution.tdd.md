# Seeded Trajectory Execution TDD Evidence

## Source and journey

The journey and acceptance criteria were derived from the Stage 4 task supplied for this implementation.

As the server-side trajectory executor, I need one explicit Run Spec and a versioned seed to produce an auditable, reproducible Tick sequence through the Stage 3 Proposal, Command, and World Transition boundary.

## RED and GREEN evidence

- RED: `npx vitest run src/lib/v2/trajectory` executed the new target before production files existed. Vitest reported four failed files; missing Stage 4 modules were the intended compile-time RED signal.
- GREEN: `npm run test:v2:trajectory` passed 4 files and 44 tests after implementation.
- Coverage: `npm run test:coverage` passed 25 files and 260 tests. Stage 4 trajectory coverage was 96.12% statements, 89.18% branches, 100% functions, and 97.54% lines.

### Time-boundary hardening correction

- RED: `npm run test:v2:trajectory` executed 52 tests and reported 6 intended failures. A Run Spec could start before its initial World, and past, future, far-future, or one-of-many drifted Proposal timestamps could reach candidate selection.
- GREEN: the same command passed 4 files and 52 tests after adding Run Spec monotonicity and candidate-to-Tick instant validation.
- Coverage: `npm run test:coverage` passed 25 files and 268 tests. Stage 4 trajectory coverage was 96.99% statements, 91.02% branches, 100% functions, and 97.63% lines.

### Millisecond-precision and timestamp-domain correction

- RED: `npm run test:v2:trajectory` executed 61 tests and reported 5 intended failures. Sub-millisecond Run Spec and Proposal timestamps were silently truncated, and a schedule could cross beyond the four-digit-year timestamp domain after parsing.
- GREEN: the same command passed 4 files and 63 tests after adding lossless millisecond parsing, canonical timestamp generation, and final-Tick domain validation.
- Coverage: `npm run test:coverage` passed 25 files and 279 tests. Stage 4 trajectory coverage was 93.65% statements, 84.24% branches, 100% functions, and 96.06% lines. Global coverage was 90.26% statements, 76.93% branches, 94.08% functions, and 91.48% lines.

## Test specification

| What is guaranteed | Test target | Type | Result |
|---|---|---|---|
| Run Specs strictly reject malformed, cross-seed, stale-revision, invalid schedule, timestamp, version, and uint32 seed input without throwing | `validation.test.ts` | unit | PASS |
| `mulberry32` version 1 retains its fixed uint32 vector and exposes draw audit data | `seeded-rng.test.ts` | unit | PASS |
| Fixed Run Spec, World, policy, runtime, and seed reproduce ids, selections, Commands, Events, and final World | `trajectory-runner.test.ts` | integration | PASS |
| Every successful Tick uses Stage 3 approval and transition, increments revision exactly once, and appends one simulation Event | `trajectory-runner.test.ts` | integration | PASS |
| Empty candidates terminate as `no_actions`; invalid policy, approval, and transition failures expose no partial Command, Event, or revision | `trajectory-runner.test.ts` | integration | PASS |
| Inputs and Agent Definitions remain unchanged, and Simulation Events never enter the Real Evidence ledger | `trajectory-runner.test.ts` | integration | PASS |
| A Run Spec cannot start before `initialWorld.updatedAt`, equality remains valid, and rejection precedes Policy and RNG work | `validation.test.ts`, `trajectory-runner.test.ts` | unit/integration | PASS |
| Every Proposal timestamp represents the Tick instant; timezone-equivalent input passes and any drift rejects the complete candidate set before selection | `trajectory-runner.test.ts` | integration | PASS |
| Run Spec and Proposal timestamps accept only instants losslessly representable in milliseconds; trailing fractional zeros normalize without changing the instant | `validation.test.ts`, `trajectory-runner.test.ts` | unit/integration | PASS |
| The complete Tick schedule remains inside the Stage 3 four-digit-year ISO domain, with overflow rejected before Policy, RNG, or Trajectory creation | `validation.test.ts`, `trajectory-runner.test.ts` | unit/integration | PASS |
| Stage 4 production code excludes ambient randomness, wall-clock reads, later-stage analytics, Claims, and Reports | `boundary.test.ts` | boundary | PASS |

## Known gaps

No UI, API route, queue, persistence, network, LLM, multi-trajectory aggregation, sensitivity analysis, intervention comparison, Claims, or Reports are in Stage 4 scope. There is therefore no browser E2E flow for this server-oriented application module.

The task requires one final ordinary commit, so RED and GREEN were preserved in this evidence file rather than separate checkpoint commits.
