import type {
  SystemWriterContractId,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";

export type SystemWriterDryRunStatus =
  | "invalid_request"
  | "blocked_by_gate"
  | "dry_run_ready";

export type SystemWriterDryRunIssueCode =
  | "invalid_json"
  | "invalid_contract_id"
  | "invalid_input"
  | "missing_required_input"
  | "unexpected_input_key"
  | "sensitive_input_key"
  | "missing_service_role"
  | "feature_flag_disabled";

export type SystemWriterDryRunRequest = {
  contractId: SystemWriterContractId;
  input?: Record<string, unknown>;
  idempotencyKey?: string;
};

export type SystemWriterDryRunIssue = {
  code: SystemWriterDryRunIssueCode;
  field?: string;
  message: string;
};

export type SystemWriterDryRunContractSpec = {
  contractId: SystemWriterContractId;
  requiredInputKeys: string[];
  optionalInputKeys: string[];
  sampleRequest: SystemWriterDryRunRequest;
};

export type SystemWriterDryRunCatalog = {
  safeMode: true;
  wouldWrite: false;
  specs: SystemWriterDryRunContractSpec[];
};

export type SystemWriterDryRunResult = {
  safeMode: true;
  wouldWrite: false;
  status: SystemWriterDryRunStatus;
  contractId?: SystemWriterContractId;
  targetTables: string[];
  requiredFlags: SystemWriterFeatureFlag[];
  disabledFlags: SystemWriterFeatureFlag[];
  requiredInputKeys: string[];
  acceptedInputKeys: string[];
  missingInputKeys: string[];
  unexpectedInputKeys: string[];
  idempotencyKeyTemplate?: string;
  receivedIdempotencyKey?: boolean;
  issues: SystemWriterDryRunIssue[];
  summary: string;
};
