import type { SystemWriterDryRunRequest } from "@/types/system-writer-dry-run";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";

export type WriterPayloadParityMode = "fixture_only";

export type WriterPayloadParityCheckCategory =
  | "contract_coverage"
  | "dry_run_shape"
  | "stub_probe_shape"
  | "future_writer_shape"
  | "idempotency"
  | "sensitive_input_guard"
  | "gate_alignment";

export type WriterPayloadParityCheck = {
  id: string;
  category: WriterPayloadParityCheckCategory;
  title: string;
  passed: boolean;
  blocking: true;
  detail: string;
};

export type WriterFutureRequestShape = {
  contractId: SystemWriterContractId;
  inputKeys: string[];
  requiredInputKeys: string[];
  optionalInputKeys: string[];
  idempotencyKeyTemplate: string;
  wouldAcceptSameInputAsDryRun: true;
  wouldWrite: false;
};

export type WriterPayloadParityFixture = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  requiredFlags: SystemWriterFeatureFlag[];
  requiredInputKeys: string[];
  optionalInputKeys: string[];
  dryRunSampleRequest: SystemWriterDryRunRequest;
  stubProbeRequest: {
    contractId: SystemWriterContractId;
  };
  futureWriterRequestShape: WriterFutureRequestShape;
  idempotencyKeyTemplate: string;
  sampleHasAllRequiredInputs: boolean;
  sampleUnexpectedInputKeys: string[];
  sampleSensitiveInputKeys: string[];
  dryRunValidationStatus: "blocked_by_gate" | "dry_run_ready";
  wouldRunDryRun: true;
  wouldProbeStub: true;
  wouldExecuteFutureWriter: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  checks: WriterPayloadParityCheck[];
};

export type WriterPayloadParityPayload = {
  safeMode: true;
  readOnly: true;
  parityMode: WriterPayloadParityMode;
  wouldRunDryRunValidation: true;
  wouldProbeInertStubs: true;
  wouldExecuteFutureWriter: false;
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
  allFixturesAligned: boolean;
  fixtureCount: number;
  globalRules: string[];
  sharedChecks: WriterPayloadParityCheck[];
  fixtures: WriterPayloadParityFixture[];
};

export type WriterPayloadParityProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  contractId?: SystemWriterContractId;
  parityMode: WriterPayloadParityMode;
  dryRunValidationStatus?: "blocked_by_gate" | "dry_run_ready";
  wouldRunDryRunValidation: boolean;
  wouldProbeInertStub: boolean;
  wouldExecuteFutureWriter: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  checks: WriterPayloadParityCheck[];
  summary: string;
};
