import { beforeAll, describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";
import { createFormalSandboxClient } from "./client";

// This contract is asserted through the public producer/reader, not a mock timeline.
type Timeline = { version: string; samples: Array<{ key: string; terminalStatus: string; ticks: Array<{ tickIndex: number; occurredAt: string | null; status: string; event: null | { stepKey: string; kind: string; label: string; participantKeys: string[]; changes: Array<{ kind: string; label: string; before: unknown; after: unknown; unit: string | null }>; causes: { priorStepKeys: string[]; factKeys: string[]; assumptionKeys: string[]; unrecorded: boolean }; claimKeys: string[] } }> }> };
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
