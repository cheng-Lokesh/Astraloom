import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";

export const ids = {
  owner: "11111111-1111-4111-8111-111111111111", seed: "22222222-2222-4222-8222-222222222222",
  graph: "33333333-3333-4333-8333-333333333333", snapshot: "44444444-4444-4444-8444-444444444444",
  self: "55555555-5555-4555-8555-555555555555", npc: "66666666-6666-4666-8666-666666666666",
  edge: "77777777-7777-4777-8777-777777777777", profile: "88888888-8888-4888-8888-888888888888",
  variant: "99999999-9999-4999-8999-999999999999",
};

export function digitalLifeInput() {
  const profile = createEmptyRealityProfileDraft(2);
  profile.goals = [{ value: "先确认共同安排", classification: "fact", evidenceSummary: "本人记录的目标" }];
  profile.values = [{ value: "尊重双方边界", classification: "fact", evidenceSummary: "本人记录的价值观" }];
  profile.lifeModelDomains.identity = [{ value: "承担长期照护责任", classification: "fact", evidenceSummary: "本人确认的长期结构" }];
  profile.lifeModelDomains.environment = [{ value: "未来可能调整居住城市", classification: "assumption", evidenceSummary: "本人提交的长期假设" }];
  profile.worldInputs.resources = [{ key: "focus-time", label: "可投入时间", resourceType: "time", available: 8, unit: "小时", minimum: 1, maximum: 8, usePerTick: 1, classification: "assumption", evidenceSummary: "本人明确设定的参数" }];
  return {
    ownerId: ids.owner, seedContextId: ids.seed, graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot,
    horizonDays: 30 as const, deterministicSeed: 1701, startedAt: "2026-10-06T04:00:00.000Z",
    seedSummary: "A bounded interaction under user-declared assumptions.",
    realityProfileSnapshot: { ownerId: ids.owner, seedContextId: ids.seed, profileId: ids.profile, revision: 2, profile },
    agents: [
      { id: ids.self, displayName: "本人", actorType: "self" as const, sourceRole: "user_core" as const, evidenceRefs: ["seed:self"] },
      { id: ids.npc, displayName: "协作对象", actorType: "third_party" as const, sourceRole: "npc" as const, evidenceRefs: ["seed:person"] },
      { id: ids.variant, displayName: "平行自我", actorType: "self" as const, sourceRole: "user_variant" as const, evidenceRefs: ["seed:self"] },
    ],
    edges: [{ id: ids.edge, fromAgentId: ids.self, toAgentId: ids.npc, relationshipType: "协作关系", evidenceRefs: ["seed:person"] }],
    safetyLevel: "safe" as const, symbolicLens: { mode: "bounded_fusion" as const, summary: "Optional framing only." },
    calibrationSnapshot: { source: "none", signals: [] },
  };
}

export function digitalLifeRules() {
  return {
    version: "digital-life-rules-v1" as const, graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
    strategies: [{ participantKey: "person-3", label: "先保留自主学习时间", confirmedForSimulation: true, evidenceSummary: "本人显式选择的平行策略" }],
    actions: [
      { key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "request_information", targetPersonKey: "person-2", question: "确认双方可投入的时间" }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人明确设定的行动假设" },
      { key: "rule-2", pathKey: "main", actorKey: "person-2", when: { kind: "after_rule", ruleKey: "rule-1" }, operation: { actionType: "update_relation_signal", relationKey: "relation-1", signal: "positive" }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人确认的条件回应假设，并非对方真实意图" },
      { key: "rule-3", pathKey: "person-3", actorKey: "person-3", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "先保留自主学习时间", status: "active", profileEntryKey: "goals.1" }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人显式选择的平行策略行动" },
    ],
  };
}
