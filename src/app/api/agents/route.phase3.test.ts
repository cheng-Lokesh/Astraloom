import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { GET } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";

describe("GET /api/agents", () => {
  beforeEach(() => {
    createSupabaseServerClient.mockReset();
  });

  it("requires a current authenticated session without disclosing a seed", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const response = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      ok: false,
      error_code: "unauthenticated",
    });
  });

  it("rejects malformed, duplicate, unknown, and non-UUID selectors after authenticating", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
    });

    for (const suffix of ["", "?seed_id=not-a-uuid", `?seed_id=${seedId}&seed_id=${seedId}`, `?seed_id=${seedId}&extra=forbidden`]) {
      const response = await GET(new Request(`http://localhost/api/agents${suffix}`));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ ok: false, error_code: "invalid_request" });
    }
  });

  it("hides authentication lookup and persistence details", async () => {
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "private auth detail" } }) },
    });
    const authError = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));
    expect(authError.status).toBe(401);
    expect(JSON.stringify(await authError.json())).not.toContain("private auth detail");

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "private database detail" } });
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) })) }));
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });
    const persistenceError = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));
    expect(persistenceError.status).toBe(500);
    expect(JSON.stringify(await persistenceError.json())).not.toContain("private database detail");
  });

  it("returns the same not-found result for missing, foreign, draft, and unsubmitted seeds", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const status = vi.fn(() => ({ maybeSingle }));
    const id = vi.fn(() => ({ eq: status }));
    const select = vi.fn(() => ({ eq: id }));
    const from = vi.fn(() => ({ select }));
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    const response = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "seed_not_found" });
    expect(select).toHaveBeenCalledWith("id");
    expect(status).toHaveBeenCalledWith("status", "submitted");
  });

  it("returns only the latest immutable snapshot's safe agent projection", async () => {
    const agentOrder = vi.fn().mockResolvedValue({
      data: [{
        id: "agent-a",
        snapshot_id: "snapshot-a",
        key_person_id: null,
        version: "phase3-agent-snapshot-v1",
        agent_type: "user_core",
        display_name: "You",
        relationship_to_user: "self",
        source: "conservative_snapshot",
        confidence: 58,
        evidence_refs: ["seed:confirmed"],
        safety_level: "safe",
        writer_version: "phase3-agent-writer-v1",
        field_sources: { display_name: "user_confirmed" },
        trace_id: "private-trace",
        idempotency_key: "private-key",
        request_hash: "private-hash",
      }],
      error: null,
    });
    const agentEq = vi.fn(() => ({ order: agentOrder }));
    const agentSelect = vi.fn(() => ({ eq: agentEq }));
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedStatus = vi.fn(() => ({ maybeSingle: seedMaybeSingle }));
    const seedIdEq = vi.fn(() => ({ eq: seedStatus }));
    const seedSelect = vi.fn(() => ({ eq: seedIdEq }));
    const from = vi.fn((table: string) =>
      table === "seed_contexts" ? { select: seedSelect } : { select: agentSelect },
    );
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    const response = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      snapshot: { id: "snapshot-a", safety_level: "safe" },
      agents: [{ id: "agent-a", agent_type: "user_core", display_name: "You" }],
    });
    expect(JSON.stringify(body)).not.toContain("private-trace");
    expect(JSON.stringify(body)).not.toContain("private-key");
    expect(JSON.stringify(body)).not.toContain("private-hash");
    expect(JSON.stringify(body)).not.toContain("field_sources");
    expect(agentSelect).toHaveBeenCalledWith(
      "id,snapshot_id,key_person_id,version,agent_type,display_name,relationship_to_user,source,confidence,evidence_refs,safety_level",
    );
  });

  it("maps empty or malformed Agent persistence results to a safe failure", async () => {
    const emptyOrder = vi.fn().mockResolvedValue({ data: null, error: null });
    const emptySelect = vi.fn(() => ({ eq: vi.fn(() => ({ order: emptyOrder })) }));
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedSelect = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: seedMaybeSingle })) })) }));
    const from = vi.fn((table: string) => table === "seed_contexts" ? { select: seedSelect } : { select: emptySelect });
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    const response = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error_code: "persistence_failed" });
  });

  it("binds the safe Agent projection to the latest immutable parent for the authenticated owner and seed", async () => {
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedStatus = vi.fn(() => ({ maybeSingle: seedMaybeSingle }));
    const seedOwner = vi.fn(() => ({ eq: seedStatus }));
    const seedSelect = vi.fn(() => ({ eq: seedOwner }));
    const snapshotMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "snapshot-latest", safety_level: "caution", error_code: null }, error: null });
    const snapshotLimit = vi.fn(() => ({ maybeSingle: snapshotMaybeSingle }));
    const snapshotOrder = vi.fn(() => ({ limit: snapshotLimit }));
    const snapshotSeed = vi.fn(() => ({ order: snapshotOrder }));
    const snapshotOwner = vi.fn(() => ({ eq: snapshotSeed }));
    const snapshotSelect = vi.fn(() => ({ eq: snapshotOwner }));
    const agentOrder = vi.fn().mockResolvedValue({ data: [{ id: "agent-latest", snapshot_id: "snapshot-latest", agent_type: "user_core", display_name: "You", relationship_to_user: "self", source: "conservative_snapshot", confidence: 58, evidence_refs: ["seed:submitted"], safety_level: "caution" }], error: null });
    const agentSnapshot = vi.fn(() => ({ order: agentOrder }));
    const agentSelect = vi.fn(() => ({ eq: agentSnapshot }));
    const from = vi.fn((table: string) => {
      if (table === "seed_contexts") return { select: seedSelect };
      if (table === "agent_profile_snapshots") return { select: snapshotSelect };
      return { select: agentSelect };
    });
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    const response = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));
    expect(response.status).toBe(200);
    expect(from).toHaveBeenNthCalledWith(1, "seed_contexts");
    expect(from).toHaveBeenNthCalledWith(2, "agent_profile_snapshots");
    expect(snapshotSelect).toHaveBeenCalledWith("id,version,safety_level,error_code");
    expect(snapshotOwner).toHaveBeenCalledWith("user_id", "owner-a");
    expect(snapshotSeed).toHaveBeenCalledWith("seed_context_id", seedId);
    expect(snapshotOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(snapshotLimit).toHaveBeenCalledWith(1);
    expect(from).toHaveBeenNthCalledWith(3, "agent_profiles");
    expect(agentSnapshot).toHaveBeenCalledWith("snapshot_id", "snapshot-latest");
  });
});
