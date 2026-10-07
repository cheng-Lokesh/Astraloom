import path from "node:path";
import { existsSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPlanningContextSchema } from "@/lib/formal-planning/contracts";
import { createFormalSandboxClient } from "./client";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), create: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.create }));
const graph = "00000000-0000-4000-8000-000000000001";
const owner = "00000000-0000-4000-8000-000000000002";
const context = defaultPlanningContextSchema.parse({ version: "formal-default-planner-v1", consentContext: "a".repeat(64), profileRevision: 3,
  resources: [{ resourceKey: "resource-1", label: "时间", unit: "小时", available: 12, minimum: 2, declaredRate: null, explicitRulePresent: false }],
  symbolicFusion: { status: "eligible", classification: "hypothesis", relationshipEffect: "not_implemented" },
});
async function route(request: Request): Promise<Response> {
  const file = path.join(process.cwd(), "src/app/api/sandbox/planning-context/route.ts");
  // A new endpoint has a real not-found transport result until its handler exists.
  if (!existsSync(file)) return Response.json({ ok: false, error_code: "route_not_found", trace_id: "safe" }, { status: 404 });
  const routeExports = await import(file) as { GET: (request: Request) => Promise<Response> };
  return routeExports.GET(request);
}
const request = (query = "") => new Request(`https://example.test/api/sandbox/planning-context${query}`);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc });
  mocks.getUser.mockResolvedValue({ data: { user: { id: owner, is_anonymous: false } }, error: null });
  mocks.rpc.mockResolvedValue({ data: context, error: null });
});

describe("session-bound read-only planning context transport", () => {
  it("returns the real strict safe RPC context through the endpoint and current client", async () => {
    const client = createFormalSandboxClient(async (input, init) => route(new Request(`https://example.test${String(input)}`, init)));
    const result = await client.planningContext(graph);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(JSON.stringify(result.data.context) === JSON.stringify(context)).toBe(true);
    expect(mocks.getUser.mock.calls.length).toBe(1);
    expect(mocks.rpc.mock.calls.length).toBe(1);
    expect(mocks.rpc.mock.calls[0][0] === "read_formal_default_planning_context_v1").toBe(true);
    expect(JSON.stringify(mocks.rpc.mock.calls[0][1]) === JSON.stringify({ p_graph_snapshot_id: graph })).toBe(true);
    expect(/ownerId|seedContextId|sourceRefs|snapshotId|birthDate|birthTime/.test(JSON.stringify(result.data.context))).toBe(false);
  });
  it("uses null Graph selection and no-store without allowing a client owner", async () => {
    const response = await route(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(mocks.rpc.mock.calls[0]?.[1]) === JSON.stringify({ p_graph_snapshot_id: null })).toBe(true);
  });
  it("rejects unverified or anonymous sessions before any RPC", async () => {
    for (const user of [null, { id: owner, is_anonymous: true }]) {
      mocks.getUser.mockResolvedValue({ data: { user }, error: null });
      const response = await route(request());
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    mocks.getUser.mockResolvedValue({ data: { user: { id: owner, is_anonymous: false } }, error: { message: "synthetic rejected token" } });
    expect((await route(request())).status).toBe(401);
    mocks.create.mockResolvedValue(null);
    expect((await route(request())).status).toBe(401);
    expect(mocks.rpc.mock.calls.length).toBe(0);
  });
  it("rejects duplicate, unknown, empty and malformed Graph queries before RPC", async () => {
    for (const query of ["?graph_id=", "?graph_id=invalid", `?graph_id=${graph}&graph_id=${graph}`, "?owner=other", `?graph_id=${graph}&extra=1`]) {
      const response = await route(request(query));
      expect(response.status).toBe(422);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(mocks.rpc.mock.calls.length).toBe(0);
  });
  it("allowlists RPC business errors and sanitizes every other failure", async () => {
    for (const [message, status] of [["unauthenticated", 401], ["graph_not_found", 404], ["current_graph_required", 409], ["synthetic private persistence detail", 500]] as const) {
      mocks.rpc.mockResolvedValue({ data: null, error: { message, details: owner } });
      const response = await route(request());
      const body = await response.json();
      expect(response.status).toBe(status);
      expect(body.error_code).toBe(status === 500 ? "persistence_failed" : message);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(JSON.stringify(body).includes(owner)).toBe(false);
    }
    mocks.getUser.mockRejectedValue(new Error("synthetic private auth detail"));
    const response = await route(request());
    expect(response.status).toBe(500);
    expect((await response.json()).error_code).toBe("persistence_failed");
  });
  it("rejects array, missing, private or unsafe scalar RPC data instead of stripping it", async () => {
    for (const data of [[context], null, { ...context, ownerId: owner }, { ...context, sourceRefs: ["private"] }, { ...context, resources: [{ ...context.resources[0], label: owner }] }]) {
      mocks.rpc.mockResolvedValue({ data, error: null });
      const response = await route(request());
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error_code).toBe("persistence_failed");
      expect(JSON.stringify(body).includes(owner)).toBe(false);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  });
});
