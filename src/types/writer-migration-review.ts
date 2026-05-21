export type WriterMigrationReviewMode = "review_checklist_only";

export type WriterMigrationReviewCategory =
  | "proposal_integrity"
  | "schema"
  | "rls"
  | "index"
  | "privacy_retention"
  | "audit"
  | "idempotency"
  | "rollback"
  | "operations"
  | "approval";

export type WriterMigrationReviewItemStatus = "pending_manual_review";

export type WriterMigrationReviewItem = {
  id: string;
  category: WriterMigrationReviewCategory;
  title: string;
  requirement: string;
  evidenceRequired: string;
  owner: string;
  blocking: boolean;
  defined: true;
  status: WriterMigrationReviewItemStatus;
  mustPassBeforeMigration: true;
  sourceRefs: string[];
};

export type WriterMigrationReviewSection = {
  id: string;
  category: WriterMigrationReviewCategory;
  title: string;
  purpose: string;
  requiredApprover: string;
  exitCriteria: string;
  status: WriterMigrationReviewItemStatus;
  items: WriterMigrationReviewItem[];
};

export type WriterMigrationReviewPayload = {
  safeMode: true;
  readOnly: true;
  checklistMode: WriterMigrationReviewMode;
  sourceProposalMode: "proposal_only";
  sourceMigrationName: string;
  sourceProposalAllChecksPassed: boolean;
  sourceProposedTableCount: number;
  sourceProposedPolicyCount: number;
  sectionCount: number;
  itemCount: number;
  blockingItemCount: number;
  allItemsDefined: boolean;
  manualApprovalRequired: true;
  approvedForMigration: false;
  readyToApplyMigration: false;
  wouldCreateMigrationFile: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldAlterExistingTables: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  globalRules: string[];
  promotionRules: string[];
  sourceRefs: string[];
  sections: WriterMigrationReviewSection[];
};

export type WriterMigrationReviewProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  checklistMode: WriterMigrationReviewMode;
  sectionId?: string;
  itemCount: number;
  blockingItemCount: number;
  approvedForMigration: false;
  readyToApplyMigration: false;
  wouldCreateMigrationFile: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldCreateServiceRoleClient: false;
  items: WriterMigrationReviewItem[];
  summary: string;
};
