# Stage 6 Claims and Reports TDD Evidence

## Source and scope

The journeys and guarantees in this report were derived from the Stage 6 task issued for baseline commit `9858a0877a467b5a913f82d071b630e6bfe5c2fa`. No separate plan file was used.

Stage 6 covers deterministic V2 Claims and Reports built only from revalidated Stage 5 Batch, Sensitivity, and Intervention results. It permanently separates Real Evidence references from Simulation Event references. It does not modify V1 or Stage 2–5 production code and does not add Stage 7 backtesting, calibration, persistence, UI, API, queues, network, LLM, search, payment, or asynchronous execution.

## User journeys

- As an auditor, I want every Claim to be rebuilt from validated Run Specs, Trajectories, Features, Clusters, and Frequencies so forged Stage 5 summaries cannot become conclusions.
- As a decision-sandbox user, I want Real Evidence, Simulation Events, Assumptions, Trajectories, sample counts, versions, and uncertainty disclosed separately so simulation frequency cannot be mistaken for real-world probability.
- As a report reader, I want Reports to copy only validated Claims without new conclusions, stronger wording, changed references, or hidden Assumptions.
- As an application-logic caller, I want strict unknown-input boundaries, stable error codes, atomic failures, deterministic replay, and deep input isolation.

## RED evidence

Command:

```text
npm run test:v2:claims-reports
```

Observed result before any Stage 6 production module existed:

```text
Test Files  1 failed (1)
Tests       no tests
Error: Cannot find module './claim-builder'
```

This was a valid compile-time RED. Vitest loaded the new Stage 6 test target and failed specifically because the requested independent Claim Builder module did not exist. No Stage 2–5 production code had been changed.

## GREEN evidence

Dedicated command:

```text
npm run test:v2:claims-reports
```

Observed result after implementation and hardening:

