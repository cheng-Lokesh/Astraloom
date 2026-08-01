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
  return new Request("http://localhost/api/agents/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agents/generate", () => {
  const rpc = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      rpc,
      from,
    });
  });

  it("requires authentication before accepting the selector", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const response = await POST(request({
      selector: { seed_id: seedId },
      idempotency_key: idempotencyKey,
      include_parallel_selves: true,
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "unauthenticated" });
  });

  it("accepts only selector, UUID idempotency key, and the narrow parallel-self option", async () => {
    const response = await POST(request({
      selector: { seed_id: seedId },
      idempotency_key: idempotencyKey,
      include_parallel_selves: true,
      user_id: "forbidden",
      seedContext: { raw_context: "forbidden" },
      confirmedPeople: [{ id: "forbidden" }],
      safetyResult: { safetyLevel: "safe" },
      trace_id: "forbidden",
      version: "forbidden",
    }));

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("passes only trusted selectors to the single controlled writer", async () => {
    rpc.mockResolvedValue({
      data: [{
        idempotent: false,
        snapshot: { id: "snapshot-a", version: "phase3-agent-snapshot-v1", safety_level: "safe" },
        agents: [{ id: "agent-a", agent_type: "user_core", display_name: "You", confidence: 58 }],
      }],
      error: null,
    });

    const response = await POST(request({
      selector: { seed_id: seedId },
      idempotency_key: idempotencyKey,
      include_parallel_selves: true,
    }));

    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("generate_agent_snapshot_phase3", {
      p_seed_context_id: seedId,
      p_idempotency_key: idempotencyKey,
      p_include_parallel_selves: true,
    });
    expect(from).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      ok: true,
      source: "controlled_snapshot",
      snapshot: { id: "snapshot-a", safety_level: "safe" },
      agents: [{ id: "agent-a", agent_type: "user_core" }],
    });
  });

  it("maps controlled writer errors to stable safe HTTP results", async () => {
    const payload = { selector: { seed_id: seedId }, idempotency_key: idempotencyKey };
    rpc.mockResolvedValueOnce({ data: null, error: { message: "seed_not_found" } });
    expect((await POST(request(payload))).status).toBe(404);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "safety_blocked" } });
    expect((await POST(request(payload))).status).toBe(409);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "safety_downgraded" } });
    expect((await POST(request(payload))).status).toBe(201);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "idempotency_key_content_conflict" } });
    const conflict = await POST(request(payload));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error_code: "idempotency_key_content_conflict" });
  });
});
