# Stage 5 Trajectory Analysis TDD Evidence

## Source and scope

The journeys and guarantees in this report were derived from the Stage 5 task issued for baseline commit `59149788d1510ee939697f70e69d3586fe56e70c`. No separate plan file was used.

Stage 5 covers deterministic batch trajectory execution, feature extraction, exact clustering, sampled simulation frequency, controlled sensitivity comparison, and pre-run intervention comparison. It does not add Claims, Reports, UI, API routes, persistence, network calls, outcome capture, backtesting, calibration, or Stage 6 behavior.

## User journeys

- As an analysis caller, I want a fixed set of uint32 seeds to execute through the existing Stage 4 runner so that the ensemble is reproducible and auditable.
- As an auditor, I want features and clusters to trace only to actual World deltas and Simulation Events so that no narrative or fabricated aggregate can enter the result.
- As a decision sandbox user, I want sampled frequencies to disclose exact counts and versions so that they cannot be mistaken for calibrated real-world probabilities.
- As an analyst, I want sensitivity variants to change exactly one declared axis and intervention variants to pass through Stage 3 approval and transition so that comparisons remain controlled and evidence-safe.

## RED evidence

Command:

```text
npx vitest run src/lib/v2/trajectory-analysis --reporter=verbose
```

Observed result before any Stage 5 production module existed:

```text
Test Files  1 failed | 1 passed (2)
Tests       1 passed (1)
Error: Cannot find module './local-adapter'
```

This was a valid compile-time RED: the boundary test executed, while the behavioral suite failed specifically because the requested Stage 5 implementation was missing. The earlier `npm run test:v2:analysis` attempt reported a missing script and was not counted as RED.

## Initial GREEN evidence

Command:

```text
npm run test:v2:analysis
```

Observed result after implementation and edge-path hardening:

```text
Test Files  2 passed (2)
Tests       14 passed (14)
Statements  90.62% (261/288)
Branches    88.40% (183/207)
Functions   97.43% (76/78)
Lines       97.02% (196/202)
```

Type validation:

```text
npm run type-check
Generating route types...
Types generated successfully
```

## Test specification

| # | What is guaranteed | Evidence | Type | Result |
|---|---|---|---|---|
| 1 | Malformed and extra-field batch inputs return stable failures without throwing | `trajectory-analysis.test.ts` strict batch rejection | Unit | PASS |
| 2 | Empty, duplicate, non-uint32, and count-mismatched seed sets are rejected | strict batch rejection | Unit | PASS |
| 3 | Cross-seed and version drift map to stable analysis errors | stable error mapping test | Unit | PASS |
| 4 | Seed order does not change canonical child or aggregate ordering | reproducibility and canonical ordering test | Integration | PASS |
| 5 | Repeated fixed inputs are deeply equal | reproducibility test | Integration | PASS |
| 6 | Every child is constructed as a Stage 4 run and executed by `executeTrajectoryV2` | batch runner integration tests and direct production import | Integration | PASS |
| 7 | A child failure returns only failure index, seed, and cause; no partial aggregate escapes | atomic child failure test | Integration | PASS |
| 8 | `no_actions` remains a real sample with stable clustering | no-actions test | Integration | PASS |
| 9 | Features are derived from actual World/Event references and do not mutate inputs | feature auditability test | Unit | PASS |
| 10 | Fabricated, missing-event, or malformed feature inputs are rejected | fabricated feature rejection test | Unit | PASS |
| 11 | Exact-signature clusters are disjoint, complete, and deterministically ordered | clustering invariant test | Unit | PASS |
| 12 | Cluster identities use `exact_outcome_signature` version `1` without randomness | clustering invariant and constants | Unit | PASS |
| 13 | Frequency numerators sum exactly to sample count and every denominator equals sample count | rational frequency test | Unit | PASS |
| 14 | Frequency output discloses versions, seeds, Reality Boundary revision, assumptions, and non-probability uncertainty wording | frequency metadata test | Unit | PASS |
| 15 | Empty samples and incomplete or duplicate cluster membership are rejected | frequency rejection tests | Unit | PASS |
| 16 | Sensitivity accepts exactly one declared external-variable axis with identical seeds and versions | controlled sensitivity test | Integration | PASS |
| 17 | Uncontrolled second changes, version drift, and unconfirmed high-impact third-party assumptions are rejected | sensitivity boundary tests | Integration | PASS |
| 18 | Pre-run interventions pass through Stage 3 approval and deterministic World Transition | intervention comparison test | Integration | PASS |
| 19 | Baseline and intervention variants use isolated World clones, paired seeds, and an unchanged Real Evidence Ledger | intervention isolation test | Integration | PASS |
| 20 | Scope scan finds no Claims, Reports, API, database, persistence, LLM/network, Destiny, astrology, or birth implementation | `boundary.test.ts` | Boundary | PASS |

## Deterministic rules

