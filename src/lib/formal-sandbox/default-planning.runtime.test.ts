import { describe, expect, it, vi } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { planningRequest, planningSource } from "@/lib/formal-planning/test-fixtures";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";
import { formalSandboxResultProjectionSchema } from "./client";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";

describe("formal default-planning runtime consumer", () => {
  it("executes a separately authorized resource through the actual formal Core pipeline", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
    try {
      const source = planningSource();
      const input = { ...digitalLifeInput(), realityProfileSnapshot: source.realityProfileSnapshot, symbolicLens: source.symbolicLens,
        acceptedAt: source.acceptedAt, startedAt: "2026-10-06T00:05:00.000Z", graphLockedAt: source.acceptedAt,
        defaultPlanning: planningRequest(), planningConsentContext: source.consentContext };
      const run = await buildFormalSandboxRunV2(input);
      if (!run.ok) throw new Error(run.errorCode);
      expect(run.ok).toBe(true);
      expect(run.bundle.events).toHaveLength(9);
      expect(run.bundle.events[0].operation).toMatchObject({ actionType: "allocate_resource", amount: 0.9 });
      const projection = projectFormalSandboxResult(run.bundle);
      expect(projection !== null).toBe(true);
      expect(projection?.defaultPlanning?.trace).toHaveLength(9);
      expect(projection?.defaultPlanning?.trace[0]).toMatchObject({ priorApplied: true, status: "selected", proposedAmount: 0.9 });
      expect(formalSandboxResultProjectionSchema.safeParse(projection).success).toBe(true);
      const neutral = await buildFormalSandboxRunV2({ ...input, defaultPlanning: planningRequest(false) });
      if (!neutral.ok) throw new Error(neutral.errorCode);
      expect(neutral.bundle.events.map(item => item.proposalId)).toEqual(run.bundle.events.map(item => item.proposalId));
      expect(neutral.bundle.events[0].operation).toMatchObject({ amount: 1 });
      expect(neutral.bundle.policyFingerprint).toBe(run.bundle.policyFingerprint);
      expect(neutral.bundle.causalFingerprint).not.toBe(run.bundle.causalFingerprint);
      expect(projectFormalSandboxResult(neutral.bundle)?.defaultPlanning?.frozenHypothesis?.status).toBe("off");
      const changed = structuredClone(run.bundle);
      changed.defaultPlanningSnapshot!.sourceBinding.profileRevision++;
      expect(projectFormalSandboxResult(changed)).toBeNull();
      const swapped = structuredClone(run.bundle);
      [swapped.defaultPlanningTraces![0], swapped.defaultPlanningTraces![1]] = [swapped.defaultPlanningTraces![1], swapped.defaultPlanningTraces![0]];
      expect(projectFormalSandboxResult(swapped)).toBeNull();
      const rules = digitalLifeRulesSchema.parse(digitalLifeRules());
      rules.actions = [rules.actions[0], rules.actions[2]].map(item => ({ ...item, when: { kind: "at_tick" as const, tickIndex: 2 } }));
      const variantRuns = [];
      for (const enabled of [false, true]) {
        const result = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules, defaultPlanning: planningRequest(enabled) });
        if (!result.ok) throw new Error(result.errorCode);
        expect(result.bundle.strategyPaths.paths).toHaveLength(1);
        expect(projectFormalSandboxResult(result.bundle)?.strategyPaths[0].projection.defaultPlanning?.trace).toHaveLength(6);
        variantRuns.push(result.bundle);
      }
      for (const pathIndex of [-1, 0]) {
        const first = pathIndex < 0 ? variantRuns[0] : variantRuns[0].strategyPaths.paths[pathIndex].bundle;
        const second = pathIndex < 0 ? variantRuns[1] : variantRuns[1].strategyPaths.paths[pathIndex].bundle;
        expect(first.events.map(item => item.proposalId)).toEqual(second.events.map(item => item.proposalId));
        expect(first.trajectoryAnalysis.trajectories.map(item => item.steps.map(step => step.rngAudit))).toEqual(second.trajectoryAnalysis.trajectories.map(item => item.steps.map(step => step.rngAudit)));
      }
    } finally { vi.useRealTimers(); }
  }, 30_000);
});
