import type {
  ActionProposalIdV2,
  AgentDefinitionIdV2,
  AgentWorldIdFactoryV2,
  AgentWorldIdKindV2,
  TransitionCommandIdV2,
  WorldConstraintIdV2,
  WorldEntityIdV2,
  WorldEventIdV2,
  WorldIdV2,
  WorldRelationIdV2,
  WorldResourceIdV2,
  WorldVariableIdV2,
} from "./types";

const prefixes: Record<AgentWorldIdKindV2, string> = {
  world: "world_v2_",
  agent_definition: "agent_definition_v2_",
  world_entity: "world_entity_v2_",
  world_relation: "world_relation_v2_",
  world_resource: "world_resource_v2_",
  world_constraint: "world_constraint_v2_",
  world_variable: "world_variable_v2_",
  action_proposal: "action_proposal_v2_",
  transition_command: "transition_command_v2_",
  world_event: "world_event_v2_",
};

function stableHash(value: string) {
  let first = 2166136261;
  let second = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 3266489917);
  }
  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

export function createStableAgentWorldIdFactoryV2(
  namespace = "astraloom-agent-world-v2",
): AgentWorldIdFactoryV2 {
  return (kind, fingerprint) =>
    `${prefixes[kind]}${stableHash(`${namespace}:${kind}:${fingerprint}`)}`;
}

function parser<T extends string>(pattern: RegExp) {
  return (value: unknown): T | null =>
    typeof value === "string" && pattern.test(value) ? (value as T) : null;
}

const suffix = "[a-z0-9][a-z0-9_-]*";
export const parseWorldIdV2 = parser<WorldIdV2>(new RegExp(`^world_v2_${suffix}$`, "i"));
export const parseAgentDefinitionIdV2 = parser<AgentDefinitionIdV2>(new RegExp(`^agent_definition_v2_${suffix}$`, "i"));
export const parseWorldEntityIdV2 = parser<WorldEntityIdV2>(new RegExp(`^world_entity_v2_${suffix}$`, "i"));
export const parseWorldRelationIdV2 = parser<WorldRelationIdV2>(new RegExp(`^world_relation_v2_${suffix}$`, "i"));
export const parseWorldResourceIdV2 = parser<WorldResourceIdV2>(new RegExp(`^world_resource_v2_${suffix}$`, "i"));
export const parseWorldConstraintIdV2 = parser<WorldConstraintIdV2>(new RegExp(`^world_constraint_v2_${suffix}$`, "i"));
export const parseWorldVariableIdV2 = parser<WorldVariableIdV2>(new RegExp(`^world_variable_v2_${suffix}$`, "i"));
export const parseActionProposalIdV2 = parser<ActionProposalIdV2>(new RegExp(`^action_proposal_v2_${suffix}$`, "i"));
export const parseTransitionCommandIdV2 = parser<TransitionCommandIdV2>(new RegExp(`^transition_command_v2_${suffix}$`, "i"));
export const parseWorldEventIdV2 = parser<WorldEventIdV2>(new RegExp(`^world_event_v2_${suffix}$`, "i"));
