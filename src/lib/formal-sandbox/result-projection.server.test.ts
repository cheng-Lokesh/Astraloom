import { describe, expect, it } from "vitest";

import { projectFormalSandboxResult } from "./result-projection.server";

const ids = {
  owner: "11111111-1111-4111-8111-111111111111",
  seed: "22222222-2222-4222-8222-222222222222",
  graph: "33333333-3333-4333-8333-333333333333",
  agentSnapshot: "44444444-4444-4444-8444-444444444444",
  self: "55555555-5555-4555-8555-555555555555",
  counterpart: "66666666-6666-4666-8666-666666666666",
  relation: "77777777-7777-4777-8777-777777777777",
};

function bundle(overrides: Record<string, unknown> = {}) {
  return {
    inputSnapshot: {
      ownerId: ids.owner, seedContextId: ids.seed, graphSnapshotId: ids.graph, agentSnapshotId: ids.agentSnapshot,
      horizonDays: 30, deterministicSeed: 1701,
      agents: [
        { id: ids.self, displayName: "Scenario owner", actorType: "self", evidenceRefs: ["private-ref"] },
        { id: ids.counterpart, displayName: "Frozen participant", actorType: "third_party", evidenceRefs: ["private-ref"] },
      ],
      edges: [{ id: ids.relation, fromAgentId: ids.self, toAgentId: ids.counterpart, relationshipType: "professional", evidenceRefs: ["private-ref"] }],
    },
    sourceBoundary: { assumptionLedger: { assumptions: [{ statement: "Conditions may remain stable during this selected horizon." }] } },
    events: [{ id: "world_event_v2_safe_step", eventType: "allocate_resource", createdAt: "2026-09-01T00:00:00.000Z", branchId: "baseline" }],
    claims: [{ id: "claim_v2_safe_claim", statement: "A conditional pattern is worth reviewing.", uncertaintyStatement: "This is a sandbox simulation, not a guarantee.", simulationEventIds: ["world_event_v2_safe_step"] }],
    report: { claimIds: ["claim_v2_safe_claim"] },
    versions: { runtime: "formal-account-sandbox-m1-v1", schema: "formal-run-bundle-m1-v1", trajectory: "trajectory-engine-v2-stage-4" },
    ...overrides,
  };
}

describe("formal sandbox result projection", () => {
  it("projects only frozen inputs and direct Claim-to-step evidence through ordinal UI keys", () => {
    const result = projectFormalSandboxResult(bundle());

    expect(result).toEqual(expect.objectContaining({
      participants: [{ key: "person-1", label: "Scenario owner", role: "scenario decision maker" }, { key: "person-2", label: "Frozen participant", role: "frozen participant" }],
      relationships: [{ key: "relation-1", fromPersonKey: "person-1", toPersonKey: "person-2", label: "professional" }],
      steps: [expect.objectContaining({ key: "step-1", kind: "sandbox_simulation" })],
      claims: [expect.objectContaining({ key: "claim-1", supportingStepKeys: ["step-1"], participantKeys: ["person-1", "person-2"], relationshipKeys: ["relation-1"] })],
    }));
    expect(JSON.stringify(result)).not.toMatch(new RegExp(Object.values(ids).join("|")));
    expect(JSON.stringify(result)).not.toContain("private-ref");
  });

  it("fails closed when a Claim references a missing Event or Report claim", () => {
    expect(projectFormalSandboxResult(bundle({ claims: [{ id: "claim_v2_safe_claim", statement: "Conditional", uncertaintyStatement: "Uncertain", simulationEventIds: ["world_event_v2_missing"] }] }))).toBeNull();
    expect(projectFormalSandboxResult(bundle({ report: { claimIds: ["claim_v2_missing"] } }))).toBeNull();
  });

  it("does not substitute a current graph when the persisted frozen bundle changes", () => {
    const frozen = bundle();
    const first = projectFormalSandboxResult(frozen);
    frozen.inputSnapshot.agents[0].displayName = "Changed only in the persisted snapshot";
    const second = projectFormalSandboxResult(frozen);
    expect(first?.participants[0]?.label).toBe("Scenario owner");
    expect(second?.participants[0]?.label).toBe("Changed only in the persisted snapshot");
  });
});
