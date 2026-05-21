import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";

export type WriterRollbackStrategy =
  | "supersede_version"
  | "soft_delete_generated"
  | "append_compensating_event"
  | "cancel_queued_run"
  | "replacement_report"
  | "payment_reversal_event"
  | "consent_revocation_event";

export type WriterRollbackTrigger =
  | "bad_generation"
  | "duplicate_operation"
  | "safety_block_after_generation"
  | "payment_refund_or_dispute"
  | "consent_revoked"
  | "operator_review";

export type WriterRollbackField = {
  name: string;
  required: boolean;
  detail: string;
};

export type WriterRollbackSampleRecord = {
  compensationEventId: string;
  contractId: SystemWriterContractId;
  strategy: WriterRollbackStrategy;
  trigger: WriterRollbackTrigger;
  originalResultRef: string;
  replacementResultRef: null;
  idempotencyKey: string;
  auditEventId: string;
  wouldPersist: false;
  wouldMutateHistory: false;
};

export type WriterRollbackContract = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  affectedTables: string[];
  strategy: WriterRollbackStrategy;
  allowedTriggers: WriterRollbackTrigger[];
  forbiddenActions: string[];
  compensationRule: string;
  historyRule: string;
  operatorReviewRule: string;
  sampleRecord: WriterRollbackSampleRecord;
};

export type WriterRollbackModelPayload = {
  safeMode: true;
  readOnly: true;
  wouldWriteCompensationRows: false;
  wouldMutateHistory: false;
  migrationIncluded: false;
  futureTableName: "writer_compensation_events";
  globalRules: string[];
  baseFields: WriterRollbackField[];
  contracts: WriterRollbackContract[];
};
