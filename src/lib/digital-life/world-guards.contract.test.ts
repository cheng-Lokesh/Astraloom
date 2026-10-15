import { beforeEach, describe, expect, it, vi } from "vitest";
import { digitalLifeInput, ids } from "./test-fixtures";
import { saveDigitalLifeModelDraftSchema } from "./model-draft";

const state = vi.hoisted(() => ({ caller: undefined as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ ...(state.caller as object), auth: { getUser: async () => ({ data: { user: { id: "11111111-1111-4111-8111-111111111111", is_anonymous: false } }, error: null }) } }) }));
import { GET, POST } from "@/app/api/sandbox/model-draft/route";

function fixture() {
  const input = digitalLifeInput(); const profile = input.realityProfileSnapshot.profile;
  profile.worldInputs.resources[0].usePerTick = null;
  profile.externalVariables = [{ value: "家庭支持待定", classification: "fact", evidenceSummary: "本人记录的当前安排" }];
  const context = {
    graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
    agents: input.agents.map((agent, index) => ({ key: `person-${index + 1}`, label: agent.displayName, role: agent.sourceRole })),
    relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }],
    resources: profile.worldInputs.resources.map(({ label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary }, index) => ({ key: `resource-${index + 1}`, label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary })),
    variables: [{ key: "external-variable-1", category: "external_variable", label: "外部变量", ...profile.externalVariables[0] }],
  };
  const base = { pathKey: "main", actorKey: "person-1", classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人明确声明的计划" };
  const rules = { version: "digital-life-rules-v2", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, strategies: [], actions: [
    { ...base, key: "rule-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "先保留安排", status: "planned" } },
    { ...base, key: "rule-2", when: { kind: "after_rule", ruleKey: "rule-1" }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 4 } },
    { ...base, key: "rule-3", when: { kind: "after_rule", ruleKey: "rule-2" }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "先保留安排", status: "cancelled" } },
  ] };
  const sourceContext = { version: "digital-life-model-draft-source-v2", signature: "d".repeat(64), modelContext: context };
  const request = saveDigitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v2", expectedRevision: 2, idempotencyKey: ids.edge, horizonDays: 30, sourceContext, draftRules: rules });
  const source = {
    signature: "c".repeat(64), signature_v2: "d".repeat(64), seed_contexts: { id: ids.seed, user_id: ids.owner }, relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot },
    agent_profiles: input.agents.map(agent => ({ id: agent.id, user_id: ids.owner, seed_context_id: ids.seed, snapshot_id: ids.snapshot, display_name: agent.displayName, agent_type: agent.sourceRole, evidence_refs: agent.evidenceRefs })),
    relation_edges: input.edges.map(edge => ({ id: edge.id, user_id: ids.owner, graph_snapshot_id: ids.graph, agent_snapshot_id: ids.snapshot, from_agent_id: edge.fromAgentId, to_agent_id: edge.toAgentId, relationship_type: edge.relationshipType, evidence_refs: edge.evidenceRefs })),
    reality_profiles: { id: ids.profile, user_id: ids.owner, seed_context_id: ids.seed, revision: 2, life_climate_value: null, life_climate_classification: "unknown", life_climate_evidence_summary: "明确未知", resources_value: null, resources_classification: "unknown", resources_evidence_summary: "明确未知", constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: "明确未知", life_goals: profile.goals, core_values: profile.values, life_themes: profile.lifeThemes, pressures: profile.pressures, external_variables: profile.externalVariables, life_model_domains: profile.lifeModelDomains, world_model_inputs: profile.worldInputs },
  };
  const row = { user_id: ids.owner, revision: 3, request };
  return { request, row, source };
}

function caller(f = fixture()) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null, error: null })) };
  return { from: vi.fn(() => query), rpc: vi.fn(async () => ({ data: { source: f.source, current: f.row }, error: null })) };
}
beforeEach(() => { state.caller = caller(); });

