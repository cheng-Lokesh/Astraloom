import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));
vi.mock("server-only", () => ({}));

import { POST } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";
const idempotencyKey = "22222222-2222-4222-8222-222222222222";

function request(body: unknown) {
  return new Request("http://localhost/api/key-people/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/key-people/extract", () => {
  const rpc = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    from.mockClear();
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
      rpc,
    });
  });

  it("requires authentication before accepting the selector", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "unauthenticated" });
  });

  it("accepts only a selector and idempotency key, refusing raw-seed and people injection", async () => {
    const invalid = await POST(request({
      selector: { seed_id: seedId },
      idempotency_key: idempotencyKey,
      seed_context: { raw_context: "do not accept client seed text" },
      people: [{ display_name: "Injected" }],
      user_id: "other-user",
    }));

    expect(invalid.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps unavailable persistence and invalid input safely", async () => {
    createSupabaseServerClient.mockResolvedValueOnce(null);
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);

    expect((await POST(request({ selector: { seed_id: "not-a-uuid" }, idempotency_key: idempotencyKey }))).status).toBe(400);
  });

  it("passes only the selector to the database-controlled extractor", async () => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, people: [] }], error: null });

    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));

    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("extract_key_people_phase3", {
      p_seed_context_id: seedId,
      p_idempotency_key: idempotencyKey,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("maps foreign, missing, unsubmitted, replay-conflict, and persistence failures to stable safe results", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "seed_not_found" } });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(404);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "idempotency_key_content_conflict" } });
    const conflict = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error_code: "idempotency_key_content_conflict" });

    rpc.mockResolvedValueOnce({ data: null, error: { message: "key_people_invalid" } });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(400);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "seed_not_found" } });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(404);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "private detail" } });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);

    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(500);
  });
});
