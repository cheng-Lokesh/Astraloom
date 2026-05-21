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

export function buildSafetyReviewDraft(
  seedContext: SeedContextDraft,
  simulationRun: SimulationRunDraft,
) {
  const now = new Date().toISOString();
  const hasGeneratedEvents = simulationRun.events.some(
    (event) => event.status !== "empty",
  );

  return {
    id: `safety_${hashText(`${simulationRun.id}:safety`)}`,
    seedContextId: seedContext.id,
    simulationRunId: simulationRun.id,
    safetyLevel: "blocked",
    reportReady: false,
    reportBlockedReason:
      "SafetyVerifier shell is present, but generated content and scanners are not implemented.",
    policyVersion: "safety-shell-v0",
    riskChecks: [
      {
        id: "crisis",
        status: "blocked",
        action: "block_report",
        severity: "critical",
        detail:
          "Crisis, self-harm, or immediate danger language must block report release until a dedicated safety path exists.",
      },
      {
        id: "professional_advice",
        status: "blocked",
        action: "manual_review",
        severity: "high",
        detail:
          "Medical, legal, and financial advice must be reframed as non-professional simulation context.",
      },
      {
        id: "harassment",
        status: "blocked",
        action: "block_report",
        severity: "high",
        detail:
          "Harassment, intimidation, or targeted abuse must block report release.",
      },
      {
        id: "deterministic_claims",
        status: "blocked",
        action: "manual_review",
        severity: "high",
        detail:
          "Unsafe deterministic claims about fate, death, illness, or unavoidable outcomes must be rejected or softened.",
      },
    ],
    gates: [
      {
        id: "run_shell",
        status: simulationRun.status === "queued" ? "ready" : "not_checked",
        detail:
          simulationRun.status === "queued"
            ? "Run shell is queued locally."
            : "Run shell exists but has not been queued.",
      },
      {
        id: "generated_content",
        status: hasGeneratedEvents ? "not_checked" : "blocked",
        detail: hasGeneratedEvents
          ? "Generated event content exists and needs review."
          : "No generated event content exists yet.",
      },
      {
        id: "risk_scanners",
        status: "blocked",
        detail: "Risk scanners are not implemented in this MVP shell.",
      },
      {
        id: "report_ready",
        status: "blocked",
        detail:
          "Report release is disabled until generated content passes SafetyVerifier.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  } satisfies SafetyReviewDraft;
}

export function markSafetyBlocked(draft: SafetyReviewDraft) {
  return {
    ...draft,
    safetyLevel: "blocked" as const,
    reportReady: false,
    reportBlockedReason:
      "Report remains blocked until generated content and scanners are implemented.",
    updatedAt: new Date().toISOString(),
  };
}
