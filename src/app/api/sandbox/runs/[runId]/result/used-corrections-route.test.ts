import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ user: { id: "11111111-1111-4111-8111-111111111111" } as { id: string; is_anonymous?: boolean } | null, authError: null as unknown, from: vi.fn(), project: vi.fn(), sourceId: undefined as string | undefined }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user }, error: state.authError }) }, from: state.from }) }));
vi.mock("@/lib/formal-sandbox/result-projection.server", () => ({ projectFormalSandboxResult: (...args: unknown[]) => state.project(...args) }));
vi.mock("@/lib/formal-sandbox/outcomes/used-corrections.server", () => ({ usedCorrectionSourceRunId: () => state.sourceId }));
import { GET } from "./route";
const runId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", sourceId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const request = () => GET(new Request("http://local/api/sandbox/runs/result"), { params: Promise.resolve({ runId }) });
const calls: string[][] = [];
function query(data: unknown, error: unknown = null) {
  const filters: string[] = []; calls.push(filters);
  const builder = { select: () => builder, eq: (column: string, value: unknown) => { filters.push(`${column}:${String(value)}`); return builder; }, maybeSingle: async () => ({ data, error }) };
  return builder;
}
beforeEach(() => {
  calls.length = 0; state.user = { id: "11111111-1111-4111-8111-111111111111" }; state.authError = null; state.sourceId = sourceId;
  state.project.mockReturnValue({ usedCorrections: { status: "source_unavailable" } });
  state.from.mockReset().mockImplementationOnce(() => query({ id: runId, status: "completed", result_bundle: { frozen: "current" }, completed_at: "2026-11-11T00:00:00Z" }));
});
describe("used correction historical source reads", () => {
  it.each(["anonymous", "auth_error"])("refuses %s before any current or source account read", async kind => {
    if (kind === "anonymous") state.user!.is_anonymous = true; else state.authError = { message: "untrusted session" };
    expect((await request()).status).toBe(401);
    expect(state.from).not.toHaveBeenCalled();
  });
  it("reads at most one source with the same owner, formal version and completed scope", async () => {
    const source = { frozen: "historical" };
    state.from.mockImplementationOnce(() => query({ id: sourceId, result_bundle: source }));
    expect((await request()).status).toBe(200);
    expect(state.from).toHaveBeenCalledTimes(2);
    expect(calls[1]).toEqual([`id:${sourceId}`, `user_id:${state.user!.id}`, "execution_version:formal-account-sandbox-m1-v1", "status:completed"]);
    expect(state.project).toHaveBeenCalledWith({ frozen: "current" }, { correctionSources: new Map([[sourceId, source]]) });
  });
  it("keeps the current result available when the source is owner-hidden or unavailable", async () => {
    state.from.mockImplementationOnce(() => query(null, { message: "private query failure" }));
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(state.project).toHaveBeenCalledWith({ frozen: "current" }, { correctionSources: new Map() });
    expect(await response.text()).not.toContain("private query failure");
  });
  it("does not read a historical source for a legacy result", async () => {
    state.sourceId = undefined;
    expect((await request()).status).toBe(200);
    expect(state.from).toHaveBeenCalledOnce();
  });
  it("rejects a mismatched returned source row instead of relabeling its identity", async () => {
    state.from.mockImplementationOnce(() => query({ id: runId, result_bundle: { frozen: "wrong row" } }));
    expect((await request()).status).toBe(500);
    expect(state.project).not.toHaveBeenCalled();
  });
});
