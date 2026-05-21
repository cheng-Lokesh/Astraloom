export type WriterMigrationProposalMode = "proposal_only";

export type WriterMigrationProposalCheckCategory =
  | "schema"
  | "rls"
  | "index"
  | "retention"
  | "evidence_alignment"
  | "write_block";

export type WriterMigrationProposalCheck = {
  id: string;
  category: WriterMigrationProposalCheckCategory;
  title: string;
  passed: boolean;
  blocking: true;
  detail: string;
};

export type WriterMigrationTableProposal = {
  tableName: "writer_audit_events" | "writer_idempotency_keys";
  purpose: string;
  owner: "server_writer";
  proposedColumns: string[];
  proposedIndexes: string[];
  rlsRule: string;
  retentionRule: string;
  sourceModelRefs: string[];
  createSql: string;
  indexSql: string[];
  rlsSql: string[];
  wouldCreateTable: false;
  wouldApplySql: false;
  wouldWriteRows: false;
  checks: WriterMigrationProposalCheck[];
};

export type WriterMigrationProposalPayload = {
  safeMode: true;
  readOnly: true;
  proposalMode: WriterMigrationProposalMode;
  migrationName: "0002_writer_audit_idempotency_proposal";
  proposedTableCount: 2;
  proposedIndexCount: number;
  proposedPolicyCount: 0;
  proposedSql: string;
  sqlLineCount: number;
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
  allChecksPassed: boolean;
  globalRules: string[];
  sharedChecks: WriterMigrationProposalCheck[];
  tables: WriterMigrationTableProposal[];
};

export type WriterMigrationProposalProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  proposalMode: WriterMigrationProposalMode;
  tableName?: WriterMigrationTableProposal["tableName"];
  wouldCreateMigrationFile: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldCreateServiceRoleClient: false;
  checks: WriterMigrationProposalCheck[];
  summary: string;
};
