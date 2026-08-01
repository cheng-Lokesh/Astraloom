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
const snapshotId = "33333333-3333-4333-8333-333333333333";
const agentId = "44444444-4444-4444-8444-444444444444";
const validSnapshot = {
  id: snapshotId,
  version: "phase3-agent-snapshot-v1",
  safety_level: "safe",
  error_code: null,
};
const validAgent = {
  id: agentId,
  snapshot_id: snapshotId,
  key_person_id: null,
  version: "phase3-agent-snapshot-v1",
  agent_type: "user_core",
  display_name: "You",
  relationship_to_user: "self",
  source: "conservative_snapshot",
  confidence: 58,
  evidence_refs: ["seed:submitted"],
  safety_level: "safe",
};

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

  it("rejects malformed JSON, an invalid content type, and unknown nested selector keys", async () => {
    const malformed = new Request("http://localhost/api/agents/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    expect((await POST(malformed)).status).toBe(400);

    const nonJson = new Request("http://localhost/api/agents/generate", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }),
    });
    expect((await POST(nonJson)).status).toBe(400);

    const nestedUnknown = await POST(request({
      selector: { seed_id: seedId, user_id: "forbidden" },
      idempotency_key: idempotencyKey,
    }));
    expect(nestedUnknown.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects JSON lookalike and empty MIME types before reaching the writer", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    for (const contentType of ["application/jsonp", "application/jsonx", ""]) {
      const response = await POST(new Request("http://localhost/api/agents/generate", {
        method: "POST",
        headers: contentType ? { "content-type": contentType } : {},
        body: JSON.stringify({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }),
      }));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ ok: false, error_code: "invalid_request" });
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects missing, invalid, null, and non-boolean narrow inputs without reaching the writer", async () => {
    const cases = [
      {},
      { selector: { seed_id: "not-a-uuid" }, idempotency_key: idempotencyKey },
      { selector: { seed_id: seedId }, idempotency_key: "not-a-uuid" },
      { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, include_parallel_selves: null },
      { selector: { seed_id: seedId }, idempotency_key: idempotencyKey, include_parallel_selves: "true" },
      { selector: null, idempotency_key: idempotencyKey },
    ];

    for (const payload of cases) {
      expect((await POST(request(payload))).status).toBe(400);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("passes only trusted selectors to the single controlled writer", async () => {
    rpc.mockResolvedValue({
      data: [{
        idempotent: false,
        snapshot: validSnapshot,
        agents: [validAgent],
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
      snapshot: { id: snapshotId, safety_level: "safe" },
      agents: [{ id: agentId, agent_type: "user_core" }],
    });
  });

  it("maps controlled writer errors to stable safe HTTP results", async () => {
    const payload = { selector: { seed_id: seedId }, idempotency_key: idempotencyKey };
    rpc.mockResolvedValueOnce({ data: null, error: { message: "seed_not_found" } });
    expect((await POST(request(payload))).status).toBe(404);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "safety_blocked" } });
    expect((await POST(request(payload))).status).toBe(409);

    rpc.mockResolvedValueOnce({ data: null, error: { message: "idempotency_key_content_conflict" } });
    const conflict = await POST(request(payload));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error_code: "idempotency_key_content_conflict" });

    rpc.mockResolvedValueOnce({ data: null, error: { message: "private detail", details: "private detail" } });
    const hidden = await POST(request(payload));
    expect(hidden.status).toBe(500);
    expect(JSON.stringify(await hidden.json())).not.toContain("private detail");

    rpc.mockResolvedValueOnce({ data: [], error: null });
    expect((await POST(request(payload))).status).toBe(500);
  });

  it("returns a downgraded snapshot only from the controlled writer and never exposes provenance", async () => {
    rpc.mockResolvedValue({ data: [{
      idempotent: false,
      snapshot: { ...validSnapshot, id: "55555555-5555-4555-8555-555555555555", safety_level: "downgraded", error_code: "safety_downgraded", trace_id: "private" },
      agents: [{ ...validAgent, id: "66666666-6666-4666-8666-666666666666", snapshot_id: "55555555-5555-4555-8555-555555555555", safety_level: "downgraded", field_sources: { private: true }, trace_id: "private" }],
    }], error: null });

    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body).toMatchObject({ snapshot: { safety_level: "downgraded", error_code: "safety_downgraded" }, agents: [{ agent_type: "user_core" }] });
    expect(JSON.stringify(body)).not.toContain("private");
    expect(JSON.stringify(body)).not.toContain("field_sources");
  });

  it("redacts forged raw Seed, provenance, and receipt fields even when an RPC response is malformedly verbose", async () => {
    rpc.mockResolvedValue({ data: [{
      idempotent: false,
      snapshot: { ...validSnapshot, raw_context: "do not expose", trace_id: "private-trace" },
      agents: [{ ...validAgent, field_sources: { private: true }, request_hash: "private-hash" }],
      receipt: { idempotency_key: idempotencyKey, raw_context: "do not expose" },
    }], error: null });

    const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
    const text = JSON.stringify(await response.json());
    expect(response.status).toBe(201);
    expect(text).not.toContain("do not expose");
    expect(text).not.toContain("private-trace");
    expect(text).not.toContain("private-hash");
    expect(text).not.toContain("receipt");
  });

  it("fails closed for malformed controlled-writer safety projections without exposing private values", async () => {
    const withoutSource = { ...validAgent };
    delete (withoutSource as Partial<typeof validAgent>).source;
    const withoutVersion = { ...validSnapshot };
    delete (withoutVersion as Partial<typeof validSnapshot>).version;
    const cases = [
      { snapshot: { ...validSnapshot, id: "not-a-uuid" }, agents: [validAgent] },
      { snapshot: { ...validSnapshot, version: "legacy-writer" }, agents: [validAgent] },
      { snapshot: withoutVersion, agents: [validAgent] },
      { snapshot: { ...validSnapshot, error_code: "private_detail" }, agents: [validAgent] },
      { snapshot: { ...validSnapshot, error_code: "safety_downgraded" }, agents: [validAgent] },
      { snapshot: { ...validSnapshot, safety_level: "downgraded" }, agents: [{ ...validAgent, safety_level: "downgraded" }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, id: "not-a-uuid" }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, snapshot_id: "not-a-uuid" }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, snapshot_id: "77777777-7777-4777-8777-777777777777" }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, key_person_id: "not-a-uuid" }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, safety_level: "downgraded" }] },
      { snapshot: validSnapshot, agents: [withoutSource] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, confidence: 101 }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, confidence: 58.5 }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, evidence_refs: [] }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, evidence_refs: [{ raw_context: "private nested raw context" }] }] },
    ];

    for (const row of cases) {
      rpc.mockResolvedValueOnce({ data: [{ idempotent: false, ...row }], error: null });
      const response = await POST(request({ selector: { seed_id: seedId }, idempotency_key: idempotencyKey }));
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body).toMatchObject({ ok: false, error_code: "persistence_failed" });
      expect(JSON.stringify(body)).not.toContain("private_detail");
      expect(JSON.stringify(body)).not.toContain("private nested raw context");
    }
  });

  it("keeps a successful replay stable and rejects malformed controlled-writer payloads", async () => {
    rpc.mockResolvedValueOnce({ data: [{
      idempotent: true,
      snapshot: validSnapshot,
      agents: [validAgent],
    }], error: null });

    const replay = await POST(request({
      selector: { seed_id: seedId },
      idempotency_key: idempotencyKey,
      include_parallel_selves: false,
    }));
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({
      ok: true,
      idempotent: true,
      snapshot: { id: snapshotId },
      agents: [{ id: agentId, agent_type: "user_core" }],
    });

    rpc.mockResolvedValueOnce({ data: [{ idempotent: false, snapshot: null, agents: [] }], error: null });
    const malformed = await POST(request({
      selector: { seed_id: seedId },
      idempotency_key: "33333333-3333-4333-8333-333333333333",
    }));
    expect(malformed.status).toBe(500);
    expect(await malformed.json()).toMatchObject({ ok: false, error_code: "persistence_failed" });
  });
});
