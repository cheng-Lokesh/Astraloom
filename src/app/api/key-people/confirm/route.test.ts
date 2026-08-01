import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { POST } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";
const personA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const personB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const key = "22222222-2222-4222-8222-222222222222";

function request(operations: unknown, extra: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/key-people/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ selector: { seed_id: seedId }, idempotency_key: key, operations, ...extra }),
  });
}

describe("POST /api/key-people/confirm", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      rpc,
    });
  });

  it("rejects anonymous and malformed batch requests before calling the database", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } });
    expect((await POST(request([{ type: "confirm", person_id: personA }]))).status).toBe(401);

    const invalid = await POST(request([{ type: "confirm", person_id: personA, evidence_refs: ["injected"] }], { user_id: "other-user" }));
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error_code: "invalid_request" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    [{ type: "confirm", person_id: personA }],
    [{ type: "rename", person_id: personA, display_name: "Renamed manager" }],
    [{ type: "delete", person_id: personA }],
    [{ type: "merge", source_person_id: personA, target_person_id: personB }],
    [{ type: "supplement", display_name: "Sponsor", relationship_to_user: "advisor", role_type: "support", note: "Named by the user." }],
  ])("accepts the %o operation and forwards only its canonical form to the atomic RPC", async (operation) => {
    rpc.mockResolvedValue({ data: [{ idempotent: false, people: [] }], error: null });

    const response = await POST(request([operation]));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("mutate_key_people_phase3", {
      p_seed_context_id: seedId,
      p_idempotency_key: key,
      p_operations: [operation],
    });
  });

  it("maps transition, ownership, idempotency conflict, and transaction failures without leaking database details", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "invalid_people_transition" } });
    expect((await POST(request([{ type: "confirm", person_id: personA }]))).status).toBe(409);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "seed_not_found" } });
    expect((await POST(request([{ type: "confirm", person_id: personA }]))).status).toBe(404);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "idempotency_key_content_conflict" } });
    expect((await POST(request([{ type: "confirm", person_id: personA }]))).status).toBe(409);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "unexpected database detail" } });
    const response = await POST(request([{ type: "confirm", person_id: personA }]));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "persistence_failed" });
  });
});
