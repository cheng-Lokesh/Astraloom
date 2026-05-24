import type { AgentProfileDraft } from "@/types/agent-profile";
import type {
  RelationEdgeDraft,
  RelationType,
  RelationWeights,
} from "@/types/relation-edge";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function score(value: string, salt: string, min = 10, max = 82) {
  const seed = Number.parseInt(hashText(`${value}:${salt}`).slice(0, 6), 36);
  return min + (seed % (max - min + 1));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function relationTypeForAgent(agent: AgentProfileDraft): RelationType {
  if (agent.agentType === "parallel_self") return "self_variant";

  switch (agent.relationshipToUser) {
    case "boss":
      return "authority";
    case "opportunity_source":
      return "opportunity";
    case "partner":
    case "colleague":
    case "advisor":
      return "alliance";
    case "family_or_partner":
      return "family";
    case "competitor":
      return "rivalry";
    default:
      return agent.profileJson.resources.emotionalLeverage > 58
        ? "dependency"
        : "unknown";
  }
}

function weightsForRelation(
  self: AgentProfileDraft,
  target: AgentProfileDraft,
): RelationWeights {
  const base = `${self.id}:${target.id}:${target.relationshipToUser}`;
  const resources = target.profileJson.resources;
  const state = target.profileJson.state;

  if (target.agentType === "parallel_self") {
    return {
      trust: 72,
      hostility: 0,
      dependency: 36,
      attraction: 0,
      competition: 18,
      informationGap: 22,
      resourceControl: 0,
      emotionalDebt: 0,
    };
  }

  return {
    trust: clamp(state.trustInUser),
    hostility: clamp(state.hostilityToUser),
    dependency: score(base, "dependency", 16, 72),
    attraction: score(base, "attraction", 0, 42),
    competition:
      relationTypeForAgent(target) === "rivalry"
        ? score(base, "competition", 58, 88)
        : score(base, "competition", 10, 52),
    informationGap: score(base, "gap", 18, 84),
    resourceControl: clamp(resources.authority * 0.5 + resources.information * 0.35),
    emotionalDebt: clamp(resources.emotionalLeverage * 0.6 + score(base, "debt", 0, 30)),
  };
}

function edgeConfidence(target: AgentProfileDraft, weights: RelationWeights) {
  const weightSpread =
    Math.max(...Object.values(weights)) - Math.min(...Object.values(weights));
  return clamp(target.confidence * 0.75 + (100 - weightSpread) * 0.25);
}

function edgeLabel(type: RelationType) {
  const labels: Record<RelationType, string> = {
    self_variant: "parallel self comparison",
    authority: "authority pressure",
    opportunity: "opportunity path",
    alliance: "alliance / support",
    dependency: "dependency",
    rivalry: "resource competition",
    family: "family / emotional boundary",
    unknown: "low-confidence relation",
  };

  return labels[type];
}

export function buildRelationEdges(
  seedContextId: string,
  agents: AgentProfileDraft[],
) {
  const now = new Date().toISOString();
  const self = agents.find((agent) => agent.agentType === "self") ?? agents[0];
  if (!self) return [];

  return agents
    .filter((agent) => agent.id !== self.id)
    .map((agent): RelationEdgeDraft => {
      const relationshipType = relationTypeForAgent(agent);
      const weights = weightsForRelation(self, agent);

      return {
        id: `edge_${hashText(`${seedContextId}:${self.id}:${agent.id}`)}`,
        seedContextId,
        version: "local-deterministic-v0",
        fromAgentId:
          agent.agentType === "parallel_self" ? agent.id : self.id,
        toAgentId:
          agent.agentType === "parallel_self" ? self.id : agent.id,
        relationshipType,
        weights,
        trend: {
          trustDelta3Ticks: 0,
          hostilityDelta3Ticks: 0,
          volatility: score(`${self.id}:${agent.id}`, "volatility", 8, 54),
        },
        confidence: edgeConfidence(agent, weights),
        evidenceRefs: Array.from(
          new Set([...self.evidenceRefs, ...agent.evidenceRefs]),
        ),
        lastInteraction: {
          eventId: null,
          summary: `${edgeLabel(relationshipType)} drafted from local Agent Profile evidence.`,
          tick: 0,
        },
        createdAt: now,
        updatedAt: now,
      };
    });
}

