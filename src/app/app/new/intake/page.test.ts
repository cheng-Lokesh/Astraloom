import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

import IntakePage from "./page";

describe("formal Intake server authentication boundary", () => {
  beforeEach(() => {
    createSupabaseServerClient.mockReset();
  });

  it("redirects an anonymous server request to login before it can render formal Intake", async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: null } });
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser } });

    await expect(IntakePage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/login;307;",
    });
    expect(createSupabaseServerClient).toHaveBeenCalledOnce();
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("continues to the formal Intake render path for an authenticated server session", async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "authenticated-user" } } });
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser } });

    await expect(IntakePage()).resolves.toBeTruthy();
    expect(createSupabaseServerClient).toHaveBeenCalledOnce();
    expect(getUser).toHaveBeenCalledOnce();
  });
});
