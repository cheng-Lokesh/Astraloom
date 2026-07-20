import type {
  ActionProposalInputV2,
  AgentWorldIdFactoryV2,
  WorldStateV2,
} from "../agent-world/types";

export const TRAJECTORY_ENGINE_VERSION_V2 =
  "trajectory-engine-v2-stage-4" as const;
export const SEEDED_RNG_ALGORITHM_V2 = "mulberry32" as const;
export const SEEDED_RNG_VERSION_V2 = "1" as const;

export type TrajectoryRunSpecIdV2 = `trajectory_run_spec_v2_${string}`;
export type TrajectoryIdV2 = `trajectory_v2_${string}`;

export type TrajectoryRunSpecV2 = {
  runSpecId: TrajectoryRunSpecIdV2;
  trajectoryId: TrajectoryIdV2;
  seedContextId: string;
  initialWorld: WorldStateV2;
  expectedInitialWorldRevision: number;
  trajectorySeed: number;
  horizonDays: 30 | 90;
  startAt: string;
  tickIntervalDays: number;
  maxTicks: number;
  policyId: string;
  policyVersion: string;
  trajectoryEngineVersion: typeof TRAJECTORY_ENGINE_VERSION_V2;
};

export type SeededRngAuditV2 = {
  algorithm: typeof SEEDED_RNG_ALGORITHM_V2;
  version: typeof SEEDED_RNG_VERSION_V2;
  seed: number;
  drawIndex: number;
  rawValue: number;
  selectedIndex: number;
};

export type SeededRngV2 = {
  readonly algorithm: typeof SEEDED_RNG_ALGORITHM_V2;
  readonly version: typeof SEEDED_RNG_VERSION_V2;
  readonly seed: number;
  readonly drawIndex: number;
  nextUint32: () => number;
};

export type TrajectoryPolicyInputV2 = {
  world: Readonly<WorldStateV2>;
  tickIndex: number;
  occurredAt: string;
  trajectorySeed: number;
  rng: SeededRngV2;
  policyId: string;
  policyVersion: string;
};

export type TrajectoryPolicyV2 = {
  readonly policyId: string;
  readonly policyVersion: string;
  proposeCandidates: (input: TrajectoryPolicyInputV2) => unknown;
};

export type TrajectoryRuntimeV2 = {
  agentWorldIdFactory: AgentWorldIdFactoryV2;
};

export type TrajectoryStatusV2 = "completed" | "no_actions" | "failed";

export type TrajectoryStepV2 = {
  tickIndex: number;
  occurredAt: string;
  selectedCandidateIndex?: number;
  rngAudit?: SeededRngAuditV2;
  proposalId?: ActionProposalInputV2["id"];
  commandId?: `transition_command_v2_${string}`;
  worldEventId?: `world_event_v2_${string}`;
  beforeRevision: number;
  afterRevision: number;
  termination?: { reason: "no_actions" };
  error?: { code: TrajectoryExecutionErrorCodeV2 };
};

export type TrajectoryResultV2 = {
  trajectoryId: TrajectoryIdV2;
  runSpecId: TrajectoryRunSpecIdV2;
  seedContextId: string;
  trajectorySeed: number;
  trajectoryEngineVersion: typeof TRAJECTORY_ENGINE_VERSION_V2;
  agentWorldEngineVersion: WorldStateV2["engineVersion"];
  policyId: string;
  policyVersion: string;
  horizonDays: 30 | 90;
  startedAt: string;
  completedAt: string;
  status: TrajectoryStatusV2;
  initialWorldId: WorldStateV2["id"];
  initialWorldRevision: number;
  finalWorld: WorldStateV2;
  steps: TrajectoryStepV2[];
};

export type TrajectoryRunSpecErrorCodeV2 =
  | "invalid_run_spec"
  | "invalid_initial_world"
  | "cross_seed_reference"
  | "stale_initial_world_revision"
  | "schedule_exceeds_horizon";

export type TrajectoryExecutionErrorCodeV2 =
  | TrajectoryRunSpecErrorCodeV2
  | "policy_mismatch"
  | "policy_execution_failed"
  | "invalid_policy_output"
  | "proposal_approval_failed"
  | "world_transition_failed";

export type TrajectoryExecutionResultV2 =
  | { ok: true; trajectory: TrajectoryResultV2 }
  | {
      ok: false;
      errorCode: TrajectoryExecutionErrorCodeV2;
      trajectory?: TrajectoryResultV2;
      causeCode?: string;
      issues?: string[];
    };

