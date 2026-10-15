import { beforeEach, describe, expect, it, vi } from "vitest";
import { digitalLifeInput, ids } from "./test-fixtures";
import { saveDigitalLifeModelDraftSchema } from "./model-draft";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";

const state = vi.hoisted(() => ({ caller: undefined as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ ...(state.caller as object), auth: { getUser: async () => ({ data: { user: { id: "11111111-1111-4111-8111-111111111111", is_anonymous: false } }, error: null }) } }) }));
import { GET, POST } from "@/app/api/sandbox/model-draft/route";

function fixture() {
  const input = digitalLifeInput();
  const profile = input.realityProfileSnapshot.profile;
  profile.externalVariables = [{ value: "家庭支持尚未确定", classification: "fact", evidenceSummary: "本人记录的当前安排" }];
  const context = {
    graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
    agents: input.agents.map((agent, index) => ({ key: `person-${index + 1}`, label: agent.displayName, role: agent.sourceRole })),
    relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }],
    resources: profile.worldInputs.resources.map(({ label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary }, index) => ({ key: `resource-${index + 1}`, label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary })),
    variables: [{ key: "external-variable-1", category: "external_variable", label: "外部变量", ...profile.externalVariables[0] }],
  };
  const rules = {
    version: "digital-life-rules-v2", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
    strategies: [], actions: [
      { key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "家庭支持可用" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人声明的条件情景" },
      { key: "rule-2", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-1" }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "先确认共同安排", status: "active", profileEntryKey: "goals.1" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人声明的承诺" },
      { key: "rule-3", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-2" }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人明确声明投入数量" },
    ],
  };
  const request = saveDigitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v2", expectedRevision: 2, idempotencyKey: ids.edge, horizonDays: 30, sourceContext: { version: "digital-life-model-draft-source-v2", signature: "a".repeat(64), modelContext: context }, draftRules: rules });
  const currentProfile = structuredClone(profile);
  currentProfile.revision = 3;
  currentProfile.worldInputs.resources[0].available = 6;
  currentProfile.externalVariables[0].value = "家庭支持仍待协调";
  currentProfile.goals[0].value = "新的目标文字不能充当旧背景内容";
  const source = {
    signature: "c".repeat(64), signature_v2: "d".repeat(64),
    seed_contexts: { id: ids.seed, user_id: ids.owner },
    relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot },
    agent_profiles: input.agents.map(agent => ({ id: agent.id, user_id: ids.owner, seed_context_id: ids.seed, snapshot_id: ids.snapshot, display_name: agent.displayName, agent_type: agent.sourceRole, evidence_refs: agent.evidenceRefs })),
    relation_edges: input.edges.map(edge => ({ id: edge.id, user_id: ids.owner, graph_snapshot_id: ids.graph, agent_snapshot_id: ids.snapshot, from_agent_id: edge.fromAgentId, to_agent_id: edge.toAgentId, relationship_type: edge.relationshipType, evidence_refs: edge.evidenceRefs })),
    reality_profiles: { id: ids.profile, user_id: ids.owner, seed_context_id: ids.seed, revision: 3, life_climate_value: null, life_climate_classification: "unknown", life_climate_evidence_summary: "明确未知", resources_value: null, resources_classification: "unknown", resources_evidence_summary: "明确未知", constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: "明确未知", life_goals: currentProfile.goals, core_values: currentProfile.values, life_themes: currentProfile.lifeThemes, pressures: currentProfile.pressures, external_variables: currentProfile.externalVariables, life_model_domains: currentProfile.lifeModelDomains, world_model_inputs: currentProfile.worldInputs },
  };
  return { request, source, row: { user_id: ids.owner, revision: 3, request }, persistedSeedId: ids.seed };
}

function caller(f = fixture(), savedSeed: unknown = f.persistedSeedId) {
  const rpc = vi.fn(async () => ({ data: { source: f.source, current: f.row }, error: null }));
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: savedSeed === null ? null : { seed_context_id: savedSeed }, error: null })) };
  return { rpc, query, from: vi.fn(() => query) };
}

beforeEach(() => { state.caller = caller(); });
const prepare = (query = "?prepare_version=v2&reconcile_revision=3") => GET(new Request(`http://local/api/sandbox/model-draft${query}`));

