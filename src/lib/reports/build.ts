import type { ReportDraft } from "@/types/report";
import type { SafetyReviewDraft } from "@/types/safety-review";
import type { SeedContextDraft } from "@/types/seed-context";
import type { SimulationRunDraft } from "@/types/simulation-run";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function buildReportDraft(
  seedContext: SeedContextDraft,
  simulationRun: SimulationRunDraft,
  safetyReview: SafetyReviewDraft,
) {
  const now = new Date().toISOString();
  const reportId = `report_${hashText(`${simulationRun.id}:report`)}`;
  const locked = !safetyReview.reportReady;

  return {
    id: reportId,
    seedContextId: seedContext.id,
    simulationRunId: simulationRun.id,
    status: locked ? "locked" : "ready_placeholder",
    reportJson: {
      title: "Report shell",
      executiveSummary: locked
        ? "Report content is locked until SafetyVerifier marks this run as report-ready."
        : "Report content placeholder. Real generated content is still disabled.",
      sections: [
        {
          id: "timeline",
          title: "Timeline",
          body: locked
            ? "Locked. No event narrative is available."
            : "Placeholder timeline section.",
          locked,
        },
        {
          id: "claims",
          title: "Claims",
          body: locked
            ? "Locked. No claims have been generated."
            : "Placeholder claims section.",
          locked,
        },
        {
          id: "evidence",
          title: "Evidence",
          body: locked
            ? "Locked. No evidence references have been generated."
            : "Placeholder evidence references section.",
          locked,
        },
      ],
    },
    safetyLevel: safetyReview.safetyLevel,
    safetyReviewId: safetyReview.id,
    claims: [
      {
        id: `claim_${hashText(`${simulationRun.id}:placeholder`)}`,
        simulationRunId: simulationRun.id,
        claimText: "Locked placeholder. No model-generated claim exists.",
        confidence: 0,
        evidenceRefs: [
          {
            id: `evidence_${hashText(`${safetyReview.id}:report-lock`)}`,
            sourceType: "safety",
            sourceId: safetyReview.id,
            label: "Safety review gate",
          },
        ],
        createdAt: now,
      },
    ],
    lockedReason: safetyReview.reportReady
      ? "Report shell is structurally ready, but real generation is still disabled."
      : safetyReview.reportBlockedReason,
    createdAt: now,
    updatedAt: now,
  } satisfies ReportDraft;
}

export function lockReportDraft(draft: ReportDraft, reason: string) {
  return {
    ...draft,
    status: "locked" as const,
    lockedReason: reason,
    reportJson: {
      ...draft.reportJson,
      executiveSummary:
        "Report content is locked until SafetyVerifier marks this run as report-ready.",
      sections: draft.reportJson.sections.map((section) => ({
        ...section,
        locked: true,
      })),
    },
    updatedAt: new Date().toISOString(),
  };
}
