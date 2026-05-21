import "server-only";

import { buildWriterAuditModel } from "@/lib/server-writers/audit";
import { buildWriterEvidenceHandoff } from "@/lib/server-writers/evidence-handoff";
import { buildWriterIdempotencyModel } from "@/lib/server-writers/idempotency";
import { buildWriterSchemaVerification } from "@/lib/server-writers/schema-verification";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  WriterPersistenceDryRunCheck,
  WriterPersistenceDryRunOperation,
  WriterPersistenceDryRunOperationGate,
  WriterPersistenceDryRunPayload,
  WriterPersistenceDryRunProbeResult,
} from "@/types/writer-persistence-dry-run";
import type {
  WriterSchemaTableVerification,
  WriterSchemaVerificationPayload,
} from "@/types/writer-schema-verification";

const auditTableName = "writer_audit_events" as const;
const idempotencyTableName = "writer_idempotency_keys" as const;
const operations: WriterPersistenceDryRunOperation[] = [
  "audit_event_write",
  "idempotency_key_reservation",
  "evidence_persistence",
];
const baseBlockedCodes = [
  "manual_schema_verification_required",
  "schema_not_verified",
  "writer_implementation_not_ready",
  "persistence_adapter_not_implemented",
  "service_role_client_forbidden",
  "rollout_approval_missing",
];

function check(
  input: WriterPersistenceDryRunCheck,
): WriterPersistenceDryRunCheck {
  return input;
}

function isOperation(value: unknown): value is WriterPersistenceDryRunOperation {
  return operations.includes(value as WriterPersistenceDryRunOperation);
}

function sourceSignals(
  schema: WriterSchemaVerificationPayload,
  tableNames: Array<WriterSchemaTableVerification["tableName"]>,
) {
  return schema.tables
    .filter((table) => tableNames.includes(table.tableName))
    .map((table) => ({
      tableName: table.tableName,
      signal: table.publicProbeSignal,
      statusCode: table.publicRestStatusCode,
    }));
}

function sharedChecks(
  schema: WriterSchemaVerificationPayload,
): WriterPersistenceDryRunCheck[] {
  return [
    check({
      id: "manual_database_evidence_required",
      category: "manual_evidence",
      title: "Manual database evidence required",
      status: "manual_required",
      blocking: true,
      detail:
        "A publishable-key public probe cannot prove table existence, RLS, browser policy absence, or zero rows for the future writer-owned tables.",
      evidenceRequired:
        "Human database evidence for to_regclass, relrowsecurity, pg_policies, and zero row counts before any persistence adapter is reviewed.",
    }),
    check({
      id: "schema_not_verified",
      category: "schema_verification",
      title: "Schema is not verified",
      status: "blocked",
      blocking: true,
      detail:
        "The applied-schema verification harness intentionally returns schemaVerified=false and readyForWriterImplementation=false.",
      evidenceRequired:
        "A later human-approved verification record must explicitly mark the future tables as verified before real persistence can be considered.",
    }),
    check({
      id: "schema_verification_source_read_only",
      category: "schema_verification",
      title: "Schema verification source is read-only",
      status:
        schema.readOnly &&
        !schema.wouldApplyMigration &&
        !schema.wouldCreateTables &&
        !schema.wouldWriteRows
          ? "passed"
          : "blocked",
      blocking: true,
      detail:
        "This gate consumes the public schema verification payload as a signal source only and does not apply SQL or create tables.",
      evidenceRequired:
        "Schema verification payload keeps wouldApplyMigration=false, wouldCreateTables=false, and wouldWriteRows=false.",
    }),
    check({
      id: "service_role_client_absent",
      category: "service_role",
      title: "Service-role client is absent",
      status:
        !schema.wouldCreateServiceRoleClient && !schema.wouldReadServiceRoleSecret
          ? "passed"
          : "blocked",
      blocking: true,
      detail:
        "The persistence dry-run gate does not create a privileged Supabase client and does not read service-role secret values.",
      evidenceRequired:
        "Payload fields remain wouldCreateServiceRoleClient=false and wouldReadServiceRoleSecret=false.",
    }),
    check({
      id: "runtime_persistence_adapter_missing",
      category: "runtime_persistence",
      title: "Runtime persistence adapter is missing",
      status: "blocked",
      blocking: true,
      detail:
        "There is still no implementation that can persist audit rows, reserve idempotency keys, or write evidence records.",
      evidenceRequired:
        "A future adapter design and implementation review must be completed before any insert/update/upsert path exists.",
    }),
    check({
      id: "rollout_approval_missing",
      category: "release_approval",
      title: "Rollout approval is missing",
      status: "blocked",
      blocking: true,
      detail:
        "Even if schema evidence exists later, production writer rollout approval is still required before persistence can be enabled.",
      evidenceRequired:
        "A future rollout checklist must approve the exact writer, environment, canary order, and rollback plan.",
    }),
  ];
}

