import type { SafetyDecision } from "@/lib/safety/safety-types";

export type SandboxReadiness =
  | "ready"
  | "low_confidence_ready"
  | "needs_clarification"
  | "blocked";

export type MissingInfoType =
  | "topic_unclear"
  | "key_people_missing"
  | "recent_event_missing"
  | "decision_options_missing"
  | "destiny_birth_time_missing"
  | "destiny_skipped"
  | "safety_sensitive";

export type ClarificationQuestion = {
  id: string;
  missingInfoType: MissingInfoType;
  prompt: string;
  helper: string;
  placeholder?: string;
  options?: string[];
};

export type SandboxReadinessEvaluation = {
  readiness: SandboxReadiness;
  completenessScore: number;
  missingInfoTypes: MissingInfoType[];
  questions: ClarificationQuestion[];
  canSkip: boolean;
  lowConfidenceReason: string | null;
  safetyDecision: SafetyDecision;
};
