import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyRealityProfileDraft, listRealityProfileEntries, type RealityProfileDraft } from "@/lib/reality-profile/profile";
import { normalizeSeedContextDraft } from "@/lib/seed-context/storage";

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

import { GET, POST } from "./route";

const ownerId = "11111111-1111-4111-8111-111111111111";
const sourceSeedId = "22222222-2222-4222-8222-222222222222";
const newSeedId = "33333333-3333-4333-8333-333333333333";
const submissionKey = "44444444-4444-4444-8444-444444444444";
const version = "reality-profile-continuation-v1";

function profile(revision = 0): RealityProfileDraft {
  const result = createEmptyRealityProfileDraft(revision);
  result.lifeClimate = { value: "近期生活安排正在调整", classification: "fact", evidenceSummary: "本人重新核对的近况" };
  result.lifeModelDomains.identity = [{ value: "承担家庭照护", classification: "fact", evidenceSummary: "本人确认的当前责任" }];
  result.worldInputs.resources = [{ key: "weekly-time", label: "可用时间", resourceType: "time", available: 8, minimum: 2, maximum: 12, unit: "小时", usePerTick: null, classification: "fact", evidenceSummary: "本人核对的可用安排" }];
  result.worldInputs.constraints = [{ key: "due", label: "安排截止", resourceKey: "weekly-time", rule: { kind: "before_time", value: "2099-01-01T00:00:00.000Z" }, classification: "fact", evidenceSummary: "本人确认的期限" }];
  return result;
}

function reviewKeys(draft: RealityProfileDraft) {
  return [...listRealityProfileEntries(draft).map(entry => entry.key), ...draft.worldInputs.resources.map((_, index) => `worldInputs.resources.${index + 1}`), ...draft.worldInputs.constraints.map((_, index) => `worldInputs.constraints.${index + 1}`)];
}

function continuation(draft = profile()) {
  return { version, sourceSeedContextId: sourceSeedId, sourceRevision: 7, reviewedProfile: draft, reviewedKeys: reviewKeys(draft), confirmedRateKeys: draft.worldInputs.resources.flatMap((resource, index) => resource.usePerTick === null ? [] : [`worldInputs.resources.${index + 1}`]), confirmedForNewSituation: true };
}

function seedDraft() {
  return normalizeSeedContextDraft({ id: "local-new-situation", questionText: "怎样安排下一阶段的生活与协作？", trackType: "crossroad", timeWindow: "90_days", situationSummary: "我在准备另一项生活安排，需要核对已经变化的可用时间和责任。", keyPeopleText: "将重新确认这次处境中的重要人物", privacyAck: true, privacySafetyAck: true, locale: "zh", status: "submitted" });
}

function post(body: unknown) {
  return POST(new Request("http://localhost/api/seed-context", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
}

function receipt(idempotent = false) {
  return { seed_context_id: newSeedId, version: "phase2-submitted-v1", submitted_at: "2026-10-19T10:00:00.000Z", frozen_at: "2026-10-19T10:00:00.000Z", idempotent };
}

function dbRow(draft: RealityProfileDraft) {
  return { life_climate_value: draft.lifeClimate.value, life_climate_classification: draft.lifeClimate.classification, life_climate_evidence_summary: draft.lifeClimate.evidenceSummary, resources_value: null, resources_classification: "unknown", resources_evidence_summary: "明确未知", constraints_value: null, constraints_classification: "unknown", constraints_evidence_summary: "明确未知", life_goals: draft.goals, core_values: draft.values, life_themes: draft.lifeThemes, pressures: draft.pressures, external_variables: draft.externalVariables, life_model_domains: draft.lifeModelDomains, world_model_inputs: draft.worldInputs, revision: draft.revision };
}

function query(data: unknown) {
  const result = { select: vi.fn(), eq: vi.fn(), not: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: Array.isArray(data) ? data : [data], error: null }).then(resolve) };
  for (const method of [result.select, result.eq, result.not, result.order, result.limit]) method.mockReturnValue(result);
  return result;
}

