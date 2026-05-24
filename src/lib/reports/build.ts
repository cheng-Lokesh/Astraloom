import { buildProductPreview } from "@/lib/preview/build";
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
  const preview = buildProductPreview({
    questionText: seedContext.questionText,
    situationSummary: seedContext.situationSummary,
    keyPeopleText: seedContext.keyPeopleText,
    timeWindow: seedContext.timeWindow,
  });
  const locked = !safetyReview.reportReady;

  return {
    id: reportId,
    seedContextId: seedContext.id,
    simulationRunId: simulationRun.id,
    status: locked ? "locked" : "ready_placeholder",
    reportJson: {
      title: "MiroFish 职场决策预览报告",
      executiveSummary: locked
        ? preview.safetyMessage
        : preview.previewSummary,
      preview,
      sections: [
        {
          id: "summary",
          title: "免费预览",
          body: preview.previewSummary,
          locked: false,
        },
        {
          id: "timeline",
          title: "时间线信号",
          body:
            preview.timelineEvents
              .map((event) => `${event.window} ${event.signal}: ${event.detail}`)
              .join("\n") || preview.safetyMessage,
          locked,
        },
        {
          id: "paid",
          title: "完整报告",
          body: preview.lockedReportSections.join("\n"),
          locked: true,
        },
      ],
    },
    safetyLevel: safetyReview.safetyLevel,
    safetyReviewId: safetyReview.id,
    claims: preview.scenarioPaths.map((path) => ({
      id: `claim_${hashText(`${simulationRun.id}:${path.id}`)}`,
      simulationRunId: simulationRun.id,
      claimText: path.summary,
      confidence: path.confidence,
      evidenceRefs: [
        {
          id: `evidence_${hashText(`${path.id}:seed`)}`,
          sourceType: "seed_context" as const,
          sourceId: seedContext.id,
          label: "用户输入与本地确定性预览",
        },
      ],
      createdAt: now,
    })),
    lockedReason: locked
      ? safetyReview.reportBlockedReason
      : "免费预览可读；完整报告仍锁定，用于验证付费意向。",
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
      sections: draft.reportJson.sections.map((section) =>
        section.id === "summary" ? section : { ...section, locked: true },
      ),
    },
    updatedAt: new Date().toISOString(),
  };
}
