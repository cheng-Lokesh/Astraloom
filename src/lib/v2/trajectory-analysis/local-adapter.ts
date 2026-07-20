import type { TrajectoryAnalysisAdapterV2 } from "./types";

export function createLocalTrajectoryAnalysisAdapterV2(adapter: TrajectoryAnalysisAdapterV2): TrajectoryAnalysisAdapterV2 {
  return Object.freeze({ ...adapter });
}
