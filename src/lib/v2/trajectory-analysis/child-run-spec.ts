import type { TrajectoryRunSpecV2 } from "../trajectory/types";
import { childRunSpecIdV2, childTrajectoryIdV2 } from "./ids";
import type { BatchRunSpecV2 } from "./types";

function childIdentityV2(spec: BatchRunSpecV2) {
  return {
    ...spec,
    trajectoryTemplate: {
      ...spec.trajectoryTemplate,
      runSpecId: undefined,
      trajectoryId: undefined,
    },
    trajectorySeeds: spec.trajectorySeeds,
  };
}

export function buildChildTrajectoryRunSpecV2(
  spec: BatchRunSpecV2,
  seed: number,
): TrajectoryRunSpecV2 {
  const identity = childIdentityV2(spec);
  return {
    ...structuredClone(spec.trajectoryTemplate),
    runSpecId: childRunSpecIdV2(identity, seed),
    trajectoryId: childTrajectoryIdV2(identity, seed),
    trajectorySeed: seed,
  };
}
