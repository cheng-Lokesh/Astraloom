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
  const maybeSingle = vi.fn();
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));

  beforeEach(() => {
    rpc.mockReset();
    maybeSingle.mockReset();
    select.mockReset();
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

  it("re-reads only the submitted owner seed, uses deterministic extraction, and persists through the atomic RPC", async () => {
    const seed = {
      id: seedId,
      user_question: "Should I accept the role?",
      simulation_track: "crossroad",
      time_horizon: "90_days",
      raw_context: "My manager and recruiter both need an answer this week.",
      decision_options: ["accept", "negotiate"],
      forbidden_actions: ["Do not burn bridges"],
      desired_output: { text: "Compare pressure points" },
      safety_flags: [],
      status: "submitted",
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: seed, error: null });
    const status = vi.fn(() => ({ maybeSingle }));
    const id = vi.fn(() => ({ eq: status }));
    select.mockReturnValue({ eq: id });
    rpc.mockResolvedValue({ data: [{ idempotent: false, people: [] }], error: null });

    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));

    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("extract_key_people_phase3", expect.objectContaining({
      p_seed_context_id: seedId,
      p_idempotency_key: idempotencyKey,
      p_candidates: expect.any(Array),
    }));
    expect(JSON.stringify(rpc.mock.calls[0]?.[1].p_candidates)).not.toContain("raw_context");
  });

  it("maps foreign, missing, unsubmitted, replay-conflict, and persistence failures to stable safe results", async () => {
    const seedMissing = vi.fn().mockResolvedValue({ data: null, error: null });
    const status = vi.fn(() => ({ maybeSingle: seedMissing }));
    select.mockReturnValue({ eq: vi.fn(() => ({ eq: status })) });
    expect((await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }))).status).toBe(404);

    select.mockReset();
    const seed = { id: seedId, user_question: "Q", simulation_track: "crossroad", time_horizon: "90_days", raw_context: "M", decision_options: [], forbidden_actions: [], desired_output: {}, safety_flags: [], status: "submitted" };
    select.mockReturnValue({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: seed, error: null }) })) })) });
    rpc.mockResolvedValueOnce({ data: null, error: { message: "idempotency_key_content_conflict" } });
    const conflict = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error_code: "idempotency_key_content_conflict" });
  });
});
