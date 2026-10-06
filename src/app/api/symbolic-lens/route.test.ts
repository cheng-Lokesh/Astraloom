import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ user: null as null | { id: string; is_anonymous?: boolean }, rpc: vi.fn(), recover: vi.fn(), rows: [] as unknown[], eq: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user }, error: null }) }, from: state.from }) }));
vi.mock("@/lib/supabase/service-role.server", () => ({ getServiceRoleSupabaseClient: () => ({ rpc: (name: string, args: unknown) => name === "recover_symbolic_lens_v1" ? state.recover(name, args) : state.rpc(name, args) }) }));
import { GET, PUT } from "./route";
import { POST as withdraw } from "./withdraw/route";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";

const source = { birthDate: "1991-06-15", birthTime: null };
const requestBody = () => ({ operation: "replace_source", revision: 0, idempotency_key: "1d2752ed-f05f-44b4-8d24-b24f77a5e8f2", source, consent: { storage: true, calculation: true, futureAttachment: false } });
const request = (body: unknown) => new Request("http://localhost/api/symbolic-lens", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
function preference(frame = buildSymbolicFrame(source, 1, new Date().toISOString())) { return { revision: 1, storage_consent: true, calculation_consent: true, future_attachment_consent: false, source_version: 1, current_snapshot: frame, updated_at: new Date().toISOString() }; }

describe("formal symbolic lens API", () => {
  afterEach(() => vi.useRealTimers());
  beforeEach(() => {
    state.user = { id: "signed-in-owner" };
    state.rows = [];
    state.rpc.mockReset(); state.eq.mockReset(); state.from.mockReset();
    state.recover.mockReset(); state.recover.mockResolvedValue({ data: [], error: null });
    state.from.mockImplementation(() => { const q = { select: vi.fn(), eq: state.eq, maybeSingle: vi.fn(async () => ({ data: state.rows.shift() ?? null, error: null })) }; q.select.mockReturnValue(q); state.eq.mockReturnValue(q); return q; });
  });
  it("denies unauthenticated and anonymous signed-in users before reads or writes", async () => {
    for (const user of [null, { id: "anonymous", is_anonymous: true }]) {
      state.user = user;
      expect((await GET()).status).toBe(401);
      expect((await PUT(request(requestBody()))).status).toBe(401);
      expect((await withdraw(request({ revision: 0, idempotency_key: requestBody().idempotency_key }))).status).toBe(401);
    }
    expect(state.rpc).not.toHaveBeenCalled(); expect(state.from).not.toHaveBeenCalled();
  });
  it("reads a safe owner-scoped current snapshot without admin writes", async () => {
    state.rows = [preference()];
    const response = await GET(); const body = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(state.eq).toHaveBeenCalledWith("user_id", "signed-in-owner");
    expect(body.lens.status).toBe("active"); expect(body.lens.futureAttachmentStatus).toBe("connected");
    expect(JSON.stringify(body).includes(source.birthDate)).toBe(false); expect(body.lens).not.toHaveProperty("user_id");
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("marks an old period stale without rewriting it", async () => {
    state.rows = [preference(buildSymbolicFrame(source, 1, "2025-01-16T00:00:00.000Z"))];
    const body = await (await GET()).json();
    expect(body.lens.status).toBe("stale"); expect(body.lens.snapshot.referencePeriod.key).toBe("2025-01");
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("detects a changed approximate month structure within the same calendar month", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-10T00:00:00Z"));
    state.rows = [preference(buildSymbolicFrame(source, 1, "2026-10-06T00:00:00Z"))];
    const body = await (await GET()).json();
    expect(body.lens.status).toBe("stale"); expect(body.lens.snapshot.referencePeriod.key).toBe("2026-10");
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("fails closed on a tampered projection instead of exposing extra source data", async () => {
    state.rows = [{ ...preference(), birth_date: source.birthDate }];
    const response = await GET(); const body = await response.json();
    expect(response.status).toBe(500); expect(JSON.stringify(body).includes(source.birthDate)).toBe(false);
  });
  it("refreshes only an already consented owner source", async () => {
    state.rows = [{ source_id: "owned-source", source_version: 1, revision: 1, storage_consent: true, calculation_consent: true }, { birth_date: source.birthDate, birth_time: null, source_version: 1 }];
    state.rpc.mockResolvedValue({ data: [{ ...preference(), revision: 2, idempotent: false }], error: null });
    const response = await PUT(request({ operation: "refresh_period", revision: 1, idempotency_key: requestBody().idempotency_key }));
    expect(response.status).toBe(201); expect(state.eq).toHaveBeenCalledWith("id", "owned-source");
    expect(state.rpc.mock.calls[0][1].p_source).toBeNull();
    expect(state.rpc.mock.calls[0][1].p_frame.sourceVersion).toBe(1);
    state.rows = [{ source_id: "owned-source", source_version: 1, revision: 2, storage_consent: false, calculation_consent: false }];
    expect((await PUT(request({ operation: "refresh_period", revision: 2, idempotency_key: requestBody().idempotency_key }))).status).toBe(409);
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });
  it("never projects withdrawn snapshots as current", async () => {
    state.rows = [{ ...preference(), calculation_consent: false, future_attachment_consent: false }];
    const body = await (await GET()).json();
    expect(body.lens.status).toBe("withdrawn"); expect(body.lens.snapshot).toBeNull();
  });
  it("requires two explicit consent scopes and rejects injected owners or unused fields", async () => {
    for (const body of [{ ...requestBody(), user_id: "injected" }, { ...requestBody(), source: { ...source, timezone: "unused" } }, { ...requestBody(), consent: { storage: true, calculation: false, futureAttachment: false } }]) {
      expect((await PUT(request(body))).status).toBe(422);
    }
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("derives the writer owner from verified session and exposes only safe projection", async () => {
    state.rpc.mockResolvedValue({ data: [{ ...preference(), idempotent: false }], error: null });
    const response = await PUT(request(requestBody())); const body = await response.json();
    expect(response.status).toBe(201);
    expect(state.rpc.mock.calls[0][0]).toBe("persist_symbolic_lens_v1");
    expect(state.rpc.mock.calls[0][1].p_user_id).toBe("signed-in-owner");
    expect(JSON.stringify(body).includes(source.birthDate)).toBe(false);
    expect(body.lens.snapshot.sourceVersion).toBe(1);
  });
  it("maps stale revisions and strips internal error messages", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { message: "symbolic_revision_conflict" } });
    expect((await PUT(request(requestBody()))).status).toBe(409);
    state.rpc.mockResolvedValue({ data: null, error: { message: "private database detail" } });
    const body = await (await PUT(request(requestBody()))).json();
    expect(body.error_code).toBe("persistence_failed"); expect(JSON.stringify(body).includes("private database")).toBe(false);
  });
  it("withdraws through the atomic writer and returns no active snapshot", async () => {
    state.rpc.mockResolvedValue({ data: [{ ...preference(), revision: 2, storage_consent: false, calculation_consent: false, future_attachment_consent: false, current_snapshot: null, idempotent: false }], error: null });
    const response = await withdraw(request({ revision: 1, idempotency_key: requestBody().idempotency_key }));
    const body = await response.json(); expect(response.status).toBe(200); expect(body.lens.status).toBe("withdrawn");
    expect(body.lens.snapshot).toBeNull(); expect(state.rpc.mock.calls[0][0]).toBe("withdraw_symbolic_lens_v1");
  });
  it("recovers an owner-key refresh receipt before newer revision or source reads", async () => {
    state.rows = [{ source_id: "owned-source", source_version: 1, revision: 2, storage_consent: true, calculation_consent: true }];
    state.recover.mockResolvedValue({ data: [{ ...preference(), revision: 2, idempotent: true }], error: null });
    const response = await PUT(request({ operation: "refresh_period", revision: 1, idempotency_key: requestBody().idempotency_key }));
    expect(response.status).toBe(200);
    expect(state.from).not.toHaveBeenCalled();
    expect(state.recover.mock.calls[0][0]).toBe("recover_symbolic_lens_v1");
    expect(state.recover.mock.calls[0][1]).not.toHaveProperty("p_frame");
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("recovers a source-save receipt on another day without recalculation or reactivation", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-07T00:00:00Z"));
    state.recover.mockResolvedValue({ data: [{ ...preference(), revision: 2, storage_consent: false, calculation_consent: false, current_snapshot: null, idempotent: true }], error: null });
    const response = await PUT(request(requestBody())); const body = await response.json();
    expect(response.status).toBe(200); expect(body.lens.status).toBe("withdrawn");
    expect(state.recover.mock.calls[0][0]).toBe("recover_symbolic_lens_v1");
    expect(state.recover.mock.calls[0][1]).not.toHaveProperty("p_frame");
    expect(state.rpc).not.toHaveBeenCalled();
    expect(JSON.stringify(body).includes(source.birthDate)).toBe(false);
  });
  it("rejects conflicting recovered input before source reads or new generation", async () => {
    state.recover.mockResolvedValue({ data: null, error: { message: "symbolic_idempotency_conflict" } });
    expect((await PUT(request(requestBody()))).status).toBe(409);
    expect(state.from).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
    expect(state.recover.mock.calls[0][1].p_user_id).toBe("signed-in-owner");
  });
});
