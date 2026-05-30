# Phase 3 Completion Audit: Destiny Core Credibility

Audit date: 2026-05-29
Branch audited: `codex/destiny-situation-sandbox`
Result: PASS

Phase 3 is complete enough to proceed to Phase 4. The current branch contains the Destiny Core V1 type surface, local calculation skeleton, interpretation layer, upgraded destiny-situation fusion, fourth simulation path, three-layer result evidence replay, and Golden Case acceptance checks for the new product shape.

## 1. Completed Items

### Destiny Core V1 Types

Status: PASS

Verified in `src/types/destiny.ts`:

- `HeavenlyStem`
- `EarthlyBranch`
- `FiveElement`
- `YinYang`
- `Pillar`
- `FourPillarsDraft`
- `TenGodSignal`
- `ElementBalanceDraft`
- `DestinyCalculationConfidence`

The profile and climate drafts also expose V1 data through `fourPillars`, `elementBalance`, `tenGodsSummary`, `destinyCalculationConfidence`, `localWarnings`, and interpretation fields.

### Destiny Core V1 Files

Status: PASS

Verified files exist and are wired into the profile builder:

- `src/lib/destiny/constants.ts`
- `src/lib/destiny/calculate-four-pillars.ts`
- `src/lib/destiny/calculate-element-balance.ts`
- `src/lib/destiny/calculate-ten-gods.ts`
- `src/lib/destiny/destiny-core-v1.ts`

`buildDestinyProfileDraft` calls `buildDestinyCoreV1`, preserves existing draft fields, and attaches V1 calculation output. Missing birth time is handled by omitting the hour pillar, lowering confidence, and adding the warning: `Unknown birth time reduces hour-pillar confidence.`

### Destiny Interpretation Layer

Status: PASS

Verified files:

- `src/lib/destiny/interpret-destiny-profile.ts`
- `src/lib/destiny/interpret-destiny-climate.ts`

Verified user-facing fields are present in `src/types/destiny.ts` and populated by the builders:

- `coreTendencies`
- `pressureThemes`
- `opportunityThemes`
- `relationshipThemes`
- `decisionRhythm`
- `cautionNotes`
- `observationSignals`
- `technicalDetails`

`buildDestinyProfileDraft` and `buildDestinyClimateDraft` both attach interpretation output. The wording remains directional and product-safe, using language such as "may indicate", "tends to", "can amplify", and "worth observing" rather than deterministic fate claims.

### Destiny-Situation Fusion Upgrade

Status: PASS

Verified in `src/lib/destiny-fusion/build-destiny-situation-fusion.ts` and `src/types/destiny-fusion.ts`.

Fusion now consumes DestinyClimate interpretation fields:

- `pressureThemes`
- `opportunityThemes`
- `relationshipThemes`
- `observationSignals`
- `decisionRhythm`

Mappings include richer explanation data:

- `destinyTheme`
- `realPersonOrPressure`
- `whyLinked`
- `evidenceBasis`
- `confidence`
- `lowConfidenceNotes`

The mapping rules cover the required theme-to-role directions, including resource pressure, boundary pressure, information uncertainty, emotional pull, opportunity shift, and expression friction. Fusion preserves source tags: `destiny climate`, `real situation`, and `integrated simulation`.

### Fourth Simulation Path

Status: PASS

Verified:

- `SimulationBranchId` includes `boundary_adjustment` in `src/types/simulation-run.ts`.
- `src/lib/simulation/branch-policy.ts` includes `Boundary adjustment path`.
- The branch policy uses `selfBias: "boundary"` and `boundaryStabilizationBias`.
- `src/lib/simulation/edge-update-rules.ts` applies boundary/resource stabilization behavior.
- `src/lib/simulation/event-policy.ts` emits a boundary-specific event path.
- `src/lib/simulation/simulation-engine.ts` includes boundary branch labels, descriptions, event summaries, and saved branch output.
- `src/app/app/simulation/running/page.tsx`, `src/app/app/simulation/result/page.tsx`, and `src/components/simulation/event-log.tsx` display the boundary path.

Simulation events still carry the evidence chain fields: `pathLabel`, `destinyInfluenceSummary`, `interactionSummary`, `pressureDeltaSummary`, `generatedClues`, and `sourceTags`.

### Result Three-Layer Evidence Basis

Status: PASS

Verified in `src/app/app/simulation/result/page.tsx`.

Each selected Finding supports:

