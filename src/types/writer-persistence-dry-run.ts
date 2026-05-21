import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type { WriterEvidenceHandoffMode } from "@/types/writer-evidence-handoff";
import type {
  WriterSchemaTableVerification,
  WriterSchemaVerificationMode,
  WriterSchemaVerificationSignal,
} from "@/types/writer-schema-verification";

export type WriterPersistenceDryRunGateMode =
  "audit_idempotency_persistence_dry_run_only";

export type WriterPersistenceDryRunOperation =
  | "audit_event_write"
  | "idempotency_key_reservation"
  | "evidence_persistence";

export type WriterPersistenceDryRunCheckCategory =
  | "schema_verification"
  | "manual_evidence"
  | "audit_model"
  | "idempotency_model"
  | "evidence_handoff"
  | "service_role"
  | "runtime_persistence"
  | "release_approval";

export type WriterPersistenceDryRunCheck = {
  id: string;
  category: WriterPersistenceDryRunCheckCategory;
  title: string;
  status: "passed" | "blocked" | "manual_required";
  blocking: true;
  detail: string;
  evidenceRequired: string;
};

export type WriterPersistenceDryRunOperationGate = {
  operation: WriterPersistenceDryRunOperation;
  title: string;
  futureTableNames: Array<WriterSchemaTableVerification["tableName"]>;
  blocked: true;
  persistenceAllowed: false;
  manualDatabaseCheckRequired: true;
  schemaVerified: false;
  readyForWriterImplementation: false;
  sourceContractIds: SystemWriterContractId[];
  sourceFixtureCount: number;
  sourcePublicProbeSignals: Array<{
    tableName: WriterSchemaTableVerification["tableName"];
    signal: WriterSchemaVerificationSignal;
    statusCode: number | null;
  }>;
  blockedCodes: string[];
  wouldPersistEvidence: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKey: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  checks: WriterPersistenceDryRunCheck[];
};

export type WriterPersistenceDryRunPayload = {
  safeMode: true;
  readOnly: true;
  gateMode: WriterPersistenceDryRunGateMode;
  sourceVerificationMode: WriterSchemaVerificationMode;
  sourceHandoffMode: WriterEvidenceHandoffMode;
  checkedAt: string;
  checkedSchemaTableCount: number;
  auditContractCount: number;
  idempotencyContractCount: number;
  evidenceFixtureCount: number;
  schemaVerified: false;
  readyForWriterImplementation: false;
  manualDatabaseCheckRequired: true;
  auditPersistenceAllowed: false;
  idempotencyReservationAllowed: false;
  evidencePersistenceAllowed: false;
  allPersistenceAttemptsBlocked: true;
  wouldPersistEvidence: false;
  wouldStoreRawPayload: false;
  wouldStorePrivateNarrative: false;
  wouldStoreSecrets: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  blockedCodes: string[];
  globalRules: string[];
  sharedChecks: WriterPersistenceDryRunCheck[];
  operationGates: WriterPersistenceDryRunOperationGate[];
};

export type WriterPersistenceDryRunProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  gateMode: WriterPersistenceDryRunGateMode;
  operation?: WriterPersistenceDryRunOperation;
  operationTitle?: string;
  summary: string;
  manualDatabaseCheckRequired: true;
  schemaVerified: false;
  readyForWriterImplementation: false;
  persistenceAllowed: false;
  auditPersistenceAllowed: false;
  idempotencyReservationAllowed: false;
  evidencePersistenceAllowed: false;
  allPersistenceAttemptsBlocked: true;
  wouldPersistEvidence: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKey: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  blockedCodes: string[];
  checks: WriterPersistenceDryRunCheck[];
};
