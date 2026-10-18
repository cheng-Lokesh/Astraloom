import { describe, expect, it } from "vitest";

import { REALITY_PROFILE_CONTINUATION_VERSION, listExpiredRealityContinuationConstraintKeys, listRealityContinuationRateKeys, listRealityContinuationReviewKeys, prepareRealityProfileContinuation, preparedRealityProfileContinuationSchema, realityProfileContinuationSchema } from "./continuation";
import { toRealityProfileDatabaseFields } from "./database-fields";
import { createEmptyRealityProfileDraft, listRealityProfileEntries, realityProfileDraftFromDatabaseRow, type RealityProfileDraft } from "./profile";

function sample(): RealityProfileDraft {
  const profile = createEmptyRealityProfileDraft(9);
  profile.lifeClimate = { value: "安排正在改变", classification: "fact", evidenceSummary: "本人重新核对" };
  profile.goals.push({ value: "仍在考虑的目标", classification: "assumption", evidenceSummary: "尚待核对" });
  profile.worldInputs = { version: 1, resources: [{ key: "time", label: "可用时间", resourceType: "time", available: 8, minimum: 2, maximum: 12, unit: "小时", usePerTick: 1, classification: "fact", evidenceSummary: "本人确认" }], constraints: [{ key: "due", label: "安排期限", resourceKey: "time", rule: { kind: "before_time", value: "2026-10-18T00:00:00.000Z" }, classification: "assumption", evidenceSummary: "需要再次核对" }] };
  return profile;
}

function input(profile = prepareRealityProfileContinuation(sample())) {
  return { version: REALITY_PROFILE_CONTINUATION_VERSION, sourceSeedContextId: "22222222-2222-4222-8222-222222222222", sourceRevision: 9, reviewedProfile: profile, reviewedKeys: listRealityContinuationReviewKeys(profile), confirmedRateKeys: listRealityContinuationRateKeys(profile), confirmedForNewSituation: true };
}

