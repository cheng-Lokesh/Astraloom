import { describe, expect, it, vi } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { defaultPlanningRequestSchema } from "@/lib/formal-planning/contracts";
import { freezeDefaultPlanning } from "@/lib/formal-planning";
import { buildDigitalLifeModel, digitalLifeRulesSchema } from "@/lib/digital-life/model";
import { planningSource, relationshipRequest, planningRequest } from "@/lib/formal-planning/test-fixtures";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";
import { formalSandboxResultProjectionSchema } from "./client";
import { resolveRelationshipTrigger } from "@/lib/formal-planning/relationship-response";

export function relationshipRuntimeInput(symbolic = true) {
  const source = planningSource();
  const request = defaultPlanningRequestSchema.parse(relationshipRequest(symbolic));
  if (request.version !== "formal-default-planner-v2") throw new Error("fixture_invalid");
  const rules = digitalLifeRulesSchema.parse({ ...digitalLifeRules(), strategies: [], actions: [request.relationshipResponse.requestRule, request.relationshipResponse.responseRule] });
  return { ...digitalLifeInput(), realityProfileSnapshot: source.realityProfileSnapshot, symbolicLens: source.symbolicLens,
    acceptedAt: source.acceptedAt, startedAt: "2026-10-06T00:05:00.000Z", graphLockedAt: source.acceptedAt,
    digitalLifeRules: rules, defaultPlanning: request, planningConsentContext: source.consentContext };
}

