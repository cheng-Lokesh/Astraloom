export type WriterSchemaVerificationMode = "public_readonly_probe_only";

export type WriterSchemaVerificationSignal =
  | "not_checked"
  | "not_detected"
  | "blocked_or_unknown"
  | "detected_publicly_reachable"
  | "network_error";

export type WriterSchemaVerificationCheckCategory =
  | "public_config"
  | "table_presence"
  | "rls"
  | "policy"
  | "row_count"
  | "runtime_gate"
  | "manual_review";

export type WriterSchemaVerificationCheck = {
  id: string;
  category: WriterSchemaVerificationCheckCategory;
  title: string;
  status: "passed" | "blocked" | "manual_required";
  blocking: boolean;
  detail: string;
  evidenceRequired: string;
};

export type WriterSchemaTableVerification = {
  tableName: "writer_audit_events" | "writer_idempotency_keys";
  expectedOwner: "server_writer";
  expectedNoBrowserPolicies: true;
  expectedRlsEnabled: true;
  expectedZeroRowsBeforeWriters: true;
  publicRestStatusCode: number | null;
  publicProbeSignal: WriterSchemaVerificationSignal;
  publicProbeDetail: string;
  tablePresenceVerified: false;
  rlsVerified: false;
  browserPolicyAbsenceVerified: false;
  zeroRowsVerified: false;
  manualDatabaseCheckRequired: true;
  manualSqlChecks: string[];
  checks: WriterSchemaVerificationCheck[];
};

export type WriterSchemaVerificationPayload = {
  safeMode: true;
  readOnly: true;
  verificationMode: WriterSchemaVerificationMode;
  sourceProposalMode: "proposal_only";
  sourceChecklistMode: "review_checklist_only";
  sourceRunbookMode: "manual_application_runbook_only";
  sourceMigrationName: string;
  sourceSqlSha256: string;
  projectUrlConfigured: boolean;
  publishableKeyConfigured: boolean;
  checkedAt: string;
  checkedTableCount: number;
  detectedPubliclyReachableCount: number;
  notDetectedCount: number;
  blockedOrUnknownCount: number;
  networkErrorCount: number;
  manualDatabaseCheckRequired: true;
  publicProbeCanProveTablePresence: false;
  publicProbeCanProveRls: false;
  publicProbeCanProvePolicyAbsence: false;
  publicProbeCanProveZeroRows: false;
  schemaVerified: false;
  readyForWriterImplementation: false;
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
  manualVerificationSql: string[];
  tables: WriterSchemaTableVerification[];
};

export type WriterSchemaVerificationProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  verificationMode: WriterSchemaVerificationMode;
  tableName?: WriterSchemaTableVerification["tableName"];
  publicProbeSignal?: WriterSchemaVerificationSignal;
  publicRestStatusCode?: number | null;
  manualDatabaseCheckRequired: true;
  schemaVerified: false;
  readyForWriterImplementation: false;
  wouldCreateMigrationFile: false;
  wouldApplyMigration: false;
  wouldCreateTables: false;
  wouldWriteRows: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldCreateServiceRoleClient: false;
  checks: WriterSchemaVerificationCheck[];
  summary: string;
};
