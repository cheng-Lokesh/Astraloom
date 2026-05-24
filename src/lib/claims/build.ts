import type {
  ClaimDraft,
  ClaimLedgerDraft,
  ClaimRiskLevel,
  ClaimType,
} from "@/types/claim";
import type { SimulationEventDraft, SimulationRunDraft } from "@/types/simulation-run";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function clamp(value: number, min = 18, max = 72) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function averageConfidence(events: SimulationEventDraft[]) {
  if (events.length === 0) return 0;
  return clamp(
    events.reduce((sum, event) => sum + event.confidence, 0) / events.length,
  );
}

function riskLevelForEvents(events: SimulationEventDraft[]): ClaimRiskLevel {
  const pressure = events.reduce((sum, event) => {
    return (
      sum +
      Object.values(event.edgeWeightDeltas).reduce((innerSum, delta) => {
        return (
          innerSum +
          Math.max(0, delta.hostility ?? 0) +
          Math.max(0, delta.competition ?? 0) +
          Math.max(0, delta.informationGap ?? 0)
        );
      }, 0)
    );
  }, 0);

  if (pressure >= 8) return "high";
  if (pressure >= 4) return "medium";
  return "low";
}

function claimTypeForEvents(events: SimulationEventDraft[]): ClaimType {
  const riskLevel = riskLevelForEvents(events);
  const hasTrustGain = events.some((event) =>
    Object.values(event.edgeWeightDeltas).some((delta) => (delta.trust ?? 0) > 0),
  );

  if (riskLevel === "high") return "risk_window";
  if (hasTrustGain) return "coordination_signal";
  if (events.some((event) => event.eventType === "graph_freeze")) {
    return "opportunity_window";
  }
  return "friction_signal";
}

function claimSummary(type: ClaimType, events: SimulationEventDraft[]) {
  const edgeCount = unique(events.flatMap((event) => event.relationEdgeIds)).length;
  const timeLabels = unique(events.map((event) => event.timeLabel)).join(", ");

  switch (type) {
    case "risk_window":
      return `${timeLabels} shows a relationship pressure signal across ${edgeCount} edge(s). Treat this as a review window, not a fixed outcome.`;
    case "opportunity_window":
      return `${timeLabels} freezes the first usable evidence chain for ${edgeCount} edge(s). This can support later scenario comparison.`;
    case "coordination_signal":
      return `${timeLabels} shows a local coordination signal on ${edgeCount} edge(s), backed by Event Log evidence.`;
    case "friction_signal":
      return `${timeLabels} shows a weak friction signal on ${edgeCount} edge(s). More events are needed before stronger wording is allowed.`;
  }
}

function groupEvents(events: SimulationEventDraft[]) {
  const usableEvents = events.filter(
    (event) => event.status === "preview" && event.relationEdgeIds.length > 0,
  );
  const groups = new Map<string, SimulationEventDraft[]>();

  usableEvents.forEach((event) => {
    const key = event.relationEdgeIds[0] ?? "ungrouped";
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });

  return Array.from(groups.values()).slice(0, 4);
}

export function buildClaimLedgerDraft(
  seedContextId: string,
  simulationRun: SimulationRunDraft,
) {
  const now = new Date().toISOString();
  const claims = groupEvents(simulationRun.events).map((events): ClaimDraft => {
    const claimType = claimTypeForEvents(events);
    const evidenceEventIds = events.map((event) => event.id);
    const traceId = `trace_${hashText(
      `${simulationRun.id}:claim:${evidenceEventIds.join(":")}`,
    )}`;

    return {
      id: `claim_${hashText(`${simulationRun.id}:${evidenceEventIds.join(":")}`)}`,
      seedContextId,
      simulationRunId: simulationRun.id,
      version: "local-deterministic-v0",
      claimType,
      summary: claimSummary(claimType, events),
      confidence: averageConfidence(events),
      riskLevel: riskLevelForEvents(events),
      evidenceEventIds,
      relatedAgentIds: unique(events.flatMap((event) => event.agentIds)),
      relatedRelationEdgeIds: unique(
        events.flatMap((event) => event.relationEdgeIds),
      ),
      isPaidLocked: false,
      safetyNotes: [
        "This claim is a local draft and must stay tied to evidence_event_ids.",
        "Do not treat this as a certain prediction or professional advice.",
      ],
      traceId,
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    seedContextId,
    simulationRunId: simulationRun.id,
    version: "local-deterministic-v0",
    claims,
    updatedAt: now,
  } satisfies ClaimLedgerDraft;
}
