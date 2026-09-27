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
        unknowns: [{ label: "约束" }, { label: "目标" }, { label: "价值观" }, { label: "人生主题" }, { label: "压力" }, { label: "外部变量" }, { label: "身份结构" }, { label: "职业结构" }, { label: "财富结构" }, { label: "关系生态" }, { label: "城市与生活环境" }, { label: "人生阶段" }],
        dimensions: [
          { label: "人生气候", facts: 1, assumptions: 0, unknowns: 0 },
          { label: "资源", facts: 0, assumptions: 1, unknowns: 0 },
          { label: "约束", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "目标", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "价值观", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "人生主题", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "压力", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "外部变量", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "身份结构", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "职业结构", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "财富结构", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "关系生态", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "城市与生活环境", facts: 0, assumptions: 0, unknowns: 1 },
          { label: "人生阶段", facts: 0, assumptions: 0, unknowns: 1 },
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

  it("projects every saved structured resource and constraint without exposing internal keys", () => {
    const draft = realityProfileDraftSchema.parse({
      ...createEmptyRealityProfileDraft(3),
      worldInputs: {
        version: 1,
        resources: [
          { key: "weekly-time", label: "每周可投入时间", resourceType: "time", available: 8, unit: "小时/周", minimum: 2, maximum: 16, usePerTick: 1, classification: "fact", evidenceSummary: "用户明确确认的每周时间" },
          { key: "monthly-budget", label: "每月预算", resourceType: "budget", available: 1200, unit: "元/月", minimum: 0, maximum: 2500, usePerTick: null, classification: "assumption", evidenceSummary: "预算仍待复核" },
        ],
        constraints: [
          { key: "project-deadline", label: "项目截止期限", resourceKey: "weekly-time", rule: { kind: "before_time", value: "2026-12-01T00:00:00.000Z" }, classification: "fact", evidenceSummary: "用户确认的项目期限" },
        ],
      },
    });

    const projection = buildRealityWorldProjection(draft, { graphLocked: true, latestRunEvent: null });

    expect(projection.world.resources).toEqual([
      { kind: "structured_resource", label: "每周可投入时间", classification: "fact", evidenceSummary: "用户明确确认的每周时间", available: 8, unit: "小时/周", minimum: 2, maximum: 16, usePerTick: 1 },
      { kind: "structured_resource", label: "每月预算", classification: "assumption", evidenceSummary: "预算仍待复核", available: 1200, unit: "元/月", minimum: 0, maximum: 2500, usePerTick: null },
    ]);
    expect(projection.world.constraints).toEqual([
      { kind: "structured_constraint", label: "项目截止期限", classification: "fact", evidenceSummary: "用户确认的项目期限", resourceLabel: "每周可投入时间", deadline: "2026-12-01T00:00:00.000Z" },
    ]);
    expect(projection.reality.dimensions).toContainEqual({ label: "资源", facts: 1, assumptions: 1, unknowns: 0 });
    expect(projection.reality.dimensions).toContainEqual({ label: "约束", facts: 1, assumptions: 0, unknowns: 0 });
    expect(projection.reality.facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "每周可投入时间" }),
      expect.objectContaining({ label: "项目截止期限" }),
    ]));
    expect(projection.reality.assumptions).toEqual([expect.objectContaining({ label: "每月预算" })]);
    expect(JSON.stringify(projection)).not.toContain("weekly-time");
    expect(JSON.stringify(projection)).not.toContain("project-deadline");
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

  it("keeps long-horizon life-model domains explicit and separately classified", () => {
    const draft = realityProfileDraftSchema.parse({
      ...createEmptyRealityProfileDraft(4),
      lifeModelDomains: {
        version: 1,
        identity: [{ value: "正在照护家庭", classification: "fact", evidenceSummary: "本人确认的当前责任" }],
        career: [{ value: "考虑管理路线", classification: "assumption", evidenceSummary: "尚未作出决定" }],
        wealth: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
        relationships: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
        environment: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
        lifeStage: [{ value: "", classification: "unknown", evidenceSummary: "明确未知" }],
      },
    });

    const projection = buildRealityWorldProjection(draft, { graphLocked: false, latestRunEvent: null });

    expect(projection.reality.facts).toContainEqual({ label: "身份结构：正在照护家庭", evidenceSummary: "本人确认的当前责任" });
    expect(projection.reality.assumptions).toContainEqual({ label: "职业结构：考虑管理路线", evidenceSummary: "尚未作出决定" });
    expect(projection.reality.unknowns).toEqual(expect.arrayContaining([
      { label: "财富结构" }, { label: "关系生态" }, { label: "城市与生活环境" }, { label: "人生阶段" },
    ]));
    expect(projection.reality.dimensions).toContainEqual({ label: "身份结构", facts: 1, assumptions: 0, unknowns: 0 });
    expect(projection.reality.dimensions).toContainEqual({ label: "职业结构", facts: 0, assumptions: 1, unknowns: 0 });
    expect(projection.reality.dimensions).toContainEqual({ label: "财富结构", facts: 0, assumptions: 0, unknowns: 1 });
  });

  it("keeps legacy resource prose unmodeled while accepting explicit typed world inputs", () => {
    const legacy = realityProfileDraftSchema.parse({
      ...createEmptyRealityProfileDraft(),
      resources: { value: "每周大约 8 小时", classification: "fact", evidenceSummary: "用户描述" },
    });

    expect(legacy.worldInputs).toEqual({ version: 1, resources: [], constraints: [] });

    const structured = realityProfileDraftSchema.safeParse({
      ...legacy,
      worldInputs: {
        version: 1,
        resources: [{
          key: "weekly-time",
          label: "每周可投入时间",
          resourceType: "time",
          available: 8,
          unit: "小时/周",
          minimum: 2,
          maximum: 16,
          usePerTick: 1,
          classification: "fact",
          evidenceSummary: "用户明确确认的可用时间",
        }],
        constraints: [{
          key: "project-deadline",
          label: "项目截止时间",
          resourceKey: "weekly-time",
          rule: { kind: "before_time", value: "2026-12-01T00:00:00.000Z" },
          classification: "fact",
          evidenceSummary: "用户确认的项目期限",
        }],
      },
    });

    expect(structured.success).toBe(true);
    if (structured.success) {
      expect(structured.data.worldInputs.resources[0]).toMatchObject({ available: 8, minimum: 2, maximum: 16, usePerTick: 1 });
      expect(structured.data.worldInputs.constraints[0]?.resourceKey).toBe("weekly-time");
    }
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
