import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";

export type WriterAuthContext =
  | "authenticated_user_request"
  | "stripe_webhook"
  | "server_executor"
  | "operator_review";

export type WriterExecutionPhaseId =
  | "receive_request"
  | "authenticate_context"
  | "validate_contract"
  | "check_feature_gates"
  | "check_idempotency"
  | "prepare_audit"
  | "service_role_write"
  | "post_write_audit"
  | "rollback_review";

export type WriterExecutionPhase = {
  id: WriterExecutionPhaseId;
  title: string;
  required: boolean;
  allowedNow: boolean;
  detail: string;
};

export type WriterGuardrailPolicy = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  authContext: WriterAuthContext;
  entrypoint: string;
  requiredFlags: SystemWriterFeatureFlag[];
  auditEventType: string;
  preWriteChecks: string[];
  idempotencyConflictBehavior: string;
  rollbackStrategy: string;
  rolloutNotes: string[];
};

export type WriterRolloutGate = {
  id: string;
  title: string;
  required: boolean;
  passed: boolean;
  detail: string;
};

export type WriterExecutionGuardrailPayload = {
  safeMode: true;
  realWritesAllowed: false;
  serviceRoleClientAllowed: false;
  aiCallsAllowed: false;
  stripeCallsAllowed: false;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  globalRules: string[];
  executionPhases: WriterExecutionPhase[];
  policies: WriterGuardrailPolicy[];
  rolloutGates: WriterRolloutGate[];
};
