import { createStableAgentWorldIdFactoryV2 } from "../agent-world/ids";
import { initializeWorldV2 } from "../agent-world/world-initializer";
import type { ActionProposalInputV2 } from "../agent-world/types";
import {
  createFixedAgentWorldRuntimeV2,
  idsV2,
  realityBoundaryV2,
  worldInitializationSpecV2,
} from "../agent-world/test-fixtures";
import { createLocalTrajectoryPolicyV2 } from "./local-adapter";
import { TRAJECTORY_ENGINE_VERSION_V2, type TrajectoryRunSpecV2 } from "./types";

export function initialTrajectoryWorldFixtureV2() {
  const result = initializeWorldV2(
    realityBoundaryV2(),
    worldInitializationSpecV2(),
    createFixedAgentWorldRuntimeV2(),
  );
  if (!result.ok) throw new Error(result.errorCode);
  return result.world;
}

export function trajectoryRunSpecFixtureV2(): TrajectoryRunSpecV2 {
  const initialWorld = initialTrajectoryWorldFixtureV2();
  return {
    runSpecId: "trajectory_run_spec_v2_career_fixture",
    trajectoryId: "trajectory_v2_career_fixture",
    seedContextId: initialWorld.seedContextId,
    initialWorld,
    expectedInitialWorldRevision: initialWorld.revision,
    trajectorySeed: 123456789,
    horizonDays: 30,
    startAt: "2026-07-19T10:00:00.000Z",
    tickIntervalDays: 1,
    maxTicks: 3,
    policyId: "local_fixture_policy",
    policyVersion: "1",
    trajectoryEngineVersion: TRAJECTORY_ENGINE_VERSION_V2,
  };
}

export function createTrajectoryRuntimeFixtureV2() {
  return {
    agentWorldIdFactory: createStableAgentWorldIdFactoryV2("stage-4-tests"),
  };
}

export function trajectoryPolicyFixtureV2({
  candidateCount = 1,
  invalidAmount,
}: { candidateCount?: number; invalidAmount?: number } = {}) {
  const spec = trajectoryRunSpecFixtureV2();
  return createLocalTrajectoryPolicyV2({
    policyId: spec.policyId,
    policyVersion: spec.policyVersion,
    candidatesForTick: ({ world, tickIndex, occurredAt }) =>
      Array.from({ length: candidateCount }, (_, candidateIndex): ActionProposalInputV2 => ({
        id: `action_proposal_v2_tick_${tickIndex}_candidate_${candidateIndex}`,
        seedContextId: world.seedContextId,
        actorAgentId: idsV2.self,
        actionType: "allocate_resource",
        targetEntityIds: [idsV2.offer],
        targetResourceIds: [idsV2.time],
        targetRelationIds: [],
        targetVariableIds: [],
        parameters: {
          actionType: "allocate_resource",
          resourceId: idsV2.time,
          amount: invalidAmount ?? candidateIndex + 1,
        },
        realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[0]!.id],
        assumptionIds: [],
        priorWorldEventIds: [],
        rationaleSummary: `Candidate ${candidateIndex} for Tick ${tickIndex}.`,
        createdAt: occurredAt,
      })),
  });
}

