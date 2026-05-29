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

function pressureScore(event: SimulationEventDraft) {
  return Object.values(event.edgeWeightDeltas).reduce((sum, delta) => {
    return (
      sum +
      Math.max(0, delta.hostility ?? 0) +
      Math.max(0, delta.competition ?? 0) +
      Math.max(0, delta.informationGap ?? 0) +
      Math.max(0, delta.emotionalDebt ?? 0)
    );
  }, 0);
}

function riskLevelForEvents(events: SimulationEventDraft[]): ClaimRiskLevel {
  if (events.length === 0) return "low";
  const pressure =
    events.reduce((sum, event) => sum + pressureScore(event), 0) / events.length;

  if (pressure >= 6) return "high";
  if (pressure >= 3) return "medium";
  return "low";
}

function eventMode(events: SimulationEventDraft[]) {
  const counts = {
    risk: 0,
    coordination: 0,
    opportunity: 0,
    friction: 0,
  };

  events.forEach((event) => {
    if (
      [
        "avoidance",
        "direct_conflict",
        "resource_competition",
        "information_gap_widening",
        "relation_pressure",
      ].includes(event.eventType)
    ) {
      counts.risk += 1;
      return;
    }
    if (["support", "cooperation", "disclosure"].includes(event.eventType)) {
      counts.coordination += 1;
      return;
    }
    if (["opportunity_signal", "graph_freeze"].includes(event.eventType)) {
      counts.opportunity += 1;
      return;
    }
    counts.friction += 1;
  });

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0];
}

function claimTypeForEvents(events: SimulationEventDraft[]): ClaimType {
  const mode = eventMode(events);
  if (mode === "coordination") return "coordination_signal";
  if (mode === "opportunity") {
    return "opportunity_window";
  }
  if (mode === "risk") return "risk_window";
  return "friction_signal";
}

function claimSummary(type: ClaimType, events: SimulationEventDraft[]) {
  const edgeCount = unique(events.flatMap(eventRelationEdgeIds)).length;
  const timeLabels = unique(events.map((event) => event.timeLabel)).slice(0, 3);
  const branchLabels = unique(
    events.map((event) => event.branchId ?? "baseline"),
  ).join(", ");
  const participantCount = unique(events.flatMap((event) => event.agentIds)).length;
  const windowLabel = timeLabels.length > 1 ? timeLabels.join(" to ") : timeLabels[0];
  const evidenceLabel = `${events.length} Event Log item${
    events.length === 1 ? "" : "s"
  }, ${edgeCount} relation edge${edgeCount === 1 ? "" : "s"}, ${participantCount} agent${
    participantCount === 1 ? "" : "s"
  }`;

  switch (type) {
    case "risk_window":
      return `${windowLabel} shows elevated pressure in ${branchLabels}, backed by ${evidenceLabel}. Use this as a review window for friction, information gaps, or resource pressure; it is not a fixed outcome.`;
    case "opportunity_window":
      return `${windowLabel} shows an opportunity signal in ${branchLabels}, backed by ${evidenceLabel}. The useful move is to inspect which evidence repeated across ticks before treating it as directionally useful.`;
    case "coordination_signal":
      return `${windowLabel} shows a coordination signal in ${branchLabels}, backed by ${evidenceLabel}. This points to where low-pressure communication or support may be available in the sandbox.`;
    case "friction_signal":
      return `${windowLabel} shows a limited friction signal in ${branchLabels}, backed by ${evidenceLabel}. More repeated events are needed before stronger wording is allowed.`;
  }
}

function groupEvents(events: SimulationEventDraft[]) {
  const usableEvents = events.filter(
    (event) => event.status === "preview" && eventRelationEdgeIds(event).length > 0,
  );
  const groups = new Map<string, SimulationEventDraft[]>();

  usableEvents.forEach((event) => {
    const key = eventRelationEdgeIds(event)[0] ?? "ungrouped";
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });

  return Array.from(groups.values()).slice(0, 4);
}

function eventRelationEdgeIds(event: SimulationEventDraft) {
  return Array.isArray(event.relationEdgeIds) ? event.relationEdgeIds : [];
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
        events.flatMap(eventRelationEdgeIds),
      ),
      isPaidLocked: false,
      safetyNotes: [
        "This claim is a local draft and must stay tied to evidence_event_ids.",
        "Do not treat this as a certain result or professional advice.",
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
