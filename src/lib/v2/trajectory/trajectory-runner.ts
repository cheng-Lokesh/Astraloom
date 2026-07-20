import { approveActionProposalV2 } from "../agent-world/action-proposal";
import { applyWorldTransitionV2 } from "../agent-world/world-transition";
import type { AgentWorldRuntimeV2, WorldStateV2 } from "../agent-world/types";
import { createSeededRngV2, selectSeededIndexV2 } from "./seeded-rng";
import { parseTrajectoryPolicyCandidatesV2 } from "./trajectory-policy";
import { addTrajectoryDaysV2, parseTrajectoryInstantV2 } from "./time";
import type {
  TrajectoryExecutionErrorCodeV2,
  TrajectoryExecutionResultV2,
  TrajectoryPolicyV2,
  TrajectoryResultV2,
  TrajectoryRuntimeV2,
  TrajectoryRunSpecV2,
  TrajectoryStepV2,
} from "./types";
import { parseTrajectoryRunSpecV2 } from "./validation";

function tickTimestamp(startAt: string, tickIndex: number, intervalDays: number) {
  const start = parseTrajectoryInstantV2(startAt);
  if (!start.ok) throw new Error("validated_start_timestamp_required");
  const tick = addTrajectoryDaysV2(start.value, tickIndex * intervalDays);
  if (!tick.ok) throw new Error("validated_tick_timestamp_required");
  return tick.value.isoTimestamp;
}

function baseResult(spec: TrajectoryRunSpecV2): TrajectoryResultV2 {
  return {
    trajectoryId: spec.trajectoryId,
    runSpecId: spec.runSpecId,
    seedContextId: spec.seedContextId,
    trajectorySeed: spec.trajectorySeed,
    trajectoryEngineVersion: spec.trajectoryEngineVersion,
    agentWorldEngineVersion: spec.initialWorld.engineVersion,
    policyId: spec.policyId,
    policyVersion: spec.policyVersion,
    horizonDays: spec.horizonDays,
    startedAt: spec.startAt,
    completedAt: spec.startAt,
    status: "completed",
    initialWorldId: spec.initialWorld.id,
    initialWorldRevision: spec.initialWorld.revision,
    finalWorld: structuredClone(spec.initialWorld),
    steps: [],
  };
}

function failed(
  trajectory: TrajectoryResultV2,
  errorCode: TrajectoryExecutionErrorCodeV2,
  step: TrajectoryStepV2,
  causeCode?: string,
  issues?: string[],
): TrajectoryExecutionResultV2 {
  trajectory.status = "failed";
  trajectory.completedAt = step.occurredAt;
  trajectory.steps.push({ ...step, error: { code: errorCode } });
  return { ok: false, errorCode, trajectory, ...(causeCode ? { causeCode } : {}), ...(issues?.length ? { issues } : {}) };
}

export function executeTrajectoryV2(
  specInput: unknown,
  policy: TrajectoryPolicyV2,
  runtime: TrajectoryRuntimeV2,
): TrajectoryExecutionResultV2 {
  const parsed = parseTrajectoryRunSpecV2(specInput);
  if (!parsed.ok) return parsed;
  const spec = parsed.value;
  if (policy.policyId !== spec.policyId || policy.policyVersion !== spec.policyVersion) {
    return { ok: false, errorCode: "policy_mismatch" };
  }
  const trajectory = baseResult(spec);
  let world: WorldStateV2 = structuredClone(spec.initialWorld);
  const rng = createSeededRngV2(spec.trajectorySeed);

  for (let tickIndex = 0; tickIndex < spec.maxTicks; tickIndex += 1) {
    const occurredAt = tickTimestamp(spec.startAt, tickIndex, spec.tickIntervalDays);
    const beforeRevision = world.revision;
    const emptyStep = { tickIndex, occurredAt, beforeRevision, afterRevision: beforeRevision };
    let output: unknown;
    try {
      output = policy.proposeCandidates({
        world: structuredClone(world),
        tickIndex,
        occurredAt,
        trajectorySeed: spec.trajectorySeed,
        rng,
        policyId: spec.policyId,
        policyVersion: spec.policyVersion,
      });
    } catch {
      trajectory.finalWorld = structuredClone(world);
      return failed(trajectory, "policy_execution_failed", emptyStep);
    }
    const candidates = parseTrajectoryPolicyCandidatesV2(output, occurredAt);
    if (!candidates.ok) {
      trajectory.finalWorld = structuredClone(world);
      return failed(trajectory, "invalid_policy_output", emptyStep, undefined, candidates.issues);
    }
    if (candidates.value.length === 0) {
      trajectory.status = "no_actions";
      trajectory.completedAt = occurredAt;
      trajectory.finalWorld = structuredClone(world);
      trajectory.steps.push({ ...emptyStep, termination: { reason: "no_actions" } });
      return { ok: true, trajectory };
    }

    const rngAudit = selectSeededIndexV2(rng, candidates.value.length);
    const selected = candidates.value[rngAudit.selectedIndex]!;
    const selectedStep = {
      ...emptyStep,
      selectedCandidateIndex: rngAudit.selectedIndex,
      rngAudit,
      proposalId: selected.id,
    };
    const stage3Runtime: AgentWorldRuntimeV2 = {
      clock: () => occurredAt,
      idFactory: runtime.agentWorldIdFactory,
    };
    const approval = approveActionProposalV2(selected, world, world.revision, stage3Runtime);
    if (!approval.ok) {
      trajectory.finalWorld = structuredClone(world);
      return failed(trajectory, "proposal_approval_failed", selectedStep, approval.errorCode, approval.issues);
    }
    const transition = applyWorldTransitionV2(world, approval.command, stage3Runtime);
    if (!transition.ok) {
      trajectory.finalWorld = structuredClone(world);
      return failed(trajectory, "world_transition_failed", selectedStep, transition.errorCode);
    }
    world = transition.world;
    trajectory.steps.push({
      ...selectedStep,
      commandId: approval.command.id,
      worldEventId: transition.event.id,
      afterRevision: world.revision,
    });
    trajectory.completedAt = occurredAt;
    trajectory.finalWorld = structuredClone(world);
  }
  return { ok: true, trajectory };
}