- Batch child Run Spec IDs and trajectory IDs use separate namespaces and SHA-256 fingerprints of the canonical batch identity, fixed versions, and trajectory seed.
- Features use actual Stage 4 terminal status, executed steps, revision delta, selected World Events, operations, targets, causal references, and deltas.
- Clustering algorithm is `exact_outcome_signature`, version `1`. A cluster contains only features with the same canonical outcome signature; the lowest `(trajectorySeed, trajectoryId)` is the representative.
- Frequency uses integer `numerator / denominator`; each denominator is the actual successful sample count, and all numerators must sum to that count.
- Sensitivity currently supports the declared `external_variable` axis. Its value changes only through a strict provenance-backed Stage 3 Proposal, approval, and deterministic World Transition.
- Each intervention is approved by `approveActionProposalV2`, applied by `applyWorldTransitionV2`, and then used as the cloned initial World of an independent Stage 4 batch rerun.

## Hardening RED/GREEN evidence

The follow-up hardening cycle added adversarial guarantees before changing production code.

RED command:

```text
npm run test:v2:analysis
```

Observed RED:

```text
Test Files  1 failed | 2 passed (3)
Tests       11 failed | 15 passed (26)
```

The failures reproduced permissive status/revision handling, mutable factory input, incomplete ID parsing, direct-World sensitivity, unbound intervention time, non-canonical cluster acceptance, and missing input Assumption disclosure.

Final GREEN:

```text
Stage 4: 4 files, 63 tests passed
Stage 5: 3 files, 29 tests passed
Statements  90.94% (442/486)
Branches    85.39% (304/356)
Functions   97.02% (98/101)
Lines       97.47% (348/357)
```

The hardening suite additionally proves:

- Strict unknown-field rejection at Trajectory, Step, termination, RNG audit, comparison, variant, axis, and Action Proposal levels.
- Status, tick, revision, time, Event, Command, World-history-prefix, ownership, and unchanged Real Evidence invariants before Feature extraction.
- Sensitivity external-variable changes are created only by Stage 3 approval and World Transition; direct variant World specs are rejected.
- Every adapter factory receives a separate recursively frozen clone, leaving the canonical spec and caller input unchanged.
- Intervention time is captured once, compared by exact instant with Proposal time, and validated before approval or transition.
- Clusters are grouped by complete canonical outcome strings; frequency recomputes clusters and rejects any changed seed, representative, ID, ordering, or provenance union.
- Frequencies disclose all Assumptions actually modeled by the initial World, independently from cluster-specific causal Assumptions.

## Child-spec and canonical-integrity hardening RED/GREEN evidence

This follow-up started from commit `15085258ac131ec505d978a4afd1f0f958cf0d30`. Tests were added before any production change.

RED command:

```text
npm run test:v2:analysis
```

Observed RED:

```text
Test Files  1 failed | 3 passed (4)
Tests       9 failed | 29 passed (38)
```

The nine failures reproduced unbound child Trajectory IDs/Run Spec/schedule fields, drifted Tick schedules, incomplete completed runs, permissive canonical outcome payloads, independently mutable derived Feature fields, Frequency acceptance of rewritten Feature disclosure, numeric and enum no-op Sensitivity transitions, and cross-variant actor/provenance drift.

GREEN command:

```text
npm run test:v2:analysis
```

Observed GREEN:

```text
Test Files  4 passed (4)
Tests       38 passed (38)
Statements  90.44% (492/544)
Branches    85.06% (353/415)
Functions   97.16% (103/106)
Lines       97.26% (391/402)
```

Additional guarantees:

- Batch execution and Feature validation share `buildChildTrajectoryRunSpecV2`; Feature extraction verifies the exact child trajectory ID, Run Spec ID, seed, horizon, start instant, policy and engine versions, initial World, Tick interval, and maximum Tick count.
- Tick zero equals `startAt`; every later Tick equals `startAt + tickIndex * tickIntervalDays`; `completed` consumes the complete schedule and `no_actions` terminates only inside it.
- Feature schema `trajectory-feature-v2.2` uses a strict canonical outcome payload. Visible terminal metrics, operation sequence, affected IDs, and evidence/Assumption provenance must exactly match that payload.
- A separate canonical Feature integrity signature binds the trajectory identity, Simulation Event IDs, engine/policy versions, and Reality Boundary revision to the canonical outcome.
- Clustering continues to group by the complete canonical outcome string, and Frequency first reconstructs canonical clusters from fully integrity-validated Features.
- Sensitivity rejects numeric and enum no-op values before approval, transition, or batch execution. Across variants, only variant/proposal IDs and the axis value may differ; actor, targets, evidence, Assumptions, prior Events, time, rationale, and controlled target metadata remain identical.

## Coverage and known gaps

The Stage 5 coverage command enforces Statements >= 90%, Branches >= 80%, Functions >= 95%, and Lines >= 90%. All final hardening thresholds pass. This stage intentionally has no browser E2E test because it introduces no UI or API surface; its end-to-end boundary is the local Stage 3 -> Stage 4 -> Stage 5 application-logic chain.

Each hardening task requires one final ordinary commit, so its RED and GREEN states are preserved in this evidence report instead of separate checkpoint commits.
