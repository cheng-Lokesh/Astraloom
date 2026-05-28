import type { AgentEcologyDraft } from "@/types/agent-profile";
import { recordSimulationRunEvent } from "@/lib/observability/audit-event";
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import { buildRelationEdges } from "@/lib/relations/build";
import type { SeedContextDraft } from "@/types/seed-context";
import type {
  SimulationRunDraft,
  SimulationRunStatus,
} from "@/types/simulation-run";
import { buildSimulationEngineV1Run } from "@/lib/simulation/simulation-engine";
import type { SafetySnapshot } from "@/lib/simulation/simulation-types";

export function buildSimulationRunDraft(
  seedContext: SeedContextDraft,
  agentEcology: AgentEcologyDraft,
  relationEdges: RelationEdgeDraft[] = buildRelationEdges(
    seedContext.id,
    agentEcology.agents,
  ),
  status: SimulationRunStatus = "not_ready",
  safetySnapshot?: SafetySnapshot,
  destinyFusion?: DestinySituationFusionDraft | null,
) {
  const run = buildSimulationEngineV1Run({
    seedContext,
    agentEcology,
    relationEdges,
    destinyFusion,
    status,
    safetySnapshot,
  });

  recordSimulationRunEvent({
    traceId: run.traceId,
    version: run.version,
    engineVersion: "simulation-engine-v1",
    safetyLevel: run.safetySnapshot?.safetyLevel ?? run.safetyLevel,
    costCents: run.costCents,
    status: run.status === "blocked" ? "blocked" : "preview",
    errorCode: run.errorCode,
  });

  return run;
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
    safetyLevel: "blocked" as const,
    safetySnapshot: {
      safetyLevel: "blocked" as const,
      flags: draft.safetySnapshot?.flags ?? [],
      allowedActions: draft.safetySnapshot?.allowedActions ?? [],
      blockedActions: [
        ...(draft.safetySnapshot?.blockedActions ?? []),
        "simulation_generation",
      ],
      reportRestrictions: draft.safetySnapshot?.reportRestrictions ?? [],
    },
    errorCode: "generation_disabled_until_gates_ready",
    updatedAt: new Date().toISOString(),
  };
}
