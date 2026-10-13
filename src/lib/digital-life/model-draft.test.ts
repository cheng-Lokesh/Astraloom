import { beforeEach, describe, expect, it, vi } from "vitest";
import { digitalLifeInput, digitalLifeRules, ids } from "./test-fixtures";
import { saveDigitalLifeModelDraftSchema } from "./model-draft";
import { readFormalModelDraft, saveFormalModelDraft } from "./model-draft.server";
const state = vi.hoisted(() => ({ user: { id: "11111111-1111-4111-8111-111111111111", is_anonymous: false } as { id: string; is_anonymous: boolean } | null, caller: undefined as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ ...(state.caller as object), auth: { getUser: async () => ({ data: { user: state.user }, error: null }) } }) }));
import { GET, POST } from "@/app/api/sandbox/model-draft/route";

function fixture() {
  const input = digitalLifeInput();
  const modelContext = { graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, agents: input.agents.map((agent, index) => ({ key: `person-${index + 1}`, label: agent.displayName, role: agent.sourceRole })), relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }], resources: input.realityProfileSnapshot.profile.worldInputs.resources.map(({ label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary }, index) => ({ key: `resource-${index + 1}`, label, available, minimum, maximum, unit, usePerTick, classification, evidenceSummary })) };
  const rules = digitalLifeRules();
  const request = saveDigitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v1", expectedRevision: 0, idempotencyKey: ids.owner, horizonDays: 30, sourceContext: { signature: "a".repeat(64), modelContext }, draftRules: { ...rules, actions: rules.actions.map(action => ({ ...action, confirmedForSimulation: false })), strategies: rules.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: false })) } });
  const source = { signature: "a".repeat(64), seed_contexts: { id: ids.seed, user_id: ids.owner }, relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot }, agent_profiles: input.agents.map(agent => ({ id: agent.id, user_id: ids.owner, seed_context_id: ids.seed, snapshot_id: ids.snapshot, display_name: agent.displayName, agent_type: agent.sourceRole, evidence_refs: agent.evidenceRefs })), relation_edges: input.edges.map(edge => ({ id: edge.id, user_id: ids.owner, graph_snapshot_id: ids.graph, agent_snapshot_id: ids.snapshot, from_agent_id: edge.fromAgentId, to_agent_id: edge.toAgentId, relationship_type: edge.relationshipType, evidence_refs: edge.evidenceRefs })), reality_profiles: { id: ids.profile, user_id: ids.owner, seed_context_id: ids.seed, revision: 2, life_climate_value: null, life_climate_classification: "unknown", life_climate_evidence_summary: "明确未知", resources_value: null, resources_classification: "unknown", resources_evidence_summary: "明确未知", constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: "明确未知", life_goals: input.realityProfileSnapshot.profile.goals, core_values: input.realityProfileSnapshot.profile.values, life_themes: input.realityProfileSnapshot.profile.lifeThemes, pressures: input.realityProfileSnapshot.profile.pressures, external_variables: input.realityProfileSnapshot.profile.externalVariables, life_model_domains: { version: 1, ...input.realityProfileSnapshot.profile.lifeModelDomains }, world_model_inputs: { version: 1, ...input.realityProfileSnapshot.profile.worldInputs } } };
  return { request, source, row: { user_id: ids.owner, revision: 1, request } };
}
function caller(data: unknown, receipt: unknown = null, saveData: unknown = null) {
  const rpc = vi.fn(async (name: string) => ({ data: name === "save_digital_life_model_draft_v1" ? saveData : data, error: null }));
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: async () => ({ data: receipt, error: null }) };
  return { rpc, from: vi.fn(() => query) };
}
beforeEach(() => { state.user = { id: ids.owner, is_anonymous: false }; state.caller = caller(null); });
describe("current model draft durable boundary", () => {
  it("recovers owned saved false rules after a new read/refresh", async () => {
    const f = fixture(); state.caller = caller({ source: f.source, current: f.row });
    const response = await GET(new Request("http://local/api/sandbox/model-draft"));
    expect(response.status).toBe(200);
    expect((await response.json()).draft).toMatchObject({ status: "current", currentRevision: 1, draftRules: f.request.draftRules });
  });
  it("saves a strictly unconfirmed owned draft through the actual new boundary", async () => {
    const f = fixture(); const db = caller({ source: f.source, current: null }, null, { row: f.row, idempotent: false });
    expect(await saveFormalModelDraft(db as never, ids.owner, f.request)).toMatchObject({ ok: true, idempotent: false, draft: { currentRevision: 1 } });
  });
  it("recovers the original revision before changed current source reads", async () => {
    const f = fixture(); const db = caller(null, f.row);
    expect(await saveFormalModelDraft(db as never, ids.owner, JSON.parse(JSON.stringify(f.request)))).toMatchObject({ ok: true, idempotent: true, draft: { currentRevision: 1 } });
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("keeps a stale saved model readable without rebinding ordinal rules", async () => {
    const f = fixture(); const source = structuredClone(f.source); source.signature = "b".repeat(64);
    expect(await readFormalModelDraft(caller({ source, current: f.row }) as never, ids.owner)).toMatchObject({ ok: true, draft: { status: "stale", sourceContext: f.request.sourceContext, draftRules: f.request.draftRules } });
  });
  it("denies anonymous, selectors, confirmed actions and unknown permission fields", async () => {
    state.user = null; expect((await GET(new Request("http://local/api/sandbox/model-draft"))).status).toBe(401);
    state.user = { id: ids.owner, is_anonymous: true }; expect((await GET(new Request("http://local/api/sandbox/model-draft"))).status).toBe(401);
    state.user = { id: ids.owner, is_anonymous: false }; expect((await GET(new Request(`http://local/api/sandbox/model-draft?owner=${ids.owner}`))).status).toBe(422);
    const f = fixture(); f.request.draftRules.actions[0].confirmedForSimulation = true as never;
    expect((await POST(new Request("http://local/api/sandbox/model-draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f.request) }))).status).toBe(422);
  });
});
