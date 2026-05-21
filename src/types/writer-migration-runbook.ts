export type WriterMigrationRunbookMode = "manual_application_runbook_only";

export type WriterMigrationRunbookPhaseId =
  | "preflight"
  | "approval_record"
  | "manual_execution"
  | "post_migration_checks"
  | "abort_and_rollback"
  | "handoff";

export type WriterMigrationRunbookStep = {
  id: string;
  phaseId: WriterMigrationRunbookPhaseId;
  title: string;
  instruction: string;
  requiredEvidence: string;
  stopCondition: string;
  owner: string;
  manualOnly: true;
  blocking: boolean;
  status: "not_started";
  sourceRefs: string[];
};

export type WriterMigrationRunbookPhase = {
  id: WriterMigrationRunbookPhaseId;
  title: string;
  purpose: string;
  requiredOperator: string;
  exitCriteria: string;
  steps: WriterMigrationRunbookStep[];
};

export type WriterMigrationRunbookPayload = {
  safeMode: true;
  readOnly: true;
  runbookMode: WriterMigrationRunbookMode;
  sourceProposalMode: "proposal_only";
  sourceChecklistMode: "review_checklist_only";
  sourceMigrationName: string;
  sourceSqlSha256: string;
  sourceReviewItemCount: number;
  sourceReviewBlockingItemCount: number;
  sourceApprovedForMigration: false;
  sourceReadyToApplyMigration: false;
  phaseCount: number;
  stepCount: number;
  blockingStepCount: number;
  humanOperatorRequired: true;
  appCanApplyMigration: false;
  approvedToApplyMigration: false;
  shouldApplyMigrationNow: false;
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
  manualExecutionBoundaries: string[];
  phases: WriterMigrationRunbookPhase[];
};

export type WriterMigrationRunbookProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  runbookMode: WriterMigrationRunbookMode;
  phaseId?: WriterMigrationRunbookPhaseId;
  stepCount: number;
  blockingStepCount: number;
  appCanApplyMigration: false;
  approvedToApplyMigration: false;
  shouldApplyMigrationNow: false;
  wouldCreateMigrationFile: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldCreateServiceRoleClient: false;
  steps: WriterMigrationRunbookStep[];
  summary: string;
};
