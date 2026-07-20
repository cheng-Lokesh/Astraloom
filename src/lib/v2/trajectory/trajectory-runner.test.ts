import { describe, expect, it, vi } from "vitest";

import type { ActionProposalInputV2 } from "../agent-world/types";
import { createStableAgentWorldIdFactoryV2 } from "../agent-world/ids";
import { idsV2 } from "../agent-world/test-fixtures";
import { createLocalTrajectoryPolicyV2 } from "./local-adapter";
import {
  createTrajectoryRuntimeFixtureV2,
  trajectoryPolicyFixtureV2,
  trajectoryRunSpecFixtureV2,
} from "./test-fixtures";
import { executeTrajectoryV2 } from "./trajectory-runner";

function policyWithCandidateTimes(createdAtValues: string[]) {
  const spec = trajectoryRunSpecFixtureV2();
  return createLocalTrajectoryPolicyV2({
    policyId: spec.policyId,
    policyVersion: spec.policyVersion,
    candidatesForTick: (input) => {
      const candidates = trajectoryPolicyFixtureV2({
        candidateCount: createdAtValues.length,
      }).proposeCandidates(input) as ActionProposalInputV2[];
      return candidates.map((candidate, index) => ({
        ...candidate,
        createdAt: createdAtValues[index]!,
      }));
    },
  });
}

function expectNoSelectedTickArtifacts(result: ReturnType<typeof executeTrajectoryV2>) {
  expect(result).toMatchObject({ ok: false, errorCode: "invalid_policy_output" });
  if (result.ok || !result.trajectory) throw new Error("missing failure trajectory");
  const step = result.trajectory.steps[0];
  expect(step).not.toHaveProperty("rngAudit");
  expect(step).not.toHaveProperty("selectedCandidateIndex");
  expect(step).not.toHaveProperty("proposalId");
  expect(step).not.toHaveProperty("commandId");
  expect(step).not.toHaveProperty("worldEventId");
  expect(result.trajectory.finalWorld.revision).toBe(0);
  expect(result.trajectory.finalWorld.worldEvents).toEqual([]);
}

