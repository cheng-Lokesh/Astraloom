import type {
  AgentDefinitionSpecV2,
  AgentDefinitionV2,
  AgentWorldRuntimeV2,
} from "./types";
import { AGENT_WORLD_SCHEMA_VERSION_V2 } from "./types";

export function createAgentDefinitionV2(
  seedContextId: string,
  spec: AgentDefinitionSpecV2,
  runtime: AgentWorldRuntimeV2,
): AgentDefinitionV2 {
  return {
    ...structuredClone(spec),
    seedContextId,
    schemaVersion: AGENT_WORLD_SCHEMA_VERSION_V2,
    createdAt: runtime.clock(),
  };
}
