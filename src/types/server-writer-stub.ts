import type { ServiceRoleAdapterOperation } from "@/types/service-role-adapter";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";

export type ServerWriterStubMode = "inert_server_only_stub";

export type ServerWriterStubCheckCategory =
  | "server_only_boundary"
  | "client_bundle"
  | "privileged_client"
  | "secret_handling"
  | "write_block"
  | "external_side_effect"
  | "history_safety";

export type ServerWriterStubCheck = {
  id: string;
  category: ServerWriterStubCheckCategory;
  title: string;
  passed: true;
  blocking: true;
  detail: string;
};

export type ServerWriterStubModule = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  intendedOperation: ServiceRoleAdapterOperation;
  modulePath: string;
  exportedSymbol: string;
  mode: ServerWriterStubMode;
  startsWithServerOnlyImport: true;
  serverOnly: true;
  inert: true;
  clientImportAllowed: false;
  browserBundleAllowed: false;
  wouldImportRealWriterImplementation: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKey: false;
  wouldWriteCompensationRows: false;
  summary: string;
  checks: ServerWriterStubCheck[];
};

export type ServerWriterStubPayload = {
  safeMode: true;
  readOnly: true;
  stubMode: ServerWriterStubMode;
  importsInertServerOnlyStubs: true;
  wouldImportRealWriterImplementation: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldExposeServiceRoleSecret: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteCompensationRows: false;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  globalRules: string[];
  sharedChecks: ServerWriterStubCheck[];
  stubs: ServerWriterStubModule[];
};

export type ServerWriterStubProbeReason =
  | "inert_stub_noop"
  | "invalid_request"
  | "unknown_contract";

export type ServerWriterStubProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  reasonCode: ServerWriterStubProbeReason;
  contractId?: SystemWriterContractId;
  modulePath?: string;
  exportedSymbol?: string;
  importsInertServerOnlyStub: boolean;
  wouldImportRealWriterImplementation: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  checks: ServerWriterStubCheck[];
  summary: string;
};
