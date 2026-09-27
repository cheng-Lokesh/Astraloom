import { describe, expect, it } from "vitest";

import {
  buildRealityWorldProjection,
  createEmptyRealityProfileDraft,
  realityProfileDraftSchema,
} from "./profile";

describe("Reality Profile", () => {
  it("keeps confirmed facts, assumptions, and unknowns distinct while deriving the locked-graph state", () => {
    const draft = realityProfileDraftSchema.parse({
      ...createEmptyRealityProfileDraft(2),
      lifeClimate: { value: "当前协作节奏变化较多", classification: "fact", evidenceSummary: "用户已确认的近期工作观察" },
      resources: { value: "可协调的支持有限", classification: "assumption", evidenceSummary: "仍待复核" },
      constraints: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      revision: 2,
    });

    expect(buildRealityWorldProjection(draft, { graphLocked: true, latestRunEvent: "cooperation" })).toEqual({
      reality: {
        facts: [{ label: "当前协作节奏变化较多", evidenceSummary: "用户已确认的近期工作观察" }],
        assumptions: [{ label: "可协调的支持有限", evidenceSummary: "仍待复核" }],
        unknowns: [{ label: "约束" }, { label: "目标" }, { label: "价值观" }, { label: "人生主题" }, { label: "压力" }, { label: "外部变量" }],
        dimensions: [
          { label: "人生气候", facts: 1, assumptions: 0, unknowns: 0 },
          { label: "资源", facts: 0, assumptions: 1, unknowns: 0 },
          { label: "约束", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "目标", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "价值观", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "人生主题", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "压力", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "外部变量", facts: 0, assumptions: 0, unknowns: 1 },
        ],
      },
      world: {
        state: "locked_graph",
        resources: [{ label: "可协调的支持有限", classification: "assumption", evidenceSummary: "仍待复核" }],
        constraints: [{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }],
        goals: [{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }],
        values: [{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }],
        lifeThemes: [{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }],
        pressures: [{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }],
        externalVariables: [{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }],
        changeNodes: [{ label: "协作变化", evidenceSummary: "来自当前正式运行的受控模拟事件" }],
      },
    });
  });

  it.each([
    ["a newer UUID version", "00000000-0000-7000-8000-000000000000"],
    ["a UUID outside the RFC variant subset", "00000000-0000-0000-0000-000000000000"],
  ])("rejects identifiers independently of %s", (_kind, identifier) => {
    const result = realityProfileDraftSchema.safeParse({
      ...createEmptyRealityProfileDraft(),
      lifeClimate: { value: "ordinary profile text", classification: "fact", evidenceSummary: `Confirmed entry ${identifier}` },
    });

    expect(result.success).toBe(false);
  });

  it("uses a trim-first Unicode character limit consistent with SQL", () => {
    const valid = realityProfileDraftSchema.safeParse({
      ...createEmptyRealityProfileDraft(),
      lifeClimate: { value: `  ${"😀".repeat(240)}  `, classification: "fact", evidenceSummary: "Confirmed observation" },
    });
    const invalid = realityProfileDraftSchema.safeParse({
      ...createEmptyRealityProfileDraft(),
      lifeClimate: { value: "😀".repeat(241), classification: "fact", evidenceSummary: "Confirmed observation" },
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("fails closed for identifiers, raw scenarios, and unsafe evidence summaries", () => {
    expect(() => realityProfileDraftSchema.parse({
      ...createEmptyRealityProfileDraft(),
      lifeClimate: { value: "plain", classification: "fact", evidenceSummary: "safe" },
      resources: { value: "plain", classification: "fact", evidenceSummary: "550e8400-e29b-41d4-a716-446655440000" },
      constraints: { value: "raw scenario", classification: "fact", evidenceSummary: "safe" },
      revision: 0,
    })).toThrow();
  });

  it("preserves each classification when separate fields share the same description", () => {
    const projection = buildRealityWorldProjection({
      ...createEmptyRealityProfileDraft(1),
      lifeClimate: { value: "支持有限", classification: "fact", evidenceSummary: "已确认的当前情况" },
      resources: { value: "支持有限", classification: "assumption", evidenceSummary: "需要后续复核" },
      constraints: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      revision: 1,
    }, { graphLocked: false, latestRunEvent: null });

    expect(projection.reality.facts).toEqual([{ label: "支持有限", evidenceSummary: "已确认的当前情况" }]);
    expect(projection.reality.assumptions).toEqual([{ label: "支持有限", evidenceSummary: "需要后续复核" }]);
  });

  it("keeps goals, values, life themes, pressures, and external variables individually classified", () => {
    const draft = realityProfileDraftSchema.parse({
      lifeClimate: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      resources: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      constraints: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      goals: [{ value: "完成职业转向", classification: "fact", evidenceSummary: "用户确认的计划" }],
      values: [{ value: "保留稳定收入", classification: "assumption", evidenceSummary: "仍需本人复核" }],
      lifeThemes: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
      pressures: [{ value: "团队调整", classification: "fact", evidenceSummary: "用户确认的近期变化" }],
      externalVariables: [{ value: "市场需求", classification: "assumption", evidenceSummary: "尚未外部核实" }],
      revision: 0,
    });

    const projection = buildRealityWorldProjection(draft, { graphLocked: false, latestRunEvent: null });

    expect(projection.reality.facts).toContainEqual({ label: "目标：完成职业转向", evidenceSummary: "用户确认的计划" });
    expect(projection.reality.assumptions).toContainEqual({ label: "价值观：保留稳定收入", evidenceSummary: "仍需本人复核" });
    expect(projection.reality.unknowns).toContainEqual({ label: "人生主题" });
    expect(projection.world.goals).toEqual([{ label: "完成职业转向", classification: "fact", evidenceSummary: "用户确认的计划" }]);
    expect(projection.world.values).toEqual([{ label: "保留稳定收入", classification: "assumption", evidenceSummary: "仍需本人复核" }]);
    expect(projection.world.lifeThemes).toEqual([{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }]);
    expect(projection.world.pressures).toEqual([{ label: "团队调整", classification: "fact", evidenceSummary: "用户确认的近期变化" }]);
    expect(projection.world.externalVariables).toEqual([{ label: "市场需求", classification: "assumption", evidenceSummary: "尚未外部核实" }]);
  });

  it("rejects unsafe values inside the new dimensions", () => {
    expect(() => realityProfileDraftSchema.parse({
      lifeClimate: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      resources: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      constraints: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      goals: [{ value: "raw scenario", classification: "fact", evidenceSummary: "用户确认" }],
      values: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
      lifeThemes: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
      pressures: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
      externalVariables: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
      revision: 0,
    })).toThrow();
  });
});