function operationTitle(operation: WriterPersistenceDryRunOperation) {
  if (operation === "audit_event_write") {
    return "Future audit event write";
  }

  if (operation === "idempotency_key_reservation") {
    return "Future idempotency key reservation";
  }

  return "Future evidence persistence";
}

function operationTables(
  operation: WriterPersistenceDryRunOperation,
): Array<WriterSchemaTableVerification["tableName"]> {
  if (operation === "audit_event_write") {
    return [auditTableName];
  }

  if (operation === "idempotency_key_reservation") {
    return [idempotencyTableName];
  }

  return [auditTableName, idempotencyTableName];
}

function contractIdsForOperation(input: {
  operation: WriterPersistenceDryRunOperation;
  auditContractIds: SystemWriterContractId[];
  idempotencyContractIds: SystemWriterContractId[];
}) {
  if (input.operation === "audit_event_write") {
    return input.auditContractIds;
  }

  if (input.operation === "idempotency_key_reservation") {
    return input.idempotencyContractIds;
  }

  return Array.from(
    new Set([...input.auditContractIds, ...input.idempotencyContractIds]),
  );
}

function operationChecks(input: {
  operation: WriterPersistenceDryRunOperation;
  schema: WriterSchemaVerificationPayload;
  auditModelSafe: boolean;
  idempotencyModelSafe: boolean;
  evidenceHandoffSafe: boolean;
}) {
  const tableNames = operationTables(input.operation);
  const checks: WriterPersistenceDryRunCheck[] = [
    check({
      id: `${input.operation}_target_schema_manual_review_required`,
      category: "schema_verification",
      title: "Target schema requires manual review",
      status: "manual_required",
      blocking: true,
      detail: `The target table set (${tableNames.join(", ")}) is not verified by a privileged database review.`,
      evidenceRequired:
        "Manual database checks must prove table presence, RLS, browser policy absence, and zero rows before this operation can be revisited.",
    }),
    check({
      id: `${input.operation}_persistence_disabled`,
      category: "runtime_persistence",
      title: "Persistence remains disabled",
      status: "blocked",
      blocking: true,
      detail:
        "This operation is intentionally represented as a dry-run gate, not an adapter call.",
      evidenceRequired:
        "A later implementation must add a reviewed adapter path and still pass the same safety fields before real writes exist.",
    }),
    check({
      id: `${input.operation}_service_role_forbidden`,
      category: "service_role",
      title: "Service-role access is forbidden",
      status:
        !input.schema.wouldCreateServiceRoleClient &&
        !input.schema.wouldReadServiceRoleSecret
          ? "passed"
          : "blocked",
      blocking: true,
      detail:
        "The dry-run gate never creates a service-role client, never reads a service-role secret, and never serializes privileged config.",
      evidenceRequired:
        "No service-role factory, secret read, or privileged Supabase client is introduced by this stage.",
    }),
  ];

  if (
    input.operation === "audit_event_write" ||
    input.operation === "evidence_persistence"
  ) {
    checks.push(
      check({
        id: `${input.operation}_audit_model_inert`,
        category: "audit_model",
        title: "Audit model is inert",
        status: input.auditModelSafe ? "passed" : "blocked",
        blocking: true,
        detail:
          "The audit model defines future event fields and samples while keeping wouldWriteAuditRows=false.",
        evidenceRequired:
          "Audit model payload must remain read-only and must not include a migration or insert path.",
      }),
    );
  }

  if (
    input.operation === "idempotency_key_reservation" ||
    input.operation === "evidence_persistence"
  ) {
    checks.push(
      check({
        id: `${input.operation}_idempotency_model_inert`,
        category: "idempotency_model",
        title: "Idempotency model is inert",
        status: input.idempotencyModelSafe ? "passed" : "blocked",
        blocking: true,
        detail:
          "The idempotency model defines future key templates and conflict behavior while keeping wouldReserveKeys=false and wouldWriteRegistryRows=false.",
        evidenceRequired:
          "Idempotency payload must remain read-only and must not reserve, mutate, or delete registry rows.",
      }),
    );
  }

  checks.push(
    check({
      id: `${input.operation}_evidence_handoff_fixture_only`,
      category: "evidence_handoff",
      title: "Evidence handoff is fixture-only",
      status: input.evidenceHandoffSafe ? "passed" : "blocked",
      blocking: true,
      detail:
        "Evidence handoff is limited to deterministic references and redacted previews; it does not persist evidence or raw payloads.",
      evidenceRequired:
        "Evidence handoff payload must keep wouldPersistEvidence=false, wouldStoreRawPayload=false, wouldWriteAuditRows=false, and wouldReserveIdempotencyKeys=false.",
    }),
  );

  return checks;
}

