import { describe, expect, it } from "vitest";

import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";
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

const profile = createEmptyRealityProfileDraft(7);
profile.lifeClimate = { value: "当前生活节奏正在调整", classification: "fact", evidenceSummary: "本人在现实档案中记录" };
profile.resources = { value: "下月可能有项目变化", classification: "assumption", evidenceSummary: "本人明确提交的待验证假设" };
profile.goals = [{ value: "保留每周学习时间", classification: "fact", evidenceSummary: "本人在现实档案中记录" }];
profile.pressures = [{ value: "未来日程存在不确定性", classification: "assumption", evidenceSummary: "本人明确提交的待验证假设" }];
const realityProfileSnapshot = {
  ownerId: ids.owner,
  seedContextId: ids.seed,
  profileId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  revision: 7,
  profile,
};

function bundle(overrides: Record<string, unknown> = {}) {
  return {
    inputSnapshot: {
      ownerId: ids.owner, seedContextId: ids.seed, graphSnapshotId: ids.graph, agentSnapshotId: ids.agentSnapshot,
      horizonDays: 30, deterministicSeed: 1701,
      realityProfileSnapshot: structuredClone(realityProfileSnapshot),
      agents: [
        { id: ids.self, displayName: "Scenario owner", actorType: "self", evidenceRefs: ["private-ref"] },
        { id: ids.counterpart, displayName: "Frozen participant", actorType: "third_party", evidenceRefs: ["private-ref"] },
      ],
      edges: [{ id: ids.relation, fromAgentId: ids.self, toAgentId: ids.counterpart, relationshipType: "professional", evidenceRefs: ["private-ref"] }],
    },
    sourceBoundary: { evidenceLedger: { items: [] as Array<{ id: string; statement: string }> }, assumptionLedger: { assumptions: [{ statement: "Conditions may remain stable during this selected horizon." }] } },
    worldSnapshots: [{
      agentDefinitions: [{ id: "definition-self", displayName: "Scenario owner" }, { id: "definition-counterpart", displayName: "Frozen participant" }],
      entities: [{ id: "entity-self", agentDefinitionId: "definition-self" }, { id: "entity-counterpart", agentDefinitionId: "definition-counterpart" }],
      relations: [{ id: "world-relation", fromEntityId: "entity-self", toEntityId: "entity-counterpart", provenance: { realEvidenceIds: [] as string[] } }],
    }],
    events: [{ id: "world_event_v2_safe_step", eventType: "allocate_resource", actorId: "definition-self", targetEntityIds: ["entity-counterpart"], targetRelationIds: [] as string[], createdAt: "2026-09-01T00:00:00.000Z", branchId: "baseline" }],
    claims: [{ id: "claim_v2_safe_claim", statement: "A conditional pattern is worth reviewing.", uncertaintyStatement: "This is a sandbox simulation, not a guarantee.", simulationEventIds: ["world_event_v2_safe_step"], realEvidenceIds: [] as string[] }],
    report: { claimIds: ["claim_v2_safe_claim"] },
    versions: { runtime: "formal-account-sandbox-m1-v1", schema: "formal-run-bundle-m1-v1", trajectory: "trajectory-engine-v2-stage-4" },
    ...overrides,
  };
}

