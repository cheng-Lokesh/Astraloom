import type {
  WriterPersistenceAdapterFailureModeId,
  WriterPersistenceAdapterMethodId,
  WriterPersistenceAdapterPhaseId,
} from "@/types/writer-persistence-adapter-design";
import type { WriterPersistenceReviewMode } from "@/types/writer-persistence-review";

export type WriterPersistenceFixtureHarnessMode =
  "persistence_adapter_fixture_harness_only";

export type WriterPersistenceFixtureCategory =
  | "transaction_order"
  | "idempotency_replay"
  | "idempotency_conflict"
  | "audit_redaction"
  | "rollback_compensation"
  | "rollout_gate"
  | "service_role_isolation"
  | "observability_support"
  | "security_no_go";

export type WriterPersistenceFixtureStatus =
  | "fixture_ready"
  | "blocked_by_review"
  | "manual_required";

export type WriterPersistenceFixtureAssertion = {
  id: string;
  title: string;
  passed: boolean;
  blocking: true;
  detail: string;
  expectedEvidence: string;
  sourceReviewItemIds: string[];
};

export type WriterPersistenceFixtureCase = {
  id: string;
  category: WriterPersistenceFixtureCategory;
  title: string;
  status: WriterPersistenceFixtureStatus;
  blocking: true;
  detail: string;
  reviewItemIds: string[];
  relatedMethods: WriterPersistenceAdapterMethodId[];
  relatedPhases: WriterPersistenceAdapterPhaseId[];
  relatedFailureModes: WriterPersistenceAdapterFailureModeId[];
  fixtureInputRefs: string[];
  expectedOutcomeRefs: string[];
  forbiddenRuntimeEffects: string[];
  assertions: WriterPersistenceFixtureAssertion[];
  wouldRunTransaction: false;
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
};

export type WriterPersistenceFixtureHarnessPayload = {
  safeMode: true;
  readOnly: true;
  fixtureMode: WriterPersistenceFixtureHarnessMode;
  sourceReviewMode: WriterPersistenceReviewMode;
  checkedAt: string;
  fixtureCount: number;
  assertionCount: number;
  passedAssertionCount: number;
  blockedFixtureCount: number;
  manualRequiredFixtureCount: number;
  sourceReviewItemCount: number;
  sourceReviewBlockingItemCount: number;
  sourceReviewManualRequiredCount: number;
  fixtureHarnessReady: true;
  fixtureEvidenceOnly: true;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldRunTransaction: false;
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
  fixtureRules: string[];
  fixtures: WriterPersistenceFixtureCase[];
};

export type WriterPersistenceFixtureHarnessProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  fixtureMode: WriterPersistenceFixtureHarnessMode;
  fixtureId?: string;
  fixtureTitle?: string;
  fixtureStatus?: WriterPersistenceFixtureStatus;
  summary: string;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldRunTransaction: false;
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
  fixtures: WriterPersistenceFixtureCase[];
};
