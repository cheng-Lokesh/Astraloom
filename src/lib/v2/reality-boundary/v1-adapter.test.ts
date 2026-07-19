import { describe, expect, it } from "vitest";

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
});
