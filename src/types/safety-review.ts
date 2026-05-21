export type SafetyLevel = "unreviewed" | "normal" | "caution" | "blocked";

export type SafetyRiskId =
  | "crisis"
  | "professional_advice"
  | "harassment"
  | "deterministic_claims";

export type SafetyGateId =
  | "run_shell"
  | "generated_content"
  | "risk_scanners"
  | "report_ready";

export type SafetyCheckStatus = "ready" | "not_checked" | "blocked";

export type SafetyAction =
  | "allow_after_review"
  | "manual_review"
  | "block_report";

export type SafetyRiskCheckDraft = {
  id: SafetyRiskId;
  status: SafetyCheckStatus;
  action: SafetyAction;
  severity: "medium" | "high" | "critical";
  detail: string;
};

export type SafetyGateDraft = {
  id: SafetyGateId;
  status: SafetyCheckStatus;
  detail: string;
};

export type SafetyReviewDraft = {
  id: string;
  seedContextId: string;
  simulationRunId: string;
  safetyLevel: SafetyLevel;
  reportReady: boolean;
  reportBlockedReason: string;
  policyVersion: "safety-shell-v0";
  riskChecks: SafetyRiskCheckDraft[];
  gates: SafetyGateDraft[];
  createdAt: string;
  updatedAt: string;
};
