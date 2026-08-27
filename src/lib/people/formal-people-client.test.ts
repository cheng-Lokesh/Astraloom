import { describe, expect, it, type Mock, vi } from "vitest";

import {
  FormalPeopleController,
  type FormalPeopleAction,
  type FormalPeopleFetch,
} from "./formal-people-client";

const seedA = "11111111-1111-4111-8111-111111111111";
const seedB = "22222222-2222-4222-8222-222222222222";
const personA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const personB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const person = {
  id: personA,
  display_name: "Project lead",
  relationship_to_user: "manager",
  role_type: "decision partner",
  confidence: 72,
  known_evidence: ["Named in submitted context"],
  missing_fields: ["Current priority"],
  status: "candidate",
  merged_into_id: null,
  evidence_refs: ["seed:person:1"],
  version: "phase3-key-person-v1",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function recoverFetch(people = [person]): Mock<FormalPeopleFetch> {
  return vi.fn()
    .mockResolvedValueOnce(json({
      seedContexts: [
        { id: seedA, version: "1", submittedAt: "2026-08-26T12:00:00.000Z", frozenAt: "2026-08-26T12:00:00.000Z" },
        { id: seedB, version: "2", submittedAt: "2026-08-27T12:00:00.000Z", frozenAt: "2026-08-27T12:00:00.000Z" },
      ],
    }))
    .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", people }));
}

function controller(fetcher: FormalPeopleFetch, ids = [
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
]) {
  return new FormalPeopleController({
    fetcher,
    newId: () => {
      const next = ids.shift();
      if (!next) throw new Error("test UUIDs exhausted");
      return next;
    },
  });
}

describe("FormalPeopleController", () => {
  it("recovers only the newest formal submitted Seed and its server people", async () => {
    const fetcher = recoverFetch();
    const subject = controller(fetcher);

    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedB }, people: [person] });
    expect(fetcher).toHaveBeenNthCalledWith(2, `/api/key-people?seed_id=${seedB}`, { method: "GET" });
  });

  it("uses a deterministic id tie-break when formal Seeds share submittedAt", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ seedContexts: [
        { id: seedA, version: "1", submittedAt: "2026-08-27T12:00:00.000Z", frozenAt: "2026-08-27T12:00:00.000Z" },
        { id: seedB, version: "1", submittedAt: "2026-08-27T12:00:00.000Z", frozenAt: "2026-08-27T12:00:00.000Z" },
      ] }))
      .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", people: [] }));

    const subject = controller(fetcher);
    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedB } });
  });

  it("accepts the offset timestamps returned by the live Seed API", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ seedContexts: [
        { id: seedA, version: "1", submittedAt: "2026-08-27T12:00:00+00:00", frozenAt: "2026-08-27T12:00:00+00:00" },
      ] }))
      .mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", people: [] }));

    const subject = controller(fetcher);
    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedA }, people: [] });
  });

  it("maps unauthenticated, absent Seed, malformed JSON, and GET errors to private recovery states", async () => {
    const unauthenticated = controller(vi.fn().mockResolvedValue(json({ errorCode: "authentication_required" }, 401)));
    await unauthenticated.recover();
    expect(unauthenticated.state).toMatchObject({ phase: "unauthenticated" });

    const noSeed = controller(vi.fn().mockResolvedValue(json({ seedContexts: [] })));
    await noSeed.recover();
    expect(noSeed.state).toMatchObject({ phase: "no_seed" });

    const malformed = controller(vi.fn().mockResolvedValue(json({ seedContexts: [{ id: seedA, raw_context: "private" }] })));
    await malformed.recover();
    expect(malformed.state).toMatchObject({ phase: "failure", notice: "We couldn't recover saved people. Please try again." });

    const unavailable = controller(vi.fn().mockResolvedValue(json({ error_code: "persistence_failed" }, 500)));
    await unavailable.recover();
    expect(unavailable.state).toMatchObject({ phase: "failure", notice: "We couldn't recover saved people. Please try again." });
  });

  it("shows a server-empty ledger without inventing local people", async () => {
    const subject = controller(recoverFetch([]));
    await subject.recover();

    expect(subject.state).toMatchObject({ phase: "ready", people: [] });
  });

  it("uses a fresh UUID and adopts the full server ledger after extraction", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", idempotent: false, people: [{ ...person, status: "needs_confirmation" }] }, 201));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.extract();

    expect(fetcher).toHaveBeenLastCalledWith("/api/key-people/extract", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ selector: { seed_id: seedB }, idempotency_key: "33333333-3333-4333-8333-333333333333" }),
    }));
    expect(subject.state).toMatchObject({ phase: "ready", people: [{ status: "needs_confirmation" }] });
  });

  it.each<FormalPeopleAction>([
    { type: "confirm", person_id: personA },
    { type: "rename", person_id: personA, display_name: "New display name" },
    { type: "delete", person_id: personA },
    { type: "merge", source_person_id: personA, target_person_id: personB },
    { type: "supplement", display_name: "Sponsor", relationship_to_user: "advisor", role_type: "support", note: "User supplied context." },
  ])("sends %o through the single atomic endpoint with a fresh key and adopts its ledger", async (action) => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", idempotent: false, people: [{ ...person, status: "confirmed" }] }));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.mutate(action);

    const [, request] = fetcher.mock.calls.at(-1) as [string, RequestInit];
    expect(request.body).toBe(JSON.stringify({ selector: { seed_id: seedB }, idempotency_key: "33333333-3333-4333-8333-333333333333", operations: [action] }));
    expect(subject.state).toMatchObject({ phase: "ready", people: [{ status: "confirmed" }] });
  });

  it("disables an in-flight action instead of issuing a duplicate request", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetcher = recoverFetch();
    fetcher.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    const subject = controller(fetcher);
    await subject.recover();

    const first = subject.mutate({ type: "confirm", person_id: personA });
    await Promise.resolve();
    const second = subject.mutate({ type: "confirm", person_id: personA });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(subject.state).toMatchObject({ pendingAction: "confirm" });

    resolveRequest?.(json({ ok: true, error_code: null, trace_id: "opaque", idempotent: false, people: [person] }));
    await Promise.all([first, second]);
    expect(subject.state).toMatchObject({ phase: "ready", pendingAction: null });
  });

  it.each([
    [409, "idempotency_key_content_conflict", "Saved people changed elsewhere. Reload saved people before trying again."],
    [409, "invalid_people_transition", "This saved change can no longer be applied. Reload saved people before trying again."],
    [404, "seed_not_found", "This submitted scenario is no longer available. Return to intake to recover it."],
    [500, "persistence_failed", "We couldn't save this people update. Your saved view has not changed."],
  ])("keeps the current server ledger and maps %s failures without exposing server details", async (status, errorCode, notice) => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: errorCode, trace_id: "opaque-secret-trace" }, status));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.mutate({ type: "delete", person_id: personA });

    expect(subject.state).toMatchObject({ phase: "ready", people: [person], notice });
    expect(JSON.stringify(subject.state)).not.toContain("opaque-secret-trace");
  });

  it("rejects unsafe response projections and never substitutes local people after an API or parse failure", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", idempotent: false, people: [{ ...person, raw_context: "must not enter UI" }] }));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.extract();

    expect(subject.state).toMatchObject({ phase: "ready", people: [person], notice: "We couldn't save this people update. Your saved view has not changed." });
  });

  it("reloads server truth after a refresh and does not retry a conflict with a new key", async () => {
    const fetcher = recoverFetch();
    fetcher.mockResolvedValueOnce(json({ ok: false, error_code: "idempotency_key_content_conflict", trace_id: "opaque" }, 409));
    fetcher.mockResolvedValueOnce(json({ seedContexts: [{ id: seedA, version: "1", submittedAt: "2026-08-28T12:00:00.000Z", frozenAt: "2026-08-28T12:00:00.000Z" }] }));
    fetcher.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", people: [{ ...person, status: "confirmed" }] }));
    const subject = controller(fetcher);
    await subject.recover();
    await subject.mutate({ type: "confirm", person_id: personA });
    await subject.recover();

    expect(fetcher).toHaveBeenCalledTimes(5);
    expect(subject.state).toMatchObject({ phase: "ready", seed: { id: seedA }, people: [{ status: "confirmed" }] });
  });

  it("returns a success signal only after a server-accepted supplement, so a form can clear safely", async () => {
    const successFetch = recoverFetch();
    successFetch.mockResolvedValueOnce(json({ ok: true, error_code: null, trace_id: "opaque", idempotent: false, people: [person] }));
    const success = controller(successFetch);
    await success.recover();

    expect(await success.mutate({ type: "supplement", display_name: "Sponsor", relationship_to_user: "advisor", role_type: "support" })).toBe(true);

    const failureFetch = recoverFetch();
    failureFetch.mockResolvedValueOnce(json({ ok: false, error_code: "persistence_failed", trace_id: "opaque" }, 500));
    const failure = controller(failureFetch);
    await failure.recover();

    expect(await failure.mutate({ type: "supplement", display_name: "Sponsor", relationship_to_user: "advisor", role_type: "support" })).toBe(false);
  });

  it("keeps invalid local operations visible and does not silently discard them", async () => {
    const fetcher = recoverFetch();
    const subject = controller(fetcher);
    await subject.recover();

    expect(await subject.mutate({ type: "supplement", display_name: "Sponsor", relationship_to_user: "x".repeat(81), role_type: "support" })).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(subject.state).toMatchObject({ notice: "Enter a valid saved-person change before trying again." });
  });
});
