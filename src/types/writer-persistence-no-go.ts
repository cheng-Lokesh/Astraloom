import type { WriterPersistenceAdapterDesignMode } from "@/types/writer-persistence-adapter-design";
import type { WriterPersistenceFixtureHarnessMode } from "@/types/writer-persistence-fixture-harness";
import type { WriterPersistenceReviewMode } from "@/types/writer-persistence-review";

export type WriterPersistenceNoGoMode =
  "persistence_adapter_no_go_evidence_packet_only";

export type WriterPersistenceNoGoCategory =
  | "schema_evidence"
  | "service_role_isolation"
  | "transaction_idempotency"
  | "audit_redaction"
  | "rollback_compensation"
  | "rollout_approval"
  | "observability_support"
  | "route_invariants"
  | "security_no_go"
  | "implementation_handoff";

export type WriterPersistenceNoGoStatus =
  | "blocked"
  | "manual_required"
  | "passed";

export type WriterPersistenceNoGoOwner =
  | "founder"
  | "backend"
  | "security"
  | "operator"
  | "qa";

export type WriterPersistenceNoGoRouteInvariant = {
  id: string;
  route: string;
  title: string;
  passed: boolean;
  blocking: true;
  expectedFlags: string[];
  actualSummary: string;
  sourceRefs: string[];
};

export type WriterPersistenceNoGoItem = {
  id: string;
  category: WriterPersistenceNoGoCategory;
  title: string;
  status: WriterPersistenceNoGoStatus;
  blocking: true;
  owner: WriterPersistenceNoGoOwner;
  detail: string;
  requiredEvidence: string;
  sourceRefs: string[];
  sourceReviewItemIds: string[];
  sourceFixtureIds: string[];
  routeInvariantIds: string[];
};

export type WriterPersistenceNoGoPayload = {
  safeMode: true;
  readOnly: true;
  noGoMode: WriterPersistenceNoGoMode;
  sourceDesignMode: WriterPersistenceAdapterDesignMode;
  sourceReviewMode: WriterPersistenceReviewMode;
  sourceFixtureMode: WriterPersistenceFixtureHarnessMode;
  checkedAt: string;
  itemCount: number;
  blockedItemCount: number;
  manualRequiredItemCount: number;
  passedItemCount: number;
  routeInvariantCount: number;
  routeInvariantPassedCount: number;
  sourceReviewItemCount: number;
  sourceFixtureCount: number;
  sourceFixtureAssertionCount: number;
  noGoPacketReady: true;
  noGoEvidenceComplete: false;
  readyForImplementationProposal: false;
  implementationProposalAllowed: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldCreateImplementationPlan: false;
  wouldCreateImplementationBranch: false;
  wouldImportRealWriterImplementation: false;
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
  blockedCodes: string[];
  packetRules: string[];
  routeInvariants: WriterPersistenceNoGoRouteInvariant[];
  items: WriterPersistenceNoGoItem[];
};

export type WriterPersistenceNoGoProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  noGoMode: WriterPersistenceNoGoMode;
  itemId?: string;
  itemTitle?: string;
  itemStatus?: WriterPersistenceNoGoStatus;
  summary: string;
  noGoEvidenceComplete: false;
  readyForImplementationProposal: false;
  implementationProposalAllowed: false;
  schemaVerified: false;
  adapterImplemented: false;
  adapterImplementationApproved: false;
  adapterImplementationAllowed: false;
  implementationReviewComplete: false;
  allBlockingEvidenceReady: false;
  allRuntimeEffectsBlocked: true;
  wouldCreateImplementationPlan: false;
  wouldCreateImplementationBranch: false;
  wouldImportRealWriterImplementation: false;
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
  blockedCodes: string[];
  routeInvariants: WriterPersistenceNoGoRouteInvariant[];
  items: WriterPersistenceNoGoItem[];
};
