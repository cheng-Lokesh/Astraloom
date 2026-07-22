import { describe, expect, it } from "vitest";

import { captureOutcomeV2, parseValidatedOutcomeV2 } from "./outcome-capture";
import {
  outcomeCaptureInputFixtureV2,
  outcomeRealityBoundaryFixtureV2,
  stage6SourceFixtureV2,
} from "./test-fixtures";
import {
  OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
  OUTCOME_SCHEMA_VERSION_V2,
} from "./types";

describe("Stage 7 Outcome capture", () => {
  it("captures a deterministic actual observation from Stage 2 validated Real Evidence without mutating history", () => {
    const input = outcomeCaptureInputFixtureV2();
    const before = structuredClone(input);
    const first = captureOutcomeV2(input);
    const second = captureOutcomeV2(structuredClone(input));

    expect(first).toEqual(second);
    expect(input).toEqual(before);
    expect(first).toMatchObject({
      ok: true,
      outcome: {
        status: "actual_observation",
        evidenceClass: "real_world",
        observed: "occurred",
        occurredAt: input.occurredAt,
        evaluatedThrough: input.evaluatedThrough,
        observationWindow: input.observationWindow,
        recordedAt: input.recordedAt,
        realEvidenceIds: input.realEvidenceIds,
        versions: {
          outcomeCalibrationEngineVersion: OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
          outcomeSchemaVersion: OUTCOME_SCHEMA_VERSION_V2,
          realityBoundarySchemaVersion: "2.0",
          realityBoundaryRevision: input.realityBoundary.revision,
        },
      },
    });
    if (!first.ok) throw new Error(first.errorCode);
    expect(first.outcome).not.toHaveProperty("simulationEventIds");
    expect(parseValidatedOutcomeV2(first.outcome)).toEqual({
      ok: true,
      outcome: first.outcome,
    });
  });

  it("rejects extra fields at every public input boundary and never returns a partial Outcome", () => {
    const topLevel = { ...outcomeCaptureInputFixtureV2(), unexpected: true };
    const nested = outcomeCaptureInputFixtureV2();
    const nestedSource = { ...nested, source: { ...nested.source, worldEventId: "world_event_v2_fake" } };
    const corruptEvidence = outcomeCaptureInputFixtureV2();
    (corruptEvidence.realityBoundary.evidenceLedger.items[0] as unknown as Record<string, unknown>).unexpected = true;

    for (const result of [
      captureOutcomeV2(topLevel),
      captureOutcomeV2(nestedSource),
      captureOutcomeV2(corruptEvidence),
    ]) {
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("outcome");
    }
  });

  it("rejects illegal ids, cross-Seed evidence, dangling evidence, invalid timing, and mismatched source provenance", () => {
    const illegalId = outcomeCaptureInputFixtureV2();
    illegalId.outcomeSpecId = "outcome:illegal";
    const crossSeed = outcomeCaptureInputFixtureV2();
    crossSeed.seedContextId = "seed_context_v2_other";
    const dangling = outcomeCaptureInputFixtureV2();
    dangling.realEvidenceIds = ["real_evidence_v2_missing"];
    const invalidTime = outcomeCaptureInputFixtureV2();
    invalidTime.occurredAt = "2026-08-21T11:00:00.000Z";
    const mismatchedSource = outcomeCaptureInputFixtureV2();
    mismatchedSource.source.sourceRef = "simulation-engine:event-1";

    expect(captureOutcomeV2(illegalId)).toMatchObject({ ok: false, errorCode: "invalid_id" });
    expect(captureOutcomeV2(crossSeed)).toMatchObject({ ok: false, errorCode: "cross_seed_reference" });
    expect(captureOutcomeV2(dangling)).toMatchObject({ ok: false, errorCode: "dangling_real_evidence" });
    expect(captureOutcomeV2(invalidTime)).toMatchObject({ ok: false, errorCode: "invalid_observation_time" });
    expect(captureOutcomeV2(mismatchedSource)).toMatchObject({ ok: false, errorCode: "invalid_outcome_source" });
  });

  it("rejects an occurred Outcome outside its forecast window without millisecond loss", () => {
    const input = outcomeCaptureInputFixtureV2();
    const evidence = input.realityBoundary.evidenceLedger.items.at(-1)!;
    evidence.occurredAt = "2026-08-19T10:00:00.001Z";
    evidence.capturedAt = "2026-08-19T10:00:00.002Z";
    evidence.createdAt = evidence.capturedAt;
    evidence.updatedAt = evidence.capturedAt;
    evidence.provenance[0]!.occurredAt = evidence.occurredAt;
    evidence.provenance[0]!.capturedAt = evidence.capturedAt;
    input.realityBoundary.updatedAt = evidence.capturedAt;
    input.realityBoundary.evidenceLedger.updatedAt = evidence.capturedAt;
    input.realityBoundary.assumptionLedger.updatedAt = evidence.capturedAt;
    input.occurredAt = evidence.occurredAt;
    input.evaluatedThrough = evidence.capturedAt;
    input.recordedAt = evidence.capturedAt;

    expect(captureOutcomeV2(input)).toMatchObject({
      ok: false,
      errorCode: "invalid_observation_time",
    });
  });

  it("requires did_not_occur to omit occurredAt and wait until the complete window has ended", () => {
    const boundary = outcomeRealityBoundaryFixtureV2({ count: 1, nonOccurrenceIndices: [0] });
    const valid = outcomeCaptureInputFixtureV2({ observed: false, boundary });
    const conflict = { ...valid, occurredAt: "2026-07-29T09:00:00.000Z" };
    const incomplete = {
      ...valid,
      evaluatedThrough: "2026-08-18T09:59:59.999Z",
      recordedAt: "2026-08-18T09:59:59.999Z",
    };

    expect(captureOutcomeV2(conflict)).toMatchObject({ ok: false, errorCode: "invalid_outcome_input" });
    expect(captureOutcomeV2(incomplete)).toMatchObject({
      ok: false,
      errorCode: "invalid_observation_time",
    });
    expect(captureOutcomeV2(valid)).toMatchObject({
      ok: true,
      outcome: {
        observed: "did_not_occur",
        evaluatedThrough: valid.observationWindow.horizonEnd,
      },
    });
    const captured = captureOutcomeV2(valid);
    if (!captured.ok) throw new Error(captured.errorCode);
    expect(captured.outcome).not.toHaveProperty("occurredAt");
  });

  it("rejects a Simulation Event masquerading as an Outcome source", () => {
    const input = outcomeCaptureInputFixtureV2();
    const simulationSource = {
      ...input,
      source: {
        realEvidenceId: input.source.realEvidenceId,
        sourceKind: "simulation_event",
        sourceRef: "world_event_v2_fake",
        verificationStatus: "source_verified",
      },
    };
    const simulationId = {
      ...input,
      realEvidenceIds: ["world_event_v2_fake"],
    };

    expect(captureOutcomeV2(simulationSource)).toMatchObject({ ok: false });
    expect(captureOutcomeV2(simulationId)).toMatchObject({ ok: false });
  });

  it("rejects duplicate Real Evidence references instead of double-counting one observation", () => {
    const input = outcomeCaptureInputFixtureV2();
    input.realEvidenceIds = [input.realEvidenceIds[0]!, input.realEvidenceIds[0]!];

    expect(captureOutcomeV2(input)).toMatchObject({ ok: false, errorCode: "duplicate_id" });
  });

  it("detects Outcome version drift and tampering after capture", () => {
    const result = captureOutcomeV2(outcomeCaptureInputFixtureV2());
    if (!result.ok) throw new Error(result.errorCode);
    const drifted = structuredClone(result.outcome);
    (drifted.versions.outcomeSchemaVersion as string) = "outcome-v2.999";
    const tampered = structuredClone(result.outcome);
    tampered.observed = "did_not_occur";

    expect(parseValidatedOutcomeV2(drifted)).toMatchObject({ ok: false, errorCode: "version_mismatch" });
    expect(parseValidatedOutcomeV2(tampered)).toMatchObject({ ok: false, errorCode: "outcome_tampering" });
  });

  it("accepts a later same-ledger Reality Boundary while keeping the forecast ledger untouched", () => {
    const source = stage6SourceFixtureV2();
    const boundary = outcomeRealityBoundaryFixtureV2({ count: 2 });
    const input = outcomeCaptureInputFixtureV2({ index: 1, boundary, source });
    const forecastBefore = structuredClone(source.claimSet.realityBoundary);

    expect(captureOutcomeV2(input)).toMatchObject({ ok: true });
    expect(source.claimSet.realityBoundary).toEqual(forecastBefore);
  });
});
