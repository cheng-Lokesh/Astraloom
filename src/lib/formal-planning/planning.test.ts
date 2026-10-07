import { describe, expect, it } from "vitest";
import { ids } from "@/lib/digital-life/test-fixtures";
import { emptySymbolicFixture } from "@/lib/formal-sandbox/symbolic-lens.test-fixtures";
import { createPlanningAssumptions, derivePlanningHypothesis, freezeDefaultPlanning, parseFrozenDefaultPlanning } from "./index";
import { planningSource as source, planningRequest as request } from "./test-fixtures";

describe("formal default planning", () => {
  it("changes only the bounded initial amount under separately confirmed symbolic hypotheses", () => {
    const off = freezeDefaultPlanning(request(false), source());
    const on = freezeDefaultPlanning(request(), source());
    expect(off.ok && on.ok).toBe(true);
    if (!off.ok || !on.ok) return;
    expect(off.planning.resources[0].neutralAmount).toBe(1);
    expect(on.planning.fusion.reduction).toBe(0.1);
    expect(on.planning.fusion.initialAmountFactor).toBe(0.9);
    expect(on.planning.resources).toEqual(off.planning.resources);
  });

  it("rejects source-owner mismatch and client-supplied source or caps", () => {
    const wrong = source();
    wrong.realityProfileSnapshot.ownerId = ids.npc;
    expect(freezeDefaultPlanning(request(), wrong).ok).toBe(false);
    expect(freezeDefaultPlanning({ ...request(), ownerId: ids.owner }, source()).ok).toBe(false);
    expect(freezeDefaultPlanning({ ...request(), cap: 1 }, source()).ok).toBe(false);
  });

  it.each([0, -1, Infinity, NaN, 1_000_001])("rejects invalid budget %s", budget => {
    const value = request();
    value.resources[0].totalBudgetLimit = budget;
    expect(freezeDefaultPlanning(value, source()).ok).toBe(false);
  });

  it("rejects duplicate, undeclared, unconfirmed or unknown request selectors", () => {
    const value = request();
    expect(freezeDefaultPlanning({ ...value, resources: [...value.resources, ...value.resources] }, source()).ok).toBe(false);
    expect(freezeDefaultPlanning({ ...value, resources: [{ ...value.resources[0], resourceKey: "resource-8" }] }, source()).ok).toBe(false);
    expect(freezeDefaultPlanning({ ...value, resources: [{ ...value.resources[0], confirmedForSimulation: false }] }, source()).ok).toBe(false);
    expect(freezeDefaultPlanning({ ...value, fusion: { enabled: true, confirmedForSimulation: false } }, source()).ok).toBe(false);
    expect(freezeDefaultPlanning({ ...value, fusion: { enabled: false, confirmedForSimulation: true } }, source()).ok).toBe(false);
  });

  it.each([false, true])("never changes a declared per-tick rule (prior=%s)", enabled => {
    const current = source();
    current.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = 1;
    const frozen = freezeDefaultPlanning(request(enabled), current);
    expect(frozen.ok).toBe(true);
    if (!frozen.ok) return;
    expect(frozen.planning.status).toBe("inactive");
    expect(frozen.planning.resources[0].status).toBe("explicit_rate");
    expect(createPlanningAssumptions(frozen.planning)).toEqual([]);
    expect(current.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick).toBe(1);
  });

  it("excludes a resource named by an explicit action on any strategy path or later tick", () => {
    const current = source();
    current.model.rules.actions = [{ key: "rule-1", pathKey: "person-3", actorKey: "person-3", when: { kind: "at_tick", tickIndex: 2 }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 1 }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人明确规则" }];
    const frozen = freezeDefaultPlanning(request(), current);
    expect(frozen.ok && frozen.planning.resources[0].status).toBe("explicit_rule");
  });

  it.each([0.0000001, 0.0000029])("keeps underflow budgets inactive independently of the prior %s", budget => {
    const value = request();
    value.resources[0].totalBudgetLimit = budget;
    const frozen = freezeDefaultPlanning(value, source());
    expect(frozen.ok && frozen.planning.status).toBe("inactive");
  });

  it("freezes 90-day slices and excludes exhausted resource headroom", () => {
    const current = source();
    current.horizonDays = 90;
    const frozen = freezeDefaultPlanning(request(), current);
    expect(frozen.ok && frozen.planning.maxTicks).toBe(6);
    expect(frozen.ok && frozen.planning.resources[0].neutralAmount).toBe(0.5);
    current.realityProfileSnapshot.profile.worldInputs.resources[0].available = 1;
    expect(freezeDefaultPlanning(request(), current)).toMatchObject({ ok: true, planning: { status: "inactive" } });
  });

  it("records unavailable or legacy symbolic sources without manufacturing a prior", () => {
    const current = source();
    current.symbolicLens = emptySymbolicFixture("not_authorized") as typeof current.symbolicLens;
    const frozen = freezeDefaultPlanning(request(), current);
    expect(frozen).toMatchObject({ ok: true, planning: { fusion: { status: "unavailable", reduction: 0 } } });
    current.symbolicLens = { mode: "bounded_fusion", summary: "Optional framing only." };
    expect(freezeDefaultPlanning(request(), current)).toMatchObject({ ok: true, planning: { fusion: { status: "unavailable", reduction: 0 } } });
  });

  it("has no planner action without resource budget authorization", () => {
    const frozen = freezeDefaultPlanning({ ...request(), resources: [] }, source());
    expect(frozen).toMatchObject({ ok: true, planning: { status: "inactive", resources: [] } });
  });

  it("rejects changed source scope, lens owner, clocks or unsupported versions", () => {
    const current = source();
    current.model.rules.profileRevision = 1;
    expect(freezeDefaultPlanning(request(), current).ok).toBe(false);
    const ownerMismatch = source();
    if (!("version" in ownerMismatch.symbolicLens) || !ownerMismatch.symbolicLens.provenance) throw new Error("fixture_invalid");
    ownerMismatch.symbolicLens.provenance.ownerId = ids.npc;
    expect(freezeDefaultPlanning(request(), ownerMismatch).ok).toBe(false);
    const timeMismatch = source();
    timeMismatch.acceptedAt = "2026-10-06T00:00:01.000Z";
    expect(freezeDefaultPlanning(request(), timeMismatch).ok).toBe(false);
    expect(freezeDefaultPlanning({ ...request(), version: "unknown" }, source()).ok).toBe(false);
  });

  it("rejects tampering with frozen amounts, prior cap, derivation and status", () => {
    const frozen = freezeDefaultPlanning(request(), source());
    if (!frozen.ok) throw new Error("fixture_invalid");
    expect(parseFrozenDefaultPlanning(frozen.planning)).toEqual(frozen.planning);
    for (const mutate of [
      (value: typeof frozen.planning) => { value.resources[0].neutralAmount = 2; },
      (value: typeof frozen.planning) => { value.fusion.reduction = 0.05; },
      (value: typeof frozen.planning) => { value.resources[0].status = "explicit_rule"; },
      (value: typeof frozen.planning) => { value.status = "inactive"; },
      (value: typeof frozen.planning) => { value.fusion.status = "off"; },
    ]) {
      const changed = structuredClone(frozen.planning);
      mutate(changed);
      expect(() => parseFrozenDefaultPlanning(changed)).toThrow();
    }
  });

  it("covers all actual element-relation channels and ties without probabilistic weights", () => {
    const base = { groupCounts: { peer: 1, expression: 0, resource: 0, responsibility: 0, support: 0 }, natalDayElement: "wood" as const, periodYearElement: "wood" as const };
    for (const periodMonthElement of ["wood", "fire", "earth", "metal", "water"] as const) {
      expect(derivePlanningHypothesis({ ...base, periodMonthElement }).reduction).toBe(periodMonthElement === "wood" ? 0 : 0.05);
    }
    expect(derivePlanningHypothesis({ ...base, groupCounts: { ...base.groupCounts, support: 1 }, periodMonthElement: "fire" }).reduction).toBe(0.1);
    expect(derivePlanningHypothesis({ ...base, groupCounts: { peer: 0, expression: 0, resource: 0, responsibility: 0, support: 0 }, periodMonthElement: "wood" }).reduction).toBe(0);
  });
});
