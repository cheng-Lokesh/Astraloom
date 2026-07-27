import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClient } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("@/lib/env", () => ({
  appConfig: { supabaseUrl: "http://localhost:54321", supabaseAnonKey: "public-test-key" },
  isSupabaseConfigured: () => true,
}));

import { updateSupabaseSession } from "./proxy";

describe("Supabase session proxy", () => {
  it("revalidates session claims and copies refreshed cookies to the response without redirecting", async () => {
    const getClaims = vi.fn().mockResolvedValue({ data: { claims: { sub: "authenticated-user" } } });
    createServerClient.mockImplementation((_url, _key, options) => {
      options.cookies.setAll([{ name: "sb-local-auth-token", value: "rotated", options: { httpOnly: true, path: "/" } }]);
      return { auth: { getClaims } };
    });

    const response = await updateSupabaseSession(new NextRequest("http://localhost:3000/app/new/intake"));

    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.getSetCookie()).toHaveLength(1);
  });
});