- Destiny basis: mode, confidence, key climate themes, relevant interpretation notes, skipped-destiny fallback.
- Real situation basis: decision topic, user free-form situation, extracted people, real-world clues.
- Dynamic sandbox basis: related sandbox events, path labels, destiny influence summary, interaction summary, pressure delta summary, generated clues.

Additional replay blocks expose relation changes, path divergence, generated clues, and destiny-situation mappings. Existing `evidenceEventIds` remain the basis for selecting related sandbox events.

### Golden Cases

Status: PASS

Verified in `src/lib/golden-cases/full-product-cases.ts`.

Golden Case acceptance now validates:

- DestinyProfile builds.
- Destiny Core V1 fields exist when birth info is available.
- Missing birth time reduces confidence without blocking.
- Rough mode.
- Skipped mode.
- DestinyClimate builds.
- Free-form situation derives usable SeedContext.
- Clarification triggers only when needed.
- Blocked safety case stops downstream generation.
- Destiny-situation fusion maps themes to real people/pressures.
- Simulation events include dynamic replay fields.
- Four branch paths exist, including `boundary_adjustment`.
- Findings include source tags.
- Evidence replay includes destiny basis, real situation basis, dynamic sandbox basis, and path divergence.

## 2. Missing Items

Status: NONE FOUND

No required Phase 3 deliverable from the audit checklist is missing in the current branch.

## 3. Partially Completed Items

Status: NON-BLOCKING HARDENING ONLY

The following are not blockers for Phase 3, but should be considered before or during Phase 4:

- The Destiny Core V1 calculation is explicitly local and approximate. It documents solar-term limitations and should not be treated as professional-grade BaZi precision.
- Golden Cases validate the product shape and invariants, but they are implemented as local acceptance logic rather than a broad dedicated unit-test suite for each low-level destiny calculation helper.
- The boundary branch policy uses neutral edge pressure plus stronger stabilization behavior. This satisfies the current product path requirement, but Phase 4 may want calibrated pressure deltas after more UX review.
- Result evidence replay is product-complete for the three layers, while deeper visual comparison of all branch divergence remains a likely Phase 4 UX refinement.

## 4. Files Inspected

- `src/types/destiny.ts`
- `src/types/destiny-fusion.ts`
- `src/types/simulation-run.ts`
- `src/lib/destiny/constants.ts`
- `src/lib/destiny/calculate-four-pillars.ts`
- `src/lib/destiny/calculate-element-balance.ts`
- `src/lib/destiny/calculate-ten-gods.ts`
- `src/lib/destiny/destiny-core-v1.ts`
- `src/lib/destiny/build-destiny-profile.ts`
- `src/lib/destiny/build-destiny-climate.ts`
- `src/lib/destiny/destiny-language.ts`
- `src/lib/destiny/interpret-destiny-profile.ts`
- `src/lib/destiny/interpret-destiny-climate.ts`
- `src/lib/destiny-fusion/build-destiny-situation-fusion.ts`
- `src/lib/simulation/branch-policy.ts`
- `src/lib/simulation/simulation-types.ts`
- `src/lib/simulation/edge-update-rules.ts`
- `src/lib/simulation/event-policy.ts`
- `src/lib/simulation/simulation-engine.ts`
- `src/app/app/simulation/running/page.tsx`
- `src/app/app/simulation/result/page.tsx`
- `src/components/simulation/event-log.tsx`
- `src/lib/claims/build.ts`
- `src/lib/reports/report-engine.ts`
- `src/lib/golden-cases/full-product-cases.ts`

## 5. Exact Follow-Up Codex Tasks Needed

No blocking follow-up task is required before Phase 4.

Recommended Phase 4 hardening tasks:

1. Add focused helper-level tests for `calculateFourPillars`, `calculateElementBalance`, and `calculateTenGods`, including missing-time and solar-term approximation boundaries.
2. Add a browser smoke check for the full `/app/start` to `/app/simulation/result` path using a rough-mode birth input and a skipped-destiny input.
3. Add a calibration pass for boundary path deltas so product copy, branch comparison, and event pressure changes remain aligned.
4. Add a compact technical disclosure panel explaining that Destiny Core V1 is deterministic local approximation and not professional-grade BaZi precision.

## 6. Safe To Proceed To Phase 4?

YES.

Phase 3 is safe to proceed from. The branch passes the required shape audit, contains the expected local deterministic Destiny Core V1 and interpretation layers, preserves product safety boundaries, and keeps the destiny layer framed as evidence context rather than deterministic fate.

Final audit verdict: PASS
