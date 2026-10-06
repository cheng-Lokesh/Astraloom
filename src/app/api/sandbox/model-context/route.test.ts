import { beforeEach, expect, it, vi } from "vitest";
import { ids } from "@/lib/digital-life/test-fixtures";
const state = vi.hoisted(() => ({ user: null as string | null, read: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null } }) } }) }));
vi.mock("@/lib/formal-sandbox/model-context.server", () => ({ readFormalDigitalLifeContext: (...args: unknown[]) => state.read(...args) }));
import { GET } from "./route";
beforeEach(() => { state.user = ids.owner; state.read.mockReset().mockResolvedValue({ ok: true, context: { graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 0, agents: [{ key: "person-1", label: "本人", role: "user_core" }], relationships: [], resources: [] } }); });
it("accepts only a Graph selector and passes the authenticated owner", async () => {
  expect((await GET(new Request(`http://local/api/sandbox/model-context?graph_id=${ids.graph}`))).status).toBe(200);
  expect(state.read.mock.calls[0]?.[1]).toBe(ids.owner);
});
it("allows a missing selector to resolve only the authenticated current chain", async () => {
  expect((await GET(new Request("http://local/api/sandbox/model-context"))).status).toBe(200);
  expect(state.read.mock.calls[0]?.[2]).toBeUndefined();
});
it("denies anonymous and duplicate or body-owner selectors without reading context", async () => {
  state.user = null;
  expect((await GET(new Request(`http://local/api/sandbox/model-context?graph_id=${ids.graph}`))).status).toBe(401);
  state.user = ids.owner;
  for (const query of [`graph_id=${ids.graph}&graph_id=${ids.graph}`, `graph_id=${ids.graph}&user_id=${ids.npc}`, "graph_id=bad"]) expect((await GET(new Request(`http://local/api/sandbox/model-context?${query}`))).status).toBe(422);
  expect(state.read).not.toHaveBeenCalled();
});
