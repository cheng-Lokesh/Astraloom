import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  client: null as { auth: { getUser: () => Promise<{ data: { user: null } }> } } | null,
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));

import { GET, PUT } from "./route";

describe("/api/reality-profile", () => {
  beforeEach(() => { state.client = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } }; });

  it("rejects anonymous reads and writes", async () => {
    expect((await GET()).status).toBe(401);
    expect((await PUT(new Request("http://localhost/api/reality-profile", { method: "PUT", body: "{}" }))).status).toBe(401);
  });
});
