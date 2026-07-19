import { describe, expect, it } from "vitest";

import { evaluateAssumptionReadinessV2 } from "./assumption-ledger";
import { adaptV1RealityBoundary } from "./v1-adapter";
import {
  createFixedRuntimeV2,
  realityIntakeV1,
  seedContextV1,
} from "./test-fixtures";

describe("V1 to V2 Reality Boundary adapter", () => {
  it("does not modify Seed Context or Reality Intake inputs", () => {
    const seed = seedContextV1();
    const intake = realityIntakeV1();
    const seedBefore = structuredClone(seed);
    const intakeBefore = structuredClone(intake);

    adaptV1RealityBoundary({
      seedContext: seed,
      realityIntake: intake,
      runtime: createFixedRuntimeV2(),
    });

    expect(seed).toEqual(seedBefore);
    expect(intake).toEqual(intakeBefore);
  });

  it("fails fast on a cross-seed Reality Intake without modifying inputs", () => {
    const seed = seedContextV1();
    const intake = realityIntakeV1();
    intake.seedContextId = "seed_other";
    const seedBefore = structuredClone(seed);
    const intakeBefore = structuredClone(intake);

    expect(() =>
      adaptV1RealityBoundary({
        seedContext: seed,
        realityIntake: intake,
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrowError(
      expect.objectContaining({ code: "v1_reality_intake_seed_mismatch" }),
    );
    expect(seed).toEqual(seedBefore);
    expect(intake).toEqual(intakeBefore);
  });

  it("is structurally deterministic with a fixed clock and id factory", () => {
    const input = {
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
    };

    expect(
      adaptV1RealityBoundary({ ...input, runtime: createFixedRuntimeV2() }),
    ).toEqual(
      adaptV1RealityBoundary({ ...input, runtime: createFixedRuntimeV2() }),
    );
  });

  it("maps manual material as unverified user-provided evidence", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });
    const manual = result.evidenceLedger.items.find(
      (item) => item.sourceKind === "user_material",
    );

    expect(manual).toMatchObject({
      sourceTier: "unrated",
      verificationStatus: "unverified",
    });
  });

  it("does not promote an external source because it has a URL or V1 confidence", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });
    const external = result.evidenceLedger.items.find(
      (item) => item.sourceKind === "search_summary",
    );

    expect(external).toMatchObject({
      sourceTier: "unrated",
      verificationStatus: "unverified",
      legacyHeuristic: {
        legacyHeuristicConfidence: 80,
        interpretation: "non-probabilistic",
      },
    });
  });

  it("maps LLM nodes and pressures to inferred Assumptions, never Evidence", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });

    expect(
      result.assumptionLedger.assumptions.some(
        (item) =>
          item.category === "llm_inference" &&
          item.epistemicStatus === "inferred",
      ),
    ).toBe(true);
    expect(
      result.evidenceLedger.items.some((item) =>
        item.provenance.some((entry) => entry.sourceRef.startsWith("llm:")),
      ),
    ).toBe(false);
  });

  it("keeps a third-party promotion-approval LLM inference high-impact and pending confirmation", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });
    const managerApproval = result.assumptionLedger.assumptions.find(
      (item) => item.statement === "Promotion approval",
    );

    expect(managerApproval).toMatchObject({
      subjectType: "third_party",
      impactLevel: "high",
      confirmationRequirement: "required",
      confirmationStatus: "pending",
    });
    expect(evaluateAssumptionReadinessV2(managerApproval!).status).toBe(
      "requires_confirmation",
    );
  });

  it("resolves V1 seed, manual, and external evidenceRefs into supporting evidence", () => {
    const intake = realityIntakeV1();
    intake.llmExtraction!.groundedRealityNodes[0]!.evidenceRefs = [
      "seed:situationSummary",
      "manual_offer",
      "external_company_page",
    ];
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: intake,
      runtime: createFixedRuntimeV2(),
    });
    const managerRole = result.assumptionLedger.assumptions.find(
      (item) => item.statement === "May control the internal promotion decision.",
    );
    const referencedSources = new Set(
      managerRole?.supportingRealEvidenceIds.flatMap((id) =>
        result.evidenceLedger.items
          .filter((item) => item.id === id)
          .flatMap((item) => item.provenance.map((entry) => entry.sourceRef)),
      ),
    );

    expect(referencedSources).toEqual(
      new Set([
        "v1-seed:situationSummary",
        "v1-manual:manual_offer",
        "v1-external:external_company_page",
      ]),
    );
  });

  it("links manual extracted hints to their manual Evidence and merges duplicates", () => {
    const intake = realityIntakeV1();
    intake.manualSources.push({
      ...structuredClone(intake.manualSources[0]!),
      id: "manual_offer_copy",
      title: "Second offer note",
      content: "A second user note.",
      extractedNodeHints: ["opportunity source"],
      extractedPressureHints: [],
      confidence: 55,
    });

    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: intake,
      runtime: createFixedRuntimeV2(),
    });
    const merged = result.assumptionLedger.assumptions.filter(
      (item) => item.statement === "opportunity source",
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.supportingRealEvidenceIds).toHaveLength(2);
    expect(
      merged[0]?.legacyHeuristicHistory?.map(
        (audit) => audit.legacyHeuristicConfidence,
      ),
    ).toEqual([78, 55]);
  });

  it("warns on unresolved V1 evidenceRefs without fabricating Evidence", () => {
    const intake = realityIntakeV1();
    intake.llmExtraction!.groundedRealityNodes[0]!.evidenceRefs = [
      "missing:private-source",
    ];
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: intake,
      runtime: createFixedRuntimeV2(),
    });

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: "v1_evidence_ref_unresolved",
        message: expect.stringContaining("missing:private-source"),
      }),
    );
    expect(JSON.stringify(result.evidenceLedger)).not.toContain(
      "missing:private-source",
    );
  });

  it("maps worries, missing external info, search questions, and missingInfo to assumptions", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });
    const categories = new Set(
      result.assumptionLedger.assumptions.map((item) => item.category),
    );

    expect(categories.has("user_worry")).toBe(true);
    expect(categories.has("information_gap")).toBe(true);
    expect(categories.has("external_search_question")).toBe(true);
  });

  it("does not place decision options or desired output in Evidence", () => {
    const seed = seedContextV1();
    const result = adaptV1RealityBoundary({
      seedContext: seed,
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });
    const statements = result.evidenceLedger.items.map((item) => item.statement);

    expect(statements).not.toContain(seed.decisionOptionsText);
    expect(statements).not.toContain(seed.desiredOutputText);
  });

  it("fully isolates destinyBirthInfo from Evidence and Assumptions", () => {
    const seed = seedContextV1();
    const result = adaptV1RealityBoundary({
      seedContext: seed,
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });

    expect(JSON.stringify(result)).not.toContain(seed.destinyBirthInfo);
    expect(result.warnings.map((warning) => warning.code)).toContain(
      "v1_destiny_input_isolated",
    );
  });

  it("never maps legacy confidence to probability or likelihood", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('"probability"');
    expect(serialized).not.toContain('"likelihood"');
    expect(serialized).toContain('"legacyHeuristicConfidence"');
    expect(serialized).toContain('"non-probabilistic"');
  });

  it("safely adapts Seed-only input and warns about missing external evidence", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      runtime: createFixedRuntimeV2(),
    });

    expect(result.evidenceLedger.items.length).toBeGreaterThan(0);
    expect(result.warnings.map((warning) => warning.code)).toContain(
      "v1_reality_intake_missing_external_evidence",
    );
  });

  it("deterministically truncates overlong excerpts and records the limitation", () => {
    const intake = realityIntakeV1();
    intake.manualSources[0]!.content = "x".repeat(2500);
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: intake,
      runtime: createFixedRuntimeV2(),
    });
    const manual = result.evidenceLedger.items.find(
      (item) => item.sourceKind === "user_material",
    );

    expect(manual?.provenance[0]?.excerpt).toHaveLength(2000);
    expect(manual?.limitations).toContain(
      "Excerpt was deterministically truncated to 2000 characters during V1 adaptation.",
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "v1_evidence_excerpt_truncated" }),
    );
  });

  it("assigns every adapted entity to the same Seed Context", () => {
    const result = adaptV1RealityBoundary({
      seedContext: seedContextV1(),
      realityIntake: realityIntakeV1(),
      runtime: createFixedRuntimeV2(),
    });

    expect(
      result.evidenceLedger.items.every(
        (item) => item.seedContextId === result.seedContextId,
      ),
    ).toBe(true);
    expect(
      result.assumptionLedger.assumptions.every(
        (item) => item.seedContextId === result.seedContextId,
      ),
    ).toBe(true);
  });
});
