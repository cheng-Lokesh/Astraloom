import { createHash } from "node:crypto";

import { createEmptyRealityProfileDraft, type RealityProfileDraft } from "@/lib/reality-profile/profile";

/** Test-side independent canonical hashing; production/browser contracts must not import this file. */
export function canonicalFixtureJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalFixtureJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalFixtureJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function fixtureDigest(value: unknown): string {
  return createHash("sha256").update(canonicalFixtureJson(value)).digest("hex");
}

export function profileFixture(): RealityProfileDraft {
  const profile = createEmptyRealityProfileDraft(7);
  const field = (value: string) => ({ value, classification: "fact" as const, evidenceSummary: "本人确认的当前资料" });
  return {
    ...profile,
    externalVariables: [field("首年支持安排仍可用")],
    lifeModelDomains: {
      version: 1,
      identity: [field("当前工作者与家庭成员")],
      career: [field("当前工作安排")],
      wealth: [field("已有独立生活储备")],
      relationships: [field("保留当前支持网络")],
      environment: [field("原城市")],
      lifeStage: [{ value: "转型准备期", classification: "assumption", evidenceSummary: "本人目前的阶段判断" }],
    },
    worldInputs: {
      version: 1,
      resources: [
        { key: "cash", label: "生活储备", resourceType: "budget", available: 120000, unit: "元", minimum: 0, maximum: 1000000, usePerTick: null, classification: "fact", evidenceSummary: "本人确认的现有储备" },
        { key: "study-time", label: "可投入时间存量", resourceType: "time", available: 600, unit: "小时", minimum: 0, maximum: 1000, usePerTick: null, classification: "fact", evidenceSummary: "本人确认的一次有限时间存量" },
      ],
      constraints: [],
    },
  };
}

export function sourceFixture(profile = profileFixture()) {
  const seedContextId = "00000000-0000-4000-8000-000000000701";
  const view = {
    version: "life-climate-b3-source-view-v1" as const,
    scopeKey: createHash("sha256").update(seedContextId).digest("hex"),
    profile,
  };
  return {
    version: "life-climate-b3-source-v1" as const,
    view,
    sourceContext: fixtureDigest(view),
    binding: { seedContextId, profileRevision: profile.revision, assessedAt: "2026-10-20T00:00:00.000Z" },
    symbolic: null,
  };
}

type Quantity = { id: string; label: string; evidenceSummary: string; kind: "quantity"; value: string | null; unit: string; periodUnit: "once" | "quarter" | "year" };
type StateAssumption = { id: string; label: string; evidenceSummary: string; kind: "state"; value: string | null };
type Rule = ReturnType<typeof ruleBase> & Record<string, unknown>;

function quantity(id: string, value: string | null, unit: string, periodUnit: Quantity["periodUnit"] = "year"): Quantity {
  return { id, label: `明确量条件：${id.replaceAll("-", " ")}`, evidenceSummary: "本人逐项设定并确认的沙盘假设", kind: "quantity", value, unit, periodUnit };
}

function state(id: string, value: string | null): StateAssumption {
  return { id, label: "明确状态条件", evidenceSummary: "本人设定的条件情景", kind: "state", value };
}

function ruleBase(id: string, order: number, stages: number[], assumptionRefs: string[], sourceRefs: string[] = []) {
  return { id, label: "本人确认的阶段规则", order, stages, assumptionRefs, sourceRefs, guard: null as null | { all: Array<Record<string, unknown>> } };
}

/** Recompute confirmations only for deliberate user re-confirmation in a test. */
export function confirmFixture<T extends { model: { assumptions: Array<{ id: string }>; commonRules: Array<{ id: string }>; alternatives: Array<{ id: string; rules: Array<{ id: string }> }> } }>(request: T) {
  const withoutConfirmation = { ...request } as T & { confirmation?: unknown };
  delete withoutConfirmation.confirmation;
  return {
    ...withoutConfirmation,
    confirmation: {
      context: fixtureDigest(withoutConfirmation),
      assumptionIds: request.model.assumptions.map((assumption) => assumption.id),
      ruleIds: [...request.model.commonRules, ...request.model.alternatives.flatMap((path) => path.rules)].map((rule) => rule.id),
      pathIds: ["baseline", ...request.model.alternatives.map((path) => path.id)],
      reviewedSource: true as const,
    },
  };
}

