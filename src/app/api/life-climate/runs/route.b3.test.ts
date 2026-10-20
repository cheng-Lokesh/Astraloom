import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";

const state = vi.hoisted(() => ({
  client: null as unknown,
  service: null as unknown,
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role.server", () => ({ getServiceRoleSupabaseClient: () => state.service }));

import { POST } from "./route";

const ownerId = "22222222-2222-4222-8222-222222222222";
const seedId = "33333333-3333-4333-8333-333333333333";
const submissionKey = "55555555-5555-4555-8555-555555555555";

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("Fixture must be JSON");
  return encoded;
}

const digest = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");

function b3Body() {
  const sourceView = {
    version: "life-climate-b3-source-view-v1",
    scopeKey: createHash("sha256").update(seedId).digest("hex"),
    profile: createEmptyRealityProfileDraft(7),
  };
  const request = {
    version: "life-climate-b3-v1",
    horizon: "3_years",
    periodUnit: "year",
    profileRevision: 7,
    sourceContext: digest(sourceView),
    model: {
      resources: [],
      assumptions: [],
      commonRules: [],
      constraintBindings: [],
      alternatives: [
        { id: "alternative-a", label: "保留当前结构", rules: [] },
        { id: "alternative-b", label: "再评估当前结构", rules: [] },
      ],
    },
    symbolic: { enabled: false },
  };
  return {
    idempotency_key: submissionKey,
    request: {
      ...request,
      confirmation: {
        context: digest(request),
        assumptionIds: [],
        ruleIds: [],
        pathIds: ["baseline", "alternative-a", "alternative-b"],
        reviewedSource: true,
      },
    },
  };
}

describe("Track B B3 protocol admission", () => {
  beforeEach(() => {
    state.rpc.mockReset();
    state.client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: ownerId, is_anonymous: false } }, error: null }) },
      from: vi.fn(),
    };
    state.service = { rpc: state.rpc };
  });

  it("accepts a confirmed B3 wrapper and lets the atomic intent boundary reject a stale source", async () => {
    // This is a valid empty/unknown three-path B3 comparison. A database conflict
    // proves that protocol dispatch reached admission without inventing results.
    state.rpc.mockResolvedValue({ data: null, error: { message: "b3_source_stale" } });
    const body = b3Body();
    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "b3_source_stale" });
    expect(state.rpc).toHaveBeenCalledWith("reserve_life_climate_b3_intent", expect.objectContaining({
      p_user_id: ownerId,
      p_idempotency_key: submissionKey,
      p_request: body.request,
    }));
    expect((state.client as { from: ReturnType<typeof vi.fn> }).from).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("maps the real PostgREST P0001 envelope using its allowlisted message", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "b3_source_stale", details: "private SQL details", hint: "private hint" } });
    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b3Body()),
    }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "b3_source_stale", outcome: "not_registered", idempotency_key: submissionKey, request_digest: digest(b3Body().request) });
  });

  it("sanitizes unknown PostgREST messages, codes, hints and SQL details", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { code: "23505", message: "private table data", details: "private SQL details", hint: "private hint" } });
    const response = await POST(new Request("http://local/api/life-climate/runs", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b3Body()),
    }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error_code: "persistence_failed" });
    expect(JSON.stringify(body)).not.toMatch(/private|23505|details|hint/);
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });

  it.each(["idempotency_conflict", "unauthenticated", "persistence_failed"])("never labels conflict/auth/unknown as not registered: %s", async (code) => {
    state.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: code } });
    const response = await POST(new Request("http://local/api/life-climate/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b3Body()) }));
    expect(await response.json()).not.toHaveProperty("outcome");
  });
});
