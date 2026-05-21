import type { ServiceRoleAdapterOperation } from "@/types/service-role-adapter";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";

export type WriterIdempotencyScope =
  | "user_seed_context"
  | "run_tick"
  | "run_report"
  | "stripe_event"
  | "consent_policy";

export type WriterIdempotencyStatus =
  | "reserved"
  | "completed"
  | "failed"
  | "expired"
  | "conflict_detected";

export type WriterIdempotencyConflictBehavior =
  | "return_existing_result"
  | "reject_conflicting_request"
  | "retry_after_pending"
  | "append_compensating_record";

export type WriterIdempotencyField = {
  name: string;
  required: boolean;
  detail: string;
};

export type WriterIdempotencySampleRecord = {
  idempotencyKey: string;
  contractId: SystemWriterContractId;
  scope: WriterIdempotencyScope;
  operation: ServiceRoleAdapterOperation;
  requestHash: string;
  status: "reserved";
  resultRef: null;
  auditEventId: string;
  wouldPersist: false;
};

export type WriterIdempotencyContract = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  operation: ServiceRoleAdapterOperation;
  scope: WriterIdempotencyScope;
  keyTemplate: string;
  uniquenessRule: string;
  reservationRule: string;
  conflictBehavior: WriterIdempotencyConflictBehavior;
  replayRule: string;
  ttlRule: string;
  sampleRecord: WriterIdempotencySampleRecord;
};

export type WriterIdempotencyModelPayload = {
  safeMode: true;
  readOnly: true;
  wouldReserveKeys: false;
  wouldWriteRegistryRows: false;
  migrationIncluded: false;
  futureTableName: "writer_idempotency_keys";
  globalRules: string[];
  conflictRules: string[];
  baseFields: WriterIdempotencyField[];
  contracts: WriterIdempotencyContract[];
};
