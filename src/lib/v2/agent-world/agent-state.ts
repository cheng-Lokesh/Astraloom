import type {
  AgentStateSpecV2,
  AgentStateV2,
  AgentWorldRuntimeV2,
} from "./types";

export function createAgentStateV2(
  seedContextId: string,
  spec: AgentStateSpecV2,
  runtime: AgentWorldRuntimeV2,
): AgentStateV2 {
  return {
    ...structuredClone(spec),
    seedContextId,
    revision: 0,
    updatedAt: runtime.clock(),
  };
}
