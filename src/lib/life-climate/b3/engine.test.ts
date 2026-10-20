import { describe, expect, it } from "vitest";

import { businessFixture, confirmFixture, fixtureDigest, sourceFixture } from "./business.test-fixtures";
import {
  buildLifeClimateB3Run,
  createLifeClimateB3ConfirmationContext,
  createLifeClimateB3SourceContext,
  lifeClimateB3RequestSchema,
  validateLifeClimateB3Run,
} from "./index";

/* Preparation only until the API runtime RED is executed and its checkpoint accepted.
 * A missing index module is not the business RED evidence for these specifications. */
describe("B3 explicit long-horizon structure engine", () => {
  it("derives reserve and readiness differences from relocation, finite learning investment and reduced support", async () => {
    const { source, request } = businessFixture();
    const run = await buildLifeClimateB3Run(source, request);
    const cash = (id: string) => run.paths.find((path) => path.id === id)!.stages.map((stage) => stage.resources.find((resource) => resource.id === "cash")!.balance);

    expect(cash("baseline")).toEqual(["156000", "180000", "204000"]);
    expect(cash("move-first")).toEqual(["102000", "102000", "114000"]);
    expect(cash("accumulate-first")).toEqual(["144000", "156000", "138000"]);
    for (const pathId of ["move-first", "accumulate-first"]) {
      const path = run.paths.find((candidate) => candidate.id === pathId)!;
      expect(path.stages.map((stage) => stage.resources.find((resource) => resource.id === "time")!.balance)).toEqual(["500", "400", "400"]);
      expect(path.stages.map((stage) => stage.investments[0].amount)).toEqual(["100", "200", "200"]);
      expect(path.stages[2].lifeModelDomains.career[0]).toEqual(source.view.profile.lifeModelDomains.career[0]);
    }
    expect(run.paths.find((path) => path.id === "move-first")!.stages[1].transitions).toContainEqual(expect.objectContaining({ ruleId: "gate-moving", status: "constrained" }));
    expect(run.paths.find((path) => path.id === "move-first")!.stages[2].transitions).toContainEqual(expect.objectContaining({ ruleId: "gate-moving", status: "conditions_met" }));
    expect(run.paths.find((path) => path.id === "accumulate-first")!.stages[1].transitions).toContainEqual(expect.objectContaining({ ruleId: "gate-local", status: "conditions_met" }));
    expect(run.events.filter((event) => event.ruleId === "move-early")).toHaveLength(1);
    expect(run.events.filter((event) => event.ruleId === "move-later")).toHaveLength(1);
    expect(run.report).toMatchObject({ mode: "conditional_long_horizon_structure", includesExactDates: false, claimsUseEventEvidence: true });
    expect(await validateLifeClimateB3Run(source, request, run)).toEqual(run);
  });

  it("keeps complete frozen six-domain states and never grows resources from a static profile", async () => {
    const source = sourceFixture();
    source.view.profile.worldInputs.resources[0].usePerTick = 100;
    source.sourceContext = fixtureDigest(source.view);
    const request = confirmFixture({
      version: "life-climate-b3-v1", horizon: "5_years", periodUnit: "year", profileRevision: 7, sourceContext: source.sourceContext,
      model: {
        constraintBindings: [],
        resources: [{ id: "cash", label: "生活储备", resourceType: "budget", unit: "元", initial: { kind: "profile_resource", resourceKey: "cash" }, minimum: "0", maximum: "1000000" }],
        assumptions: [], commonRules: [],
        alternatives: [{ id: "pause-a", label: "保留当前结构", rules: [] }, { id: "pause-b", label: "稍后复核当前结构", rules: [] }],
      },
      symbolic: { enabled: false },
    });
    const before = structuredClone(source);
    const run = await buildLifeClimateB3Run(source, request);
    expect(source).toEqual(before);
    expect(run.events).toEqual([]);
    expect(run.claims).toEqual([]);
    for (const path of run.paths) {
      expect(path.stages).toHaveLength(5);
      for (const stage of path.stages) {
        expect(stage.lifeModelDomains).toEqual(source.view.profile.lifeModelDomains);
        expect(stage.resources[0].balance).toBe("120000");
      }
    }
  });

  it("does not turn unknown initial resources or learning progress into zero", async () => {
    const fixture = businessFixture();
    fixture.request.model.resources[0].initial = { kind: "unknown" } as never;
    fixture.request.model.assumptions.find((assumption) => assumption.id === "initial-effort")!.value = null;
    const request = confirmFixture(fixture.request);
    const run = await buildLifeClimateB3Run(fixture.source, request);
    for (const path of run.paths) {
      for (const stage of path.stages) {
        expect(stage.resources.find((resource) => resource.id === "cash")).toMatchObject({ balance: null, status: "unknown" });
        expect(stage.transitions.every((transition) => transition.status !== "conditions_met")).toBe(true);
      }
    }
    expect(run.comparisons.every((comparison) => comparison.resourceDifferences.filter((difference) => difference.resourceId === "cash").every((difference) => difference.difference === null))).toBe(true);
  });

  it("keeps an unaffordable relocation unexecuted instead of clipping its cost or using the same stage's future income", async () => {
    const fixture = businessFixture();
    fixture.source.view.profile.worldInputs.resources[0].available = 20000;
    fixture.source.sourceContext = fixtureDigest(fixture.source.view);
    fixture.request.sourceContext = fixture.source.sourceContext;
    const request = confirmFixture(fixture.request);
    const run = await buildLifeClimateB3Run(fixture.source, request);
    const first = run.paths.find((path) => path.id === "move-first")!.stages[0];
    expect(first.lifeModelDomains.environment[0]).toEqual(fixture.source.view.profile.lifeModelDomains.environment[0]);
    expect(first.resources.find((resource) => resource.id === "cash")!.balance).toBe("44000");
  });

  it("does not charge a learning budget or accumulate effort when its finite time stock is insufficient", async () => {
    const fixture = businessFixture();
    fixture.source.view.profile.worldInputs.resources[1].available = 50;
    fixture.source.sourceContext = fixtureDigest(fixture.source.view);
    fixture.request.sourceContext = fixture.source.sourceContext;
    const request = confirmFixture(fixture.request);
    const run = await buildLifeClimateB3Run(fixture.source, request);
    const first = run.paths.find((path) => path.id === "move-first")!.stages[0];
    expect(first.resources.find((resource) => resource.id === "cash")!.balance).toBe("114000");
    expect(first.resources.find((resource) => resource.id === "time")!.balance).toBe("50");
    expect(first.investments[0].amount).toBe("0");
  });

  it("leaves total learning unknown even after paid investment when its explicitly supplied initial total is unknown", async () => {
    const fixture = businessFixture();
    fixture.request.model.assumptions.find((assumption) => assumption.id === "initial-effort")!.value = null;
    const request = confirmFixture(fixture.request);
    const run = await buildLifeClimateB3Run(fixture.source, request);
    const second = run.paths.find((path) => path.id === "accumulate-first")!.stages[1];
    expect(second.investments[0]).toMatchObject({ amount: null, status: "unknown" });
    expect(second.transitions).toContainEqual(expect.objectContaining({ ruleId: "gate-local", status: "unknown" }));
  });

  it.each([
    ["1_year", "quarter", 4],
    ["3_years", "year", 3],
    ["5_years", "year", 5],
  ] as const)("uses %s with explicit %s stages without imposing a near-term cycle conversion", async (horizon, periodUnit, count) => {
    const source = sourceFixture();
    const request = confirmFixture({
      version: "life-climate-b3-v1", horizon, periodUnit, profileRevision: 7, sourceContext: source.sourceContext,
      model: { constraintBindings: [], resources: [], assumptions: [], commonRules: [], alternatives: [{ id: "path-a", label: "保留当前结构", rules: [] }, { id: "path-b", label: "稍后复核结构", rules: [] }] },
      symbolic: { enabled: false },
    });
    const run = await buildLifeClimateB3Run(source, request);
    expect(run.paths).toHaveLength(3);
    expect(run.paths.every((path) => path.stages.length === count)).toBe(true);
    expect(run.events).toEqual([]);
    expect(run.claims).toEqual([]);
  });

  it("requires explicit zero for known cumulative learning rather than filling a missing initial-progress assumption", async () => {
    const fixture = businessFixture();
    fixture.request.model.assumptions = fixture.request.model.assumptions.filter((assumption) => assumption.id !== "initial-effort");
    const request = confirmFixture(fixture.request);
    await expect(buildLifeClimateB3Run(fixture.source, request)).rejects.toMatchObject({ code: "invalid_b3_request" });
  });

  it("rejects changed horizon, period unit or stage amounts with a previous confirmation context", async () => {
    const fixture = businessFixture();
    expect(lifeClimateB3RequestSchema.safeParse({ ...fixture.request, horizon: "1_year" }).success).toBe(false);
    const changed = structuredClone(fixture.request);
    changed.model.assumptions.find((assumption) => assumption.id === "salary-year")!.value = "144001";
    await expect(buildLifeClimateB3Run(fixture.source, changed)).rejects.toMatchObject({ code: "b3_confirmation_mismatch" });
    const unitChanged = { ...fixture.request, horizon: "1_year", periodUnit: "quarter" };
    await expect(buildLifeClimateB3Run(fixture.source, unitChanged)).rejects.toBeInstanceOf(Error);
  });

  it("rejects source changes even when the client computes a valid confirmation for its obsolete source context", async () => {
    const fixture = businessFixture();
    fixture.source.view.profile.revision = 8;
    fixture.source.binding.profileRevision = 8;
    fixture.source.sourceContext = fixtureDigest(fixture.source.view);
    await expect(buildLifeClimateB3Run(fixture.source, fixture.request)).rejects.toMatchObject({ code: "b3_source_stale" });
  });

  it("makes every claim trace to actual same-run events and rejects historical numeric, order or evidence tampering", async () => {
    const { source, request } = businessFixture();
    const run = await buildLifeClimateB3Run(source, request);
    expect(run.claims.length).toBeGreaterThan(0);
    const events = new Map(run.events.map((event) => [event.id, event]));
    for (const claim of run.claims) {
      expect(claim.evidenceEventIds.length).toBeGreaterThan(0);
      for (const id of claim.evidenceEventIds) expect(events.get(id)?.pathId).toBe(claim.pathId);
    }
    for (const event of run.events) {
      for (const id of event.causalEventIds) {
        expect(events.get(id)?.pathId).toBe(event.pathId);
        expect(events.get(id)!.sequence).toBeLessThan(event.sequence);
      }
    }
    const badBalance = structuredClone(run);
    badBalance.paths[1].stages[2].resources[0].balance = "999999";
    await expect(validateLifeClimateB3Run(source, request, badBalance)).rejects.toMatchObject({ code: "b3_semantic_mismatch" });
    const badOrder = structuredClone(run);
    [badOrder.events[0], badOrder.events[1]] = [badOrder.events[1], badOrder.events[0]];
    await expect(validateLifeClimateB3Run(source, request, badOrder)).rejects.toMatchObject({ code: "b3_semantic_mismatch" });
    const badEvidence = structuredClone(run);
    const target = badEvidence.claims[0];
    target.evidenceEventIds = [badEvidence.events.find((event) => event.pathId !== target.pathId)!.id];
    await expect(validateLifeClimateB3Run(source, request, badEvidence)).rejects.toMatchObject({ code: "b3_semantic_mismatch" });
  });

  it("uses public deterministic SHA256 contexts without relying on private identity or browser-unavailable crypto imports", async () => {
    const { source, request } = businessFixture();
    expect(await createLifeClimateB3SourceContext(source.view)).toBe(source.sourceContext);
    const unconfirmed = Object.fromEntries(Object.entries(request).filter(([key]) => key !== "confirmation"));
    expect(await createLifeClimateB3ConfirmationContext(unconfirmed)).toBe(request.confirmation.context);
    expect(await buildLifeClimateB3Run(source, request)).toEqual(await buildLifeClimateB3Run(structuredClone(source), structuredClone(request)));
  });
});
