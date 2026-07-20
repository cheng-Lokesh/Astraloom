import type { TrajectoryPolicyInputV2, TrajectoryPolicyV2 } from "./types";

export function createLocalTrajectoryPolicyV2({
  policyId,
  policyVersion,
  candidatesForTick,
}: {
  policyId: string;
  policyVersion: string;
  candidatesForTick: (input: TrajectoryPolicyInputV2) => unknown;
}): TrajectoryPolicyV2 {
  return {
    policyId,
    policyVersion,
    proposeCandidates(input) {
      return candidatesForTick(input);
    },
  };
}

