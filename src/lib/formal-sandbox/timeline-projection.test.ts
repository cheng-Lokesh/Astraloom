import { beforeAll, describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";
import { validateWorldV2 } from "@/lib/v2/agent-world/validation";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";
import { createFormalSandboxClient } from "./client";

// This contract is asserted through the public producer/reader, not a mock timeline.
type Timeline = { version: string; samples: Array<{ key: string; terminalStatus: string; ticks: Array<{ tickIndex: number; occurredAt: string | null; status: string; event: null | { stepKey: string; kind: string; label: string; participantKeys: string[]; changes: Array<{ kind: string; label: string; before: unknown; after: unknown; unit: string | null }>; causes: { priorStepKeys: string[]; factKeys: string[]; assumptionKeys: string[]; ruleKeys?: string[]; unrecorded: boolean }; claimKeys: string[] } }> }> };
type Bundle = Extract<Awaited<ReturnType<typeof buildFormalSandboxRunV2>>, { ok: true }>['bundle'];
const timelineOf = (bundle: unknown) => (projectFormalSandboxResult(bundle) as unknown as { timeline?: Timeline } | null)?.timeline;

let built: Bundle;
let early: Bundle;
beforeAll(async () => {
  const result = await buildFormalSandboxRunV2({ ...digitalLifeInput(), digitalLifeRules: digitalLifeRules() });
  if (!result.ok) throw new Error(result.errorCode);
  built = result.bundle;
  const input = digitalLifeInput();
  input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = null;
  const rules = digitalLifeRules();
  rules.strategies = [];
  rules.actions = [rules.actions[0]];
  const stopped = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
  if (!stopped.ok) throw new Error(stopped.errorCode);
  early = stopped.bundle;
}, 60_000);

describe("persisted Track A life timeline", () => {
  it("projects actual ticks independently for three samples and each strategy without changing history", () => {
    const before = JSON.stringify(built);
    const projection = projectFormalSandboxResult(built);
    const timeline = timelineOf(built);
    expect(timeline?.version).toBe("formal-simulation-timeline-v1");
    expect(timeline?.samples).toHaveLength(3);
    for (const [sampleIndex, sample] of timeline!.samples.entries()) {
      const trajectory = built.trajectoryAnalysis.trajectories[sampleIndex];
      expect(sample.key).toBe(`sample-${sampleIndex + 1}`);
      expect(sample.ticks.map(tick => [tick.tickIndex, tick.occurredAt])).toEqual(trajectory.steps.map(step => [step.tickIndex, step.occurredAt]));
      for (const tick of sample.ticks) if (tick.event) {
        const rawEvent = trajectory.finalWorld.worldEvents.find(event => trajectory.steps[tick.tickIndex].worldEventId === event.id)!;
        expect(tick.event.stepKey).toBe(`step-${built.events.findIndex(event => event.id === rawEvent.id) + 1}`);
        expect(tick.event.claimKeys.length).toBeGreaterThan(0);
        const ownSteps = sample.ticks.slice(0, tick.tickIndex).flatMap(item => item.event ? [item.event.stepKey] : []);
        expect(tick.event.causes.priorStepKeys.every(key => ownSteps.includes(key))).toBe(true);
        expect(tick.event.claimKeys.every(key => projection!.claims.some(claim => claim.key === key && claim.stepKeys.includes(tick.event!.stepKey)))).toBe(true);
      }
    }
    const strategy = projection!.strategyPaths[0].projection as unknown as { timeline?: Timeline };
    expect(strategy.timeline?.samples).toHaveLength(3);
    expect(strategy.timeline!.samples[0].ticks[0].event?.kind).toBe("commitment");
    expect(strategy.timeline!.samples[0].ticks[0].event?.participantKeys).toContain("person-3");
    expect(JSON.stringify(built)).toBe(before);
  });

  it("shows request, conditional NPC response, typed resource changes and persisted causes", () => {
    const ticks = timelineOf(built)?.samples[0].ticks;
    expect(ticks?.[0].event?.kind).toBe("information_request");
    expect(ticks?.[1].event).toMatchObject({ kind: "relationship_response", participantKeys: expect.arrayContaining(["person-2"]), causes: { priorStepKeys: ["step-1"] } });
    expect(ticks?.[1].event?.changes).toContainEqual({ kind: "relationship", label: "协作关系", before: "neutral", after: "positive", unit: null });
    expect(ticks?.[2].event?.changes).toContainEqual({ kind: "resource", label: "可投入时间", before: 8, after: 7, unit: "小时" });
  });

  it("resolves only persisted current-path rule assumptions for why an NPC response or commitment changed", () => {
    const projection = projectFormalSandboxResult(built)!;
    const response = timelineOf(built)!.samples[0].ticks[1].event!;
    expect(response.causes.ruleKeys).toEqual(["rule-2"]);
    // The actor's private source evidence stays hidden even when its rule is readable.
    expect(response.causes.unrecorded).toBe(true);
    expect(projection.digitalLifeModel.rules.find(rule => rule.key === response.causes.ruleKeys![0])?.evidenceSummary).toBe("本人确认的条件回应假设，并非对方真实意图");
    const strategy = projection.strategyPaths[0].projection as unknown as { timeline: Timeline };
    expect(strategy.timeline.samples[0].ticks[0].event?.causes.ruleKeys).toEqual(["rule-3"]);
    expect(timelineOf(built)!.samples.flatMap(sample => sample.ticks.flatMap(tick => tick.event?.causes.ruleKeys ?? []))).not.toContain("rule-3");
  });

  it("distinguishes an executed empty termination cycle from an unreached later cycle", () => {
    const ticks = timelineOf(early)?.samples[0].ticks;
    expect(ticks).toEqual([
      expect.objectContaining({ tickIndex: 0, occurredAt: early.trajectoryAnalysis.trajectories[0].steps[0].occurredAt, status: "event" }),
      { tickIndex: 1, occurredAt: early.trajectoryAnalysis.trajectories[0].steps[1].occurredAt, status: "no_actions", event: null },
      { tickIndex: 2, occurredAt: null, status: "not_reached", event: null },
    ]);
  });

  it("reads JSON-persisted output through the real browser client with no private identifiers", async () => {
    const projection = projectFormalSandboxResult(JSON.parse(JSON.stringify(built)));
    const client = createFormalSandboxClient(async () => new Response(JSON.stringify({ ok: true, completed_at: null, projection }), { status: 200 }));
    const result = await client.result("opaque-run-selector");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.data.projection as unknown as { timeline?: Timeline }).timeline?.samples).toHaveLength(3);
    const safe = JSON.stringify(timelineOf(built));
    expect(safe).not.toMatch(/world_event_v2_|agent_definition_v2_|trajectory_v2_|transition_command_v2_|seed:self|focus-time|11111111-1111|seedSummary|private|trace_id/);
  });

  it("retains readable legacy steps when trajectory analysis was never stored", () => {
    const legacy = structuredClone(early) as unknown as Record<string, unknown>;
    delete legacy.trajectoryAnalysis;
    delete legacy.strategyPaths;
    delete (legacy.inputSnapshot as Record<string, unknown>).digitalLifeModel;
    const projection = projectFormalSandboxResult(legacy);
    expect(projection?.steps.length).toBeGreaterThan(0);
    expect((projection as unknown as { timeline?: Timeline }).timeline).toBeUndefined();
  });

  it("keeps typed historical paths readable when only analysis is missing", () => {
    const legacy = structuredClone(built) as unknown as Record<string, unknown>;
    delete legacy.trajectoryAnalysis;
    const paths = legacy.strategyPaths as { paths: Array<{ bundle: Record<string, unknown> }> };
    for (const path of paths.paths) delete path.bundle.trajectoryAnalysis;
    const projection = projectFormalSandboxResult(legacy);
    expect(projection?.steps.length).toBeGreaterThan(0);
    expect((projection as unknown as { timeline?: Timeline }).timeline).toBeUndefined();
    expect(projection?.strategyPaths[0].projection.steps.length).toBeGreaterThan(0);
  });

  it.each([30, 90] as const)("projects v1/v2/v3 %i-day runs with two independent strategy worlds", async horizonDays => {
    for (const version of ["digital-life-rules-v1", "digital-life-rules-v2", "digital-life-rules-v3"] as const) {
      const input = digitalLifeInput();
      input.agents.push({ ...input.agents[2], id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", displayName: "另一平行自我" });
      input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = null;
      input.realityProfileSnapshot.profile.externalVariables = [{ value: "共同安排尚未确认", classification: "fact", evidenceSummary: "本人记录的现状" }];
      const actions = ["main", "person-3", "person-4"].flatMap((pathKey, pathIndex) => {
        const firstKey = `rule-${pathIndex * 3 + 1}`, secondKey = `rule-${pathIndex * 3 + 2}`;
        const common = { pathKey, actorKey: pathKey === "main" ? "person-1" : pathKey, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人显式设定的独立行动假设" };
        return [
          { ...common, key: firstKey, when: { kind: "at_tick", tickIndex: 0 }, operation: version === "digital-life-rules-v1" ? { actionType: "update_commitment", commitmentKey: "commitment-1", label: "准备共同安排", status: "active" } : { actionType: "update_external_variable", variableKey: "external-variable-1", value: "共同安排已确认" } },
          { ...common, key: secondKey, when: { kind: "after_rule", ruleKey: firstKey }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: pathIndex + 1 }, ...(version === "digital-life-rules-v3" ? { guard: { kind: "environment_equals", variableKey: "external-variable-1", value: "共同安排已确认" } } : {}) },
          { ...common, key: `rule-${pathIndex * 3 + 3}`, when: { kind: "after_rule", ruleKey: secondKey }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "落实共同安排", status: "fulfilled" } },
        ];
      });
      const rules = digitalLifeRulesSchema.parse({ ...digitalLifeRules(), version, actions, strategies: ["person-3", "person-4"].map(participantKey => ({ participantKey, label: "单独比较的策略", confirmedForSimulation: true, evidenceSummary: "本人明确确认的平行策略" })) });
      const run = await buildFormalSandboxRunV2({ ...input, horizonDays, digitalLifeRules: rules });
      expect(run.ok, !run.ok ? run.errorCode : undefined).toBe(true);
      if (!run.ok) throw new Error(run.errorCode);
      const projection = projectFormalSandboxResult(JSON.parse(JSON.stringify(run.bundle)));
      expect(projection).not.toBeNull();
      const all = [projection!, ...projection!.strategyPaths.map(path => path.projection)] as unknown as Array<{ timeline: Timeline }>;
      expect(all).toHaveLength(3);
      for (const path of all) for (const sample of path.timeline.samples) {
        expect(sample.ticks).toHaveLength(horizonDays === 30 ? 3 : 6);
        expect(sample.ticks[1].event?.changes).toContainEqual(expect.objectContaining({ kind: "resource", before: 8 }));
        if (version !== "digital-life-rules-v1") expect(sample.ticks[0].event?.changes).toContainEqual({ kind: "environment", label: "外部变量", before: "共同安排尚未确认", after: "共同安排已确认", unit: null });
        if (horizonDays === 90) {
          expect(sample.ticks[3].status).toBe("no_actions");
          expect(sample.ticks[4]).toEqual({ tickIndex: 4, occurredAt: null, status: "not_reached", event: null });
        }
      }
    }
  }, 60_000);

  it.each(["foreign", "future"])("rejects coherent %s causal tampering in all stored copies", mode => {
    const forged = structuredClone(built), trajectory = forged.trajectoryAnalysis.trajectories[0];
    const target = trajectory.finalWorld.worldEvents[0];
    target.priorWorldEventIds = [mode === "foreign" ? forged.trajectoryAnalysis.trajectories[1].finalWorld.worldEvents[0].id : trajectory.finalWorld.worldEvents[1].id];
    forged.worldSnapshots[0] = structuredClone(trajectory.finalWorld);
    forged.events = forged.trajectoryAnalysis.trajectories.flatMap(item => item.finalWorld.worldEvents.map((event, tickIndex) => ({ ...event, branchId: item.trajectoryId, tickIndex })));
    expect(projectFormalSandboxResult(forged) === null).toBe(true);
  });

  it("rejects a structurally valid initial resource rebound to an NPC in every stored World", () => {
    const forged = structuredClone(built), analysis = forged.trajectoryAnalysis;
    const npc = analysis.spec.trajectoryTemplate.initialWorld.agentDefinitions.find(agent => agent.actorType === "third_party")!;
    analysis.spec.trajectoryTemplate.initialWorld.resources[0].controllerAgentId = npc.id;
    for (const [index, trajectory] of analysis.trajectories.entries()) {
      trajectory.finalWorld.resources[0].controllerAgentId = npc.id;
      forged.worldSnapshots[index] = structuredClone(trajectory.finalWorld);
      expect(validateWorldV2(trajectory.finalWorld).ok).toBe(true);
    }
    expect(validateWorldV2(analysis.spec.trajectoryTemplate.initialWorld).ok).toBe(true);
    expect(projectFormalSandboxResult(forged) === null).toBe(true);
  });

  it.each(["null", "bad_status", "sample_key", "unsafe_path"])("client rejects malformed recorded timeline: %s", async mode => {
    const projection = projectFormalSandboxResult(built)!;
    const record = projection as unknown as { timeline: Timeline | null };
    if (mode === "null") record.timeline = null;
    else if (mode === "bad_status") record.timeline!.samples[0].ticks[0].status = "not_reached";
    else if (mode === "sample_key") record.timeline!.samples[0].key = "sample-4";
    else record.timeline!.samples[0].ticks[0].event!.changes[0].label = "C:\\Users\\private-location\\history.json";
    const client = createFormalSandboxClient(async () => new Response(JSON.stringify({ ok: true, completed_at: null, projection }), { status: 200 }));
    const result = await client.result("opaque-run-selector");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe("invalid_response");
  });

  it.each([null, {}, { trajectories: [] }])("rejects malformed present analysis rather than silently labelling it unrecorded: %j", analysis => {
    expect(projectFormalSandboxResult({ ...built, trajectoryAnalysis: analysis }) === null).toBe(true);
  });

  it("rejects an event cause borrowed from another sample", () => {
    const forged = structuredClone(built);
    forged.events[1].priorWorldEventIds = [forged.trajectoryAnalysis.trajectories[1].finalWorld.worldEvents[0].id];
    expect(projectFormalSandboxResult(forged) === null).toBe(true);
  });

  it("rejects a future cause within the same sample", () => {
    const forged = structuredClone(built);
    forged.events[0].priorWorldEventIds = [forged.trajectoryAnalysis.trajectories[0].finalWorld.worldEvents[1].id];
    expect(projectFormalSandboxResult(forged) === null).toBe(true);
  });
});
