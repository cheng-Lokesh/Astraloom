import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";

export type WriterRolloutGateCategory =
  | "environment"
  | "database"
  | "service_role"
  | "contract_validation"
  | "audit"
  | "idempotency"
  | "rollback"
  | "ai_safety_cost"
  | "payments"
  | "support"
  | "observability"
  | "operator_review";

export type WriterRolloutGateStatus = "passed" | "blocked" | "manual_review";

export type WriterRolloutLaunchMode =
  | "none_currently"
  | "internal_canary_after_gates"
  | "manual_operator_only_after_gates"
  | "production_after_review";

export type WriterRolloutReadiness =
  | "blocked"
  | "candidate_after_gates"
  | "not_first_candidate";

export type WriterRolloutGate = {
  id: string;
  category: WriterRolloutGateCategory;
  title: string;
  required: boolean;
  blocking: boolean;
  status: WriterRolloutGateStatus;
  evidence: string;
  missingWork: string;
};

export type WriterRolloutContractPlan = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  requiredFlags: SystemWriterFeatureFlag[];
  readiness: WriterRolloutReadiness;
  launchMode: WriterRolloutLaunchMode;
  candidateOrder: number;
  firstAllowedAudience: string;
  requiredBeforeLaunch: string[];
  blockedBy: string[];
  canaryPlan: string[];
  abortConditions: string[];
};

export type WriterRolloutChecklistPayload = {
  safeMode: true;
  readOnly: true;
  wouldEnableWriters: false;
  wouldCreateServiceRoleClient: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  approvedForProduction: false;
  allRequiredGatesPassed: false;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  globalRules: string[];
  releaseSequence: string[];
  globalGates: WriterRolloutGate[];
  contractPlans: WriterRolloutContractPlan[];
};