```text
Test Files  2 passed (2)
Tests       14 passed (14)
Statements  90.88% (299/329)
Branches    82.14% (184/224)
Functions   95.52% (64/67)
Lines       97.46% (231/237)
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
| 1 | Scenario-frequency Claims are deterministic and preserve input immutability | deterministic replay test | Integration | PASS |
| 2 | Batch analysis is strictly revalidated from Run Spec through Trajectory, Feature, Cluster, and Frequency | forged Stage 5 analysis attacks | Integration | PASS |
| 3 | Sensitivity differences are recomputed from paired seeds and exact frequencies | sensitivity comparison tests | Integration | PASS |
| 4 | Intervention differences are recomputed from paired seeds and exact frequencies | intervention comparison tests | Integration | PASS |
| 5 | Sensitivity axes and pre-run transition Events match the variant World and revision | forged axis/Event/revision attacks | Integration | PASS |
| 6 | Cross-seed, cross-ledger, dangling, cross-trajectory, missing, duplicate, and illegal provenance is rejected atomically | provenance attack matrix | Unit/Integration | PASS |
| 7 | High-impact third-party Assumptions must be confirmed for simulation | unconfirmed Assumption test | Unit | PASS |
| 8 | Claims store separate Real Evidence and Simulation Event arrays plus Assumptions, Trajectories, Clusters, counts, versions, and uncertainty | Claim contract assertions | Unit | PASS |
| 9 | Claim IDs, integrity signatures, ordering, statements, and outputs are deterministic | replay and semantic-integrity tests | Unit | PASS |
| 10 | Recalculating a Claim ID cannot turn simulation frequency into certainty or probability language | strengthened-Claim attack | Unit | PASS |
| 11 | Reports select only known validated Claim IDs and copy Claim content and references exactly | Report construction test | Integration | PASS |
| 12 | Added conclusions, stronger text, changed references, probability labels, duplicate IDs, bad types, and extra fields are rejected | Report attack matrix | Unit | PASS |
| 13 | Real Evidence and Simulation Events are never written into one ledger | scope and ledger boundary test | Boundary | PASS |
| 14 | Stage 6 has no UI, API, persistence, network, LLM, payment, async, backtesting, or calibration implementation | production scope scan | Boundary | PASS |

## Deterministic and evidence rules

- Claim and Report IDs are 24-character SHA-256 fingerprints of canonical structural content under separate namespaces.
- Stage 6 parses a strict unknown-input envelope, re-parses the Stage 5 Batch Run Spec, re-extracts every Feature from its Stage 4 Trajectory, reconstructs exact Clusters, and recomputes Frequency before generating any Claim.
- Every Real Evidence ID must exist in the exact Reality Boundary Evidence Ledger snapshot used by the Stage 5 initial World.
- Scenario Simulation Event IDs come from the named Stage 4 Trajectories. Difference Claims additionally include the revalidated pre-run transition Event and its baseline-World prior Event chain; these remain Simulation Evidence and never substitute for Real Evidence.
- High-impact third-party Assumptions must remain `required`, `confirmed`, and `confirmed_for_simulation`.
- Scenario frequency remains integer `numerator / denominator`, and deterministic differences use a signed numerator over the paired fixed-seed sample denominator.
- Reports regenerate only from validated Claim snapshots. They cannot accept caller-authored conclusions, rewrite Claim wording, change references, hide Assumptions, or use real-world probability labels.
- All validation precedes output construction. Failed operations return a stable error code and no partial Claim or Report list.

## Full validation evidence

The required layered commands passed:

```text
npm run test:v2:evidence          5 files, 83 tests
npm run test:v2:world             6 files, 116 tests
npm run test:v2:trajectory        4 files, 63 tests
npm run test:v2:analysis          4 files, 47 tests
npm run test:v2:claims-reports    2 files, 14 tests
npm test                         31 files, 340 tests
npm run test:unit                30 files, 337 tests
npm run test:golden               1 file, 3 tests
npm run test:coverage            31 files, 340 tests
```

Both `npm run check` and `npm run check:ci` passed, including lint, route type generation, TypeScript, and the Next.js 16.2.6 production build. The baseline diff check is performed against the delivery commit immediately before push.

## Coverage and known gaps

The dedicated Stage 6 command enforces Statements >= 90%, Branches >= 80%, Functions >= 95%, and Lines >= 90%; all four thresholds pass. The global Vitest coverage allowlist includes every Stage 6 production file.

There is intentionally no browser E2E test because Stage 6 is synchronous application logic with no UI or API surface. Stage 7 outcome capture, backtesting, calibration, database persistence, and asynchronous server execution remain out of scope.

The task requires one final ordinary commit, so RED and GREEN are preserved in this evidence file instead of separate checkpoint commits.

## Unknown-input, Claim identity, Report provenance, and comparison hardening

This follow-up started from commit `5e0651b2b72db3e725f8348187e6281e65534cd6` and remained entirely inside Stage 6 production code, its existing tests, and this existing TDD record.

RED command:

```text
npm run test:v2:claims-reports
```

Observed RED before production changes:

```text
Test Files  1 failed | 1 passed (2)
Tests       9 failed | 11 passed (20)
```

The nine failures reproduced malformed Assumption Ledger exceptions, hostile getter exceptions, re-signed Claim mathematics/version bypasses, incomplete sensitivity/intervention comparison control, Report construction without Stage 5 source revalidation, and acceptance of re-signed public Claim summaries.

Final GREEN:

```text
Test Files  2 passed (2)
Tests       20 passed (20)
Statements  90.95% (372/409)
Branches    83.68% (236/282)
Functions   95.77% (68/71)
Lines       96.29% (286/297)
```

Additional guarantees:

- Every public Stage 6 builder/parser catches arbitrary unknown input, including nested throwing getters, and returns an atomic stable failure without partial Claims or Reports.
- Evidence and Assumption Ledgers must both pass their validators before Stage 6 reads nested Assumptions.
- Scenario numerators stay inside `[0, denominator]`; difference numerators stay inside `[-denominator, denominator]`, even after an attacker recalculates Claim ID and integrity digest.
- Claim type, metric, source-analysis namespace, and variant namespace form one strict identity contract.
- Stage 3 Agent World, Stage 4 Trajectory, Stage 5 Analysis/Feature/Clustering versions are exact literals rather than caller-controlled strings.
- Report construction requires a Stage 5-backed Claim Set plus Reality Boundary, regenerates canonical Claims through the Stage 6 builder, and compares every supplied Claim field before selecting `claimIds`.
- Re-signed Claims with dangling Real Evidence, Simulation Events, Trajectories, Clusters, or impossible counts cannot enter a Report.
- Baseline and variant Batch Specs are compared across the complete normalized structure. Only the validated pre-run transition World, expected revision, and start instant may differ.
- The pre-run Event is replayed from its one deterministic delta and must reconstruct the exact variant initial World. Sensitivity additionally binds different baseline/variant values to the Event operation `variableId` and `value`.

Follow-up full validation:

```text
npm run test:v2:evidence          5 files, 83 tests
npm run test:v2:world             6 files, 116 tests
npm run test:v2:trajectory        4 files, 63 tests
npm run test:v2:analysis          4 files, 47 tests
npm run test:v2:claims-reports    2 files, 20 tests
npm test                         31 files, 346 tests
npm run test:unit                30 files, 343 tests
npm run test:golden               1 file, 3 tests
npm run test:coverage            31 files, 346 tests
```

No Stage 7 outcome capture, backtesting, calibration, database, persistence, API, UI, network, LLM, queue, payment, or asynchronous execution was added.

## Difference Claim pre-run causal provenance hardening

This follow-up started from commit `176a684a48ce49608c124ccdda9b132a7b98f5d5`. It changed only the Stage 6 Claim builder, its existing test file, and this existing TDD record.

RED command and observed result before production changes:

```text
npm run test:v2:claims-reports
Test Files  1 failed | 1 passed (2)
Tests       3 failed | 20 passed (23)
```

The failures proved that canonical Sensitivity and Intervention Difference Claims omitted the validated transition Event ID, its causal Real Evidence, and its prior World Events, allowing a correspondingly re-signed public Claim set to pass Report regeneration.

Final focused GREEN:

```text
Test Files  2 passed (2)
Tests       23 passed (23)
Statements  91.10% (379/416)
Branches    85.26% (243/285)
Functions   95.94% (71/74)
Lines       96.34% (290/301)
```

New guarantees:

- `buildDifferenceClaim` requires the exact `WorldEventV2` returned by successful transition replay validation.
- Sensitivity and Intervention Claims use a sorted unique union of both clusters' Real Evidence, Assumptions, Simulation Events, member Trajectories, and Cluster IDs plus the transition's causal Real Evidence, causal Assumptions, Event ID, and prior World Event IDs.
- Transition Real Evidence and Assumptions must exist in the supplied Reality Boundary, and every prior Event must exist in the baseline World.
- The transition remains the variant World's unique final addition and must reconstruct that World exactly when replayed from the baseline World.
- Report construction regenerates these canonical Difference Claims from its Claim Set and rejects re-signed Claims that delete or substitute transition provenance.
- Real Evidence, Assumptions, Simulation Events, Trajectories, and Clusters remain separately typed, sorted, unique, deterministic provenance arrays.
- `scenario_frequency` construction and meaning are unchanged.

Follow-up full validation:

```text
npm run test:v2:trajectory        4 files, 63 tests
npm run test:v2:analysis          4 files, 47 tests
npm run test:v2:claims-reports    2 files, 23 tests
npm test                         31 files, 349 tests
npm run test:unit                30 files, 346 tests
npm run test:golden               1 file, 3 tests
npm run test:coverage            31 files, 349 tests
```

Both `npm run check` and `npm run check:ci` passed completely, including lint, route type generation, TypeScript, and the Next.js 16.2.6 production build of 99 static pages. Two earlier `check:ci` attempts reached and passed coverage, lint, and type-check but hit intermittent `fonts.gstatic.com` JetBrains Mono download timeouts; direct URL probes returned HTTP 200 and the unchanged command passed on retry.

Global coverage was Statements 90.64% (2926/3228), Branches 79.35% (2045/2577), Functions 94.71% (717/757), and Lines 93.02% (2573/2766).

Stage 7 outcome capture, backtesting, calibration, persistence, database, API, UI, network, LLM, queue, payment, and asynchronous execution remain out of scope.
