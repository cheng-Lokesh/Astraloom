import type { WriterRolloutReadiness } from "@/types/system-writer-rollout";
import type { WriterRollbackStrategy } from "@/types/system-writer-rollback";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type { WriterPersistenceDryRunGateMode } from "@/types/writer-persistence-dry-run";
import type { WriterSchemaVerificationMode } from "@/types/writer-schema-verification";

export type WriterPersistenceAdapterDesignMode =
  "persistence_adapter_design_only";

export type WriterPersistenceAdapterMethodId =
  | "start_persistence_attempt"
  | "reserve_idempotency_key"
  | "append_audit_attempt"
  | "commit_future_writer_result"
  | "finalize_idempotency_result"
  | "record_compensation_required";

export type WriterPersistenceAdapterPhaseId =
  | "preflight"
  | "idempotency_reservation"
  | "audit_attempt"
  | "future_writer_body"
  | "audit_result"
  | "idempotency_finalize"
  | "compensation_handoff";

export type WriterPersistenceAdapterFailureModeId =
  | "schema_not_verified"
  | "duplicate_request"
  | "conflicting_request"
  | "idempotency_reservation_failed"
  | "audit_append_failed"
  | "future_writer_failed"
  | "compensation_required"
  | "rollout_not_approved";

export type WriterPersistenceAdapterCheckCategory =
  | "source_gate"
  | "schema"
  | "transaction_order"
  | "idempotency"
  | "audit"
  | "evidence"
  | "rollback"
  | "service_role"
  | "release_approval"
  | "implementation_gap";

export type WriterPersistenceAdapterCheck = {
  id: string;
  category: WriterPersistenceAdapterCheckCategory;
  title: string;
  status: "passed" | "blocked" | "manual_required";
  blocking: true;
  detail: string;
  evidenceRequired: string;
};

export type WriterPersistenceAdapterMethod = {
  id: WriterPersistenceAdapterMethodId;
  title: string;
  purpose: string;
  futureOwnerModule: string;
  futureInputRefs: string[];
  futureOutputRefs: string[];
  futureTableNames: string[];
  transactionBoundary: string;
  rollbackBehavior: string;
  failureModes: WriterPersistenceAdapterFailureModeId[];
  canRunNow: false;
  wouldImportRealWriterImplementation: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldPersistEvidence: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldWriteCompensationRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  checks: WriterPersistenceAdapterCheck[];
};

export type WriterPersistenceAdapterPhase = {
  id: WriterPersistenceAdapterPhaseId;
  order: number;
  title: string;
  purpose: string;
  futureAtomicityRule: string;
  canBeSkipped: false;
  currentStatus: "design_only_blocked";
  blockedBy: string[];
};

export type WriterPersistenceAdapterFailureMode = {
  id: WriterPersistenceAdapterFailureModeId;
  title: string;
  trigger: string;
  requiredResponse: string;
  auditRequirement: string;
  idempotencyRequirement: string;
  rollbackStrategy?: WriterRollbackStrategy;
  currentStatus: "documented_only";
  wouldWriteRows: false;
};

export type WriterPersistenceAdapterContractReadiness = {
  contractId: SystemWriterContractId;
  rolloutReadiness: WriterRolloutReadiness;
  firstAllowedAudience: string;
  targetTables: string[];
  requiredBeforeLaunch: string[];
  blockedBy: string[];
  adapterDesignCovered: true;
  adapterImplementationAllowed: false;
};

export type WriterPersistenceAdapterDesignPayload = {
  safeMode: true;
  readOnly: true;
  designMode: WriterPersistenceAdapterDesignMode;
  sourceDryRunGateMode: WriterPersistenceDryRunGateMode;
  sourceVerificationMode: WriterSchemaVerificationMode;
  sourceAllPersistenceAttemptsBlocked: true;
  sourceRolloutApprovedForProduction: false;
  sourceRolloutAllRequiredGatesPassed: false;
  checkedAt: string;
  methodCount: number;
  phaseCount: number;
  failureModeCount: number;
  contractReadinessCount: number;
  schemaVerified: false;
  readyForWriterImplementation: false;
  manualDatabaseCheckRequired: true;
  adapterImplemented: false;
  adapterCanRun: false;
  transactionImplementationAllowed: false;
  allRuntimeEffectsBlocked: true;
  wouldImportRealWriterImplementation: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldPersistEvidence: false;
  wouldStoreRawPayload: false;
  wouldStoreSecrets: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldWriteCompensationRows: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldEnableWriters: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  blockedCodes: string[];
  globalRules: string[];
  sharedChecks: WriterPersistenceAdapterCheck[];
  methods: WriterPersistenceAdapterMethod[];
  phases: WriterPersistenceAdapterPhase[];
  failureModes: WriterPersistenceAdapterFailureMode[];
  contractReadiness: WriterPersistenceAdapterContractReadiness[];
};

export type WriterPersistenceAdapterDesignProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  designMode: WriterPersistenceAdapterDesignMode;
  methodId?: WriterPersistenceAdapterMethodId;
  methodTitle?: string;
  summary: string;
  schemaVerified: false;
  readyForWriterImplementation: false;
  adapterImplemented: false;
  adapterCanRun: false;
  transactionImplementationAllowed: false;
  allRuntimeEffectsBlocked: true;
  wouldImportRealWriterImplementation: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldPersistEvidence: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldWriteCompensationRows: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldEnableWriters: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  wouldUnlockReports: false;
  blockedCodes: string[];
  checks: WriterPersistenceAdapterCheck[];
};
