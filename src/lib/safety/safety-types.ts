import type { AgentProfileDraft } from "@/types/agent-profile";
import type { ClaimDraft } from "@/types/claim";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import type { SeedContextDraft } from "@/types/seed-context";
import type { SimulationRunDraft } from "@/types/simulation-run";

export type SafetyLevel = "safe" | "caution" | "downgraded" | "blocked";

export type SafetyFlag =
  | "self_harm"
  | "violence"
  | "stalking"
  | "surveillance"
  | "partner_monitoring"
  | "medical"
  | "legal"
  | "investment"
  | "therapy"
  | "minor_safety"
  | "revenge"
  | "coercion"
  | "third_party_mind_reading"
  | "deterministic_fate"
  | "guaranteed_reconciliation";

export type SafetyVerifierInput = {
  seedContext: SeedContextDraft;
  agents?: AgentProfileDraft[];
  relationEdges?: RelationEdgeDraft[];
  simulationRun?: SimulationRunDraft | null;
  claims?: ClaimDraft[];
};

export type SafetyDecision = {
  safetyLevel: SafetyLevel;
  flags: SafetyFlag[];
  userMessage: string;
  allowedActions: string[];
  blockedActions: string[];
  reportRestrictions: string[];
};

export type SafetyRule = {
  flag: SafetyFlag;
  level: Exclude<SafetyLevel, "safe">;
  patterns: RegExp[];
};
