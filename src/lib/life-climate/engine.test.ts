import { describe, expect, it } from "vitest";

import { createEmptyRealityProfileDraft, type RealityProfileDraft } from "@/lib/reality-profile/profile";
import { buildLifeClimateRun, type LifeClimateRunRequest } from "./engine";

function profileFixture(): RealityProfileDraft {
  const profile = createEmptyRealityProfileDraft(7);
  return {
    ...profile,
    lifeModelDomains: {
      version: 1,
      identity: [{ value: "当前主要照顾家人", classification: "fact", evidenceSummary: "本人确认" }],
      career: [{ value: "继续当前岗位", classification: "assumption", evidenceSummary: "本人目前的基线设想" }],
      wealth: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
      relationships: [{ value: "保持现有支持网络", classification: "fact", evidenceSummary: "本人确认" }],
      environment: [{ value: "居住在当前城市", classification: "fact", evidenceSummary: "本人确认" }],
      lifeStage: [{ value: "职业转型准备期", classification: "assumption", evidenceSummary: "本人判断" }],
    },
  };
}

function requestFixture(overrides: Partial<LifeClimateRunRequest> = {}): LifeClimateRunRequest {
  return {
    horizon: "1_year",
    profileRevision: 7,
    change: {
      domain: "career",
      entryIndex: 0,
      startPeriod: 2,
      newState: "转为每周四天工作，为照护安排留出时间",
      evidenceSummary: "这是本人设定的备选路径假设",
    },
    ...overrides,
  };
}

function idSequence() {
  let counter = 1;
  return () => `00000000-0000-4000-8000-${String(counter++).padStart(12, "0")}`;
}

describe("buildLifeClimateRun", () => {
  it("compares a frozen baseline with one explicit change across four coarse periods", () => {
    const profile = profileFixture();
    const result = buildLifeClimateRun(profile, requestFixture(), idSequence());
    const baseline = result.paths.find((path) => path.id === "baseline");
    const alternative = result.paths.find((path) => path.id === "alternative");

    expect(result).toMatchObject({ version: "life-climate-b1-v1", horizon: "1_year", profileRevision: 7 });
    expect(result.profileSnapshot.lifeModelDomains).toEqual(profile.lifeModelDomains);
    expect(baseline?.periods).toHaveLength(4);
    expect(alternative?.periods).toHaveLength(4);
    expect(baseline?.periods.map((period) => period.label)).toEqual(["第一阶段", "第二阶段", "第三阶段", "第四阶段"]);
    expect(baseline?.periods[1].lifeModelDomains.career[0]).toEqual(profile.lifeModelDomains.career[0]);
    expect(alternative?.periods[0].lifeModelDomains.career[0]).toEqual(profile.lifeModelDomains.career[0]);
    expect(alternative?.periods[1].lifeModelDomains.career[0]).toEqual({
      value: "转为每周四天工作，为照护安排留出时间",
      classification: "assumption",
      evidenceSummary: "这是本人设定的备选路径假设",
    });
    expect(alternative?.periods[3].lifeModelDomains.identity).toEqual(profile.lifeModelDomains.identity);
    expect(alternative?.periods[3].lifeModelDomains.wealth).toEqual(profile.lifeModelDomains.wealth);
  });

  it("keeps unknown baseline domains unknown and produces event-backed conditional claims", () => {
    const result = buildLifeClimateRun(profileFixture(), requestFixture({
      change: {
        domain: "wealth",
        entryIndex: 0,
        startPeriod: 1,
        newState: "建立独立应急储备",
        evidenceSummary: "本人设定的备选路径假设",
      },
    }), idSequence());
    const baseline = result.paths.find((path) => path.id === "baseline");

    expect(baseline?.periods[0].lifeModelDomains.wealth[0]).toEqual({
      value: "",
      classification: "unknown",
      evidenceSummary: "明确未知",
    });
    expect(result.events).toHaveLength(1);
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].evidenceEventIds).toEqual([result.events[0].id]);
    expect(result.report.claimIds).toEqual([result.claims[0].id]);
    expect(result.events[0]).toMatchObject({ periodIndex: 1, pathId: "alternative", source: "user_assumption" });
    expect(result.claims[0].uncertainty).toMatch(/条件|模拟|未建模/);
  });

  it("does not turn the user assumption into a dated or probabilistic prediction", () => {
    const result = buildLifeClimateRun(profileFixture(), requestFixture(), idSequence());
    const visibleText = JSON.stringify({ paths: result.paths, events: result.events, claims: result.claims, report: result.report });

    expect(visibleText).not.toMatch(/\b\d{4}-\d{2}-\d{2}\b|\b\d+(?:\.\d+)?%|必然发生/);
    expect(result.report).toMatchObject({ mode: "conditional_structure_comparison", includesExactDates: false, claimsUseEventEvidence: true });
    expect(result.report.limitations.join(" ")).toContain("不是现实事件清单、概率或确定预言");
  });

  it("rejects a stale profile revision and a change that targets a missing domain entry", () => {
    expect(() => buildLifeClimateRun(profileFixture(), requestFixture({ profileRevision: 6 }), idSequence())).toThrow();
    expect(() => buildLifeClimateRun(profileFixture(), requestFixture({ change: { ...requestFixture().change, entryIndex: 2 } }), idSequence())).toThrow();
  });
});
