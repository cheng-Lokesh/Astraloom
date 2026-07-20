import type { TrajectoryIdV2, TrajectoryRunSpecIdV2 } from "./types";

const suffix = "[a-z0-9][a-z0-9_-]*";

function parser<T extends string>(pattern: RegExp) {
  return (value: unknown): T | null =>
    typeof value === "string" && pattern.test(value) ? (value as T) : null;
}

export const parseTrajectoryRunSpecIdV2 = parser<TrajectoryRunSpecIdV2>(
  new RegExp(`^trajectory_run_spec_v2_${suffix}$`, "i"),
);

export const parseTrajectoryIdV2 = parser<TrajectoryIdV2>(
  new RegExp(`^trajectory_v2_${suffix}$`, "i"),
);
