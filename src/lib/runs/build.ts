import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";
import type {
  SimulationEventDraft,
  SimulationGateDraft,
  SimulationRunDraft,
  SimulationRunStatus,
} from "@/types/simulation-run";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function tickCountForWindow(timeWindow: TimeWindow) {
  const counts: Record<TimeWindow, number> = {
    "30_days": 3,
    "90_days": 6,
    "1_year": 8,
    "3_years": 10,
    "5_years": 12,
  };

  return counts[timeWindow];
}

function buildGates(agentEcology: AgentEcologyDraft): SimulationGateDraft[] {
  const hasAgents = agentEcology.agents.length > 0;
  const hasNpc = agentEcology.agents.some((agent) => agent.agentType === "npc");

  return [
    {
      id: "agents",
      status: hasAgents && hasNpc ? "ready" : "missing",
      detail:
        hasAgents && hasNpc
          ? "Agent ecology shell is present."
          : "Agent ecology needs at least one self and one confirmed NPC.",
    },
    {
      id: "cost_gate",
      status: "blocked",
      detail: "Payment entitlement and cost cap are not wired in the MVP shell.",
    },
    {
      id: "prompt_pack",
      status: "missing",
      detail: "Simulation prompt pack is still unreleased.",
    },
    {
      id: "safety_checks",
      status: "blocked",
      detail: "SafetyVerifier is not implemented yet.",
    },
  ];
}

function buildEvents(
  simulationRunId: string,
  seedContext: SeedContextDraft,
  now: string,
): SimulationEventDraft[] {
  return Array.from(
    { length: tickCountForWindow(seedContext.timeWindow) },
    (_, index) => ({
      id: `event_${hashText(`${simulationRunId}:${index + 1}`)}`,
      simulationRunId,
      tick: index + 1,
      timeWindow: seedContext.timeWindow,
      eventType: "empty_slot",
      summary: "Awaiting generation. No model output has been produced.",
      involvedAgentIds: [],
      status: "empty",
      createdAt: now,
    }),
  );
}

export function buildSimulationRunDraft(
  seedContext: SeedContextDraft,
  agentEcology: AgentEcologyDraft,
  status: SimulationRunStatus = "not_ready",
) {
  const now = new Date().toISOString();
  const simulationRunId = `run_${hashText(`${seedContext.id}:simulation`)}`;

  return {
    id: simulationRunId,
    seedContextId: seedContext.id,
    status,
    modelVersion: "unreleased",
    promptVersion: "unreleased",
    costCents: 0,
    errorCode: null,
    gates: buildGates(agentEcology),
    events: buildEvents(simulationRunId, seedContext, now),
    agentIds: agentEcology.agents.map((agent) => agent.id),
    createdAt: now,
    updatedAt: now,
  } satisfies SimulationRunDraft;
}

export function queueSimulationRunDraft(draft: SimulationRunDraft) {
  return {
    ...draft,
    status: "queued" as const,
    updatedAt: new Date().toISOString(),
  };
}

export function blockSimulationRunDraft(draft: SimulationRunDraft) {
  return {
    ...draft,
    status: "blocked" as const,
    errorCode: "generation_disabled_until_gates_ready",
    updatedAt: new Date().toISOString(),
  };
}
