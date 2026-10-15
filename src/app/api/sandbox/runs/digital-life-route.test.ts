import { beforeEach, describe, expect, it, vi } from "vitest";
import { digitalLifeRules, ids } from "@/lib/digital-life/test-fixtures";

const state = vi.hoisted(() => ({ user: null as string | null, start: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null } }) } }) }));
vi.mock("@/lib/formal-sandbox/start.server", () => ({ startFormalSandboxRun: (...args: unknown[]) => state.start(...args) }));
import { POST } from "./route";

const body = () => ({ graph_snapshot_id: ids.graph, idempotency_key: ids.edge, horizon_days: 30, digital_life_rules: digitalLifeRules() });
const request = (value: unknown) => new Request("http://local/api/sandbox/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });

beforeEach(() => {
  state.user = ids.owner;
  state.start.mockReset().mockResolvedValue({ ok: true, idempotent: false, run: { id: ids.seed, status: "completed", graph_snapshot_id: ids.graph, time_horizon: "30_days" } });
});

describe("digital-life Run HTTP contract", () => {
  it("accepts explicit legal rules and sends only the cookie owner and validated input to Start", async () => {
    const response = await POST(request(body()));
    expect(response.status).toBe(201);
    expect(state.start.mock.calls[0]?.[1]).toBe(ids.owner);
    expect(state.start.mock.calls[0]?.[2]).toEqual(body());
  });
  it("admits confirmed v2 conditions unchanged while refusing the same operation inside a v1 envelope", async () => {
    const rules = { ...digitalLifeRules(), version: "digital-life-rules-v2", actions: [{ key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 1 }, operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "家庭支持可用" }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人声明的条件情景，不代表现实控制" }], strategies: [] };
    const input = { ...body(), digital_life_rules: rules };
    const response = await POST(request(input));
    expect(response.status).toBe(201);
    expect(state.start.mock.calls[0]?.[2]).toEqual(input);
    state.start.mockClear();
    expect((await POST(request({ ...input, digital_life_rules: { ...rules, version: "digital-life-rules-v1" } }))).status).toBe(422);
    expect(state.start).not.toHaveBeenCalled();
  });
  it("denies anonymous requests before the runtime or writer runs", async () => {
    state.user = null;
    expect((await POST(request(body()))).status).toBe(401);
    expect(state.start).not.toHaveBeenCalled();
  });
  it.each([
    () => ({ ...body(), user_id: ids.npc }),
    () => ({ ...body(), digital_life_rules: { ...digitalLifeRules(), ownerId: ids.npc } }),
    () => ({ ...body(), digital_life_rules: { ...digitalLifeRules(), version: "future" } }),
    () => ({ ...body(), digital_life_rules: { ...digitalLifeRules(), strategies: Array(3).fill(digitalLifeRules().strategies[0]) } }),
    () => { const value = body(); value.digital_life_rules.actions[1].confirmedForSimulation = false; return value; },
  ])("rejects malformed, forged or unconfirmed rule payloads before Start", async (value) => {
    expect((await POST(request(value()))).status).toBe(422);
    expect(state.start).not.toHaveBeenCalled();
  });
});
