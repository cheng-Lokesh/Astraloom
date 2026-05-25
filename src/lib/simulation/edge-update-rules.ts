import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";

import type { BranchPolicy, EdgeUpdateResult } from "./simulation-types";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function applyDelta(
  weights: RelationWeights,
  delta: Partial<RelationWeights>,
): RelationWeights {
  return {
    trust: clamp(weights.trust + (delta.trust ?? 0)),
    hostility: clamp(weights.hostility + (delta.hostility ?? 0)),
    dependency: clamp(weights.dependency + (delta.dependency ?? 0)),
    attraction: clamp(weights.attraction + (delta.attraction ?? 0)),
    competition: clamp(weights.competition + (delta.competition ?? 0)),
    informationGap: clamp(weights.informationGap + (delta.informationGap ?? 0)),
    resourceControl: clamp(
      weights.resourceControl + (delta.resourceControl ?? 0),
    ),
    emotionalDebt: clamp(weights.emotionalDebt + (delta.emotionalDebt ?? 0)),
  };
}

export function buildEdgeUpdate(
  edge: RelationEdgeDraft,
  beforeWeights: RelationWeights,
  branch: BranchPolicy,
  tickIndex: number,
): EdgeUpdateResult {
  const pressure =
    beforeWeights.hostility +
    beforeWeights.competition +
    beforeWeights.informationGap +
    beforeWeights.resourceControl;
  const support = beforeWeights.trust + beforeWeights.dependency;
  const pressureLeads = pressure > support;
  const pulse = 1 + ((tickIndex + edge.id.length + branch.id.length) % 3);
  const ruleIds = [`edge_update:${edge.relationshipType}`, `branch:${branch.id}`];

  const delta: Partial<RelationWeights> = pressureLeads
    ? {
        trust: -pulse,
        hostility: pulse + branch.edgePressureBias,
        informationGap: Math.max(1, pulse + branch.edgePressureBias),
        emotionalDebt: beforeWeights.emotionalDebt > 55 ? 1 : 0,
      }
    : {
        trust: pulse + Math.max(0, branch.cooperationBias),
        hostility: -pulse,
        dependency: branch.id === "cautious_self" ? 1 : 0,
        informationGap: branch.id === "decisive_self" ? -pulse : -1,
      };

  if (edge.relationshipType === "opportunity") {
    delta.resourceControl = branch.id === "decisive_self" ? -1 : 1;
    delta.informationGap = branch.id === "decisive_self" ? -2 : 1;
    ruleIds.push("edge_update:opportunity_signal");
  }

  if (edge.relationshipType === "rivalry") {
    delta.competition = pulse + branch.edgePressureBias;
    ruleIds.push("edge_update:resource_competition");
  }

  return {
    delta,
    afterWeights: applyDelta(beforeWeights, delta),
    ruleIds,
  };
}