function buildOperationGate(input: {
  operation: WriterPersistenceDryRunOperation;
  schema: WriterSchemaVerificationPayload;
  auditContractIds: SystemWriterContractId[];
  idempotencyContractIds: SystemWriterContractId[];
  evidenceFixtureCount: number;
  auditModelSafe: boolean;
  idempotencyModelSafe: boolean;
  evidenceHandoffSafe: boolean;
}): WriterPersistenceDryRunOperationGate {
  const futureTableNames = operationTables(input.operation);

  return {
    operation: input.operation,
    title: operationTitle(input.operation),
    futureTableNames,
    blocked: true,
    persistenceAllowed: false,
    manualDatabaseCheckRequired: true,
    schemaVerified: false,
    readyForWriterImplementation: false,
    sourceContractIds: contractIdsForOperation(input),
    sourceFixtureCount: input.evidenceFixtureCount,
    sourcePublicProbeSignals: sourceSignals(input.schema, futureTableNames),
    blockedCodes: baseBlockedCodes,
    wouldPersistEvidence: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKey: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteIdempotencyRows: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    checks: operationChecks(input),
  };
}

export async function buildWriterPersistenceDryRunGate(): Promise<WriterPersistenceDryRunPayload> {
  const schema = await buildWriterSchemaVerification();
  const audit = buildWriterAuditModel();
  const idempotency = buildWriterIdempotencyModel();
  const evidence = buildWriterEvidenceHandoff();
  const auditContractIds = audit.contracts.map((contract) => contract.contractId);
  const idempotencyContractIds = idempotency.contracts.map(
    (contract) => contract.contractId,
  );
  const auditModelSafe =
    audit.readOnly && !audit.wouldWriteAuditRows && !audit.migrationIncluded;
  const idempotencyModelSafe =
    idempotency.readOnly &&
    !idempotency.wouldReserveKeys &&
    !idempotency.wouldWriteRegistryRows &&
    !idempotency.migrationIncluded;
  const evidenceHandoffSafe =
    evidence.readOnly &&
    evidence.allFixturesReady &&
    !evidence.wouldPersistEvidence &&
    !evidence.wouldWriteAuditRows &&
    !evidence.wouldReserveIdempotencyKeys &&
    !evidence.wouldWriteIdempotencyRows &&
    !evidence.wouldWriteRows;
  const operationGates = operations.map((operation) =>
    buildOperationGate({
      operation,
      schema,
      auditContractIds,
      idempotencyContractIds,
      evidenceFixtureCount: evidence.fixtureCount,
      auditModelSafe,
      idempotencyModelSafe,
      evidenceHandoffSafe,
    }),
  );

  return {
    safeMode: true,
    readOnly: true,
    gateMode: "audit_idempotency_persistence_dry_run_only",
    sourceVerificationMode: schema.verificationMode,
    sourceHandoffMode: evidence.handoffMode,
    checkedAt: new Date().toISOString(),
    checkedSchemaTableCount: schema.checkedTableCount,
    auditContractCount: audit.contracts.length,
    idempotencyContractCount: idempotency.contracts.length,
    evidenceFixtureCount: evidence.fixtureCount,
    schemaVerified: false,
    readyForWriterImplementation: false,
    manualDatabaseCheckRequired: true,
    auditPersistenceAllowed: false,
    idempotencyReservationAllowed: false,
    evidencePersistenceAllowed: false,
    allPersistenceAttemptsBlocked: true,
    wouldPersistEvidence: false,
    wouldStoreRawPayload: false,
    wouldStorePrivateNarrative: false,
    wouldStoreSecrets: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteIdempotencyRows: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    blockedCodes: baseBlockedCodes,
    globalRules: [
      "This gate is a dry-run only; it does not call an audit writer, idempotency registry, or evidence persistence adapter.",
      "Schema verification remains public-probe-only and cannot approve real persistence without manual database evidence.",
      "Future audit writes must remain blocked until table presence, RLS, policy absence, zero rows, service-role isolation, and rollout approval are reviewed together.",
      "Future idempotency reservations must remain blocked until an atomic server-only reservation path is designed and reviewed.",
      "Evidence handoff fixtures can be inspected, but request hashes, redacted previews, audit evidence, and idempotency evidence are not persisted.",
      "No service-role client, secret read, database write, migration application, AI call, Stripe call, payment entitlement, or report unlock is allowed in this stage.",
    ],
    sharedChecks: sharedChecks(schema),
    operationGates,
  };
}

