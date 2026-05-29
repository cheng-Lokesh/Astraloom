import type { AgentProfileDraft } from "@/types/agent-profile";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";

import type { BranchPolicy, EventPolicyResult } from "./simulation-types";

function evidenceRefsForEvent(
  agents: AgentProfileDraft[],
  edge: RelationEdgeDraft,
) {
  const agentRefs = agents
    .filter((agent) => [edge.fromAgentId, edge.toAgentId].includes(agent.id))
    .flatMap((agent) => agent.evidenceRefs);

  return Array.from(new Set([...edge.evidenceRefs, ...agentRefs]));
}

export function buildEventPolicy(
  agents: AgentProfileDraft[],
  edge: RelationEdgeDraft,
  beforeWeights: RelationWeights,
  delta: Partial<RelationWeights>,
  branch: BranchPolicy,
  tickIndex: number,
): EventPolicyResult {
  if (tickIndex === 1) {
    return {
      eventType: "graph_freeze",
      causes: ["run_freezes_agent_and_relation_snapshots"],
      action: "Freeze the current relation edge as evidence baseline.",
      summary: `${branch.label} starts by freezing a ${edge.relationshipType} edge as the evidence baseline.`,
      ruleSource: {
        ruleId: "event:graph_freeze",
        agentIds: [edge.fromAgentId, edge.toAgentId],
        relationEdgeIds: [edge.id],
        evidenceRefs: evidenceRefsForEvent(agents, edge),
      },
    };
  }

  if ((delta.informationGap ?? 0) > 0) {
    return {
      eventType: "information_gap_widening",
      causes: ["edge_information_gap_delta_positive", `branch:${branch.id}`],
      action: "Record that the available facts became less complete.",
      summary: `${branch.label} widens an information gap on a ${edge.relationshipType} edge; this is a signal, not a conclusion.`,
      ruleSource: {
        ruleId: "event:information_gap_widening",
        agentIds: [edge.fromAgentId, edge.toAgentId],
        relationEdgeIds: [edge.id],
        evidenceRefs: evidenceRefsForEvent(agents, edge),
      },
    };
  }

  if (branch.id === "boundary_adjustment") {
    return {
      eventType: "relation_pressure",
      causes: ["boundary_adjustment_path", `branch:${branch.id}`],
      action:
        "Model a clearer time box, boundary, or alternative option without turning it into a user choice.",
      summary: `${branch.label} tests whether a clearer boundary or controlled alternative can stabilize a ${edge.relationshipType} edge.`,
      ruleSource: {
        ruleId: "event:boundary_adjustment",
        agentIds: [edge.fromAgentId, edge.toAgentId],
        relationEdgeIds: [edge.id],
        evidenceRefs: evidenceRefsForEvent(agents, edge),
      },
    };
  }

  if ((delta.competition ?? 0) > 0 || edge.relationshipType === "rivalry") {
    return {
      eventType: "resource_competition",
      causes: ["edge_competition_or_resource_pressure", `branch:${branch.id}`],
      action: "Track resource pressure without turning it into a fixed outcome.",
      summary: `${branch.label} surfaces resource competition around a ${edge.relationshipType} edge.`,
      ruleSource: {
        ruleId: "event:resource_competition",
        agentIds: [edge.fromAgentId, edge.toAgentId],
        relationEdgeIds: [edge.id],
        evidenceRefs: evidenceRefsForEvent(agents, edge),
      },
    };
  }

  if ((delta.hostility ?? 0) > 0) {
    return {
      eventType: beforeWeights.hostility > 60 ? "direct_conflict" : "avoidance",
      causes: ["edge_hostility_delta_positive", `branch:${branch.id}`],
      action:
        beforeWeights.hostility > 60
          ? "Record a direct conflict pressure signal."
          : "Record an avoidance pressure signal.",
      summary: `${branch.label} records pressure on a ${edge.relationshipType} edge while preserving uncertainty.`,
      ruleSource: {
        ruleId:
          beforeWeights.hostility > 60 ? "event:direct_conflict" : "event:avoidance",
        agentIds: [edge.fromAgentId, edge.toAgentId],
        relationEdgeIds: [edge.id],
        evidenceRefs: evidenceRefsForEvent(agents, edge),
      },
    };
  }

  if ((delta.informationGap ?? 0) < 0 || branch.id === "decisive_self") {
    return {
      eventType: "disclosure",
      causes: ["information_gap_reduced", `branch:${branch.id}`],
      action: "Record a clearer information exchange signal.",
      summary: `${branch.label} reduces uncertainty on a ${edge.relationshipType} edge through a disclosure signal.`,
      ruleSource: {
        ruleId: "event:disclosure",
        agentIds: [edge.fromAgentId, edge.toAgentId],
        relationEdgeIds: [edge.id],
        evidenceRefs: evidenceRefsForEvent(agents, edge),
      },
    };
  }

  if ((delta.trust ?? 0) > 0 || branch.id === "cautious_self") {
    return {
      eventType: "support",
      causes: ["edge_trust_delta_positive", `branch:${branch.id}`],
      action: "Record a support signal that may later support a cautious claim.",
      summary: `${branch.label} records a support signal on a ${edge.relationshipType} edge.`,
      ruleSource: {
        ruleId: "event:support",
        agentIds: [edge.fromAgentId, edge.toAgentId],
        relationEdgeIds: [edge.id],
        evidenceRefs: evidenceRefsForEvent(agents, edge),
      },
    };
  }

  return {
    eventType:
      edge.relationshipType === "opportunity" ? "opportunity_signal" : "cooperation",
    causes: ["edge_rule_cooperation_default", `branch:${branch.id}`],
    action: "Record a low-risk cooperation or opportunity signal.",
    summary: `${branch.label} records a cooperation signal on a ${edge.relationshipType} edge.`,
    ruleSource: {
      ruleId:
        edge.relationshipType === "opportunity"
          ? "event:opportunity_signal"
          : "event:cooperation",
      agentIds: [edge.fromAgentId, edge.toAgentId],
      relationEdgeIds: [edge.id],
      evidenceRefs: evidenceRefsForEvent(agents, edge),
    },
  };
}
