import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  const exchangeCodeForSession = vi.fn();
  const getUser = vi.fn();

  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    getUser.mockReset();
    createSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession, getUser },
    });
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "authenticated-user" } }, error: null });
  });

  it("redirects missing authorization codes to the canonical login origin", async () => {
    const response = await GET(new Request("http://localhost:3000/auth/callback?next=/app/new/intake"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=missing_auth_code");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("does not disclose exchange failures and refuses a protocol-relative next destination", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "provider error detail" } });

    const response = await GET(new Request("http://localhost:3000/auth/callback?code=pkce-code&next=//example.invalid"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth_exchange_failed");
  });

  it("exchanges the code, confirms the restored server session, and redirects only to a safe next path", async () => {
    const response = await GET(new Request("http://localhost:3000/auth/callback?code=pkce-code&next=/app/new/intake"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/new/intake");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rejects external next destinations after a successful exchange", async () => {
    const response = await GET(new Request("http://localhost:3000/auth/callback?code=pkce-code&next=https://example.invalid"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/app/new/intake");
  });
});
