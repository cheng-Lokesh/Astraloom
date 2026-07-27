import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildV1Seed } from "@/test/v1-fixtures";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { GET, POST } from "./route";

const submissionKey = "11111111-1111-4111-8111-111111111111";

function request(body: unknown) {
  return new Request("http://localhost/api/seed-context", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/seed-context", () => {
  const rpc = vi.fn();
  const select = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    select.mockReset();
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      rpc,
      from: vi.fn(() => ({
        select,
      })),
    });
  });

  it("rejects unauthenticated, malformed, and user-id-injected writes before the RPC", async () => {
    createSupabaseServerClient.mockResolvedValueOnce(null);
    expect((await POST(request({}))).status).toBe(503);

    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    expect((await POST(request({}))).status).toBe(401);

    const response = await POST(request({
      draft: buildV1Seed(),
      submissionKey,
      user_id: "someone-else",
    }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("submits only the normalized draft through the atomic database entrypoint", async () => {
    rpc.mockResolvedValue({
      data: [{
        seed_context_id: "seed-a",
        version: "phase2-submitted-v1",
        submitted_at: "2026-07-27T00:00:00.000Z",
        frozen_at: "2026-07-27T00:00:00.000Z",
        idempotent: false,
      }],
      error: null,
    });

    const response = await POST(request({ draft: buildV1Seed(), submissionKey }));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("submit_seed_context_phase2", {
      p_submission_key: submissionKey,
      p_payload: expect.objectContaining({
        trackType: "crossroad",
        timeWindow: "90_days",
        privacyAck: true,
        privacySafetyAck: true,
      }),
    });
    expect(rpc.mock.calls[0]?.[1].p_payload).not.toHaveProperty("user_id");
    expect(await response.json()).toEqual({
      seedContext: {
        id: "seed-a",
        version: "phase2-submitted-v1",
        submittedAt: "2026-07-27T00:00:00.000Z",
        frozenAt: "2026-07-27T00:00:00.000Z",
      },
      idempotent: false,
    });
  });

  it("maps a reused key with different content to a conflict", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "idempotency_key_content_conflict" },
    });

    const response = await POST(request({ draft: buildV1Seed(), submissionKey }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ errorCode: "idempotency_key_content_conflict" });
  });

  it("recovers formal submitted versions without returning a trace identifier", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{
        id: "seed-a",
        version: "phase2-submitted-v1",
        trace_id: "must-not-leave-the-server",
        submitted_at: "2026-07-27T00:00:00.000Z",
        frozen_at: "2026-07-27T00:00:00.000Z",
      }],
      error: null,
    });
    const not = vi.fn(() => ({ not, order }));
    const eq = vi.fn(() => ({ not }));
    select.mockReturnValue({ eq });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(select).toHaveBeenCalledWith("id, version, submitted_at, frozen_at");
    expect(eq).toHaveBeenCalledWith("status", "submitted");
    expect(not).toHaveBeenNthCalledWith(1, "frozen_at", "is", null);
    expect(not).toHaveBeenNthCalledWith(2, "consent_event_id", "is", null);
    expect(await response.json()).toEqual({
      seedContexts: [{
        id: "seed-a",
        version: "phase2-submitted-v1",
        submittedAt: "2026-07-27T00:00:00.000Z",
        frozenAt: "2026-07-27T00:00:00.000Z",
      }],
    });
  });

  it("rejects anonymous recovery and reports retrieval failures without leaking database details", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    expect((await GET()).status).toBe(401);

    const order = vi.fn().mockResolvedValue({ data: null, error: { message: "database detail" } });
    const not = vi.fn(() => ({ not, order }));
    select.mockReturnValue({ eq: vi.fn(() => ({ not })) });
    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ errorCode: "seed_context_recovery_failed" });
  });
});
