import { loadAgentEcologyDraft } from "@/lib/agents/storage";
import { loadBillingSupportDraft } from "@/lib/billing/storage";
import { loadKeyPeopleDraft } from "@/lib/people/storage";
import { loadReportDraft } from "@/lib/reports/storage";
import { loadSimulationRunDraft } from "@/lib/runs/storage";
import { loadSafetyReviewDraft } from "@/lib/safety/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";

export function loadLocalDraftBundle() {
  const seedContext = loadSeedContextDraft();

  return {
    seedContext,
    keyPeople: seedContext ? loadKeyPeopleDraft(seedContext.id) : null,
    agentEcology: seedContext ? loadAgentEcologyDraft(seedContext.id) : null,
    simulationRun: seedContext ? loadSimulationRunDraft(seedContext.id) : null,
    safetyReview: seedContext ? loadSafetyReviewDraft(seedContext.id) : null,
    report: seedContext ? loadReportDraft(seedContext.id) : null,
    billing: loadBillingSupportDraft(),
  };
}

export type LocalDraftBundle = ReturnType<typeof loadLocalDraftBundle>;