describe("explicit current-model reconciliation preparation", () => {
  it("reads an owned same-chain Profile change as a zero-write unresolved plan without mapping old resource or variable ordinals", async () => {
    const f = fixture(); const before = JSON.stringify(f); const db = caller(f); state.caller = db;
    const response = await prepare();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.draft.status).toBe("stale");
    expect(body.draft.sourceContext).toEqual(f.request.sourceContext);
    expect(body.preparedSourceContext.modelContext.profileRevision).toBe(3);
    expect(body.preparedSourceContext.modelContext.resources[0].available).toBe(6);
    expect(body.reconciliation).toMatchObject({ version: "digital-life-model-reconciliation-v1", draftRevision: 3, horizonDays: 30, sourceRules: f.request.draftRules, permissionsReset: { planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true } });
    expect(body.reconciliation.requirements).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleKey: "rule-1", kind: "variable", previousSelector: "external-variable-1" }),
      expect.objectContaining({ ruleKey: "rule-2", kind: "detach_profile_entry", previousSelector: "goals.1" }),
      expect.objectContaining({ ruleKey: "rule-3", kind: "resource", previousSelector: "resource-1" }),
    ]));
    expect(body.reconciliation.sourceRules.profileRevision).toBe(2);
    expect(body.reconciliation.sourceRules.actions.every((item: { confirmedForSimulation: boolean }) => item.confirmedForSimulation === false)).toBe(true);
    expect(JSON.stringify(body.reconciliation.requirements)).not.toContain("新的目标文字不能充当旧背景内容");
    expect(body.reconciliation).not.toHaveProperty("draftRules");
    expect(db.from).toHaveBeenCalledWith("digital_life_model_drafts");
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.query.select).toHaveBeenCalledExactlyOnceWith("seed_context_id");
    expect(db.query.eq).toHaveBeenCalledWith("user_id", ids.owner);
    expect(db.query.eq).toHaveBeenCalledWith("revision", 3);
    expect(db.query.eq).toHaveBeenCalledTimes(2);
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc.mock.calls[0][0]).toBe("read_digital_life_model_draft_v1");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(f)).toBe(before);
    expect(JSON.stringify(body.reconciliation)).not.toMatch(/11111111-1111|22222222-2222/);
  });

  it("keeps default GET and original prepare-v2 responses free of reconciliation and its extra Seed lookup", async () => {
    for (const query of ["", "?prepare_version=v2"]) {
      const db = caller(); state.caller = db;
      const response = await prepare(query);
      expect(response.status).toBe(200);
      expect(await response.json()).not.toHaveProperty("reconciliation");
      expect(db.from).not.toHaveBeenCalled();
    }
  });

  it.each(["?reconcile_revision=3", "?prepare_version=v2&reconcile_revision=0", "?prepare_version=v2&reconcile_revision=03", "?prepare_version=v2&reconcile_revision=-1", "?prepare_version=v2&reconcile_revision=NaN", "?prepare_version=v2&reconcile_revision=3.0", "?prepare_version=v2&reconcile_revision=9007199254740992", "?prepare_version=v2&reconcile_revision=3&reconcile_revision=3", "?prepare_version=v2&reconcile_revision=3&extra=1"])("rejects ambiguous or noncanonical reconciliation selectors %s", async query => {
    const db = caller(); state.caller = db;
    expect((await prepare(query)).status).toBe(422);
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("requires the current owned draft revision before looking up the original Seed", async () => {
    const db = caller(); state.caller = db;
    const response = await prepare("?prepare_version=v2&reconcile_revision=2");
    expect(response.status).toBe(409);
    expect((await response.json()).error_code).toBe("revision_conflict");
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([null, ids.npc, "not-a-uuid"])("hides an unavailable or incompatible original Seed binding %s", async seed => {
    state.caller = caller(fixture(), seed);
    const response = await prepare();
    expect(response.status).toBe(409);
    expect((await response.json()).error_code).toBe("model_reconciliation_scope_changed");
  });

  it.each(["graph", "agents", "relationships", "profile"])("refuses reconciliation after a %s scope change without copying ordinals", async change => {
    const f = fixture();
    if (change === "graph") f.source.relation_graph_snapshots.id = ids.npc;
    if (change === "agents") f.source.agent_profiles.reverse();
    if (change === "relationships") f.source.relation_edges[0].relationship_type = "已经变化的关系记录";
    if (change === "profile") f.source.reality_profiles.revision = 2;
    state.caller = caller(f);
    const response = await prepare();
    expect(response.status).toBe(409);
    expect((await response.json()).error_code).toBe("model_reconciliation_scope_changed");
  });

  it("never accepts reconciliation selectors on a save request", async () => {
    const f = fixture(); const db = caller(f); state.caller = db;
    const response = await POST(new Request("http://local/api/sandbox/model-draft?prepare_version=v2&reconcile_revision=3", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f.request) }));
    expect(response.status).toBe(422);
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });
  it("has a distinct strict client response and validates the revision before issuing a fetch", async () => {
    const response = await prepare(); const body = await response.json();
    const fetcher = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
    const client = createFormalSandboxClient(fetcher);
    expect((await client.prepareModelReconciliation(3)).ok).toBe(true);
    expect(fetcher).toHaveBeenLastCalledWith("/api/sandbox/model-draft?prepare_version=v2&reconcile_revision=3", { cache: "no-store" });
    expect(await client.modelDraft()).toMatchObject({ ok: false, errorCode: "invalid_response" });
    expect(await client.prepareModelDraftV2()).toMatchObject({ ok: false, errorCode: "invalid_response" });
    fetcher.mockClear();
    for (const revision of [0, -1, 3.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) expect(await client.prepareModelReconciliation(revision)).toMatchObject({ ok: false, errorCode: "invalid_request" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
