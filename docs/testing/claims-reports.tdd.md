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
- Every Simulation Event ID carried by a Claim must come from the Stage 4 Trajectories named by that Claim. Pre-run transition Events are revalidated as comparison inputs but are not substituted for trajectory Simulation Events.
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
