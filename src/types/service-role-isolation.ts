import type { ServiceRoleAdapterOperation } from "@/types/service-role-adapter";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";

export type ServiceRoleIsolationCheckCategory =
  | "server_only_boundary"
  | "client_bundle"
  | "secret_handling"
  | "runtime_import"
  | "write_block";

export type ServiceRoleIsolationCheck = {
  id: string;
  category: ServiceRoleIsolationCheckCategory;
  title: string;
  passed: boolean;
  blocking: boolean;
  detail: string;
};

export type ServiceRoleIsolationPlan = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  intendedOperation: ServiceRoleAdapterOperation;
  serverOnlyModule: string;
  moduleSuffixOk: boolean;
  serverOnlyImportRequired: true;
  clientImportAllowed: false;
  browserBundleAllowed: false;
  wouldImportModule: false;
  wouldCreateClient: false;
  wouldReadSecretValue: false;
  wouldWrite: false;
  checks: ServiceRoleIsolationCheck[];
};

export type ServiceRoleIsolationPayload = {
  safeMode: true;
  readOnly: true;
  harnessMode: "diagnostic_only";
  wouldImportServerWriter: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldExposeServiceRoleSecret: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  globalRules: string[];
  boundaryChecks: ServiceRoleIsolationCheck[];
  plans: ServiceRoleIsolationPlan[];
};

export type ServiceRoleIsolationProbeResult = {
  safeMode: true;
  readOnly: true;
  contractId?: SystemWriterContractId;
  serverOnlyModule?: string;
  wouldImportServerWriter: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldWriteRows: false;
  blocked: true;
  checks: ServiceRoleIsolationCheck[];
  summary: string;
};