describe("new-situation Reality Profile continuation HTTP boundary", () => {
  const rpc = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    rpc.mockReset().mockResolvedValue({ data: [receipt()], error: null });
    from.mockReset();
    createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: ownerId } } }) }, rpc, from });
  });

  it("prepares only the current owner's exact source version, clearing rates but retaining expired deadlines for review", async () => {
    const source = profile(7);
    source.worldInputs.resources[0]!.usePerTick = 1;
    source.worldInputs.constraints[0]!.rule.value = "2000-01-01T00:00:00.000Z";
    const seedQuery = query({ id: sourceSeedId });
    const profileQuery = query(dbRow(source));
    from.mockImplementation((table: string) => table === "seed_contexts" ? seedQuery : profileQuery);

    const response = await (GET as (request: Request) => Promise<Response>)(new Request("http://localhost/api/seed-context?prepare_continuation=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.continuation).toEqual({ version, sourceSeedContextId: sourceSeedId, sourceRevision: 7, preparedAt: expect.any(String), profile: { ...source, revision: 0, worldInputs: { ...source.worldInputs, resources: [{ ...source.worldInputs.resources[0], usePerTick: null }] } }, expiredConstraintKeys: ["worldInputs.constraints.1"] });
    expect(Number.isFinite(Date.parse(body.continuation.preparedAt))).toBe(true);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(seedQuery.eq).toHaveBeenCalledWith("user_id", ownerId);
    expect(seedQuery.order).toHaveBeenCalledWith("submitted_at", { ascending: false });
    expect(seedQuery.order).toHaveBeenCalledWith("id", { ascending: false });
    expect(profileQuery.eq).toHaveBeenCalledWith("user_id", ownerId);
    expect(profileQuery.eq).toHaveBeenCalledWith("seed_context_id", sourceSeedId);
    expect(profileQuery.select.mock.calls.flat().join(",")).not.toMatch(/(?:^|,)id(?:,|$)/);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("passes the full reviewed profile and all confirmations to one atomic invoker RPC without a separate profile write", async () => {
    const reviewed = profile();
    reviewed.worldInputs.resources[0]!.usePerTick = 1;
    const input = continuation(reviewed);
    const response = await post({ draft: seedDraft(), submissionKey, realityContinuation: input });

    expect(response.status).toBe(201);
    expect(from).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("submit_seed_context_phase2", { p_submission_key: submissionKey, p_payload: expect.objectContaining({ privacyAck: true, privacySafetyAck: true }), p_reality_continuation: { ...input, reviewedProfile: dbRow(reviewed) } });
    expect(await response.json()).toEqual({ seedContext: { id: newSeedId, version: "phase2-submitted-v1", submittedAt: "2026-10-19T10:00:00.000Z", frozenAt: "2026-10-19T10:00:00.000Z" }, idempotent: false });
  });

  it("replays an original unknown request after its deadline has passed without a mutable-source pre-read", async () => {
    const reviewed = profile();
    reviewed.worldInputs.constraints[0]!.rule.value = "2000-01-01T00:00:00.000Z";
    rpc.mockResolvedValue({ data: [receipt(true)], error: null });
    const response = await post({ draft: seedDraft(), submissionKey, realityContinuation: continuation(reviewed) });
    expect(response.status).toBe(200);
    expect((await response.json()).idempotent).toBe(true);
    expect(from).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it.each(["reality_continuation_source_stale", "reality_continuation_revision_conflict", "reality_continuation_deadline_expired", "idempotency_key_content_conflict"])("sanitizes the authoritative database conflict %s without creating any separate artifact", async errorCode => {
    rpc.mockResolvedValue({ data: null, error: { message: errorCode, details: "private database data" } });
    const response = await post({ draft: seedDraft(), submissionKey, realityContinuation: continuation() });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ errorCode });
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    ["missing item", (input: ReturnType<typeof continuation>) => { input.reviewedKeys.pop(); }],
    ["duplicate item", (input: ReturnType<typeof continuation>) => { input.reviewedKeys.push(input.reviewedKeys[0]!); }],
    ["extra item", (input: ReturnType<typeof continuation>) => { input.reviewedKeys.push("lifeClimate.extra"); }],
    ["unconfirmed resource rate", (input: ReturnType<typeof continuation>) => { input.reviewedProfile.worldInputs.resources[0]!.usePerTick = 1; }],
    ["extra resource rate confirmation", (input: ReturnType<typeof continuation>) => { input.confirmedRateKeys.push("worldInputs.resources.1"); }],
    ["nonzero new profile revision", (input: ReturnType<typeof continuation>) => { input.reviewedProfile.revision = 7; }],
  ])("rejects %s before persistence", async (_label, change) => {
    const input = continuation();
    change(input);
    const response = await post({ draft: seedDraft(), submissionKey, realityContinuation: input });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ errorCode: "invalid_reality_continuation" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects inherited runtime authorization and third-party identity payloads before persistence", async () => {
    const input = { ...continuation(), digitalLifeRules: { confirmedForSimulation: true }, planning: { enabled: true }, symbolic: { enabled: true }, outcomeCalibration: { confirmed: true }, people: [{ id: sourceSeedId }] };
    const response = await post({ draft: seedDraft(), submissionKey, realityContinuation: input });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ errorCode: "invalid_reality_continuation" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps the existing blank-new-situation two-argument RPC path", async () => {
    const response = await post({ draft: seedDraft(), submissionKey });
    expect(response.status).toBe(201);
    expect(Object.keys(rpc.mock.calls[0]![1])).toEqual(["p_submission_key", "p_payload"]);
  });
});
