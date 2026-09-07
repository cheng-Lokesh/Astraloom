import { describe, expect, it } from "vitest";

import { projectFormalSandboxResult } from "./result-projection.server";

const bundle = {
  inputSnapshot: {
    agents: [
      { id: "agent_internal_self", displayName: "Scenario owner", actorType: "self", evidenceRefs: ["seed:question"] },
      { id: "agent_internal_peer", displayName: "Project collaborator", actorType: "third_party", evidenceRefs: ["seed:people"] },
    ],
    edges: [{ id: "edge_internal_one", fromAgentId: "agent_internal_self", toAgentId: "agent_internal_peer", relationshipType: "work collaborator", evidenceRefs: ["seed:people"] }],
  },
  sourceBoundary: {
    evidenceLedger: { items: [{ id: "real_evidence_internal_one", statement: "The user confirmed a decision deadline.", sourceKind: "user_statement", sourceTier: "tier_1_user_confirmed", verificationStatus: "user_confirmed", provenance: [], limitations: ["It may be incomplete."] }] },
    assumptionLedger: { assumptions: [{ id: "assumption_internal_one", statement: "The working conditions may remain stable during the selected horizon.", subjectType: "external_variable", category: "relationship_stability", epistemicStatus: "inferred", impactLevel: "medium", supportingRealEvidenceIds: ["real_evidence_internal_one"], contradictingRealEvidenceIds: [], limitations: ["This is not a real-world fact."], confirmationRequirement: "not_required", confirmationStatus: "not_required" }] },
  },
  events: [
    { id: "world_event_v2_one", eventType: "allocate_resource", evidenceClass: "world_transition_simulation_evidence", causalRealEvidenceIds: ["real_evidence_internal_one"], causalAssumptionIds: ["assumption_internal_one"] },
    { id: "world_event_v2_two", eventType: "record_observation", evidenceClass: "world_transition_simulation_evidence", causalRealEvidenceIds: ["real_evidence_internal_one"], causalAssumptionIds: [] },
  ],
  claims: [{ id: "claim_v2_one", claimType: "scenario_frequency", statement: "If the stated conditions hold, this is a conditional simulation signal.", uncertaintyStatement: "It is not a real-world probability.", simulationEventIds: ["world_event_v2_one"] }],
  report: { claimIds: ["claim_v2_one"] },
};

describe("formal result safe reading projection", () => {
  it("projects only this frozen result's people, relations, facts, assumptions, steps, and direct claim evidence", () => {
    const result = projectFormalSandboxResult(bundle);
    expect(result).toEqual({
      ok: true,
      projection: expect.objectContaining({
        participants: [{ key: "participant-1", label: "Scenario owner", role: "Scenario participant" }, { key: "participant-2", label: "Project collaborator", role: "Scenario participant" }],
        relationships: [{ key: "relationship-1", fromParticipantKey: "participant-1", toParticipantKey: "participant-2", label: "work collaborator" }],
        facts: [{ key: "fact-1", statement: "The user confirmed a decision deadline.", boundary: "user_fact" }],
        assumptions: [{ key: "assumption-1", statement: "The working conditions may remain stable during the selected horizon.", boundary: "explicit_assumption" }],
        steps: [{ key: "step-1", order: 1, label: "Resource allocation", boundary: "simulation_step" }, { key: "step-2", order: 2, label: "Recorded observation", boundary: "simulation_step" }],
        claims: [{ key: "claim-1", statement: "If the stated conditions hold, this is a conditional simulation signal.", uncertainty: "It is not a real-world probability.", stepKeys: ["step-1"], boundary: "conditional_claim" }],
      }),
    });
    const rendered = JSON.stringify(result);
    expect(rendered).not.toMatch(/agent_internal|edge_internal|real_evidence_internal|assumption_internal|world_event_v2|claim_v2|report/i);
  });

  it.each([
    ["a dangling claim event", { ...bundle, claims: [{ ...bundle.claims[0], simulationEventIds: ["world_event_v2_missing"] }] }],
    ["a missing frozen relation endpoint", { ...bundle, inputSnapshot: { ...bundle.inputSnapshot, edges: [{ ...bundle.inputSnapshot.edges[0], toAgentId: "agent_missing" }] } }],
    ["an unknown transition", { ...bundle, events: [{ ...bundle.events[0], eventType: "invent_outcome" }] }],
    ["an unsafe UUID-shaped participant label", { ...bundle, inputSnapshot: { ...bundle.inputSnapshot, agents: [{ ...bundle.inputSnapshot.agents[0], displayName: "11111111-1111-4111-8111-111111111111" }, bundle.inputSnapshot.agents[1]] } }],
    ["a report disconnected from its claim", { ...bundle, report: { claimIds: [] } }],
  ])("fails closed for %s", (_label, invalidBundle) => {
    expect(projectFormalSandboxResult(invalidBundle)).toEqual({ ok: false, errorCode: "result_projection_unavailable" });
  });
});
