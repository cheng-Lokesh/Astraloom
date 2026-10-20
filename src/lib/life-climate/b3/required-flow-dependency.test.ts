import { describe, expect, it } from "vitest";
import { businessFixture, confirmFixture, fixtureDigest } from "./business.test-fixtures";
import { buildLifeClimateB3Run } from "./index";

function recurringDependencyFixture(mode: "unfunded" | "unknown" | "not_applicable") {
  const fixture = businessFixture();
  const expense = fixture.request.model.commonRules.find((rule) => rule.id === "old-city-living")!;
  expense.guard = null;
  expense.assumptionRefs = ["old-living-year"];
  fixture.request.model.assumptions.find((item) => item.id === "old-living-year")!.value = "100000";
  fixture.request.model.commonRules = [expense];
  fixture.request.model.assumptions.push({ id: "after-payment-state", label: "本期义务完成后的结构条件", evidenceSummary: "本人明确设定的依赖条件", kind: "state", value: "已满足本期付款前提的结构" });
  fixture.request.model.alternatives[0].rules = [{ id: "after-current-payment", label: "依赖本期义务", order: 0, stages: [2], kind: "guarded_structure_transition", sourceRefs: [], assumptionRefs: ["after-payment-state"], guard: { all: [{ kind: "rule_executed", ruleId: "old-city-living" }] }, effects: [{ targetEntryKey: "lifeModelDomains.identity.1", valueAssumptionId: "after-payment-state" }] }];
  fixture.request.model.alternatives[1].rules = [];
  if (mode === "unknown") {
    fixture.request.model.assumptions.push({ id: "unknown-payment", label: "第二期支出未知", evidenceSummary: "本人明确保留未知", kind: "quantity", value: null, unit: "元", periodUnit: "year" });
    expense.assumptionRefs.push("unknown-payment");
    expense.amountByStage = [1, 2, 3].map((stageIndex) => ({ stageIndex, amountAssumptionId: stageIndex === 2 ? "unknown-payment" : "old-living-year" }));
  }
  if (mode === "not_applicable") {
    expense.guard = { all: [{ kind: "source_state_is", sourceEntryKey: "externalVariables.1", valueAssumptionId: "support-available" }] };
    expense.assumptionRefs.push("support-available");
    fixture.request.model.commonRules.push({ id: "stop-payment-condition", kind: "scenario_change", label: "本期条件不再适用", order: 0, stages: [2], sourceEntryKey: "externalVariables.1", valueAssumptionId: "support-reduced", sourceRefs: [], assumptionRefs: ["support-reduced"], guard: null });
  }
  return { source: fixture.source, request: confirmFixture(fixture.request) };
}

describe("B3 repeated required obligation dependency", () => {
  it.each(["unfunded", "unknown", "not_applicable"] as const)("does not reuse an earlier success when the latest required flow is %s", async (mode) => {
    const { source, request } = recurringDependencyFixture(mode);
    const run = await buildLifeClimateB3Run(source, request);
    const path = run.paths[1];
    expect(path.stages[0].obligations[0].status).toBe("fulfilled");
    expect(path.stages[1].obligations.find((item) => item.ruleId === "old-city-living" && item.stageIndex === 2)!.status).toBe(mode);
    expect(path.stages[1].lifeModelDomains.identity[0]).toEqual(source.view.profile.lifeModelDomains.identity[0]);
    expect(run.events.some((event) => event.pathId === path.id && event.ruleId === "after-current-payment" && event.kind === "structure_transition")).toBe(false);
    if (mode === "unknown") expect(run.events.find((event) => event.pathId === path.id && event.ruleId === "after-current-payment")!.kind).toBe("guard_unknown");
  });

  it("preserves a completed one-time payment and completed learning as historical prerequisites after current resources expire", async () => {
    const fixture = businessFixture();
    const investment = fixture.request.model.alternatives[0].rules.find((rule) => rule.kind === "investment_cycle")!;
    investment.stages = [1];
    fixture.request.model.commonRules = [];
    fixture.request.model.assumptions.find((item) => item.id === "required-effort")!.value = "100";
    fixture.request.model.assumptions.push({ id: "historical-result", kind: "state", label: "历史前提结构", evidenceSummary: "本人明确的历史依赖", value: "既有投入与一次行动完成后的结构" });
    fixture.request.model.alternatives[0].rules = [investment,
      { id: "one-payment", kind: "one_time_resource_change", label: "一次付款", order: 0, stages: [1], resourceId: "cash", direction: "debit", amountAssumptionId: "moving-cost", sourceRefs: [], assumptionRefs: ["moving-cost"], guard: null },
      { id: "historical-completion", kind: "guarded_structure_transition", label: "检查历史已完成条件", order: 0, stages: [2], sourceRefs: [], assumptionRefs: ["historical-result", "required-effort"], guard: { all: [{ kind: "rule_executed", ruleId: "one-payment" }, { kind: "investment_at_least", investmentId: "moving-effort", amountAssumptionId: "required-effort" }] }, effects: [{ targetEntryKey: "lifeModelDomains.lifeStage.1", valueAssumptionId: "historical-result" }] },
    ];
    fixture.request.model.alternatives[1].rules = [];
    fixture.source.view.profile.worldInputs.constraints = ["cash", "study-time"].map((resourceKey) => ({ key: `${resourceKey}-deadline`, label: "来源资源期限", resourceKey, rule: { kind: "before_time", value: "2027-10-20T00:00:00.000Z" }, classification: "fact", evidenceSummary: "本人确认的资源期限" }));
    fixture.source.sourceContext = fixtureDigest(fixture.source.view);
    const request = confirmFixture({ ...fixture.request, sourceContext: fixture.source.sourceContext, model: { ...fixture.request.model, constraintBindings: fixture.source.view.profile.worldInputs.constraints.map((constraint) => ({ constraintKey: constraint.key, mode: "source_deadline" })) } });
    const run = await buildLifeClimateB3Run(fixture.source, request);
    expect(run.paths[1].stages[1].constraints.every((constraint) => constraint.status === "constrained")).toBe(true);
    expect(run.paths[1].stages[1].investments[0].amount).toBe("100");
    expect(run.paths[1].stages[1].lifeModelDomains.lifeStage[0].value).toBe("既有投入与一次行动完成后的结构");
    expect(run.events.find((event) => event.ruleId === "historical-completion")!.kind).toBe("structure_transition");
  });
});