describe("Trajectory Runner V2", () => {
  it("rejects a Run Spec that starts before World without calling Policy or returning partial output", () => {
    const spec = {
      ...trajectoryRunSpecFixtureV2(),
      startAt: "2026-07-19T09:59:59.999Z",
    };
    const proposeCandidates = vi.fn(() => []);
    const result = executeTrajectoryV2(
      spec,
      {
        policyId: spec.policyId,
        policyVersion: spec.policyVersion,
        proposeCandidates,
      },
      createTrajectoryRuntimeFixtureV2(),
    );

    expect(result).toEqual({ ok: false, errorCode: "start_before_initial_world" });
    expect(proposeCandidates).not.toHaveBeenCalled();
    expect(result).not.toHaveProperty("trajectory");
  });

  it.each([
    ["past", "2026-07-19T09:59:59.999Z"],
    ["future", "2026-07-19T10:00:00.001Z"],
    ["far-future", "2099-01-01T00:00:00.000Z"],
  ])("rejects a %s Proposal timestamp before candidate selection", (_label, createdAt) => {
    const result = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), maxTicks: 1 },
      policyWithCandidateTimes([createdAt]),
      createTrajectoryRuntimeFixtureV2(),
    );

    expectNoSelectedTickArtifacts(result);
    if (!result.ok) {
      expect(result.issues).toEqual([
        "candidates.0.createdAt: Must represent the same instant as Tick occurredAt 2026-07-19T10:00:00.000Z.",
      ]);
    }
  });

  it("accepts a Proposal timestamp expressed as the same instant in another timezone", () => {
    const result = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), maxTicks: 1 },
      policyWithCandidateTimes(["2026-07-19T18:00:00.000+08:00"]),
      createTrajectoryRuntimeFixtureV2(),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trajectory.finalWorld.revision).toBe(1);
      expect(result.trajectory.finalWorld.worldEvents).toHaveLength(1);
    }
  });

  it("rejects the entire candidate set when one of multiple Proposal timestamps drifts", () => {
    const result = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), maxTicks: 1 },
      policyWithCandidateTimes([
        "2026-07-19T10:00:00.000Z",
        "2026-07-19T10:00:00.001Z",
      ]),
      createTrajectoryRuntimeFixtureV2(),
    );

    expectNoSelectedTickArtifacts(result);
    if (!result.ok) {
      expect(result.issues).toEqual([
        "candidates.1.createdAt: Must represent the same instant as Tick occurredAt 2026-07-19T10:00:00.000Z.",
      ]);
    }
  });

  it.each([30, 90] as const)("executes a legal %i-day Run Spec", (horizonDays) => {
    const result = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), horizonDays, maxTicks: 1 },
      trajectoryPolicyFixtureV2(),
      createTrajectoryRuntimeFixtureV2(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.trajectory.horizonDays).toBe(horizonDays);
  });

  it("executes one legal Tick through Proposal, Command, and World Transition", () => {
    const result = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), maxTicks: 1 },
      trajectoryPolicyFixtureV2(),
      createTrajectoryRuntimeFixtureV2(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.trajectory.status).toBe("completed");
    expect(result.trajectory.steps).toHaveLength(1);
    expect(result.trajectory.steps[0]).toMatchObject({
      tickIndex: 0,
      occurredAt: "2026-07-19T10:00:00.000Z",
      selectedCandidateIndex: expect.any(Number),
      proposalId: expect.stringMatching(/^action_proposal_v2_/),
      commandId: expect.stringMatching(/^transition_command_v2_/),
      worldEventId: expect.stringMatching(/^world_event_v2_/),
      beforeRevision: 0,
      afterRevision: 1,
    });
    expect(result.trajectory.finalWorld.worldEvents[0]?.evidenceClass).toBe(
      "world_transition_simulation_evidence",
    );
  });

  it("executes multiple Ticks with exact revisions and append-only Events", () => {
    const result = executeTrajectoryV2(
      trajectoryRunSpecFixtureV2(),
      trajectoryPolicyFixtureV2(),
      createTrajectoryRuntimeFixtureV2(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.trajectory.steps.map((step) => [step.beforeRevision, step.afterRevision])).toEqual([
      [0, 1], [1, 2], [2, 3],
    ]);
    expect(result.trajectory.steps.map((step) => step.occurredAt)).toEqual([
      "2026-07-19T10:00:00.000Z",
      "2026-07-20T10:00:00.000Z",
      "2026-07-21T10:00:00.000Z",
    ]);
    expect(result.trajectory.finalWorld.worldEvents).toHaveLength(3);
    expect(result.trajectory.finalWorld.resources.find((item) => item.id === idsV2.time)?.available).toBe(3);
  });

  it("is deeply reproducible for fixed inputs including ids, selections, commands, Events, and final World", () => {
    const spec = trajectoryRunSpecFixtureV2();
    const first = executeTrajectoryV2(spec, trajectoryPolicyFixtureV2(), createTrajectoryRuntimeFixtureV2());
    const second = executeTrajectoryV2(spec, trajectoryPolicyFixtureV2(), createTrajectoryRuntimeFixtureV2());
    expect(second).toEqual(first);
  });

  it("allows another seed to choose a different deterministic candidate", () => {
    const policy = trajectoryPolicyFixtureV2({ candidateCount: 3 });
    const first = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), trajectorySeed: 1, maxTicks: 1 }, policy,
      createTrajectoryRuntimeFixtureV2(),
    );
    const second = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), trajectorySeed: 2, maxTicks: 1 }, policy,
      createTrajectoryRuntimeFixtureV2(),
    );
    expect(first.ok && first.trajectory.steps[0]?.selectedCandidateIndex).not.toBe(
      second.ok && second.trajectory.steps[0]?.selectedCandidateIndex,
    );
  });

  it("does not modify Run Spec, initial World, or policy candidates", () => {
    const spec = trajectoryRunSpecFixtureV2();
    const candidates: ActionProposalInputV2[] = [];
    const policy = createLocalTrajectoryPolicyV2({
      policyId: spec.policyId,
      policyVersion: spec.policyVersion,
      candidatesForTick: (input) => {
        const generated = trajectoryPolicyFixtureV2().proposeCandidates(input) as ActionProposalInputV2[];
        candidates.splice(0, candidates.length, ...generated);
        return candidates;
      },
    });
    const beforeSpec = structuredClone(spec);
    const result = executeTrajectoryV2(spec, policy, createTrajectoryRuntimeFixtureV2());
    expect(spec).toEqual(beforeSpec);
    expect(candidates[0]?.parameters).toMatchObject({ amount: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trajectory.finalWorld.agentDefinitions).toEqual(
        beforeSpec.initialWorld.agentDefinitions,
      );
    }
  });

  it("terminates deterministically with no_actions", () => {
    const spec = trajectoryRunSpecFixtureV2();
    const policy = createLocalTrajectoryPolicyV2({
      policyId: spec.policyId,
      policyVersion: spec.policyVersion,
      candidatesForTick: () => [],
    });
    const result = executeTrajectoryV2(spec, policy, createTrajectoryRuntimeFixtureV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.trajectory.status).toBe("no_actions");
    expect(result.trajectory.steps[0]).toMatchObject({
      tickIndex: 0,
      beforeRevision: 0,
      afterRevision: 0,
      termination: { reason: "no_actions" },
    });
    expect(result.trajectory.finalWorld.worldEvents).toEqual([]);
  });

  it("returns stable invalid policy output without a partial Tick", () => {
    const spec = trajectoryRunSpecFixtureV2();
    const policy = createLocalTrajectoryPolicyV2({
      policyId: spec.policyId,
      policyVersion: spec.policyVersion,
      candidatesForTick: () => [{ bad: true }],
    });
    const result = executeTrajectoryV2(spec, policy, createTrajectoryRuntimeFixtureV2());
    expect(result).toMatchObject({ ok: false, errorCode: "invalid_policy_output" });
    if (result.ok) return;
    if (!result.trajectory) throw new Error("missing failure trajectory");
    expect(result.trajectory.steps.at(-1)).toMatchObject({ beforeRevision: 0, afterRevision: 0 });
    expect(result.trajectory.steps.at(-1)).not.toHaveProperty("commandId");
    expect(result.trajectory.steps.at(-1)).not.toHaveProperty("worldEventId");
    expect(result.trajectory.finalWorld.revision).toBe(0);
  });

  it("returns approval failures without partial Command, Event, or revision", () => {
    const spec = trajectoryRunSpecFixtureV2();
    const policy = trajectoryPolicyFixtureV2({ invalidAmount: 99 });
    const result = executeTrajectoryV2(spec, policy, createTrajectoryRuntimeFixtureV2());
    expect(result).toMatchObject({ ok: false, errorCode: "proposal_approval_failed" });
    if (result.ok) return;
    if (!result.trajectory) throw new Error("missing failure trajectory");
    expect(result.trajectory.steps[0]).not.toHaveProperty("commandId");
    expect(result.trajectory.steps[0]).not.toHaveProperty("worldEventId");
    expect(result.trajectory.finalWorld.revision).toBe(0);
  });

  it("returns transition failures without exposing a partial Command, Event, or revision", () => {
    const baseFactory = createStableAgentWorldIdFactoryV2("stage-4-transition-failure");
    const result = executeTrajectoryV2(
      { ...trajectoryRunSpecFixtureV2(), maxTicks: 1 },
      trajectoryPolicyFixtureV2(),
      {
        agentWorldIdFactory: (kind, fingerprint) =>
          kind === "world_event" ? "invalid_event_id" : baseFactory(kind, fingerprint),
      },
    );
    expect(result).toMatchObject({ ok: false, errorCode: "world_transition_failed" });
    if (result.ok || !result.trajectory) return;
    expect(result.trajectory.steps[0]).not.toHaveProperty("commandId");
    expect(result.trajectory.steps[0]).not.toHaveProperty("worldEventId");
    expect(result.trajectory.finalWorld.revision).toBe(0);
    expect(result.trajectory.finalWorld.worldEvents).toEqual([]);
  });

  it("rejects policy identity drift with a stable error", () => {
    const policy = trajectoryPolicyFixtureV2();
    const result = executeTrajectoryV2(
      trajectoryRunSpecFixtureV2(),
      { ...policy, policyVersion: "2" },
      createTrajectoryRuntimeFixtureV2(),
    );
    expect(result).toEqual({ ok: false, errorCode: "policy_mismatch" });
  });

  it("converts a policy exception into a stable failure without changing World", () => {
    const spec = trajectoryRunSpecFixtureV2();
    const policy = createLocalTrajectoryPolicyV2({
      policyId: spec.policyId,
      policyVersion: spec.policyVersion,
      candidatesForTick: () => {
        throw new Error("adapter failure");
      },
    });
    const result = executeTrajectoryV2(spec, policy, createTrajectoryRuntimeFixtureV2());
    expect(result).toMatchObject({ ok: false, errorCode: "policy_execution_failed" });
    if (result.ok || !result.trajectory) return;
    expect(result.trajectory.finalWorld).toEqual(spec.initialWorld);
  });

  it("keeps Real Evidence unchanged and never mixes Simulation Events into its ledger", () => {
    const spec = trajectoryRunSpecFixtureV2();
    const evidenceBefore = structuredClone(spec.initialWorld.realityBoundarySnapshot.evidenceLedger);
    const result = executeTrajectoryV2(spec, trajectoryPolicyFixtureV2(), createTrajectoryRuntimeFixtureV2());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.trajectory.finalWorld.realityBoundarySnapshot.evidenceLedger).toEqual(evidenceBefore);
    const realIds = new Set(evidenceBefore.items.map((item) => item.id));
    expect(result.trajectory.finalWorld.worldEventIds.every((id) => !realIds.has(id as never))).toBe(true);
  });
});
