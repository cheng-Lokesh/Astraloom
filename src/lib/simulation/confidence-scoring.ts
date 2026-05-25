import type { ConfidenceInput } from "./simulation-types";

function clamp(value: number, min = 18, max = 88) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function scoreEventConfidence({
  edge,
  agents,
  ruleCount,
  tickIndex,
}: ConfidenceInput) {
  const participantAgents = agents.filter((agent) =>
    [edge.fromAgentId, edge.toAgentId].includes(agent.id),
  );
  const agentConfidence = participantAgents.length
    ? participantAgents.reduce((sum, agent) => sum + agent.confidence, 0) /
      participantAgents.length
    : edge.confidence;
  const evidenceBonus = Math.min(8, edge.evidenceRefs.length * 2);
  const lateTickPenalty = Math.max(0, tickIndex - 3);

  return clamp(
    edge.confidence * 0.5 +
      agentConfidence * 0.32 +
      ruleCount * 3 +
      evidenceBonus -
      lateTickPenalty,
  );
}
