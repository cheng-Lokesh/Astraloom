export type SystemWriterContractId =
  | "agent_profile_generation"
  | "relation_edge_generation"
  | "simulation_run_create"
  | "event_tick_append"
  | "claim_generation"
  | "report_generation"
  | "payment_entitlement_record"
  | "consent_event_record";

export type SystemWriterContractCategory =
  | "agent_ecology"
  | "simulation"
  | "reporting"
  | "payments"
  | "compliance";

export type SystemWriterContractStatus =
  | "disabled"
  | "missing_service_role"
  | "ready_placeholder";

export type SystemWriterFeatureFlag =
  | "ENABLE_SYSTEM_WRITERS"
  | "ENABLE_AI_GENERATION"
  | "ENABLE_STRIPE_WRITES";

export type SystemWriterContract = {
  id: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  trigger: string;
  requiredInputs: string[];
  safetyGates: string[];
  idempotencyKey: string;
  requiredFlags: SystemWriterFeatureFlag[];
  status: SystemWriterContractStatus;
  enabled: boolean;
  detail: string;
};

export type SystemWriterContractPayload = {
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  contracts: SystemWriterContract[];
};
