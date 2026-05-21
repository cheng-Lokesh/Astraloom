import type {
  SystemWriterContractId,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";

export type ServiceRoleAdapterMode = "disabled";

export type ServiceRoleAdapterOperation =
  | "insert"
  | "upsert"
  | "update"
  | "append";

export type ServiceRoleAdapterBlockCode =
  | "service_role_missing"
  | "system_writers_disabled"
  | "ai_generation_disabled"
  | "stripe_writes_disabled"
  | "real_writes_forbidden"
  | "client_creation_forbidden"
  | "unknown_contract";

export type ServiceRoleAdapterCheck = {
  id: string;
  title: string;
  passed: boolean;
  blocking: boolean;
  detail: string;
};

export type ServiceRoleAdapterPlan = {
  contractId: SystemWriterContractId;
  targetTables: string[];
  intendedOperation: ServiceRoleAdapterOperation;
  serverOnlyModule: string;
  requiredFlags: SystemWriterFeatureFlag[];
  wouldCreateClient: false;
  wouldWrite: false;
  blocked: true;
  blockedCodes: ServiceRoleAdapterBlockCode[];
  checks: ServiceRoleAdapterCheck[];
};

export type ServiceRoleAdapterStatusPayload = {
  safeMode: true;
  adapterMode: ServiceRoleAdapterMode;
  wouldCreateClient: false;
  wouldWrite: false;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  globalBlockedCodes: ServiceRoleAdapterBlockCode[];
  adapterRules: string[];
  plans: ServiceRoleAdapterPlan[];
};

export type ServiceRoleAdapterProbeRequest = {
  contractId?: SystemWriterContractId;
  operation?: ServiceRoleAdapterOperation;
};

export type ServiceRoleAdapterProbeResult = {
  safeMode: true;
  adapterMode: ServiceRoleAdapterMode;
  contractId?: SystemWriterContractId;
  requestedOperation?: ServiceRoleAdapterOperation;
  expectedOperation?: ServiceRoleAdapterOperation;
  wouldCreateClient: false;
  wouldWrite: false;
  blocked: true;
  blockedCodes: ServiceRoleAdapterBlockCode[];
  checks: ServiceRoleAdapterCheck[];
  summary: string;
};
