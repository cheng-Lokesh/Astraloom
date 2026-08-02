import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { GET } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";
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

function mockCompleteRead(snapshot: unknown, agents: unknown) {
  const agentOrder = vi.fn().mockResolvedValue({ data: agents, error: null });
  const agentSeed = vi.fn(() => ({ order: agentOrder }));
  const agentOwner = vi.fn(() => ({ eq: agentSeed }));
  const agentSnapshot = vi.fn(() => ({ eq: agentOwner }));
  const agentSelect = vi.fn(() => ({ eq: agentSnapshot }));
  const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
  const seedFrozenAt = vi.fn(() => ({ maybeSingle: seedMaybeSingle }));
  const seedSubmittedAt = vi.fn(() => ({ not: seedFrozenAt }));
  const seedStatus = vi.fn(() => ({ not: seedSubmittedAt }));
  const seedScope = vi.fn(() => ({ eq: seedStatus }));
  const seedOwner = vi.fn(() => ({ eq: seedScope }));
  const seedSelect = vi.fn(() => ({ eq: seedOwner }));
  const snapshotMaybeSingle = vi.fn().mockResolvedValue({ data: snapshot, error: null });
  const snapshotLimit = vi.fn(() => ({ maybeSingle: snapshotMaybeSingle }));
  const snapshotOrder = vi.fn(() => ({ limit: snapshotLimit }));
  const snapshotSeed = vi.fn(() => ({ order: snapshotOrder }));
  const snapshotOwner = vi.fn(() => ({ eq: snapshotSeed }));
  const snapshotSelect = vi.fn(() => ({ eq: snapshotOwner }));
  const from = vi.fn((table: string) => {
    if (table === "seed_contexts") return { select: seedSelect };
    if (table === "agent_profile_snapshots") return { select: snapshotSelect };
    return { select: agentSelect };
  });
  createSupabaseServerClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
    from,
  });
}

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
    const from = vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ not: vi.fn(() => ({ not: vi.fn(() => ({ maybeSingle })) })) })) })) })) })),
    }));
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
    const status = vi.fn(() => ({ not: vi.fn(() => ({ not: vi.fn(() => ({ maybeSingle })) })) }));
    const owner = vi.fn(() => ({ eq: status }));
    const id = vi.fn(() => ({ eq: owner }));
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
    expect(owner).toHaveBeenCalledWith("user_id", "owner-a");
    expect(status).toHaveBeenCalledWith("status", "submitted");
  });

  it("returns only the latest immutable snapshot's safe agent projection", async () => {
    const agentOrder = vi.fn().mockResolvedValue({
      data: [{
        ...validAgent,
        writer_version: "phase3-agent-writer-v1",
        field_sources: { display_name: "user_confirmed" },
        trace_id: "private-trace",
        idempotency_key: "private-key",
        request_hash: "private-hash",
      }],
      error: null,
    });
    const agentSeed = vi.fn(() => ({ order: agentOrder }));
    const agentOwner = vi.fn(() => ({ eq: agentSeed }));
    const agentSnapshot = vi.fn(() => ({ eq: agentOwner }));
    const agentSelect = vi.fn(() => ({ eq: agentSnapshot }));
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedStatus = vi.fn(() => ({ not: vi.fn(() => ({ not: vi.fn(() => ({ maybeSingle: seedMaybeSingle })) })) }));
    const seedOwner = vi.fn(() => ({ eq: seedStatus }));
    const seedIdEq = vi.fn(() => ({ eq: seedOwner }));
    const seedSelect = vi.fn(() => ({ eq: seedIdEq }));
    const snapshotMaybeSingle = vi.fn().mockResolvedValue({ data: validSnapshot, error: null });
    const snapshotLimit = vi.fn(() => ({ maybeSingle: snapshotMaybeSingle }));
    const snapshotOrder = vi.fn(() => ({ limit: snapshotLimit }));
    const snapshotSeed = vi.fn(() => ({ order: snapshotOrder }));
    const snapshotOwner = vi.fn(() => ({ eq: snapshotSeed }));
    const snapshotSelect = vi.fn(() => ({ eq: snapshotOwner }));
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
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      snapshot: { id: snapshotId, safety_level: "safe" },
      agents: [{ id: agentId, agent_type: "user_core", display_name: "You" }],
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
    const emptyAgentSeed = vi.fn(() => ({ order: emptyOrder }));
    const emptyAgentOwner = vi.fn(() => ({ eq: emptyAgentSeed }));
    const emptyAgentSnapshot = vi.fn(() => ({ eq: emptyAgentOwner }));
    const emptySelect = vi.fn(() => ({ eq: emptyAgentSnapshot }));
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedSelect = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ not: vi.fn(() => ({ not: vi.fn(() => ({ maybeSingle: seedMaybeSingle })) })) })) })) })) }));
    const snapshotMaybeSingle = vi.fn().mockResolvedValue({ data: validSnapshot, error: null });
    const snapshotLimit = vi.fn(() => ({ maybeSingle: snapshotMaybeSingle }));
    const snapshotOrder = vi.fn(() => ({ limit: snapshotLimit }));
    const snapshotSeed = vi.fn(() => ({ order: snapshotOrder }));
    const snapshotOwner = vi.fn(() => ({ eq: snapshotSeed }));
    const snapshotSelect = vi.fn(() => ({ eq: snapshotOwner }));
    const from = vi.fn((table: string) => {
      if (table === "seed_contexts") return { select: seedSelect };
      if (table === "agent_profile_snapshots") return { select: snapshotSelect };
      return { select: emptySelect };
    });
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    const response = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error_code: "persistence_failed" });
  });

  it("fails closed for malformed persisted safety projections without echoing private values", async () => {
    const withoutSource = { ...validAgent };
    delete (withoutSource as Partial<typeof validAgent>).source;
    const withoutVersion = { ...validSnapshot };
    delete (withoutVersion as Partial<typeof validSnapshot>).version;
    const userVariant = { ...validAgent, id: "55555555-5555-4555-8555-555555555555", agent_type: "user_variant" };
    const secondUserCore = { ...validAgent, id: "66666666-6666-4666-8666-666666666666" };
    const secondVariant = { ...validAgent, id: "77777777-7777-4777-8777-777777777777", agent_type: "user_variant" };
    const thirdVariant = { ...validAgent, id: "88888888-8888-4888-8888-888888888888", agent_type: "user_variant" };
    const confirmedPersonId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const firstNpc = { ...validAgent, id: "99999999-9999-4999-8999-999999999999", key_person_id: confirmedPersonId, agent_type: "npc", source: "confirmed_person_snapshot" };
    const secondNpc = { ...firstNpc, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
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
      { snapshot: validSnapshot, agents: [] },
      { snapshot: validSnapshot, agents: [userVariant] },
      { snapshot: validSnapshot, agents: [validAgent, secondUserCore] },
      { snapshot: validSnapshot, agents: [validAgent, userVariant, secondVariant, thirdVariant] },
      { snapshot: validSnapshot, agents: [validAgent, firstNpc, secondNpc] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, source: "private_raw_source" }] },
      { snapshot: validSnapshot, agents: [{ ...validAgent, evidence_refs: ["private raw user context must not leak"] }] },
    ];

    for (const fixture of cases) {
      mockCompleteRead(fixture.snapshot, fixture.agents);
      const response = await GET(new Request(`http://localhost/api/agents?seed_id=${seedId}`));
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body).toMatchObject({ ok: false, error_code: "persistence_failed" });
      expect(JSON.stringify(body)).not.toContain("private_detail");
      expect(JSON.stringify(body)).not.toContain("private nested raw context");
      expect(JSON.stringify(body)).not.toContain("private_raw_source");
      expect(JSON.stringify(body)).not.toContain("private raw user context must not leak");
    }
  });

  it("binds the safe Agent projection to the latest immutable parent for the authenticated owner and seed", async () => {
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedFrozenAt = vi.fn(() => ({ maybeSingle: seedMaybeSingle }));
    const seedSubmittedAt = vi.fn(() => ({ not: seedFrozenAt }));
    const seedStatus = vi.fn(() => ({ not: seedSubmittedAt }));
    const seedScope = vi.fn(() => ({ eq: seedStatus }));
    const seedOwner = vi.fn(() => ({ eq: seedScope }));
    const seedSelect = vi.fn(() => ({ eq: seedOwner }));
    const latestSnapshotId = "55555555-5555-4555-8555-555555555555";
    const snapshotMaybeSingle = vi.fn().mockResolvedValue({ data: { ...validSnapshot, id: latestSnapshotId, safety_level: "caution" }, error: null });
    const snapshotLimit = vi.fn(() => ({ maybeSingle: snapshotMaybeSingle }));
    const snapshotOrder = vi.fn(() => ({ limit: snapshotLimit }));
    const snapshotSeed = vi.fn(() => ({ order: snapshotOrder }));
    const snapshotOwner = vi.fn(() => ({ eq: snapshotSeed }));
    const snapshotSelect = vi.fn(() => ({ eq: snapshotOwner }));
    const agentOrder = vi.fn().mockResolvedValue({ data: [{ ...validAgent, id: "66666666-6666-4666-8666-666666666666", snapshot_id: latestSnapshotId, safety_level: "caution" }], error: null });
    const agentSeed = vi.fn(() => ({ order: agentOrder }));
    const agentOwner = vi.fn(() => ({ eq: agentSeed }));
    const agentSnapshot = vi.fn(() => ({ eq: agentOwner }));
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
    expect(seedOwner).toHaveBeenCalledWith("id", seedId);
    expect(seedScope).toHaveBeenCalledWith("user_id", "owner-a");
    expect(seedStatus).toHaveBeenCalledWith("status", "submitted");
    expect(seedSubmittedAt).toHaveBeenCalledWith("submitted_at", "is", null);
    expect(seedFrozenAt).toHaveBeenCalledWith("frozen_at", "is", null);
    expect(from).toHaveBeenNthCalledWith(3, "agent_profiles");
    expect(agentSnapshot).toHaveBeenCalledWith("snapshot_id", latestSnapshotId);
    expect(agentOwner).toHaveBeenCalledWith("user_id", "owner-a");
    expect(agentSeed).toHaveBeenCalledWith("seed_context_id", seedId);
  });
});
