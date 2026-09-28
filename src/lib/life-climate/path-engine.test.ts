import { describe, expect, it } from "vitest";

import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";
import { buildLifeClimatePathRun, lifeClimatePathRunRequestSchema, type LifeClimatePathRunRequest } from "./engine";

function profileFixture() {
  const profile = createEmptyRealityProfileDraft(7);
  return {
    ...profile,
    lifeModelDomains: {
      version: 1 as const,
      identity: [{ value: "当前照护家人", classification: "fact" as const, evidenceSummary: "本人确认" }],
      career: [{ value: "继续当前岗位", classification: "assumption" as const, evidenceSummary: "当前设想" }],
      wealth: [{ value: "保持现有储备", classification: "fact" as const, evidenceSummary: "本人确认" }],
      relationships: [{ value: "保持支持网络", classification: "fact" as const, evidenceSummary: "本人确认" }],
      environment: [{ value: "居住在当前城市", classification: "fact" as const, evidenceSummary: "本人确认" }],
      lifeStage: [{ value: "转型准备期", classification: "assumption" as const, evidenceSummary: "当前设想" }],
    },
  };
}

function ids() {
  let value = 1;
  return () => `00000000-0000-4000-8000-${String(value++).padStart(12, "0")}`;
}

describe("Track B multi-horizon path builder", () => {
  it("accepts all three long horizons and gives each a horizon-appropriate number of coarse stages", () => {
    const profile = profileFixture();
    const cases = [
      { horizon: "1_year" as const, count: 4 },
      { horizon: "3_years" as const, count: 3 },
      { horizon: "5_years" as const, count: 5 },
    ];

    for (const item of cases) {
      const parsed = lifeClimatePathRunRequestSchema.safeParse({
        horizon: item.horizon,
        profileRevision: 7,
        changes: [{
          domain: "career",
          entryIndex: 0,
          startPeriod: 1,
          newState: "尝试更灵活的工作安排",
          evidenceSummary: "本人设定的备选假设",
        }],
      });

      expect(parsed.success, `${item.horizon} should be supported`).toBe(true);
      if (!parsed.success) continue;
      const result = buildLifeClimatePathRun(profile, parsed.data, ids());
      expect(result.horizon).toBe(item.horizon);
      expect(result.paths[0].periods).toHaveLength(item.count);
      expect(result.paths[1].periods).toHaveLength(item.count);
    }
  });

  it("applies several user-authored changes in order while preserving the frozen baseline and evidence links", () => {
    const profile = profileFixture();
    const result = buildLifeClimatePathRun(profile, {
      horizon: "5_years",
      profileRevision: 7,
      changes: [
        { domain: "career", entryIndex: 0, startPeriod: 1, newState: "转入弹性工作", evidenceSummary: "本人设定的第一阶段假设" },
        { domain: "career", entryIndex: 0, startPeriod: 3, newState: "改为四天工作制", evidenceSummary: "本人设定的第三阶段假设" },
        { domain: "career", entryIndex: 0, startPeriod: 4, newState: "转为顾问型工作", evidenceSummary: "本人设定的第四阶段假设" },
      ],
    }, ids());
    const [baseline, alternative] = result.paths;

    expect(result).toMatchObject({ version: "life-climate-b2-v1", horizon: "5_years", profileRevision: 7 });
    expect(alternative.periods.map((period) => period.label)).toEqual(["第 1 年", "第 2 年", "第 3 年", "第 4 年", "第 5 年"]);
    expect(alternative.periods[0].lifeModelDomains.career[0].value).toBe("转入弹性工作");
    expect(alternative.periods[1].lifeModelDomains.career[0].value).toBe("转入弹性工作");
    expect(alternative.periods[2].lifeModelDomains.career[0].value).toBe("改为四天工作制");
    expect(alternative.periods[3].lifeModelDomains.career[0].value).toBe("转为顾问型工作");
    expect(alternative.periods[4].lifeModelDomains.career[0].value).toBe("转为顾问型工作");
    expect(baseline.periods.every((period) => period.lifeModelDomains.career[0].value === "继续当前岗位")).toBe(true);
    expect(baseline.periods.every((period) => period.lifeModelDomains.wealth[0].value === "保持现有储备")).toBe(true);
    expect(result.events).toHaveLength(3);
    expect(result.claims).toHaveLength(3);
    expect(result.events[2].beforeState.value).toBe("改为四天工作制");
    expect(result.claims.map((claim) => claim.evidenceEventIds[0])).toEqual(result.events.map((event) => event.id));
    expect(result.report.claimIds).toEqual(result.claims.map((claim) => claim.id));
  });

  it("rejects stage numbers outside the chosen horizon and duplicate changes to one field in the same stage", () => {
    const baseChange: LifeClimatePathRunRequest["changes"][number] = {
      domain: "career",
      entryIndex: 0,
      startPeriod: 1,
      newState: "一项假设",
      evidenceSummary: "本人设定",
    };
    const base = {
      profileRevision: 7,
      changes: [baseChange],
    };

    expect(lifeClimatePathRunRequestSchema.safeParse({ ...base, horizon: "3_years", changes: [{ ...base.changes[0], startPeriod: 4 }] }).success).toBe(false);
    expect(lifeClimatePathRunRequestSchema.safeParse({
      horizon: "3_years",
      profileRevision: 7,
      changes: [base.changes[0], { ...base.changes[0], newState: "另一项假设" }],
    }).success).toBe(false);
    expect(() => buildLifeClimatePathRun(profileFixture(), {
      horizon: "3_years",
      profileRevision: 6,
      changes: base.changes,
    }, ids())).toThrow();
  });

  it("keeps each comparison inside one selected life theme", () => {
    const result = lifeClimatePathRunRequestSchema.safeParse({
      horizon: "3_years",
      profileRevision: 7,
      changes: [
        { domain: "career", entryIndex: 0, startPeriod: 1, newState: "换一种工作安排", evidenceSummary: "本人设定" },
        { domain: "wealth", entryIndex: 0, startPeriod: 2, newState: "增加储备", evidenceSummary: "本人设定" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("keeps long-horizon results conditional and explicitly refuses to infer unsupported effects", () => {
    const result = buildLifeClimatePathRun(profileFixture(), {
      horizon: "3_years",
      profileRevision: 7,
      changes: [{ domain: "career", entryIndex: 0, startPeriod: 2, newState: "改变工作安排", evidenceSummary: "本人设定的备选假设" }],
    }, ids());
    const text = JSON.stringify(result);

    expect(result.report.mode).toBe("user_authored_structural_path");
    expect(result.report.includesExactDates).toBe(false);
    expect(text).not.toMatch(/\b\d{4}-\d{2}-\d{2}\b|\b\d+(?:\.\d+)?%|必然发生/);
    expect(result.report.limitations.join(" ")).toContain("不会推断跨领域因果");
  });
});
