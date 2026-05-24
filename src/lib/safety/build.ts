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

const highRiskPatterns = [
  /self[-\s]?harm|suicide|kill myself|violence|threat/i,
  /stalk|surveillance|monitor my partner|harass|blackmail|revenge/i,
  /medical diagnosis|treatment|legal advice|financial advice|investment advice/i,
  /minor safety|underage/i,
  /自伤|自杀|暴力|威胁|跟踪|监控|骚扰|勒索|报复|诊断|用药|法律建议|投资建议/,
];

function hasHighRiskContent(seedContext: SeedContextDraft) {
  const combined = [
    seedContext.questionText,
    seedContext.situationSummary,
    seedContext.keyPeopleText,
  ].join("\n");

  return highRiskPatterns.some((pattern) => pattern.test(combined));
}

export function buildSafetyReviewDraft(
  seedContext: SeedContextDraft,
  simulationRun: SimulationRunDraft,
) {
  const now = new Date().toISOString();
  const hasEvents = simulationRun.events.some((event) => event.status !== "empty");
  const highRisk = hasHighRiskContent(seedContext);
  const reportReady = hasEvents && !highRisk;

  return {
    id: `safety_${hashText(`${simulationRun.id}:safety`)}`,
    seedContextId: seedContext.id,
    simulationRunId: simulationRun.id,
    safetyLevel: highRisk ? "blocked" : hasEvents ? "normal" : "caution",
    reportReady,
    reportBlockedReason: reportReady
      ? "Local safety checks passed. Paid unlock remains limited to deeper evidence and strategy."
      : highRisk
        ? "High-risk content was detected. Action-oriented output is downgraded and paid unlock cannot bypass this gate."
        : "Event Log is missing or incomplete, so report output stays downgraded.",
    policyVersion: "safety-shell-v0",
    riskChecks: [
      {
        id: "crisis",
        status: highRisk ? "blocked" : "ready",
        action: "block_report",
        severity: "critical",
        detail:
          "Crisis or immediate danger language blocks action-oriented output.",
      },
      {
        id: "professional_advice",
        status: highRisk ? "blocked" : "ready",
        action: "manual_review",
        severity: "high",
        detail:
          "Medical, legal, and financial requests are reframed as non-professional simulation context.",
      },
      {
        id: "harassment",
        status: highRisk ? "blocked" : "ready",
        action: "block_report",
        severity: "high",
        detail:
          "Coercion, surveillance, harassment, intimidation, and abuse requests block strategy output.",
      },
      {
        id: "deterministic_claims",
        status: "ready",
        action: "manual_review",
        severity: "high",
        detail:
          "Claims must remain non-deterministic and tied to evidence_event_ids.",
      },
    ],
    gates: [
      {
        id: "run_shell",
        status: simulationRun.status === "queued" ? "ready" : "not_checked",
        detail:
          simulationRun.status === "queued"
            ? "The local run is queued and has a frozen input graph."
            : "Queue the local run before opening report output.",
      },
      {
        id: "generated_content",
        status: hasEvents ? "ready" : "blocked",
        detail: hasEvents
          ? "Event Log evidence exists."
          : "No usable Event Log evidence exists yet.",
      },
      {
        id: "risk_scanners",
        status: highRisk ? "blocked" : "ready",
        detail: highRisk
          ? "High-risk content triggered safety downgrade."
          : "Local high-risk checks passed.",
      },
      {
        id: "report_ready",
        status: reportReady ? "ready" : "blocked",
        detail: reportReady
          ? "Result Sandbox can show evidence-bound claims."
          : "Output is downgraded until safety and evidence gates pass.",
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
      "Manually blocked. Paid unlock and report generation remain disabled until reviewed.",
    riskChecks: draft.riskChecks.map((check) => ({
      ...check,
      status: check.id === "deterministic_claims" ? check.status : ("blocked" as const),
    })),
    gates: draft.gates.map((gate) =>
      gate.id === "report_ready" ? { ...gate, status: "blocked" as const } : gate,
    ),
    updatedAt: new Date().toISOString(),
  };
}
