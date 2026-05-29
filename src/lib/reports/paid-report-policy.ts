import type { AgentProfileDraft } from "@/types/agent-profile";
import type { ClaimDraft } from "@/types/claim";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import type {
  PaidFullReport,
  ReportBranchComparison,
  ReportEvidenceEvent,
} from "@/types/report";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationRunDraft,
} from "@/types/simulation-run";

import { buildStrategyOptions } from "./strategy-builder";

function riskSignal(event: SimulationEventDraft) {
  return [
    "avoidance",
    "direct_conflict",
    "resource_competition",
    "information_gap_widening",
  ].includes(event.eventType);
}

function supportSignal(event: SimulationEventDraft) {
  return ["support", "cooperation", "disclosure", "opportunity_signal"].includes(
    event.eventType,
  );
}

function evidenceEventForClaim(
  event: SimulationEventDraft,
  claims: ClaimDraft[],
): ReportEvidenceEvent {
  const claimIds = claims
    .filter((claim) => claim.evidenceEventIds.includes(event.id))
    .map((claim) => claim.id);

  return {
    id: event.id,
    claimIds,
    branchId: event.branchId ?? "unknown",
    tickIndex: event.tickIndex,
    timeLabel: event.timeLabel,
    eventType: event.eventType,
    participants: event.participants ?? event.agentIds,
    relationEdgeIds: event.relationEdgeIds,
    causes: event.causes ?? [],
    action: event.action ?? "Record an evidence-linked scenario signal.",
    beforeState: event.beforeState,
    afterState: event.afterState,
    edgeWeightDeltas: event.edgeWeightDeltas,
    evidenceRefs: event.evidence?.evidenceRefs ?? [],
    confidence: event.confidence,
  };
}

function branchComparison(
  simulationRun: SimulationRunDraft,
  claims: ClaimDraft[],
  events: SimulationEventDraft[],
): ReportBranchComparison[] {
  const branches = simulationRun.branches ?? [
    { id: "baseline" as const, label: "Current inertia path", tickIds: [], eventIds: [] },
    {
      id: "cautious_self" as const,
      label: "Cautious observation path",
      tickIds: [],
      eventIds: [],
    },
    {
      id: "decisive_self" as const,
      label: "Active push path",
      tickIds: [],
      eventIds: [],
    },
    {
      id: "boundary_adjustment" as const,
      label: "Boundary adjustment path",
      tickIds: [],
      eventIds: [],
    },
  ];

  return branches.map((branch) => {
    const branchEvents = events.filter(
      (event) => (event.branchId ?? "baseline") === branch.id,
    );
    const eventIds = new Set(branchEvents.map((event) => event.id));
    const claimIds = claims
      .filter((claim) =>
        claim.evidenceEventIds.some((eventId) => eventIds.has(eventId)),
      )
      .map((claim) => claim.id);

    return {
      branchId: branch.id as SimulationBranchId,
      label: branch.label,
      claimIds,
      eventCount: branchEvents.length,
      riskSignalCount: branchEvents.filter(riskSignal).length,
      supportSignalCount: branchEvents.filter(supportSignal).length,
    };
  });
}

export function buildPaidFullReport(
  claims: ClaimDraft[],
  simulationRun: SimulationRunDraft,
  agents: AgentProfileDraft[],
  relationEdges: RelationEdgeDraft[],
): PaidFullReport {
  const claimEventIds = new Set(claims.flatMap((claim) => claim.evidenceEventIds));
  const evidenceEvents = simulationRun.events.filter((event) =>
    claimEventIds.has(event.id),
  );
  const involvedAgentIds = new Set([
    ...claims.flatMap((claim) => claim.relatedAgentIds),
    ...evidenceEvents.flatMap((event) => event.agentIds),
  ]);
  const involvedRelationEdgeIds = new Set([
    ...claims.flatMap((claim) => claim.relatedRelationEdgeIds),
    ...evidenceEvents.flatMap((event) => event.relationEdgeIds),
  ]);

  return {
    claimIds: claims.map((claim) => claim.id),
    fullClaims: claims,
    fullEventChain: evidenceEvents.map((event) =>
      evidenceEventForClaim(event, claims),
    ),
    involvedAgentIds: agents
      .filter((agent) => involvedAgentIds.has(agent.id))
      .map((agent) => agent.id),
    involvedRelationEdgeIds: relationEdges
      .filter((edge) => involvedRelationEdgeIds.has(edge.id))
      .map((edge) => edge.id),
    branchComparison: branchComparison(simulationRun, claims, evidenceEvents),
    strategyOptions: buildStrategyOptions(claims, evidenceEvents),
  } satisfies PaidFullReport;
}
