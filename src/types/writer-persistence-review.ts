import type {
  WriterPersistenceAdapterDesignMode,
  WriterPersistenceAdapterFailureModeId,
  WriterPersistenceAdapterMethodId,
  WriterPersistenceAdapterPhaseId,
} from "@/types/writer-persistence-adapter-design";

export type WriterPersistenceReviewMode =
  "persistence_adapter_implementation_review_only";

export type WriterPersistenceReviewCategory =
  | "schema_evidence"
  | "service_role_isolation"
  | "transaction_tests"
  | "idempotency_tests"
  | "audit_redaction_tests"
  | "rollback_compensation_tests"
  | "rollout_approval"
  | "observability_support"
  | "no_go_security"
  | "source_invariants";

export type WriterPersistenceReviewStatus =
  | "blocked"
  | "manual_required"
  | "passed";

export type WriterPersistenceReviewOwner =
  | "founder"
  | "backend"
  | "security"
  | "operator"
  | "qa";

export type WriterPersistenceReviewItem = {
  id: string;
  category: WriterPersistenceReviewCategory;
  title: string;
  status: WriterPersistenceReviewStatus;
  blocking: true;
  owner: WriterPersistenceReviewOwner;
  requiredEvidence: string;
  detail: string;
  sourceRefs: string[];
  relatedMethods: WriterPersistenceAdapterMethodId[];
  relatedPhases: WriterPersistenceAdapterPhaseId[];
  relatedFailureModes: WriterPersistenceAdapterFailureModeId[];
};

export type WriterPersistenceReviewPayload = {
  safeMode: true;
  readOnly: true;
  reviewMode: WriterPersistenceReviewMode;
  sourceDesignMode: WriterPersistenceAdapterDesignMode;
  checkedAt: string;
  itemCount: number;
  blockingItemCount: number;
  manualRequiredCount: number;
  passedItemCount: number;
  sourceMethodCount: number;
  sourcePhaseCount: number;
  sourceFailureModeCount: number;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
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
  reviewRules: string[];
  items: WriterPersistenceReviewItem[];
};

export type WriterPersistenceReviewProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  reviewMode: WriterPersistenceReviewMode;
  itemId?: string;
  itemTitle?: string;
  itemStatus?: WriterPersistenceReviewStatus;
  summary: string;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
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
  items: WriterPersistenceReviewItem[];
};
