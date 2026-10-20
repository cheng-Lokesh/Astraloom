import { describe, expect, it } from "vitest";
import { businessFixture, confirmFixture, fixtureDigest } from "./business.test-fixtures";
import { buildLifeClimateB3Run } from "./index";

function guardedReadFixture(deadline: string, duplicateConstraint = false) {
  const fixture = businessFixture();
  fixture.request.model.commonRules = [];
  fixture.request.model.assumptions.find((item) => item.id === "initial-effort")!.value = "200";
  fixture.request.model.alternatives[0].rules = fixture.request.model.alternatives[0].rules.filter((rule) => rule.kind !== "relocation");
  fixture.request.model.alternatives[0].rules.find((rule) => rule.kind === "investment_cycle")!.stages = [3];
  fixture.request.model.alternatives[0].rules.find((rule) => rule.kind === "transition_readiness")!.stages = [1];
  fixture.request.model.alternatives[1].rules = [];
  const keys = duplicateConstraint ? ["cash-window", "second-cash-window"] : ["cash-window"];
  fixture.source.view.profile.worldInputs.constraints = keys.map((key) => ({ key, label: "储备来源期限", resourceKey: "cash", rule: { kind: "before_time", value: deadline }, classification: "fact", evidenceSummary: "本人确认的资源期限" }));
  fixture.source.sourceContext = fixtureDigest(fixture.source.view);
  const request = confirmFixture({ ...fixture.request, sourceContext: fixture.source.sourceContext, model: { ...fixture.request.model, constraintBindings: keys.map((constraintKey) => ({ constraintKey, mode: "source_deadline" })) } });
  return { source: fixture.source, request };
}

describe("B3 current-resource guard deadline propagation", () => {
  it.each([
    ["2026-10-19T00:00:00.000Z", "constrained", "guard_constrained"],
    ["2027-01-01T00:00:00.000Z", "unknown", "guard_unknown"],
    ["2030-01-01T00:00:00.000Z", "conditions_met", "transition_readiness"],
  ] as const)("applies %s to readiness that reads current cash without consuming it", async (deadline, status, kind) => {
    const { source, request } = guardedReadFixture(deadline, true);
    const run = await buildLifeClimateB3Run(source, request);
    const path = run.paths.find((item) => item.id === "move-first")!;
    expect(path.stages[0].transitions).toContainEqual({ ruleId: "gate-moving", domain: "career", status });
    const event = run.events.find((item) => item.pathId === path.id && item.ruleId === "gate-moving" && item.stageIndex === 1)!;
    expect(event.kind).toBe(kind);
    expect(event.sourceRefs).toEqual(expect.arrayContaining(["worldInputs.constraints.cash-window", "worldInputs.constraints.second-cash-window"]));
    expect(run.claims.find((claim) => claim.evidenceEventIds.includes(event.id))!.sourceRefs).toEqual(event.sourceRefs);
  });

  it.each([
    ["2026-10-19T00:00:00.000Z", "guard_constrained", false],
    ["2027-01-01T00:00:00.000Z", "guard_unknown", false],
    ["2030-01-01T00:00:00.000Z", "structure_transition", true],
  ] as const)("applies %s equally to a structural rule that only reads current cash", async (deadline, kind, changed) => {
    const fixture = guardedReadFixture(deadline, true);
    fixture.request.model.assumptions.push({ id: "cash-guarded-state", kind: "state", label: "当前储备前提结构", evidenceSummary: "本人明确的结构前提", value: "当前储备条件允许的结构" });
    fixture.request.model.alternatives[0].rules.push({ id: "cash-read-structure", kind: "guarded_structure_transition", label: "只检查当前储备", order: 1, stages: [1], sourceRefs: [], assumptionRefs: ["cash-guarded-state", "required-reserve"], guard: { all: [{ kind: "resource_at_least", resourceId: "cash", amountAssumptionId: "required-reserve" }] }, effects: [{ targetEntryKey: "lifeModelDomains.identity.1", valueAssumptionId: "cash-guarded-state" }] });
    const run = await buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request));
    const event = run.events.find((item) => item.ruleId === "cash-read-structure")!;
    expect(event.kind).toBe(kind);
    expect(event.sourceRefs).toEqual(expect.arrayContaining(["worldInputs.constraints.cash-window", "worldInputs.constraints.second-cash-window"]));
    expect(run.paths[1].stages[0].lifeModelDomains.identity[0].value).toBe(changed ? "当前储备条件允许的结构" : fixture.source.view.profile.lifeModelDomains.identity[0].value);
  });

  it("does not apply a current cash deadline to a transition that reads only historical cumulative investment", async () => {
    const fixture = guardedReadFixture("2026-10-19T00:00:00.000Z");
    fixture.request.model.assumptions.push({ id: "historical-structure", kind: "state", label: "历史投入条件", evidenceSummary: "本人确认的条件结构", value: "历史累计投入门槛已满足" });
    fixture.request.model.alternatives[0].rules.push({ id: "historical-investment-only", kind: "guarded_structure_transition", label: "仅检查既有投入", order: 1, stages: [1], sourceRefs: [], assumptionRefs: ["historical-structure", "required-effort"], guard: { all: [{ kind: "investment_at_least", investmentId: "moving-effort", amountAssumptionId: "required-effort" }] }, effects: [{ targetEntryKey: "lifeModelDomains.lifeStage.1", valueAssumptionId: "historical-structure" }] });
    const run = await buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request));
    expect(run.paths[1].stages[0].investments[0].amount).toBe("200");
    expect(run.paths[1].stages[0].lifeModelDomains.lifeStage[0].value).toBe("历史累计投入门槛已满足");
    expect(run.events.find((item) => item.ruleId === "historical-investment-only")!.sourceRefs).not.toContain("worldInputs.constraints.cash-window");
  });
});