describe("formal sandbox result projection", () => {
  it("shows only the frozen Profile facts, assumptions and unknowns without exposing private inputs", () => {
    const input = bundle();
    Object.assign(input.inputSnapshot, { seedSummary: "Private raw scenario with a secret credential" });
    input.sourceBoundary.evidenceLedger.items.push({ id: "private-profile-evidence-ref", statement: "Private raw scenario with a secret credential" });
    const result = projectFormalSandboxResult(input);

    expect(result?.realityProfile).toEqual({
      status: "frozen",
      revision: 7,
      facts: [
        { key: "fact-1", label: "人生气候", statement: "当前生活节奏正在调整", evidenceSummary: "本人在现实档案中记录" },
        { key: "fact-2", label: "目标", statement: "保留每周学习时间", evidenceSummary: "本人在现实档案中记录" },
      ],
      assumptions: [
        { key: "assumption-1", label: "资源", statement: "下月可能有项目变化", evidenceSummary: "本人明确提交的待验证假设" },
        { key: "assumption-2", label: "压力", statement: "未来日程存在不确定性", evidenceSummary: "本人明确提交的待验证假设" },
      ],
      unknowns: [
        { key: "unknown-1", label: "约束" },
        { key: "unknown-2", label: "价值观" },
        { key: "unknown-3", label: "人生主题" },
        { key: "unknown-4", label: "外部变量" },
      ],
      structuredResources: [],
      structuredConstraints: [],
    });
    expect(JSON.stringify(result)).not.toMatch(new RegExp(`${ids.owner}|${ids.seed}|${realityProfileSnapshot.profileId}|private-profile-evidence-ref|Private raw scenario|secret credential`));
  });

  it("keeps submitted Seed evidence in facts without exposing its narrative or private references", () => {
    const input = bundle();
    const rawSeedScenario = "PRIVATE_RAW_SEED_SCENARIO secret api_key seed-internal-ref 88888888-8888-4888-8888-888888888888";
    const seedEvidenceId = "99999999-9999-4999-8999-999999999999";
    const relationshipEvidenceId = "relationship-evidence-private-ref";
    Object.assign(input.inputSnapshot, { seedSummary: rawSeedScenario });
    input.sourceBoundary.evidenceLedger.items.push(Object.assign(
      { id: seedEvidenceId, statement: rawSeedScenario },
      { claimKey: "formal.seed.summary", privateRef: "seed-private-ref-marker", credential: "secret credential marker" },
    ));
    input.sourceBoundary.evidenceLedger.items.push(Object.assign(
      { id: relationshipEvidenceId, statement: "A professional connection is supported by a user-provided observation." },
      { claimKey: "formal.relationship.context", privateRef: "relationship-private-ref-marker" },
    ));
    input.claims[0].realEvidenceIds = [relationshipEvidenceId];
    input.worldSnapshots[0].relations[0].provenance.realEvidenceIds = [relationshipEvidenceId];

    const result = projectFormalSandboxResult(input);
    const serialized = JSON.stringify(result);

    expect(result?.facts).toEqual([
      { key: "fact-1", statement: "本次运行使用已提交的 Seed 作为 Reality evidence；情境原文未展示。", boundary: "user_provided_fact" },
      { key: "fact-2", statement: "A professional connection is supported by a user-provided observation.", boundary: "user_provided_fact" },
    ]);
    expect(result?.relationships).toEqual([{ key: "relation-1", fromPersonKey: "person-1", toPersonKey: "person-2", label: "professional" }]);
    expect(result?.claims[0]?.relationshipKeys).toEqual(["relation-1"]);
    expect(result?.assumptions).toEqual([{ key: "assumption-1", statement: "Conditions may remain stable during this selected horizon.", boundary: "system_assumption" }]);
    expect(result?.realityProfile.facts.map(({ statement }) => statement)).toEqual(["当前生活节奏正在调整", "保留每周学习时间"]);
    expect(result?.realityProfile.assumptions.map(({ statement }) => statement)).toEqual(["下月可能有项目变化", "未来日程存在不确定性"]);
    expect(serialized).not.toMatch(/PRIVATE_RAW_SEED_SCENARIO|api_key|seed-internal-ref|88888888-8888-4888-8888-888888888888|99999999-9999-4999-8999-999999999999|seed-private-ref-marker|secret credential marker|relationship-private-ref-marker/);
  });

  it("fails closed when the frozen Profile owner, Seed or revision does not match the Run snapshot", () => {
    const wrongOwner = bundle();
    wrongOwner.inputSnapshot.realityProfileSnapshot.ownerId = ids.graph;
    expect(projectFormalSandboxResult(wrongOwner)).toBeNull();

    const wrongSeed = bundle();
    wrongSeed.inputSnapshot.realityProfileSnapshot.seedContextId = ids.graph;
    expect(projectFormalSandboxResult(wrongSeed)).toBeNull();

    const wrongRevision = bundle();
    wrongRevision.inputSnapshot.realityProfileSnapshot.revision += 1;
    expect(projectFormalSandboxResult(wrongRevision)).toBeNull();
  });

  it("marks older Runs without a stored Profile snapshot as unrecorded and never reads a current Profile", () => {
    const current = bundle();
    const { realityProfileSnapshot, ...legacyInputSnapshot } = current.inputSnapshot;
    expect(realityProfileSnapshot).toBeDefined();
    const legacy = { ...current, inputSnapshot: legacyInputSnapshot };
    const result = projectFormalSandboxResult(legacy);
    expect(result?.realityProfile).toEqual({ status: "not_recorded", revision: null, facts: [], assumptions: [], unknowns: [], structuredResources: [], structuredConstraints: [] });
  });

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

  it("fails closed for duplicate Event and Claim object ids", () => {
    const duplicateEvent = bundle();
    duplicateEvent.events.push({ ...duplicateEvent.events[0] });
    expect(projectFormalSandboxResult(duplicateEvent)).toBeNull();

    const duplicateClaim = bundle();
    duplicateClaim.claims.push({ ...duplicateClaim.claims[0] });
    duplicateClaim.report.claimIds.push("claim_v2_safe_claim");
    expect(projectFormalSandboxResult(duplicateClaim)).toBeNull();
  });

  it("does not substitute a current graph when the persisted frozen bundle changes", () => {
    const frozen = bundle();
    const first = projectFormalSandboxResult(frozen);
    frozen.inputSnapshot.agents[0].displayName = "Changed only in the persisted snapshot";
    const second = projectFormalSandboxResult(frozen);
    expect(first?.participants[0]?.label).toBe("Scenario owner");
    expect(second?.participants[0]?.label).toBe("Changed only in the persisted snapshot");
  });

  it("links a Claim only to the frozen people and relation touched by its supporting Events", () => {
    const unrelatedAgent = "88888888-8888-4888-8888-888888888888";
    const unrelatedRelation = "99999999-9999-4999-8999-999999999999";
    const input = bundle();
    input.inputSnapshot.agents.push({ id: unrelatedAgent, displayName: "Unrelated observer", actorType: "third_party", evidenceRefs: ["private-ref"] });
    input.inputSnapshot.edges.push({ id: unrelatedRelation, fromAgentId: ids.self, toAgentId: unrelatedAgent, relationshipType: "unrelated", evidenceRefs: ["private-ref"] });
    input.events = [{ id: "world_event_v2_safe_step", eventType: "allocate_resource", actorId: "definition-self", targetEntityIds: ["entity-counterpart"], targetRelationIds: [], createdAt: "2026-09-01T00:00:00.000Z", branchId: "baseline" }];
    input.worldSnapshots = [{
      agentDefinitions: [
        { id: "definition-self", displayName: "Scenario owner" },
        { id: "definition-counterpart", displayName: "Frozen participant" },
        { id: "definition-unrelated", displayName: "Unrelated observer" },
      ],
      entities: [
        { id: "entity-self", agentDefinitionId: "definition-self" },
        { id: "entity-counterpart", agentDefinitionId: "definition-counterpart" },
        { id: "entity-unrelated", agentDefinitionId: "definition-unrelated" },
      ],
      relations: [],
    }];

    const result = projectFormalSandboxResult(input);

    expect(result?.claims[0]?.participantKeys).toEqual(["person-1", "person-2"]);
    expect(result?.claims[0]?.relationshipKeys).toEqual(["relation-1"]);
  });

  it("links a Claim to a frozen relation through shared real-evidence provenance", () => {
    const input = bundle();
    input.events = [{ id: "world_event_v2_safe_step", eventType: "allocate_resource", actorId: "definition-self", targetEntityIds: [], targetRelationIds: [], createdAt: "2026-09-01T00:00:00.000Z", branchId: "baseline" }];
    input.claims[0].realEvidenceIds = ["real-evidence-direct"];
    input.sourceBoundary = { evidenceLedger: { items: [{ id: "real-evidence-direct", statement: "A direct user-provided fact." }] }, assumptionLedger: { assumptions: [] } };
    input.worldSnapshots[0].relations = [{ id: "world-relation", fromEntityId: "entity-self", toEntityId: "entity-counterpart", provenance: { realEvidenceIds: ["real-evidence-direct"] } }];

    const result = projectFormalSandboxResult(input);

    expect(result?.claims[0]?.participantKeys).toEqual(["person-1", "person-2"]);
    expect(result?.claims[0]?.relationshipKeys).toEqual(["relation-1"]);
  });

  it("fails closed when one Agent Definition id changes identity across World snapshots", () => {
    const input = bundle();
    input.worldSnapshots.push({
      agentDefinitions: [{ id: "definition-self", displayName: "Frozen participant" }, { id: "definition-counterpart", displayName: "Frozen participant" }],
      entities: [{ id: "entity-self", agentDefinitionId: "definition-self" }, { id: "entity-counterpart", agentDefinitionId: "definition-counterpart" }],
      relations: [],
    });

    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it("fails closed when one Entity id changes its Agent Definition across World snapshots", () => {
    const input = bundle();
    input.worldSnapshots.push({
      agentDefinitions: [{ id: "definition-self", displayName: "Scenario owner" }, { id: "definition-counterpart", displayName: "Frozen participant" }],
      entities: [{ id: "entity-self", agentDefinitionId: "definition-counterpart" }, { id: "entity-counterpart", agentDefinitionId: "definition-counterpart" }],
      relations: [],
    });

    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it.each([
    ["an Entity's Agent Definition", (input: ReturnType<typeof bundle>) => { input.worldSnapshots[0].entities[0].agentDefinitionId = "definition-missing"; }],
    ["a World Relation endpoint", (input: ReturnType<typeof bundle>) => { input.worldSnapshots[0].relations[0].toEntityId = "entity-missing"; }],
    ["an Event actor", (input: ReturnType<typeof bundle>) => { input.events[0].actorId = "definition-missing"; }],
    ["an Event target Entity", (input: ReturnType<typeof bundle>) => { input.events[0].targetEntityIds = ["entity-missing"]; }],
    ["an Event target Relation", (input: ReturnType<typeof bundle>) => { input.events[0].targetRelationIds = ["world-relation-missing"]; }],
  ])("fails closed for a dangling %s reference", (_label, mutate) => {
    const input = bundle();
    mutate(input);
    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it.each([
    ["frozen edge id", (input: ReturnType<typeof bundle>) => { input.inputSnapshot.edges.push({ ...input.inputSnapshot.edges[0], fromAgentId: ids.counterpart, toAgentId: ids.self }); }],
    ["frozen directed endpoints", (input: ReturnType<typeof bundle>) => { input.inputSnapshot.edges.push({ ...input.inputSnapshot.edges[0], id: "relation-second", relationshipType: "conflicting" }); }],
    ["World Definition id inside one snapshot", (input: ReturnType<typeof bundle>) => { input.worldSnapshots[0].agentDefinitions.push({ ...input.worldSnapshots[0].agentDefinitions[0] }); }],
    ["World Entity id inside one snapshot", (input: ReturnType<typeof bundle>) => { input.worldSnapshots[0].entities.push({ ...input.worldSnapshots[0].entities[0] }); }],
    ["World Relation id inside one snapshot", (input: ReturnType<typeof bundle>) => { input.worldSnapshots[0].relations.push({ ...input.worldSnapshots[0].relations[0] }); }],
    ["World Relation directed endpoints inside one snapshot", (input: ReturnType<typeof bundle>) => { input.worldSnapshots[0].relations.push({ ...input.worldSnapshots[0].relations[0], id: "world-relation-second" }); }],
  ])("fails closed for a duplicate %s", (_label, mutate) => {
    const input = bundle();
    mutate(input);
    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it("fails closed when a repeated World Relation id conflicts across snapshots", () => {
    const input = bundle();
    input.worldSnapshots.push({
      agentDefinitions: structuredClone(input.worldSnapshots[0].agentDefinitions),
      entities: structuredClone(input.worldSnapshots[0].entities),
      relations: [{ ...input.worldSnapshots[0].relations[0], fromEntityId: "entity-counterpart", toEntityId: "entity-self" }],
    });
    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it("fails closed when a repeated World Relation keeps its endpoints but changes provenance", () => {
    const input = bundle();
    input.sourceBoundary.evidenceLedger.items = [
      { id: "real-evidence-one", statement: "First fact." },
      { id: "real-evidence-two", statement: "Second fact." },
    ];
    input.worldSnapshots[0].relations[0].provenance.realEvidenceIds = ["real-evidence-one"];
    input.worldSnapshots.push({
      agentDefinitions: structuredClone(input.worldSnapshots[0].agentDefinitions),
      entities: structuredClone(input.worldSnapshots[0].entities),
      relations: [{ ...structuredClone(input.worldSnapshots[0].relations[0]), provenance: { realEvidenceIds: ["real-evidence-two"] } }],
    });

    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it.each([
    ["frozen Agent", (input: ReturnType<typeof bundle>) => { input.inputSnapshot.agents[0].evidenceRefs.push("private-ref"); }],
    ["frozen Relation", (input: ReturnType<typeof bundle>) => { input.inputSnapshot.edges[0].evidenceRefs.push("private-ref"); }],
  ])("fails closed for duplicate %s evidence references", (_label, mutate) => {
    const input = bundle();
    mutate(input);
    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it.each([
    ["Report Claim", (input: ReturnType<typeof bundle>) => {
      input.claims.push({ ...input.claims[0], id: "claim_v2_second_claim" });
      input.report.claimIds = ["claim_v2_safe_claim", "claim_v2_safe_claim"];
    }],
    ["Claim Event", (input: ReturnType<typeof bundle>) => { input.claims[0].simulationEventIds.push("world_event_v2_safe_step"); }],
    ["Claim real evidence", (input: ReturnType<typeof bundle>) => {
      input.sourceBoundary = { evidenceLedger: { items: [{ id: "real-evidence-one", statement: "One fact." }] }, assumptionLedger: { assumptions: [] } };
      input.claims[0].realEvidenceIds = ["real-evidence-one", "real-evidence-one"];
    }],
    ["Event target Entity", (input: ReturnType<typeof bundle>) => { input.events[0].targetEntityIds.push("entity-counterpart"); }],
    ["Event target Relation", (input: ReturnType<typeof bundle>) => { input.events[0].targetRelationIds = ["world-relation", "world-relation"]; }],
  ])("fails closed for duplicate %s references", (_label, mutate) => {
    const input = bundle();
    mutate(input);
    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it("fails closed when Claim real evidence is absent from the frozen Reality Boundary", () => {
    const input = bundle();
    input.claims[0].realEvidenceIds = ["real-evidence-missing"];
    expect(projectFormalSandboxResult(input)).toBeNull();
  });

  it("maps an explicitly targeted reverse World edge to the only matching frozen relation", () => {
    const input = bundle();
    input.worldSnapshots[0].relations = [{ id: "world-relation", fromEntityId: "entity-counterpart", toEntityId: "entity-self", provenance: { realEvidenceIds: [] } }];
    input.events[0].targetEntityIds = [];
    input.events[0].targetRelationIds = ["world-relation"];

    expect(projectFormalSandboxResult(input)?.claims[0]?.relationshipKeys).toEqual(["relation-1"]);
  });

  it("prefers the correctly directed frozen relation when both directions exist", () => {
    const input = bundle();
    input.inputSnapshot.edges.push({ id: "relation-reverse", fromAgentId: ids.counterpart, toAgentId: ids.self, relationshipType: "reverse professional", evidenceRefs: ["private-ref"] });
    input.worldSnapshots[0].relations = [{ id: "world-relation", fromEntityId: "entity-counterpart", toEntityId: "entity-self", provenance: { realEvidenceIds: [] } }];
    input.events[0].targetEntityIds = [];
    input.events[0].targetRelationIds = ["world-relation"];

    expect(projectFormalSandboxResult(input)?.claims[0]?.relationshipKeys).toEqual(["relation-2"]);
  });

  it("keeps ambiguous frozen display names but omits their World linkage instead of guessing", () => {
    const input = bundle();
    input.inputSnapshot.agents[0].displayName = "Same display name";
    input.inputSnapshot.agents[1].displayName = "Same display name";
    input.worldSnapshots[0].agentDefinitions = [{ id: "definition-self", displayName: "Same display name" }, { id: "definition-counterpart", displayName: "Same display name" }];
    input.events[0].targetEntityIds = [];

    const result = projectFormalSandboxResult(input);

    expect(result).not.toBeNull();
    expect(result?.steps[0]?.participantKeys).toEqual([]);
    expect(result?.steps[0]?.relationshipKeys).toEqual([]);
  });

  it("projects explicit structured resources and simulated changes without exposing World IDs", () => {
    const input = bundle();
    Object.assign(input.worldSnapshots[0], {
      resources: [{ id: "world-resource-internal-id", resourceType: "time", label: "每周可投入时间", available: 5, unit: "小时", min: 2, max: 8 }],
      constraints: [{ id: "world-constraint-internal-id", constraintType: "deadline", target: { type: "resource", id: "world-resource-internal-id" }, rule: { kind: "before_time", value: "2026-10-01T00:00:00.000Z" } }],
    });
    input.inputSnapshot.realityProfileSnapshot.profile.worldInputs.resources = [{
      key: "weekly-focus",
      label: "每周可投入时间",
      resourceType: "time",
      available: 8,
      unit: "小时",
      minimum: 2,
      maximum: 8,
      usePerTick: 1,
      classification: "assumption",
      evidenceSummary: "本人明确设定的模拟参数",
    }];
    input.inputSnapshot.realityProfileSnapshot.profile.worldInputs.constraints = [{
      key: "focus-deadline",
      label: "阶段时间边界",
      resourceKey: "weekly-focus",
      rule: { kind: "before_time", value: "2026-10-01T00:00:00.000Z" },
      classification: "fact",
      evidenceSummary: "本人记录的时间限制",
    }];

    const result = projectFormalSandboxResult(input);
    expect(result?.realityProfile.structuredResources).toEqual([expect.objectContaining({ key: "resource-1", available: 8, classification: "assumption" })]);
    expect(result?.realityProfile.structuredConstraints).toEqual([expect.objectContaining({ key: "constraint-1", resourceLabel: "每周可投入时间" })]);
    expect(result?.resourceChanges).toEqual([{
      key: "change-1",
      pathKey: "path-1",
      label: "每周可投入时间",
      before: 8,
      after: 5,
      unit: "小时",
      minimum: 2,
      maximum: 8,
      boundary: "simulation_change",
    }]);
    expect(JSON.stringify(result)).not.toContain("world-resource-internal-id");
    expect(JSON.stringify(result)).not.toContain("weekly-focus");
  });
});
