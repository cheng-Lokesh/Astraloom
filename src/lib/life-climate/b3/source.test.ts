import { describe, expect, it } from "vitest";
import { businessFixture, confirmFixture, fixtureDigest, sourceFixture } from "./business.test-fixtures";
import { buildLifeClimateB3Run, canonicalLifeClimateB3Json, createLifeClimateB3SourceContext, createLifeClimateB3SymbolicSource, getLifeClimateB3StageWindows, validateLifeClimateB3Run } from "./index";

function withDeadline(deadline: string) {
  const fixture = businessFixture();
  fixture.source.view.profile.worldInputs.constraints.push({ key: "funding-window", label: "储备使用期限", resourceKey: "cash", rule: { kind: "before_time", value: deadline }, classification: "fact", evidenceSummary: "本人确认的来源期限" });
  fixture.source.sourceContext = fixtureDigest(fixture.source.view);
  const request = confirmFixture({ ...fixture.request, sourceContext: fixture.source.sourceContext, model: { ...fixture.request.model, constraintBindings: [{ constraintKey: "funding-window", mode: "source_deadline" }] } });
  return { source: fixture.source, request };
}

describe("B3 frozen source, deadlines and independent symbolic series", () => {
  it("preserves stage context changes and derives support loss from the actual typed scenario guard", async () => {
    const fixture = businessFixture();
    const run = await buildLifeClimateB3Run(fixture.source, fixture.request);
    const second = run.paths[0].stages[1];
    const context = second.contextStates.find((item) => item.sourceEntryKey === "externalVariables.1")!;
    expect(context).toMatchObject({ value: "后续支持减少为零的情景", classification: "assumption", source: "simulation_condition", assumptionRefs: ["support-reduced"] });
    expect(context.evidenceEventIds).toHaveLength(1);
    expect(run.events.find((event) => event.id === context.evidenceEventIds[0])!.ruleId).toBe("support-drop");
    expect(second.contextStates.find((item) => item.sourceEntryKey === "pressures.1")).toMatchObject({ value: null, classification: "unknown", source: "frozen_profile" });
    expect(second.obligations.find((item) => item.ruleId === "conditional-support" && item.stageIndex === 2)).toMatchObject({ status: "not_applicable", paidAmount: "0", evidenceEventIds: expect.arrayContaining(context.evidenceEventIds) });
    fixture.request.model.commonRules = fixture.request.model.commonRules.filter((rule) => rule.id !== "support-drop");
    const withoutReduction = await buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request));
    expect(withoutReduction.paths[0].stages.map((stage) => stage.resources[0].balance)).toEqual(["156000", "192000", "228000"]);
    expect(fixture.source.view.profile.externalVariables[0].classification).toBe("fact");
  });

  it("uses frozen coarse ranges to distinguish before-deadline, within-stage uncertainty and expired conditions for every same-resource rule", async () => {
    const { source, request } = withDeadline("2028-01-01T00:00:00.000Z");
    const run = await buildLifeClimateB3Run(source, request);
    expect(run.paths[0].stages.map((stage) => stage.constraints[0].status)).toEqual(["satisfied", "unknown", "constrained"]);
    expect(run.paths[0].stages[0].resources[0].balance).toBe("156000");
    expect(run.paths[0].stages[1].resources[0]).toMatchObject({ status: "unknown", balance: null });
    expect(run.paths[0].stages[2].resources[0].status).toBe("constrained");
    // A definite unmet effort threshold dominates a second unknown guard in an all-condition.
    expect(run.paths[1].stages[1].transitions).toContainEqual(expect.objectContaining({ status: "constrained" }));
    const tampered = structuredClone(run);
    tampered.paths[0].stages[1].constraints[0].status = "satisfied";
    await expect(validateLifeClimateB3Run(source, request, tampered)).rejects.toMatchObject({ code: "b3_semantic_mismatch" });
  });

  it("requires exact source constraint coverage and cannot revive an expired deadline with a late stage assumption", async () => {
    const fixture = withDeadline("2026-10-19T00:00:00.000Z");
    const noCoverage = confirmFixture({ ...fixture.request, model: { ...fixture.request.model, constraintBindings: [] } });
    await expect(buildLifeClimateB3Run(fixture.source, noCoverage)).rejects.toMatchObject({ code: "invalid_b3_request" });
    const request = confirmFixture({ ...fixture.request, model: { ...fixture.request.model,
      assumptions: [...fixture.request.model.assumptions, { id: "late-limit", kind: "quantity", value: "3", unit: "阶段", periodUnit: "once", label: "阶段限制假设", evidenceSummary: "本人确认的粗阶段限制" }],
      constraintBindings: [{ constraintKey: "funding-window", mode: "narrowed_stage_limit", lastStage: 3, assumptionId: "late-limit" }],
    } });
    const run = await buildLifeClimateB3Run(fixture.source, request);
    expect(run.paths.every((path) => path.stages.every((stage) => stage.constraints[0].status === "constrained"))).toBe(true);
    expect(run.paths[1].stages[0].lifeModelDomains.environment[0].value).toBe("原城市");
  });

  it("retains unfunded obligations and shortfalls in later stages without clipping the balance into a feasible path", async () => {
    const fixture = businessFixture();
    fixture.request.model.assumptions.find((item) => item.id === "salary-year")!.value = "0";
    fixture.request.model.assumptions.find((item) => item.id === "support-first-year")!.value = "0";
    fixture.request.model.assumptions.find((item) => item.id === "old-living-year")!.value = "200000";
    const run = await buildLifeClimateB3Run(fixture.source, confirmFixture(fixture.request));
    const baseline = run.paths[0];
    expect(baseline.stages[0].resources[0]).toMatchObject({ balance: "120000", status: "constrained", shortfall: "80000" });
    expect(baseline.stages[2].obligations).toContainEqual(expect.objectContaining({ ruleId: "old-city-living", stageIndex: 1, status: "unfunded", requestedAmount: "200000", paidAmount: "0", shortfall: "80000" }));
    expect(run.comparisons.every((comparison) => comparison.resourceDifferences[0].difference === null)).toBe(true);
  });

  it("computes separate future representative frames from the frozen source and keeps every causal core artifact identical when enabled", async () => {
    const fixture = businessFixture();
    const symbolic = await createLifeClimateB3SymbolicSource({ birthDate: "1991-06-15", birthTime: null, sourceVersion: 2, consentRevision: 4, referenceDate: "2026-10-20" }, "3_years", "year");
    expect(symbolic.series.map((point) => point.status === "available" ? point.frame.referencePeriod.key : null)).toEqual(["2027-04", "2028-04", "2029-04"]);
    expect(symbolic.series.every((point) => point.status === "available" && point.frame.calculation.precision === "date_only" && point.frame.causalUse === false)).toBe(true);
    expect(JSON.stringify(symbolic)).not.toContain("1991-06-15");
    const source = { ...fixture.source, symbolic };
    const off = await buildLifeClimateB3Run(source, fixture.request);
    const request = confirmFixture({ ...fixture.request, symbolic: { enabled: true, sourceContext: symbolic.sourceContext } });
    const on = await buildLifeClimateB3Run(source, request);
    for (const key of ["paths", "events", "claims", "comparisons", "report"] as const) expect(on[key]).toEqual(off[key]);
    expect(off.symbolicAttachment).toBeNull();
    expect(on.symbolicAttachment).toEqual(symbolic);
  });

  it("rejects unsupported full-source precision including noncausal per-tick fields and rejects unpaired Unicode", async () => {
    const source = sourceFixture();
    source.view.profile.worldInputs.resources[0].usePerTick = 0.0000001;
    await expect(createLifeClimateB3SourceContext(source.view)).rejects.toMatchObject({ code: "b3_unsupported_precision" });
    source.view.profile.worldInputs.resources[0].usePerTick = 0.000001;
    expect(await createLifeClimateB3SourceContext(source.view)).toHaveLength(64);
    source.view.profile.values[0] = { value: "\ud800", classification: "fact", evidenceSummary: "本人填写" };
    await expect(createLifeClimateB3SourceContext(source.view)).rejects.toBeInstanceOf(Error);
    expect(canonicalLifeClimateB3Json({ "😀": 1, "\ue000": 2, a: "汉字", n: 0.000001, list: [null, true, 2] })).toBe('{"a":"汉字","list":[null,true,2],"n":0.000001,"\ue000":2,"😀":1}');
  });

  it("clamps civil calendar month ends without reading the current clock", () => {
    const windows = getLifeClimateB3StageWindows("2028-01-31T04:00:00.000Z", "1_year", "quarter");
    expect(windows[0].endAt).toBe("2028-04-30T04:00:00.000Z");
    expect(windows[1].endAt).toBe("2028-07-31T04:00:00.000Z");
    expect(windows[2].startAt).toBe(windows[1].endAt);
  });
});