export async function probeWriterPersistenceDryRunGate(
  requestBody: unknown,
): Promise<WriterPersistenceDryRunProbeResult> {
  const payload = await buildWriterPersistenceDryRunGate();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      gateMode: payload.gateMode,
      summary:
        "Persistence dry-run probe blocked: request body must be a JSON object and no persistence attempt was made.",
      manualDatabaseCheckRequired: true,
      schemaVerified: false,
      readyForWriterImplementation: false,
      persistenceAllowed: false,
      auditPersistenceAllowed: false,
      idempotencyReservationAllowed: false,
      evidencePersistenceAllowed: false,
      allPersistenceAttemptsBlocked: true,
      wouldPersistEvidence: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKey: false,
      wouldReserveIdempotencyKeys: false,
      wouldWriteIdempotencyRows: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      wouldUnlockReports: false,
      blockedCodes: payload.blockedCodes,
      checks: payload.sharedChecks,
    };
  }

  const operation = (requestBody as { operation?: unknown }).operation;

  if (!isOperation(operation)) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      gateMode: payload.gateMode,
      summary:
        "Persistence dry-run probe blocked: unknown operation and no persistence attempt was made.",
      manualDatabaseCheckRequired: true,
      schemaVerified: false,
      readyForWriterImplementation: false,
      persistenceAllowed: false,
      auditPersistenceAllowed: false,
      idempotencyReservationAllowed: false,
      evidencePersistenceAllowed: false,
      allPersistenceAttemptsBlocked: true,
      wouldPersistEvidence: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKey: false,
      wouldReserveIdempotencyKeys: false,
      wouldWriteIdempotencyRows: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      wouldUnlockReports: false,
      blockedCodes: payload.blockedCodes,
      checks: payload.sharedChecks,
    };
  }

  const gate = payload.operationGates.find(
    (candidate) => candidate.operation === operation,
  );

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    gateMode: payload.gateMode,
    operation,
    operationTitle: gate?.title,
    summary:
      "Persistence dry-run probe blocked as designed: the operation was classified, prerequisite evidence was listed, and no audit row, idempotency key, evidence record, service-role client, migration, AI call, Stripe call, or report unlock was attempted.",
    manualDatabaseCheckRequired: true,
    schemaVerified: false,
    readyForWriterImplementation: false,
    persistenceAllowed: false,
    auditPersistenceAllowed: false,
    idempotencyReservationAllowed: false,
    evidencePersistenceAllowed: false,
    allPersistenceAttemptsBlocked: true,
    wouldPersistEvidence: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKey: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteIdempotencyRows: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    blockedCodes: gate?.blockedCodes ?? payload.blockedCodes,
    checks: gate?.checks ?? payload.sharedChecks,
  };
}
