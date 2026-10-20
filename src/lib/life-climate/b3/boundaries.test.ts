import { describe, expect, it } from "vitest";
import { businessFixture, confirmFixture, fixtureDigest, sourceFixture } from "./business.test-fixtures";
import { buildLifeClimateB3Run } from "./index";

function maximumFlows() {
  const source = sourceFixture();
  const rule = (id: string, order: number) => ({ id, label: "明确阶段补给", order, stages: [1, 2, 3, 4, 5], assumptionRefs: ["one-unit"], sourceRefs: ["worldInputs.resources.cash"], guard: null, kind: "recurring_resource_flow", resourceId: "cash", direction: "credit", obligation: "required", amountByStage: [1, 2, 3, 4, 5].map((stageIndex) => ({ stageIndex, amountAssumptionId: "one-unit" })) });
  const request = confirmFixture({ version: "life-climate-b3-v1", horizon: "5_years", periodUnit: "year", profileRevision: 7, sourceContext: source.sourceContext,
    model: { constraintBindings: [], resources: [{ id: "cash", label: "生活储备", resourceType: "budget", unit: "元", initial: { kind: "profile_resource", resourceKey: "cash" }, minimum: "0", maximum: "1000000" }], assumptions: [{ id: "one-unit", label: "每阶段一元补给", evidenceSummary: "逐项明确的补给假设", kind: "quantity", value: "1", unit: "元", periodUnit: "year" }],
      commonRules: Array.from({ length: 16 }, (_, order) => rule(`common-${order}`, order)), alternatives: ["path-a", "path-b", "path-c"].map((id) => ({ id, label: `明确路径 ${id}`, rules: Array.from({ length: 24 }, (_, index) => rule(`${id}-flow-${index}`, index + 16)) })) }, symbolic: { enabled: false } });
  return { source, request };
}

describe("B3 accepted-model output bounds", () => {
  it("preserves all 200 required flow records for a maximum-size five-year path", async () => {
    const { source, request } = maximumFlows();
    const run = await buildLifeClimateB3Run(source, request);
    expect(run.paths[1].stages[4].obligations).toHaveLength(200);
    expect(run.paths[1].stages[4].resources[0].balance).toBe("120200");
  });
  it("retains all 280 baseline-and-alternative resource evidence references without truncation", async () => {
    const { source, request } = maximumFlows();
    const run = await buildLifeClimateB3Run(source, request);
    expect(run.comparisons.find((item) => item.alternativePathId === "path-a" && item.stageIndex === 5)!.resourceDifferences[0].evidenceEventIds).toHaveLength(280);
    expect(run.events).toHaveLength(680);
  });
  it("supports twelve simultaneous structure effects including all 24 value and classification changes", async () => {
    const fixture = businessFixture();
    for (const key of ["identity", "career", "wealth", "relationships", "environment", "lifeStage"] as const) { fixture.source.view.profile.lifeModelDomains[key][0].classification = "fact"; fixture.source.view.profile.lifeModelDomains[key].push({ value: "第二项当前背景", classification: "fact", evidenceSummary: "本人补充的背景" }); }
    fixture.source.sourceContext = fixtureDigest(fixture.source.view);
    fixture.request.sourceContext = fixture.source.sourceContext;
    const effects = ["identity", "career", "wealth", "relationships", "environment", "lifeStage"].flatMap((key) => [1, 2].map((index) => ({ targetEntryKey: `lifeModelDomains.${key}.${index}`, valueAssumptionId: `structure-${key.toLowerCase()}-${index}` })));
    fixture.request.model.assumptions.push(...effects.map((effect) => ({ id: effect.valueAssumptionId, label: "明确结构条件", evidenceSummary: "本人设定的结构条件", kind: "state" as const, value: "条件满足后的结构安排" })));
    fixture.request.model.alternatives[1].rules.push({ id: "twelve-effects", label: "守卫后的十二项结构变化", order: 1, stages: [2], assumptionRefs: effects.map((effect) => effect.valueAssumptionId), sourceRefs: effects.map((effect) => effect.targetEntryKey), guard: { all: [{ kind: "rule_executed", ruleId: "learn-local" }] }, kind: "guarded_structure_transition", effects });
    const run = await buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request));
    const event = run.events.find((item) => item.ruleId === "twelve-effects")!;
    expect(event.before).toHaveLength(24);
    expect(event.after).toHaveLength(24);
  });
});
