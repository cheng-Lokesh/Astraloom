import { describe, expect, it } from "vitest";

import { businessFixture, confirmFixture } from "./business.test-fixtures";
import {
  buildLifeClimateB3Run,
  lifeClimateB3PublicRunSchema,
  lifeClimateB3RequestSchema,
  projectLifeClimateB3Run,
  validateLifeClimateB3Run,
} from "./index";

/* Prepared specifications. Missing-module/setup failures do not satisfy the RED gate. */
describe("B3 strict public contracts and replay authority", () => {
  it("derives actual source dependencies even when a newly confirmed request omits its optional sourceRef annotations", async () => {
    const fixture = businessFixture();
    for (const rule of [...fixture.request.model.commonRules, ...fixture.request.model.alternatives.flatMap((path) => path.rules)]) rule.sourceRefs = [];
    const run = await buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request));
    expect(run.events.find((event) => event.ruleId === "work-income")!.sourceRefs).toContain("worldInputs.resources.cash");
    const relocation = run.events.find((event) => event.ruleId === "move-early")!;
    expect(relocation.sourceRefs).toEqual(expect.arrayContaining(["worldInputs.resources.cash", "lifeModelDomains.environment.1"]));
    const scenario = run.events.find((event) => event.ruleId === "support-drop")!;
    expect(scenario.sourceRefs).toContain("externalVariables.1");
    const living = run.events.find((event) => event.ruleId === "new-city-living")!;
    expect(living.sourceRefs).toContain("lifeModelDomains.environment.1");
    expect(run.claims.find((claim) => claim.evidenceEventIds.includes(relocation.id))!.sourceRefs).toEqual(relocation.sourceRefs);
  });
  it("rejects two declarations that duplicate the same frozen resource balance under different ids", async () => {
    const fixture = businessFixture();
    fixture.request.model.resources.push({ ...structuredClone(fixture.request.model.resources[0]), id: "cash-duplicate", label: "重复储备声明" });
    await expect(buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request))).rejects.toMatchObject({ code: "invalid_b3_request" });
  });
  it.each(["1e5", "-1", "12000.0000001", "Infinity", "NaN", "01", " 100 "])("rejects the noncanonical or inexact quantity %s without silently normalizing it", async (value) => {
    const fixture = businessFixture();
    fixture.request.model.assumptions.find((assumption) => assumption.id === "salary-year")!.value = value;
    const request = confirmFixture(fixture.request);
    expect(lifeClimateB3RequestSchema.safeParse(request).success).toBe(false);
    await expect(buildLifeClimateB3Run(fixture.source, request)).rejects.toMatchObject({ code: "invalid_b3_request" });
  });

  it("rejects missing, repeated or extra confirmations rather than trusting a matching digest alone", async () => {
    const { source, request } = businessFixture();
    for (const mutation of [
      { ...request.confirmation, assumptionIds: request.confirmation.assumptionIds.slice(1) },
      { ...request.confirmation, ruleIds: [...request.confirmation.ruleIds, request.confirmation.ruleIds[0]] },
      { ...request.confirmation, pathIds: [...request.confirmation.pathIds, "unrelated-path"] },
      { ...request.confirmation, reviewedSource: false },
    ]) {
      await expect(buildLifeClimateB3Run(source, { ...request, confirmation: mutation })).rejects.toBeInstanceOf(Error);
    }
  });

  it("rejects source scope, engine version, unknown input fields and cross-path rule dependencies", async () => {
    const fixture = businessFixture();
    expect(lifeClimateB3RequestSchema.safeParse({ ...fixture.request, version: "life-climate-b2-v1" }).success).toBe(false);
    expect(lifeClimateB3RequestSchema.safeParse({ ...fixture.request, ownerId: "owner-selected-by-client" }).success).toBe(false);
    expect(lifeClimateB3RequestSchema.safeParse({ ...fixture.request, periodUnit: undefined }).success).toBe(false);
    const crossPath = structuredClone(fixture.request);
    crossPath.model.alternatives[0].rules.find((rule) => rule.id === "gate-moving")!.guard = { all: [{ kind: "rule_executed", ruleId: "learn-local" }] };
    await expect(buildLifeClimateB3Run(fixture.source, confirmFixture(crossPath))).rejects.toMatchObject({ code: "invalid_b3_request" });
    await expect(buildLifeClimateB3Run({ ...fixture.source, binding: { ...fixture.source.binding, profileRevision: 6 } }, fixture.request)).rejects.toMatchObject({ code: "invalid_b3_source" });
  });

  it("rejects a quantity whose explicit unit disagrees with the selected resource", async () => {
    const fixture = businessFixture();
    const time = fixture.request.model.assumptions.find((assumption) => assumption.id === "learning-time")!;
    if (time.kind !== "quantity") throw new Error("Fixture must have an explicit time quantity.");
    time.unit = "天";
    await expect(buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request))).rejects.toMatchObject({ code: "invalid_b3_request" });
  });

  it("does not accept a per-year amount as a per-quarter amount merely because the outer horizon and confirmations changed", async () => {
    const fixture = businessFixture();
    const changed = confirmFixture({ ...fixture.request, horizon: "1_year", periodUnit: "quarter" });
    await expect(buildLifeClimateB3Run(fixture.source, changed)).rejects.toMatchObject({ code: "invalid_b3_request" });
  });

  it("projects a strict public run without private server binding and preserves full-source replay separately", async () => {
    const { source, request } = businessFixture();
    const run = await buildLifeClimateB3Run(source, request);
    const publicRun = projectLifeClimateB3Run(run);
    expect(publicRun.sourceSnapshot).not.toHaveProperty("binding");
    expect(publicRun.sourceSnapshot.view).toEqual(source.view);
    expect(lifeClimateB3PublicRunSchema.safeParse(publicRun).success).toBe(true);
    expect(lifeClimateB3PublicRunSchema.safeParse({ ...publicRun, sourceSnapshot: { ...publicRun.sourceSnapshot, binding: source.binding } }).success).toBe(false);
    await expect(validateLifeClimateB3Run(source, request, publicRun)).rejects.toBeInstanceOf(Error);
    expect(run.sourceSnapshot.binding).toEqual(source.binding);
  });

  it("rejects extra persisted fields and changed comparisons instead of parsing them into a self-consistent-looking history", async () => {
    const { source, request } = businessFixture();
    const run = await buildLifeClimateB3Run(source, request);
    await expect(validateLifeClimateB3Run(source, request, { ...run, realWorldProbability: 0.9 })).rejects.toMatchObject({ code: "b3_semantic_mismatch" });
    const changed = structuredClone(run);
    changed.comparisons[0].resourceDifferences[0].difference = "123456";
    await expect(validateLifeClimateB3Run(source, request, changed)).rejects.toMatchObject({ code: "b3_semantic_mismatch" });
  });
});