describe("fresh Reality Profile continuation contract", () => {
  it("prepares a detached new profile preserving all classifications and original deadline, with resource rates cleared", () => {
    const source = sample();
    const snapshot = structuredClone(source);
    const draft = prepareRealityProfileContinuation(source);
    expect(draft).toEqual({ ...source, revision: 0, worldInputs: { ...source.worldInputs, resources: [{ ...source.worldInputs.resources[0], usePerTick: null }] } });
    draft.goals[0]!.evidenceSummary = "仍然未知";
    draft.worldInputs.resources[0]!.available = 7;
    expect(source).toEqual(snapshot);
    expect(listExpiredRealityContinuationConstraintKeys(source, "2026-10-18T00:00:00.000Z")).toEqual(["worldInputs.constraints.1"]);
    expect(listExpiredRealityContinuationConstraintKeys(source, "2026-10-17T23:59:59.999Z")).toEqual([]);
  });

  it("requires the exact final item set including unknown entries and each structured resource or constraint", () => {
    const request = input();
    expect(request.reviewedKeys).toEqual([...listRealityProfileEntries(request.reviewedProfile).map(item => item.key), "worldInputs.resources.1", "worldInputs.constraints.1"]);
    expect(request.reviewedKeys).toContain("lifeModelDomains.lifeStage.1");
    expect(request.reviewedKeys).toContain("goals.2");
    expect(realityProfileContinuationSchema.safeParse(request).success).toBe(true);
    request.reviewedKeys.reverse();
    expect(realityProfileContinuationSchema.safeParse(request).success).toBe(true);
  });

  it("accepts a complete explicit-unknown profile without inventing values or simulation permissions", () => {
    const request = input(createEmptyRealityProfileDraft());
    const parsed = realityProfileContinuationSchema.parse(request);
    expect(parsed.reviewedProfile).toEqual(createEmptyRealityProfileDraft());
    expect(parsed.reviewedKeys).toHaveLength(14);
    expect(parsed.confirmedRateKeys).toEqual([]);
    expect(Object.keys(parsed)).toEqual(["version", "sourceSeedContextId", "sourceRevision", "reviewedProfile", "reviewedKeys", "confirmedRateKeys", "confirmedForNewSituation"]);
  });

  it("requires independent confirmation for precisely the non-null rates", () => {
    const request = input();
    request.reviewedProfile.worldInputs.resources[0]!.usePerTick = 1;
    expect(realityProfileContinuationSchema.safeParse(request).success).toBe(false);
    request.confirmedRateKeys = ["worldInputs.resources.1"];
    expect(realityProfileContinuationSchema.safeParse(request).success).toBe(true);
    request.confirmedRateKeys.push("worldInputs.resources.1");
    expect(realityProfileContinuationSchema.safeParse(request).success).toBe(false);
  });

  it.each([
    ["nonzero destination revision", (request: ReturnType<typeof input>) => { request.reviewedProfile.revision = 9; }],
    ["unknown with inferred value", (request: ReturnType<typeof input>) => { request.reviewedProfile.values[0]!.value = "系统猜测"; }],
    ["unsafe source summary", (request: ReturnType<typeof input>) => { request.reviewedProfile.lifeClimate.evidenceSummary = "private@example.test"; }],
    ["out of bounds resource", (request: ReturnType<typeof input>) => { request.reviewedProfile.worldInputs.resources[0]!.available = 1; }],
    ["missing review", (request: ReturnType<typeof input>) => { request.reviewedKeys.pop(); }],
    ["duplicate review", (request: ReturnType<typeof input>) => { request.reviewedKeys.push(request.reviewedKeys[0]!); }],
    ["unconfirmed situation", (request: ReturnType<typeof input>) => { request.confirmedForNewSituation = false; }],
    ["invalid source revision", (request: ReturnType<typeof input>) => { request.sourceRevision = 0; }],
  ])("rejects %s without throwing from safeParse", (_label, mutate) => {
    const request = input();
    mutate(request);
    expect(() => realityProfileContinuationSchema.safeParse(request)).not.toThrow();
    expect(realityProfileContinuationSchema.safeParse(request).success).toBe(false);
  });

  it("rejects absent dimensions and inherited authorizations at every level", () => {
    const request = input();
    const incomplete = { ...request.reviewedProfile };
    Reflect.deleteProperty(incomplete, "lifeModelDomains");
    expect(realityProfileContinuationSchema.safeParse({ ...request, reviewedProfile: incomplete }).success).toBe(false);
    const withoutWorld = { ...request.reviewedProfile };
    Reflect.deleteProperty(withoutWorld, "worldInputs");
    expect(realityProfileContinuationSchema.safeParse({ ...request, reviewedProfile: withoutWorld }).success).toBe(false);
    expect(realityProfileContinuationSchema.safeParse({ ...request, planning: true }).success).toBe(false);
    expect(realityProfileContinuationSchema.safeParse({ ...request, reviewedProfile: { ...request.reviewedProfile, people: [] } }).success).toBe(false);
  });

  it("keeps time checks out of the static request schema so an exact old request can reach receipt recovery", () => {
    expect(realityProfileContinuationSchema.safeParse(input()).success).toBe(true);
    const request = input();
    const prepared = { version: request.version, sourceSeedContextId: request.sourceSeedContextId, sourceRevision: request.sourceRevision, profile: request.reviewedProfile, preparedAt: "2026-10-19T00:00:00.000Z", expiredConstraintKeys: ["worldInputs.constraints.1"] };
    expect(preparedRealityProfileContinuationSchema.safeParse(prepared).success).toBe(true);
    expect(preparedRealityProfileContinuationSchema.safeParse({ ...prepared, expiredConstraintKeys: [] }).success).toBe(false);
    prepared.profile.worldInputs.resources[0]!.usePerTick = 1;
    expect(preparedRealityProfileContinuationSchema.safeParse(prepared).success).toBe(false);
  });

  it("maps every dimension to the existing columns once and roundtrips explicit unknown scalars", () => {
    const source = sample();
    const fields = toRealityProfileDatabaseFields(source);
    expect(fields.resources_value).toBeNull();
    expect(fields.resources_evidence_summary).toBe("明确未知");
    expect(fields.life_goals).toEqual(source.goals);
    expect(fields.life_model_domains).toEqual(source.lifeModelDomains);
    expect(fields.world_model_inputs).toEqual(source.worldInputs);
    expect(fields).not.toHaveProperty("revision");
    expect(fields).not.toHaveProperty("id");
    expect(fields).not.toHaveProperty("user_id");
    expect(realityProfileDraftFromDatabaseRow({ ...fields, revision: source.revision })).toEqual(source);
    fields.life_goals[0]!.evidenceSummary = "changed output";
    expect(source.goals[0]!.evidenceSummary).toBe("明确未知");
  });
});