describe("explicit guard protocol preparation and source compatibility", () => {
  it("prepares draft3/rules3 with the identical source2 signature without upgrading a saved v2 draft or writing", async () => {
    const f = fixture(); const before = JSON.stringify(f); const db = caller(f); state.caller = db;
    const response = await GET(new Request("http://local/api/sandbox/model-draft?prepare_version=v3"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.draft.version).toBe("digital-life-model-draft-v2");
    expect(body.draft.draftRules).toEqual(f.request.draftRules);
    expect(body.preparedSourceContext).toEqual(f.request.sourceContext);
    expect(body.preparedProtocol).toEqual({ version: "digital-life-model-draft-protocol-v3", draftVersion: "digital-life-model-draft-v3", rulesVersion: "digital-life-rules-v3" });
    expect(body).not.toHaveProperty("reconciliation");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith("read_digital_life_model_draft_v1");
    expect(db.from).not.toHaveBeenCalled();
    expect(JSON.stringify(f)).toBe(before);
  });

  it.each(["v1", "v2"])("leaves the existing saved %s DTO and source hash byte-stable on default and prepare-v2 reads", async version => {
    const f = fixture();
    if (version === "v1") {
      const { variables: ignoredVariables, ...legacyContext } = f.request.sourceContext.modelContext;
      expect(ignoredVariables).toBeDefined();
      f.request = saveDigitalLifeModelDraftSchema.parse({ ...f.request, version: "digital-life-model-draft-v1", sourceContext: { signature: f.source.signature, modelContext: legacyContext }, draftRules: { ...f.request.draftRules, version: "digital-life-rules-v1" } });
      f.row.request = f.request;
    }
    const before = JSON.stringify(f.request);
    for (const query of ["", "?prepare_version=v2"]) {
      const db = caller(f); state.caller = db;
      const response = await GET(new Request(`http://local/api/sandbox/model-draft${query}`));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.draft.sourceContext).toEqual(f.request.sourceContext);
      expect(body.draft.draftRules).toEqual(f.request.draftRules);
      expect(body.draft.version).toBe(f.request.version);
      expect(body).not.toHaveProperty("preparedProtocol");
      expect(db.from).not.toHaveBeenCalled();
    }
    expect(JSON.stringify(f.request)).toBe(before);
  });

  it("admits a v3 unconfirmed save bound to source2, with the guard included in the immutable request", async () => {
    const f = fixture();
    const request = { ...f.request, version: "digital-life-model-draft-v3", expectedRevision: 3, idempotencyKey: ids.variant, draftRules: { ...f.request.draftRules, version: "digital-life-rules-v3", actions: f.request.draftRules.actions.map(action => action.key === "rule-3" ? { ...action, guard: { kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 } } : action) } };
    const db = caller(f);
    db.rpc = vi.fn(async (name: string) => ({ data: name === "read_digital_life_model_draft_v1" ? { source: f.source, current: f.row } : { row: { user_id: ids.owner, revision: 4, request }, idempotent: false }, error: null })) as typeof db.rpc;
    state.caller = db;
    const response = await POST(new Request("http://local/api/sandbox/model-draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) }));
    expect(response.status).toBe(201);
    expect((await response.json()).draft).toMatchObject({ version: "digital-life-model-draft-v3", currentRevision: 4, draftRules: request.draftRules, sourceContext: f.request.sourceContext });
    expect(db.rpc).toHaveBeenCalledWith("save_digital_life_model_draft_v1", { p_request: request });
  });

  it.each(["?prepare_version=v3&extra=1", "?prepare_version=v3&prepare_version=v3", "?prepare_version=v3&reconcile_revision=3"])("keeps unapproved query combinations closed: %s", async query => {
    const db = caller(); state.caller = db;
    expect((await GET(new Request(`http://local/api/sandbox/model-draft${query}`))).status).toBe(422);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("still rejects every query on a save", async () => {
    const f = fixture(); const db = caller(f); state.caller = db;
    expect((await POST(new Request("http://local/api/sandbox/model-draft?prepare_version=v3", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f.request) }))).status).toBe(422);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