describe("real relationship-response controlled pipeline", () => {
  it("changes actual self allocation only after the exact request and negative NPC response", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
    try {
      const input = relationshipRuntimeInput();
      const modeled = buildDigitalLifeModel(input, input.digitalLifeRules);
      if (!modeled.ok) throw new Error(modeled.errorCode);
      const frozen = freezeDefaultPlanning(input.defaultPlanning, { ...planningSource(), model: modeled.model });
      expect(frozen.ok).toBe(true);
      const run = await buildFormalSandboxRunV2(input);
      if (!run.ok) throw new Error(run.errorCode);
      expect(run.bundle.events).toHaveLength(9);
      expect(run.bundle.events.slice(0, 2).map(event => event.operation.actionType)).toEqual(["request_information", "update_relation_signal"]);
      expect(run.bundle.events[1].operation).toMatchObject({ signal: "negative" });
      expect(run.bundle.events[2].operation).toMatchObject({ actionType: "allocate_resource", amount: 0.9 });
      const delta = run.bundle.events[2].deltas[0];
      expect(delta.valueType).toBe("resource");
      if (delta.valueType !== "resource") throw new Error("fixture_invalid");
      expect(delta.before - delta.after).toBeCloseTo(0.9);
      expect(input.digitalLifeRules).toEqual(relationshipRuntimeInput().digitalLifeRules);
      const projection = projectFormalSandboxResult(JSON.parse(JSON.stringify(run.bundle)));
      expect(projection !== null).toBe(true);
      expect(formalSandboxResultProjectionSchema.safeParse(projection).success).toBe(true);
      expect(projection?.defaultPlanning?.relationshipResponse?.samples).toHaveLength(3);
      expect(projection?.defaultPlanning?.relationshipResponse?.samples[0]).toMatchObject({ status: "selected", proposedAmount: 0.9 });
      const changed = structuredClone(run.bundle);
      changed.events[1].actorId = changed.events[0].actorId;
      expect(projectFormalSandboxResult(changed)).toBeNull();
    } finally { vi.useRealTimers(); }
  }, 30_000);

  it("keeps source, proposal IDs and RNG stable while off/on and positive/neutral change only the supported amount", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
    try {
      const bundles = [];
      for (const enabled of [false, true]) {
        const run = await buildFormalSandboxRunV2(relationshipRuntimeInput(enabled));
        if (!run.ok) throw new Error(run.errorCode);
        bundles.push(run.bundle);
        expect(run.bundle.events[2].operation).toMatchObject({ amount: enabled ? 0.9 : 0.95 });
      }
      expect(bundles[0].policyFingerprint).toBe(bundles[1].policyFingerprint);
      expect(bundles[0].causalFingerprint).not.toBe(bundles[1].causalFingerprint);
      expect(bundles[0].events.map(event => event.proposalId)).toEqual(bundles[1].events.map(event => event.proposalId));
      expect(bundles[0].trajectoryAnalysis.trajectories.map(item => item.steps.map(step => step.rngAudit))).toEqual(bundles[1].trajectoryAnalysis.trajectories.map(item => item.steps.map(step => step.rngAudit)));
      for (const signal of ["positive", "neutral"] as const) {
        const input = relationshipRuntimeInput();
        if (input.defaultPlanning.version !== "formal-default-planner-v2") throw new Error("fixture_invalid");
        const response = input.defaultPlanning.relationshipResponse.responseRule;
        if (response.operation.actionType !== "update_relation_signal") throw new Error("fixture_invalid");
        response.operation.signal = signal; input.digitalLifeRules.actions[1] = structuredClone(response);
        const run = await buildFormalSandboxRunV2(input);
        if (!run.ok) throw new Error(run.errorCode);
        expect(run.bundle.events[2].operation).toMatchObject({ amount: 1 });
        expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(run.bundle))) !== null).toBe(true);
        const missingTrace = structuredClone(run.bundle);
        missingTrace.defaultPlanningTraces![0].trace = [];
        expect(projectFormalSandboxResult(missingTrace)).toBeNull();
      }
      const off = { ...relationshipRuntimeInput(), defaultPlanning: defaultPlanningRequestSchema.parse(planningRequest(false)) };
      const old = await buildFormalSandboxRunV2(off);
      if (!old.ok) throw new Error(old.errorCode);
      expect(old.bundle.defaultPlanningSnapshot?.version).toBe("formal-default-planner-v1");
      expect(projectFormalSandboxResult(old.bundle)?.defaultPlanning?.relationshipResponse).toBeUndefined();
    } finally { vi.useRealTimers(); }
  }, 30_000);

  it("supports complete after_rule ancestry and JSON optional fields without accepting wrong actors, sample namespaces or prior references", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
    try {
      const input = { ...relationshipRuntimeInput(), horizonDays: 90 as const };
      if (input.defaultPlanning.version !== "formal-default-planner-v2") throw new Error("fixture_invalid");
      const prior = digitalLifeRulesSchema.parse(digitalLifeRules()).actions[2];
      prior.key = "rule-3"; prior.pathKey = "main"; prior.actorKey = "person-1";
      if (prior.operation.actionType !== "update_commitment") throw new Error("fixture_invalid");
      prior.operation.profileEntryKey = undefined;
      input.defaultPlanning.relationshipResponse.requestRule.when = { kind: "after_rule", ruleKey: "rule-3" };
      input.digitalLifeRules.actions = [prior, input.defaultPlanning.relationshipResponse.requestRule, input.defaultPlanning.relationshipResponse.responseRule];
      const run = await buildFormalSandboxRunV2(input);
      if (!run.ok || run.bundle.defaultPlanningSnapshot?.version !== "formal-default-planner-v2") throw new Error("fixture_invalid");
      expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(run.bundle))) !== null).toBe(true);
      const frame = run.bundle.defaultPlanningSnapshot.relationshipResponse;
      const trajectory = run.bundle.trajectoryAnalysis.trajectories[0];
      const world = run.bundle.worldSnapshots[0];
      const namespace = `formal_${run.bundle.policyFingerprint}_${trajectory.trajectorySeed}`;
      const occurredAt = "2026-12-04T00:05:00.000Z";
      expect(resolveRelationshipTrigger(frame, world, namespace, `formal-${run.bundle.policyFingerprint}`, occurredAt, input.startedAt, 6) !== null).toBe(true);
      for (const kind of ["actor", "target", "prior", "time", "assumption", "evidence", "command"] as const) {
        const changed = structuredClone(world);
        const response = changed.worldEvents.find(event => event.operation.actionType === "update_relation_signal")!;
        if (kind === "actor") response.actorId = changed.worldEvents[0].actorId;
        if (kind === "target") response.targetEntityIds = [];
        if (kind === "prior") response.priorWorldEventIds = [];
        if (kind === "time") response.createdAt = changed.worldEvents[0].createdAt;
        if (kind === "assumption") response.causalAssumptionIds = changed.worldEvents[0].causalAssumptionIds;
        if (kind === "evidence") response.causalRealEvidenceIds = changed.worldEvents[0].causalRealEvidenceIds;
        if (kind === "command") changed.appliedTransitionCommandIds = [];
        expect(resolveRelationshipTrigger(frame, changed, namespace, `formal-${run.bundle.policyFingerprint}`, occurredAt, input.startedAt, 6)).toBeNull();
      }
      expect(resolveRelationshipTrigger(frame, world, `${namespace}_other`, `formal-${run.bundle.policyFingerprint}`, occurredAt, input.startedAt, 6)).toBeNull();
    } finally { vi.useRealTimers(); }
  }, 30_000);

  it("preserves neutral pre-response candidates and consumes the hypothesis only after a selected allocation amid resource competition", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
    try {
      const input = { ...relationshipRuntimeInput(), horizonDays: 90 as const };
      if (input.defaultPlanning.version !== "formal-default-planner-v2") throw new Error("fixture_invalid");
      input.defaultPlanning.relationshipResponse.requestRule.when = { kind: "at_tick", tickIndex: 1 };
      input.digitalLifeRules.actions[0] = input.defaultPlanning.relationshipResponse.requestRule;
      input.realityProfileSnapshot.profile.worldInputs.resources.push({ ...input.realityProfileSnapshot.profile.worldInputs.resources[0], key: "learning-time", label: "自主学习时间" });
      input.defaultPlanning.resources.push({ resourceKey: "resource-2", totalBudgetLimit: 3, confirmedForSimulation: true });
      const run = await buildFormalSandboxRunV2(input);
      if (!run.ok) throw new Error(run.errorCode);
      const projection = projectFormalSandboxResult(JSON.parse(JSON.stringify(run.bundle)));
      expect(projection !== null).toBe(true);
      let observedUnselectedThenSelected = false;
      for (const [index, entry] of run.bundle.defaultPlanningTraces!.entries()) {
        const relevant = entry.trace.filter(trace => trace.resourceKey === "resource-1");
        expect(relevant.find(trace => trace.tickIndex === 0)).toMatchObject({ proposedAmount: 0.5 });
        expect(relevant.find(trace => trace.tickIndex === 0)?.relationshipResponse).toBeUndefined();
        const world = run.bundle.worldSnapshots[index];
        const applied = relevant.filter(trace => trace.relationshipResponse?.firstResponseAllocation && world.worldEvents.some(event => event.proposalId === trace.proposalId));
        expect(applied.length).toBeLessThanOrEqual(1);
        if (applied.length) {
          expect(applied[0].proposedAmount).toBe(0.45);
          if (relevant.some(trace => trace.relationshipResponse?.firstResponseAllocation && trace.tickIndex < applied[0].tickIndex && !world.worldEvents.some(event => event.proposalId === trace.proposalId))) observedUnselectedThenSelected = true;
          for (const later of relevant.filter(trace => trace.tickIndex > applied[0].tickIndex)) expect(later.proposedAmount).toBe(0.5);
        }
        for (const plan of run.bundle.defaultPlanningSnapshot!.resources) {
          const bound = entry.trace[0].worldBinding.resources.find(resource => resource.resourceKey === plan.resourceKey)!;
          const spent = world.worldEvents.reduce((total, event) => total + (event.operation.actionType === "allocate_resource" && event.operation.resourceId === bound.resourceId ? event.operation.amount : 0), 0);
          expect(spent).toBeLessThanOrEqual(plan.totalBudgetLimit);
          expect(world.resources.find(resource => resource.id === bound.resourceId)!.available).toBeGreaterThanOrEqual(plan.minimum);
        }
      }
      expect(observedUnselectedThenSelected).toBe(true);
    } finally { vi.useRealTimers(); }
  }, 30_000);

  it("does not manufacture main relationship samples for an unauthorized strategy with no planner traces", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
    try {
      const input = relationshipRuntimeInput();
      const original = digitalLifeRulesSchema.parse(digitalLifeRules());
      input.digitalLifeRules.strategies = original.strategies;
      input.digitalLifeRules.actions.push(...[0, 1, 2].map(tickIndex => ({ ...structuredClone(original.actions[2]), key: `rule-${tickIndex + 3}`, when: { kind: "at_tick" as const, tickIndex } })));
      const run = await buildFormalSandboxRunV2(input);
      if (!run.ok) throw new Error(run.errorCode);
      const projection = projectFormalSandboxResult(JSON.parse(JSON.stringify(run.bundle)));
      expect(projection !== null).toBe(true);
      expect(projection?.defaultPlanning?.relationshipResponse?.samples).toHaveLength(3);
      expect(run.bundle.strategyPaths.paths[0].bundle.defaultPlanningTraces?.every(item => item.trace.length === 0)).toBe(true);
      expect(projection?.strategyPaths[0].projection.defaultPlanning?.relationshipResponse).toBeUndefined();
    } finally { vi.useRealTimers(); }
  }, 30_000);
});
