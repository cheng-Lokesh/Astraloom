import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ user: null as null | { id: string; is_anonymous?: boolean }, rpc: vi.fn(), row: null as unknown, from: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user }, error: null }) }, from: state.from }) }));
vi.mock("@/lib/supabase/service-role.server", () => ({ getServiceRoleSupabaseClient: () => ({ rpc: state.rpc }) }));
import { readFutureAttachment, writeFutureAttachment } from "./future-attachment.server";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";
const key = "11111111-1111-4111-8111-111111111111";
const request = (body: unknown) => new Request("http://localhost/api/symbolic-lens/future-attachment", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
function pref() { return { revision: 2, storage_consent: true, calculation_consent: true, future_attachment_consent: true, current_snapshot: { frame: buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 1, new Date().toISOString()) } }; }
describe("independent future Run attachment consent", () => {
  beforeEach(() => {
    state.user = { id: key }; state.rpc.mockReset(); state.eq.mockReset(); state.from.mockReset(); state.row = pref();
    state.from.mockImplementation(() => { const q = { select: vi.fn(), eq: state.eq, maybeSingle: async () => ({ data: state.row, error: null }) }; q.select.mockReturnValue(q); state.eq.mockReturnValue(q); return q; });
  });
  it("requires a real signed-in owner before any grant or read", async () => {
    for (const user of [null, { id: key, is_anonymous: true }]) {
      state.user = user;
      expect((await readFutureAttachment()).status).toBe(401);
      expect((await writeFutureAttachment(request({ revision: 1, enabled: true, idempotency_key: key }))).status).toBe(401);
    }
    expect(state.rpc).not.toHaveBeenCalled(); expect(state.from).not.toHaveBeenCalled();
  });
  it("reads only the owner's eligibility without birth inputs or internal references", async () => {
    const response = await readFutureAttachment(); const body = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(state.eq).toHaveBeenCalledWith("user_id", key);
    expect(body.attachment).toEqual({ revision: 2, enabled: true, eligible: true, status: "active" });
    expect(JSON.stringify(body)).not.toContain(key); expect(JSON.stringify(body)).not.toContain("1991-06-15");
  });
  it.each([null, {}, { revision: 1, enabled: null, idempotency_key: key }, { revision: 1, enabled: true, idempotency_key: key, user_id: key }])("rejects incomplete, NULL and owner-injected input", async body => {
    expect((await writeFutureAttachment(request(body))).status).toBe(422); expect(state.rpc).not.toHaveBeenCalled();
  });
  it("passes explicit enablement to the sole controlled writer and returns its safe receipt state", async () => {
    state.rpc.mockResolvedValue({ data: [{ ...pref(), idempotent: false }], error: null });
    const response = await writeFutureAttachment(request({ revision: 1, enabled: true, idempotency_key: key }));
    expect(response.status).toBe(201);
    expect(state.rpc).toHaveBeenCalledWith("set_symbolic_future_attachment_v1", expect.objectContaining({ p_user_id: key, p_expected_revision: 1, p_enabled: true, p_idempotency_key: key }));
    expect((await response.json()).attachment.enabled).toBe(true);
  });
  it("a recovered old grant after withdrawal cannot re-enable the current account", async () => {
    state.rpc.mockResolvedValue({ data: [{ revision: 3, storage_consent: false, calculation_consent: false, future_attachment_consent: false, current_snapshot: null, idempotent: true }], error: null });
    const response = await writeFutureAttachment(request({ revision: 1, enabled: true, idempotency_key: key }));
    expect(response.status).toBe(200); expect((await response.json()).attachment).toEqual({ revision: 3, enabled: false, eligible: false, status: "withdrawn" });
  });
  it("maps stale consent and conflicts safely without database payloads", async () => {
    for (const code of ["symbolic_revision_conflict", "symbolic_idempotency_conflict", "symbolic_consent_required", "symbolic_period_stale"]) {
      state.rpc.mockResolvedValue({ data: null, error: { message: code } });
      expect((await writeFutureAttachment(request({ revision: 1, enabled: true, idempotency_key: key }))).status).toBe(409);
    }
    state.rpc.mockResolvedValue({ data: null, error: { message: "private database source" } });
    const body = await (await writeFutureAttachment(request({ revision: 1, enabled: true, idempotency_key: key }))).json();
    expect(body.error_code).toBe("persistence_failed"); expect(JSON.stringify(body)).not.toContain("private database");
  });
});
