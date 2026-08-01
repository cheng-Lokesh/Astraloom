import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { GET } from "./route";

const seedId = "11111111-1111-4111-8111-111111111111";

describe("GET /api/key-people", () => {
  beforeEach(() => {
    createSupabaseServerClient.mockReset();
  });

  it("requires a current authenticated session without disclosing a seed", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const response = await GET(new Request(`http://localhost/api/key-people?seed_id=${seedId}`));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      ok: false,
      error_code: "unauthenticated",
    });
  });

  it("maps unavailable persistence, invalid selectors, and read failures to safe errors", async () => {
    createSupabaseServerClient.mockResolvedValueOnce(null);
    expect((await GET(new Request(`http://localhost/api/key-people?seed_id=${seedId}`))).status).toBe(500);

    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
    });
    expect((await GET(new Request("http://localhost/api/key-people?seed_id=not-a-uuid"))).status).toBe(400);

    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "private detail" } });
    const seedStatus = vi.fn(() => ({ maybeSingle: seedMaybeSingle }));
    const seedIdEq = vi.fn(() => ({ eq: seedStatus }));
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq: seedIdEq })) }));
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });
    expect((await GET(new Request(`http://localhost/api/key-people?seed_id=${seedId}`))).status).toBe(500);
  });

  it("returns the same not-found result for foreign and missing submitted seeds", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const status = vi.fn(() => ({ maybeSingle }));
    const id = vi.fn(() => ({ eq: status }));
    const select = vi.fn(() => ({ eq: id }));
    const from = vi.fn(() => ({ select }));
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    const response = await GET(new Request(`http://localhost/api/key-people?seed_id=${seedId}`));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, error_code: "seed_not_found" });
    expect(select).toHaveBeenCalledWith("id");
    expect(status).toHaveBeenCalledWith("status", "submitted");
  });

  it("returns only safe persisted fields for the current owner's submitted seed", async () => {
    const peopleOrder = vi.fn().mockResolvedValue({
      data: [{
        id: "person-a",
        display_name: "Manager",
        relationship_to_user: "boss",
        role_type: "authority",
        confidence: 78,
        known_evidence: ["Named in the submitted context"],
        missing_fields: ["Recent commitment"],
        status: "candidate",
        merged_into_id: null,
        evidence_refs: ["seed:opaque"],
        version: "phase3-key-person-v1",
        trace_id: "must-not-be-returned",
      }],
      error: null,
    });
    const peopleEq = vi.fn(() => ({ order: peopleOrder }));
    const peopleSelect = vi.fn(() => ({ eq: peopleEq }));
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedStatus = vi.fn(() => ({ maybeSingle: seedMaybeSingle }));
    const seedIdEq = vi.fn(() => ({ eq: seedStatus }));
    const seedSelect = vi.fn(() => ({ eq: seedIdEq }));
    const from = vi.fn((table: string) =>
      table === "seed_contexts" ? { select: seedSelect } : { select: peopleSelect },
    );
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    const response = await GET(new Request(`http://localhost/api/key-people?seed_id=${seedId}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      error_code: null,
      people: [{
        id: "person-a",
        display_name: "Manager",
        relationship_to_user: "boss",
        role_type: "authority",
        confidence: 78,
        known_evidence: ["Named in the submitted context"],
        missing_fields: ["Recent commitment"],
        status: "candidate",
        merged_into_id: null,
        evidence_refs: ["seed:opaque"],
        version: "phase3-key-person-v1",
      }],
    });
  });

  it("hides person-query failures", async () => {
    const peopleOrder = vi.fn().mockResolvedValue({ data: null, error: { message: "private detail" } });
    const peopleSelect = vi.fn(() => ({ eq: vi.fn(() => ({ order: peopleOrder })) }));
    const seedMaybeSingle = vi.fn().mockResolvedValue({ data: { id: seedId }, error: null });
    const seedSelect = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: seedMaybeSingle })) })) }));
    const from = vi.fn((table: string) => table === "seed_contexts" ? { select: seedSelect } : { select: peopleSelect });
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner-a" } } }) },
      from,
    });

    expect((await GET(new Request(`http://localhost/api/key-people?seed_id=${seedId}`))).status).toBe(500);
  });
});
