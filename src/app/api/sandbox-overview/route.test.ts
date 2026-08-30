import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ client: null as unknown, read: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));
vi.mock("@/lib/sandbox-overview/overview.server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sandbox-overview/overview.server")>()),
  readSandboxOverview: (...args: unknown[]) => state.read(...args),
}));

import { GET } from "./route";

describe("GET /api/sandbox-overview", () => {
  beforeEach(() => {
    state.read.mockReset();
    state.client = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } };
  });

  it("rejects anonymous access without reading account data", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: false, error_code: "unauthenticated", trace_id: expect.any(String) }));
    expect(state.read).not.toHaveBeenCalled();
  });

  it("uses only the authenticated owner and returns a non-cacheable safe projection", async () => {
    state.client = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-not-an-input" } } }) } };
    state.read.mockResolvedValue({ authenticated: true, nextAction: { kind: "start_intake", href: "/app/new/intake" } });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(state.read).toHaveBeenCalledWith(state.client, "owner-not-an-input");
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true, overview: expect.any(Object) }));
  });

  it("does not leak a persistence exception", async () => {
    state.client = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-not-an-input" } } }) } };
    state.read.mockRejectedValue(new Error("sensitive database detail"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("sensitive database detail");
  });
});
