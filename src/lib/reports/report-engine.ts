import type { AgentProfileDraft } from "@/types/agent-profile";
import type { ClaimDraft } from "@/types/claim";
import { recordReportGenerationEvent } from "@/lib/observability/audit-event";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import type { ReportEngineV1Output } from "@/types/report";
import type { SeedContextDraft } from "@/types/seed-context";
import type { SimulationRunDraft } from "@/types/simulation-run";

import { buildFreePreviewReport } from "./free-preview-policy";
import { buildPaidFullReport } from "./paid-report-policy";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function claimHasEventEvidence(claim: ClaimDraft, simulationRun: SimulationRunDraft) {
  const eventIds = new Set(simulationRun.events.map((event) => event.id));
  return (
    claim.evidenceEventIds.length > 0 &&
    claim.evidenceEventIds.every((eventId) => eventIds.has(eventId))
  );
}

export function buildReportEngineV1({
  seedContext,
  simulationRun,
  claims,
  agents,
  relationEdges,
}: {
  seedContext: SeedContextDraft;
  simulationRun: SimulationRunDraft;
  claims: ClaimDraft[];
  agents: AgentProfileDraft[];
  relationEdges: RelationEdgeDraft[];
}): ReportEngineV1Output {
  const evidenceBackedClaims = claims.filter((claim) =>
    claimHasEventEvidence(claim, simulationRun),
  );
  const claimIds = evidenceBackedClaims.map((claim) => claim.id);
  const evidenceEventCount = evidenceBackedClaims.reduce(
    (total, claim) => total + claim.evidenceEventIds.length,
    0,
  );
  const generatedAt = new Date().toISOString();

  recordReportGenerationEvent({
    traceId: `report_trace_${hashText(`${simulationRun.id}:${generatedAt}`)}`,
    claimIds,
    evidenceEventCount,
    paidState: "free",
    errorCode: claimIds.length === 0 ? "report_missing_claims" : null,
  });

  return {
    id: `report_v1_${hashText(`${simulationRun.id}:${claimIds.join(":")}`)}`,
    seedContextId: seedContext.id,
    simulationRunId: simulationRun.id,
    version: "report-engine-v1",
    generatedAt,
    freePreview: buildFreePreviewReport(
      evidenceBackedClaims,
      simulationRun.events,
    ),
    paidReport: buildPaidFullReport(
      evidenceBackedClaims,
      simulationRun,
      agents,
      relationEdges,
    ),
    invariant: {
      claimIds,
      paidDoesNotCreateClaims: true,
      paidDoesNotRaiseConfidence: true,
      paidDoesNotChangeRiskLevel: true,
    },
  };
}
