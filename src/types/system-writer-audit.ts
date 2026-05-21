import type { WriterAuthContext } from "@/types/system-writer-guardrail";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";

export type WriterAuditLifecycle =
  | "attempt_received"
  | "gate_blocked"
  | "adapter_probe"
  | "write_succeeded"
  | "write_failed"
  | "rollback_recorded";

export type WriterAuditSensitivity =
  | "safe_metadata"
  | "pseudonymous_identifier"
  | "hash_only"
  | "internal_state"
  | "forbidden_secret";

export type WriterAuditField = {
  name: string;
  required: boolean;
  sensitivity: WriterAuditSensitivity;
  detail: string;
};

export type WriterAuditEventSample = {
  eventType: string;
  lifecycle: WriterAuditLifecycle;
  contractId: SystemWriterContractId;
  actorContext: WriterAuthContext;
  targetTables: string[];
  idempotencyKey: string;
  requestHash: string;
  gateDecision: "blocked" | "would_record_only";
  blockedCodes: string[];
  writerVersion: string;
  createdAt: string;
  wouldPersist: false;
};

export type WriterAuditEventContract = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  actorContext: WriterAuthContext;
  targetTables: string[];
  futureTableName: "writer_audit_events";
  eventTypes: string[];
  requiredFields: WriterAuditField[];
  forbiddenFields: string[];
  correlationKeys: string[];
  retentionRule: string;
  sampleBlockedEvent: WriterAuditEventSample;
};

export type WriterAuditModelPayload = {
  safeMode: true;
  readOnly: true;
  wouldWriteAuditRows: false;
  migrationIncluded: false;
  futureTableName: "writer_audit_events";
  globalRules: string[];
  redactionRules: string[];
  baseFields: WriterAuditField[];
  contracts: WriterAuditEventContract[];
};