export function businessFixture() {
  const source = sourceFixture();
  const assumptions: Array<Quantity | StateAssumption> = [
    quantity("salary-year", "144000", "元"),
    quantity("old-living-year", "120000", "元"),
    quantity("new-living-year", "132000", "元"),
    quantity("support-first-year", "12000", "元"),
    quantity("moving-cost", "30000", "元", "once"),
    quantity("learning-cost", "12000", "元"),
    quantity("learning-time", "100", "小时"),
    quantity("initial-effort", "0", "小时", "once"),
    quantity("required-effort", "200", "小时", "once"),
    quantity("required-reserve", "110000", "元", "once"),
    state("old-city", "原城市"),
    state("new-city", "新城市"),
    state("support-reduced", "后续支持减少为零的情景"),
    state("support-available", "首年支持安排仍可用"),
  ];
  const yearly = (amountAssumptionId: string, stages = [1, 2, 3]) => stages.map((stageIndex) => ({ stageIndex, amountAssumptionId }));
  const flow = (id: string, order: number, direction: "credit" | "debit", amountAssumptionId: string, stages = [1, 2, 3]): Rule => ({
    ...ruleBase(id, order, stages, [amountAssumptionId], ["worldInputs.resources.cash"]),
    kind: "recurring_resource_flow", resourceId: "cash", direction,
    amountByStage: yearly(amountAssumptionId, stages), obligation: "required",
  });
  const oldLiving = flow("old-city-living", 3, "debit", "old-living-year");
  oldLiving.assumptionRefs.push("old-city");
  oldLiving.sourceRefs.push("lifeModelDomains.environment.1");
  oldLiving.guard = { all: [{ kind: "source_state_is", sourceEntryKey: "lifeModelDomains.environment.1", valueAssumptionId: "old-city" }] };
  const newLiving = flow("new-city-living", 4, "debit", "new-living-year");
  newLiving.assumptionRefs.push("new-city");
  newLiving.sourceRefs.push("lifeModelDomains.environment.1");
  newLiving.guard = { all: [{ kind: "source_state_is", sourceEntryKey: "lifeModelDomains.environment.1", valueAssumptionId: "new-city" }] };
  const support = flow("conditional-support", 1, "credit", "support-first-year");
  support.assumptionRefs.push("support-available");
  support.sourceRefs.push("externalVariables.1");
  support.guard = { all: [{ kind: "source_state_is", sourceEntryKey: "externalVariables.1", valueAssumptionId: "support-available" }] };
  const commonRules: Rule[] = [
    { ...ruleBase("support-drop", 0, [2], ["support-reduced"], ["externalVariables.1"]), kind: "scenario_change", sourceEntryKey: "externalVariables.1", valueAssumptionId: "support-reduced" },
    flow("work-income", 0, "credit", "salary-year"),
    support,
    oldLiving,
    newLiving,
  ];
  const move = (id: string, stage: number): Rule => ({
    ...ruleBase(id, 0, [stage], ["moving-cost", "new-city"], ["lifeModelDomains.environment.1", "worldInputs.resources.cash"]),
    kind: "relocation", targetEntryKey: "lifeModelDomains.environment.1", valueAssumptionId: "new-city", budgetResourceId: "cash", costAmountAssumptionId: "moving-cost",
  });
  const learning = (id: string, investmentId: string): Rule => ({
    ...ruleBase(id, 0, [1, 2], ["initial-effort", "learning-time", "learning-cost"], ["worldInputs.resources.cash", "worldInputs.resources.study-time"]),
    kind: "investment_cycle", investmentId, initialProgressAssumptionId: "initial-effort", timeResourceId: "time", budgetResourceId: "cash", timeAmountAssumptionId: "learning-time", costAmountAssumptionId: "learning-cost",
  });
  const readiness = (id: string, investmentId: string): Rule => ({
    ...ruleBase(id, 0, [2, 3], ["required-effort", "required-reserve"], ["lifeModelDomains.career.1", "lifeModelDomains.lifeStage.1"]),
    kind: "transition_readiness", domain: "career", investmentId,
    guard: { all: [
      { kind: "investment_at_least", investmentId, amountAssumptionId: "required-effort" },
      { kind: "resource_at_least", resourceId: "cash", amountAssumptionId: "required-reserve" },
    ] },
  });
  const request = confirmFixture({
    version: "life-climate-b3-v1" as const,
    horizon: "3_years" as const,
    periodUnit: "year" as const,
    profileRevision: 7,
    sourceContext: source.sourceContext,
    model: {
      constraintBindings: [],
      resources: [
        { id: "cash", label: "生活储备", resourceType: "budget" as const, unit: "元", initial: { kind: "profile_resource" as const, resourceKey: "cash" }, minimum: "0", maximum: "1000000" },
        { id: "time", label: "可投入时间存量", resourceType: "time" as const, unit: "小时", initial: { kind: "profile_resource" as const, resourceKey: "study-time" }, minimum: "0", maximum: "1000" },
      ],
      assumptions,
      commonRules,
      alternatives: [
        { id: "move-first", label: "先迁居并投入学习", rules: [move("move-early", 1), learning("learn-moving", "moving-effort"), readiness("gate-moving", "moving-effort")] },
        { id: "accumulate-first", label: "先积累学习再迁居", rules: [move("move-later", 3), learning("learn-local", "local-effort"), readiness("gate-local", "local-effort")] },
      ],
    },
    symbolic: { enabled: false as const },
  });
  return { source, request };
}
