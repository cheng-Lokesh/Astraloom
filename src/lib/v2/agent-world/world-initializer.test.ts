import { describe, expect, it } from "vitest";

import { initializeWorldV2 } from "./world-initializer";
import { validateWorldV2 } from "./validation";
import {
  createFixedAgentWorldRuntimeV2,
  realityBoundaryV2,
  worldInitializationSpecV2,
} from "./test-fixtures";

describe("World initialization V2", () => {
  it("initializes the explicit career-decision World at revision zero", () => {
    const result = initializeWorldV2(realityBoundaryV2(), worldInitializationSpecV2(), createFixedAgentWorldRuntimeV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.world.revision).toBe(0);
    expect(result.world.agentDefinitions).toHaveLength(3);
    expect(result.world.agentStates).toHaveLength(3);
    expect(result.world.worldEvents).toEqual([]);
    expect(result.world.worldEventIds).toEqual([]);
    expect(validateWorldV2(result.world)).toEqual({ ok: true, issues: [] });
  });

  it("does not modify the Reality Boundary or initialization spec", () => {
    const boundary = realityBoundaryV2();
    const spec = worldInitializationSpecV2(boundary);
    const beforeBoundary = structuredClone(boundary);
    const beforeSpec = structuredClone(spec);
    initializeWorldV2(boundary, spec, createFixedAgentWorldRuntimeV2());
    expect(boundary).toEqual(beforeBoundary);
    expect(spec).toEqual(beforeSpec);
  });

  it("is deterministic with fixed runtime injection", () => {
    const boundary = realityBoundaryV2();
    const spec = worldInitializationSpecV2(boundary);
    expect(initializeWorldV2(boundary, spec, createFixedAgentWorldRuntimeV2())).toEqual(
      initializeWorldV2(boundary, spec, createFixedAgentWorldRuntimeV2()),
    );
  });

  it("rejects cross-seed ownership", () => {
    const boundary = realityBoundaryV2();
    const spec = worldInitializationSpecV2(boundary);
    spec.entities[0]!.seedContextId = "seed_other";
    expect(initializeWorldV2(boundary, spec, createFixedAgentWorldRuntimeV2())).toMatchObject({ ok: false, errorCode: "cross_seed_reference" });
  });

  it("rejects missing Evidence or Assumption references", () => {
    const boundary = realityBoundaryV2();
    const spec = worldInitializationSpecV2(boundary);
    spec.agentDefinitions[0]!.realEvidenceIds = ["real_evidence_v2_missing"];
    expect(initializeWorldV2(boundary, spec, createFixedAgentWorldRuntimeV2())).toMatchObject({ ok: false, errorCode: "unknown_real_evidence" });
  });

  it.each(["rejected", "disputed"] as const)("rejects a %s assumption", (epistemicStatus) => {
    const boundary = realityBoundaryV2();
    const assumption = boundary.assumptionLedger.assumptions[1]!;
    assumption.epistemicStatus = epistemicStatus;
    assumption.confirmationStatus = epistemicStatus === "rejected" ? "rejected" : "not_required";
    expect(initializeWorldV2(boundary, worldInitializationSpecV2(boundary), createFixedAgentWorldRuntimeV2())).toMatchObject({ ok: false, errorCode: "assumption_not_executable" });
  });

  it("rejects an unconfirmed high-impact third-party assumption", () => {
    const boundary = realityBoundaryV2();
    const assumption = boundary.assumptionLedger.assumptions[0]!;
    assumption.epistemicStatus = "inferred";
    assumption.confirmationStatus = "pending";
    expect(initializeWorldV2(boundary, worldInitializationSpecV2(boundary), createFixedAgentWorldRuntimeV2())).toMatchObject({ ok: false, errorCode: "third_party_confirmation_required" });
  });

  it("keeps confirmed third-party assumptions non-factual and lower-impact assumptions visible/provisional", () => {
    const boundary = realityBoundaryV2();
    const result = initializeWorldV2(boundary, worldInitializationSpecV2(boundary), createFixedAgentWorldRuntimeV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.world.realityBoundarySnapshot.assumptionLedger.assumptions[0]?.factStatus).toBe("not_real_world_fact");
    const recruiter = result.world.agentDefinitions.find((definition) => definition.displayName === "Recruiter");
    expect(recruiter?.fieldProvenance.role).toMatchObject({ provisional: true, visible: true });
  });

  it("does not copy warnings, Destiny, V1 Events, probability, or likelihood into World", () => {
    const boundary = realityBoundaryV2();
    boundary.warnings.push({ code: "legacy", message: "Destiny should stay outside World." });
    const result = initializeWorldV2(boundary, worldInitializationSpecV2(boundary), createFixedAgentWorldRuntimeV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const serialized = JSON.stringify(result.world);
    expect(serialized).not.toMatch(/destiny|probability|likelihood|event_v1/i);
    expect(result.world.realityBoundarySnapshot).not.toHaveProperty("warnings");
  });
});
