import "server-only";

import { buildWriterPersistenceDryRunGate } from "@/lib/server-writers/persistence-dry-run";
import { buildWriterRollbackModel } from "@/lib/server-writers/rollback";
import { buildWriterRolloutChecklist } from "@/lib/server-writers/rollout";
import type { WriterRollbackStrategy } from "@/types/system-writer-rollback";
import type {
  WriterPersistenceAdapterCheck,
  WriterPersistenceAdapterDesignPayload,
  WriterPersistenceAdapterDesignProbeResult,
  WriterPersistenceAdapterFailureMode,
  WriterPersistenceAdapterMethod,
  WriterPersistenceAdapterMethodId,
  WriterPersistenceAdapterPhase,
} from "@/types/writer-persistence-adapter-design";

const methodIds: WriterPersistenceAdapterMethodId[] = [
  "start_persistence_attempt",
  "reserve_idempotency_key",
  "append_audit_attempt",
  "commit_future_writer_result",
  "finalize_idempotency_result",
  "record_compensation_required",
];

const baseBlockedCodes = [
  "adapter_design_only",
  "schema_not_verified",
  "manual_database_evidence_required",
  "persistence_dry_run_still_blocked",
  "service_role_client_forbidden",
  "transaction_not_implemented",
  "rollout_approval_missing",
];

function check(
  input: WriterPersistenceAdapterCheck,
): WriterPersistenceAdapterCheck {
  return input;
}

function isMethodId(value: unknown): value is WriterPersistenceAdapterMethodId {
  return methodIds.includes(value as WriterPersistenceAdapterMethodId);
}

function sharedChecks(input: {
  dryRunAllBlocked: boolean;
  dryRunWouldWriteRows: boolean;
  rolloutApproved: boolean;
  rolloutAllRequiredGatesPassed: boolean;
}) {
  return [
    check({
      id: "source_persistence_gate_still_blocked",
      category: "source_gate",
      title: "Persistence dry-run gate is still blocked",
      status:
        input.dryRunAllBlocked && !input.dryRunWouldWriteRows
          ? "passed"
          : "blocked",
      blocking: true,
      detail:
        "The adapter design consumes the previous dry-run gate as a blocker source and does not override it.",
      evidenceRequired:
        "Persistence dry-run payload keeps allPersistenceAttemptsBlocked=true and wouldWriteRows=false.",
    }),
    check({
      id: "schema_verification_missing",
      category: "schema",
      title: "Schema verification is still missing",
      status: "manual_required",
      blocking: true,
      detail:
        "The future writer_audit_events and writer_idempotency_keys tables are not verified by privileged manual evidence.",
      evidenceRequired:
        "Manual database evidence must prove table presence, RLS, policy absence, and zero rows before implementation.",
    }),
    check({
      id: "transaction_order_documented_only",
      category: "transaction_order",
      title: "Transaction order is documented only",
      status: "blocked",
      blocking: true,
      detail:
        "The transaction sequence is specified for future implementation, but no transaction, insert, update, upsert, or delete exists now.",
      evidenceRequired:
        "A later implementation review must map this design to exact server-only code and database behavior.",
    }),
    check({
      id: "service_role_factory_absent",
      category: "service_role",
      title: "Service-role factory is absent",
      status: "passed",
      blocking: true,
      detail:
        "This stage does not add a service-role Supabase client factory and does not read privileged secrets.",
      evidenceRequired:
        "No service-role factory file, no secret read, and no privileged client creation are introduced.",
    }),
    check({
      id: "rollout_not_approved",
      category: "release_approval",
      title: "Rollout is not approved",
      status:
        !input.rolloutApproved && !input.rolloutAllRequiredGatesPassed
          ? "blocked"
          : "manual_required",
      blocking: true,
      detail:
        "Production rollout remains unapproved, so the adapter design cannot become executable.",
      evidenceRequired:
        "Future rollout payload must approve the exact writer, environment, canary order, abort conditions, and rollback plan.",
    }),
  ];
}

function methodChecks(methodId: WriterPersistenceAdapterMethodId) {
  const checks: WriterPersistenceAdapterCheck[] = [
    check({
      id: `${methodId}_design_only`,
      category: "implementation_gap",
      title: "Method is design-only",
      status: "blocked",
      blocking: true,
      detail:
        "The method shape is documented for future implementation, but it cannot be called as a real persistence adapter.",
      evidenceRequired:
        "A future reviewed implementation must provide server-only code, isolated credentials, tests, and rollout approval.",
    }),
    check({
      id: `${methodId}_service_role_blocked`,
      category: "service_role",
      title: "Service-role access remains blocked",
      status: "passed",
      blocking: true,
      detail:
        "The method does not create a privileged client or read service-role secret values in this stage.",
      evidenceRequired:
        "All service-role and secret-read flags remain false in the API response.",
    }),
    check({
      id: `${methodId}_no_runtime_effects`,
      category: "transaction_order",
      title: "No runtime effects",
      status: "passed",
      blocking: true,
      detail:
        "The method does not persist evidence, write audit rows, reserve idempotency keys, mutate registry rows, or write compensation rows.",
      evidenceRequired:
        "All write, reserve, persist, AI, Stripe, and report-unlock flags remain false.",
    }),
  ];

  if (
    methodId === "reserve_idempotency_key" ||
    methodId === "finalize_idempotency_result"
  ) {
    checks.push(
      check({
        id: `${methodId}_idempotency_atomicity_required`,
        category: "idempotency",
        title: "Idempotency atomicity required",
        status: "manual_required",
        blocking: true,
        detail:
          "Future implementation must make reservation, replay, conflict, and finalize behavior atomic.",
        evidenceRequired:
          "Database uniqueness, transaction boundary, and conflict tests must be approved before this method can run.",
      }),
    );
  }

  if (
    methodId === "append_audit_attempt" ||
    methodId === "finalize_idempotency_result" ||
    methodId === "record_compensation_required"
  ) {
    checks.push(
      check({
        id: `${methodId}_append_only_audit_required`,
        category: "audit",
        title: "Append-only audit required",
        status: "manual_required",
        blocking: true,
        detail:
          "Future implementation must append audit evidence without storing raw payloads, secrets, prompts, or provider responses.",
        evidenceRequired:
          "Audit field mapping, redaction proof, and failure-path audit tests must be approved before this method can run.",
      }),
    );
  }

  if (methodId === "record_compensation_required") {
    checks.push(
      check({
        id: `${methodId}_rollback_review_required`,
        category: "rollback",
        title: "Rollback review required",
        status: "manual_required",
        blocking: true,
        detail:
          "Future compensation handling must preserve generated, payment, consent, audit, and idempotency history.",
        evidenceRequired:
          "Operator review and data-preserving compensation rules must be mapped to exact writer failure modes.",
      }),
    );
  }

  return checks;
}

function method(input: Omit<WriterPersistenceAdapterMethod, "canRunNow" | "wouldImportRealWriterImplementation" | "wouldCreateServiceRoleClient" | "wouldReadServiceRoleSecret" | "wouldPersistEvidence" | "wouldWriteRows" | "wouldWriteAuditRows" | "wouldReserveIdempotencyKeys" | "wouldWriteIdempotencyRows" | "wouldWriteCompensationRows" | "wouldCallAi" | "wouldCallStripe" | "wouldUnlockReports" | "checks">): WriterPersistenceAdapterMethod {
  return {
    ...input,
    canRunNow: false,
    wouldImportRealWriterImplementation: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldPersistEvidence: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteIdempotencyRows: false,
    wouldWriteCompensationRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    checks: methodChecks(input.id),
  };
}

function buildMethods(): WriterPersistenceAdapterMethod[] {
  return [
    method({
      id: "start_persistence_attempt",
      title: "Start persistence attempt",
      purpose:
        "Validate trusted server context, writer contract id, request hash, idempotency key template, and redacted evidence refs before any future persistence work begins.",
      futureOwnerModule: "src/lib/server-writers/persistence-adapter.server.ts",
      futureInputRefs: [
        "contractId",
        "trustedActorContext",
        "requestHash",
        "idempotencyKey",
        "redactedEvidenceRef",
        "sourceDryRunDecision",
      ],
      futureOutputRefs: ["attemptRef", "blockedCodes", "normalizedRequestRef"],
      futureTableNames: [],
      transactionBoundary:
        "Pre-transaction validation only; it must not write until schema, idempotency, and audit preconditions pass.",
      rollbackBehavior:
        "Return a blocked decision before side effects. No compensation is needed because no row can exist.",
      failureModes: ["schema_not_verified", "rollout_not_approved"],
    }),
    method({
      id: "reserve_idempotency_key",
      title: "Reserve idempotency key",
      purpose:
        "Future atomic reservation of a logical operation key before any service-owned writer result is committed.",
      futureOwnerModule: "src/lib/server-writers/persistence-adapter.server.ts",
      futureInputRefs: [
        "contractId",
        "idempotencyKey",
        "requestHash",
        "scope",
        "lockWindow",
      ],
      futureOutputRefs: ["reservationRef", "replayResultRef", "conflictDecision"],
      futureTableNames: ["writer_idempotency_keys"],
      transactionBoundary:
        "Must run in the same database transaction or equivalent atomic unit that prevents duplicate keys and conflicting request hashes.",
      rollbackBehavior:
        "If reservation fails, append no writer result; if later work fails, finalize the key as failed or conflict_detected in the reviewed future implementation.",
      failureModes: [
        "duplicate_request",
        "conflicting_request",
        "idempotency_reservation_failed",
      ],
    }),
    method({
      id: "append_audit_attempt",
      title: "Append audit attempt",
      purpose:
        "Future append-only audit event for attempt_received, gate_blocked, adapter_probe, or write_failed before/around writer execution.",
      futureOwnerModule: "src/lib/server-writers/persistence-adapter.server.ts",
      futureInputRefs: [
        "contractId",
        "lifecycle",
        "requestHash",
        "idempotencyKey",
        "redactedEvidenceRef",
        "blockedCodes",
      ],
      futureOutputRefs: ["auditEventId"],
      futureTableNames: ["writer_audit_events"],
      transactionBoundary:
        "Audit attempt should be appended before high-impact writer body execution where possible; failure to append must block the writer.",
      rollbackBehavior:
        "Audit events are append-only. Later failures require an additional failure or compensation audit event, never mutation of the original audit row.",
      failureModes: ["audit_append_failed"],
    }),
    method({
      id: "commit_future_writer_result",
      title: "Commit future writer result",
      purpose:
        "Placeholder boundary for future service-owned artifact, payment, consent, or report write after idempotency and audit preconditions pass.",
      futureOwnerModule: "src/lib/server-writers/<contract>.server.ts",
      futureInputRefs: [
        "reservationRef",
        "auditEventId",
        "validatedWriterPayload",
        "safetyDecision",
        "entitlementDecision",
      ],
      futureOutputRefs: ["writerResultRef", "resultVersionRef"],
      futureTableNames: ["contract_target_tables"],
      transactionBoundary:
        "Future writer body must be coordinated with idempotency and audit. For high-impact flows, result commit and finalize behavior must be atomic or compensatable.",
      rollbackBehavior:
        "Generated artifacts are superseded or invalidated by version; payment and consent history are compensated through append-only events.",
      failureModes: ["future_writer_failed", "compensation_required"],
    }),
    method({
      id: "finalize_idempotency_result",
      title: "Finalize idempotency result",
      purpose:
        "Future transition from reserved to completed, failed, expired, or conflict_detected after writer outcome is known.",
      futureOwnerModule: "src/lib/server-writers/persistence-adapter.server.ts",
      futureInputRefs: [
        "reservationRef",
        "requestHash",
        "writerResultRef",
        "auditEventId",
        "finalStatus",
      ],
      futureOutputRefs: ["idempotencyResultRef", "replayableResultRef"],
      futureTableNames: ["writer_idempotency_keys", "writer_audit_events"],
      transactionBoundary:
        "Finalize must be tied to audit result append. A completed result must be replayable; a conflict must never write the target artifact.",
      rollbackBehavior:
        "If finalize fails after a writer result, future implementation must append a failure audit and route to compensation review.",
      failureModes: [
        "audit_append_failed",
        "idempotency_reservation_failed",
        "compensation_required",
      ],
    }),
    method({
      id: "record_compensation_required",
      title: "Record compensation required",
      purpose:
        "Future handoff when a writer result must be superseded, invalidated, refunded, revoked, or manually reviewed.",
      futureOwnerModule: "src/lib/server-writers/rollback.server.ts",
      futureInputRefs: [
        "contractId",
        "originalResultRef",
        "trigger",
        "idempotencyKey",
        "auditEventId",
        "operatorReviewRef",
      ],
      futureOutputRefs: ["compensationRef", "operatorReviewQueueRef"],
      futureTableNames: ["writer_compensation_events", "writer_audit_events"],
      transactionBoundary:
        "Compensation record creation must preserve original history and append a new audit event; it must not delete payment, consent, audit, or idempotency history.",
      rollbackBehavior:
        "Compensation is the rollback behavior. Destructive rollback remains forbidden after any production writer has written rows.",
      failureModes: ["compensation_required", "audit_append_failed"],
    }),
  ];
}

function phase(input: Omit<WriterPersistenceAdapterPhase, "canBeSkipped" | "currentStatus">): WriterPersistenceAdapterPhase {
  return {
    ...input,
    canBeSkipped: false,
    currentStatus: "design_only_blocked",
  };
}

function buildPhases(): WriterPersistenceAdapterPhase[] {
  return [
    phase({
      id: "preflight",
      order: 1,
      title: "Preflight validation",
      purpose:
        "Confirm trusted server context, contract allowlist, schema evidence, dry-run gate result, requestHash, and redacted evidence refs.",
      futureAtomicityRule:
        "No database write may begin until every preflight gate passes.",
      blockedBy: ["schema_not_verified", "rollout_approval_missing"],
    }),
    phase({
      id: "idempotency_reservation",
      order: 2,
      title: "Reserve idempotency key",
      purpose:
        "Create or reuse the logical operation key before any target writer row is created.",
      futureAtomicityRule:
        "Unique key plus requestHash comparison must be atomic. Same key/different hash is a conflict and must not write.",
      blockedBy: ["idempotency_persistence_not_implemented"],
    }),
    phase({
      id: "audit_attempt",
      order: 3,
      title: "Append attempt audit",
      purpose:
        "Append attempt, blocked, or adapter-probe audit evidence using hash/ref metadata only.",
      futureAtomicityRule:
        "Failure to append required audit evidence blocks high-impact writer execution.",
      blockedBy: ["audit_persistence_not_implemented"],
    }),
    phase({
      id: "future_writer_body",
      order: 4,
      title: "Run future writer body",
      purpose:
        "Execute the future service-owned writer result after idempotency and audit gates pass.",
      futureAtomicityRule:
        "Writer result must be committed with replayable idempotency state or compensatable failure evidence.",
      blockedBy: ["real_writer_implementation_missing"],
    }),
    phase({
      id: "audit_result",
      order: 5,
      title: "Append result audit",
      purpose:
        "Append success, failure, conflict, or rollback-required audit evidence after writer outcome.",
      futureAtomicityRule:
        "Result audit must not mutate prior audit rows; it appends a new lifecycle event.",
      blockedBy: ["audit_persistence_not_implemented"],
    }),
    phase({
      id: "idempotency_finalize",
      order: 6,
      title: "Finalize idempotency state",
      purpose:
        "Mark reservation completed, failed, expired, or conflict_detected with result references.",
      futureAtomicityRule:
        "Completed state must point to replayable resultRef. Failed/conflict states must not create duplicate target rows.",
      blockedBy: ["idempotency_persistence_not_implemented"],
    }),
    phase({
      id: "compensation_handoff",
      order: 7,
      title: "Compensation handoff",
      purpose:
        "Route failed or unsafe outcomes into data-preserving rollback/compensation review.",
      futureAtomicityRule:
        "Compensation must append history and preserve payment, consent, audit, and idempotency records.",
      blockedBy: ["rollback_compensation_not_implemented"],
    }),
  ];
}

function failureMode(input: WriterPersistenceAdapterFailureMode): WriterPersistenceAdapterFailureMode {
  return input;
}

function rollbackStrategyFor(
  strategy: WriterRollbackStrategy | undefined,
): WriterRollbackStrategy | undefined {
  return strategy;
}

function buildFailureModes(
  firstRollbackStrategy: WriterRollbackStrategy | undefined,
): WriterPersistenceAdapterFailureMode[] {
  return [
    failureMode({
      id: "schema_not_verified",
      title: "Schema not verified",
      trigger:
        "Manual database evidence for writer_audit_events or writer_idempotency_keys is missing or contradictory.",
      requiredResponse:
        "Block before any adapter method can run and return manual verification requirements.",
      auditRequirement:
        "No audit row is written in this stage; future implementation may append gate_blocked only after audit persistence is approved.",
      idempotencyRequirement:
        "No key is reserved because schema readiness is not proven.",
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
    failureMode({
      id: "duplicate_request",
      title: "Duplicate request",
      trigger:
        "Same contractId and idempotencyKey arrive with the same requestHash.",
      requiredResponse:
        "Future adapter should return existing resultRef or pending status without writing the target artifact twice.",
      auditRequirement:
        "Append replay audit evidence without copying raw payload.",
      idempotencyRequirement:
        "Return the existing reservation/completed state.",
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
    failureMode({
      id: "conflicting_request",
      title: "Conflicting request",
      trigger:
        "Same idempotencyKey arrives with a different requestHash.",
      requiredResponse:
        "Reject before target writer execution and mark conflict_detected in the future registry.",
      auditRequirement:
        "Append conflict audit evidence with blockedCodes and requestHash only.",
      idempotencyRequirement:
        "Do not overwrite the original key or resultRef.",
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
    failureMode({
      id: "idempotency_reservation_failed",
      title: "Idempotency reservation failed",
      trigger:
        "Future reservation transaction cannot insert, lock, or compare the key safely.",
      requiredResponse:
        "Abort before writer result creation.",
      auditRequirement:
        "Append failure audit only after audit persistence is reviewed.",
      idempotencyRequirement:
        "No target writer row may exist without a successful reservation.",
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
    failureMode({
      id: "audit_append_failed",
      title: "Audit append failed",
      trigger:
        "Future audit event cannot be appended for attempt, success, failure, or compensation.",
      requiredResponse:
        "Block high-impact writer execution or route to compensation review if the writer result already exists.",
      auditRequirement:
        "Audit failure itself must be observable through operator logs without exposing secrets.",
      idempotencyRequirement:
        "Finalize key as failed only if doing so preserves replay and conflict semantics.",
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
    failureMode({
      id: "future_writer_failed",
      title: "Future writer failed",
      trigger:
        "Generated artifact, payment, consent, report, or event writer fails after reservation/attempt evidence.",
      requiredResponse:
        "Append failure evidence and finalize idempotency as failed; do not silently retry with a different requestHash.",
      auditRequirement:
        "Append write_failed with target tables, blocked codes, and result refs only.",
      idempotencyRequirement:
        "Record failed status or release retry according to the reviewed lock window.",
      rollbackStrategy: rollbackStrategyFor(firstRollbackStrategy),
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
    failureMode({
      id: "compensation_required",
      title: "Compensation required",
      trigger:
        "A writer result exists but later safety, duplicate, refund, consent, or operator review requires correction.",
      requiredResponse:
        "Append data-preserving compensation; never delete payment, consent, audit, or idempotency history.",
      auditRequirement:
        "Append rollback_recorded or compensation_required evidence.",
      idempotencyRequirement:
        "Use the original or compensation key to prevent duplicate compensation actions.",
      rollbackStrategy: rollbackStrategyFor(firstRollbackStrategy),
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
    failureMode({
      id: "rollout_not_approved",
      title: "Rollout not approved",
      trigger:
        "The exact writer, audience, flags, canary order, or abort conditions lack operator approval.",
      requiredResponse:
        "Block before any executable adapter path is available.",
      auditRequirement:
        "No production audit row is written by this design-only stage.",
      idempotencyRequirement:
        "No production idempotency key is reserved by this design-only stage.",
      currentStatus: "documented_only",
      wouldWriteRows: false,
    }),
  ];
}

export async function buildWriterPersistenceAdapterDesign(): Promise<WriterPersistenceAdapterDesignPayload> {
  const dryRun = await buildWriterPersistenceDryRunGate();
  const rollout = buildWriterRolloutChecklist();
  const rollback = buildWriterRollbackModel();
  const methods = buildMethods();
  const phases = buildPhases();
  const firstRollbackStrategy = rollback.contracts[0]?.strategy;
  const failureModes = buildFailureModes(firstRollbackStrategy);
  const contractReadiness = rollout.contractPlans.map((plan) => ({
    contractId: plan.contractId,
    rolloutReadiness: plan.readiness,
    firstAllowedAudience: plan.firstAllowedAudience,
    targetTables: plan.targetTables,
    requiredBeforeLaunch: plan.requiredBeforeLaunch,
    blockedBy: plan.blockedBy,
    adapterDesignCovered: true as const,
    adapterImplementationAllowed: false as const,
  }));

  return {
    safeMode: true,
    readOnly: true,
    designMode: "persistence_adapter_design_only",
    sourceDryRunGateMode: dryRun.gateMode,
    sourceVerificationMode: dryRun.sourceVerificationMode,
    sourceAllPersistenceAttemptsBlocked: true,
    sourceRolloutApprovedForProduction: false,
    sourceRolloutAllRequiredGatesPassed: false,
    checkedAt: new Date().toISOString(),
    methodCount: methods.length,
    phaseCount: phases.length,
    failureModeCount: failureModes.length,
    contractReadinessCount: contractReadiness.length,
    schemaVerified: false,
    readyForWriterImplementation: false,
    manualDatabaseCheckRequired: true,
    adapterImplemented: false,
    adapterCanRun: false,
    transactionImplementationAllowed: false,
    allRuntimeEffectsBlocked: true,
    wouldImportRealWriterImplementation: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldPersistEvidence: false,
    wouldStoreRawPayload: false,
    wouldStoreSecrets: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteIdempotencyRows: false,
    wouldWriteCompensationRows: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldEnableWriters: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    blockedCodes: baseBlockedCodes,
    globalRules: [
      "This stage designs the future persistence adapter only; it does not implement or call it.",
      "The adapter must reserve idempotency before target writer writes and append audit evidence around attempts, results, failures, and compensation.",
      "A completed idempotency key must be replayable; a conflicting requestHash must be rejected before target writes.",
      "Audit events must store hashes and references only, never raw payloads, prompts, model responses, Stripe payloads, tokens, API keys, or service-role values.",
      "Rollback must preserve generated, payment, consent, audit, and idempotency history through append-only compensation or version supersession.",
      "No service-role client, secret read, transaction, database write, migration application, AI call, Stripe call, payment entitlement, or report unlock is allowed in this stage.",
    ],
    sharedChecks: sharedChecks({
      dryRunAllBlocked: dryRun.allPersistenceAttemptsBlocked,
      dryRunWouldWriteRows: dryRun.wouldWriteRows,
      rolloutApproved: rollout.approvedForProduction,
      rolloutAllRequiredGatesPassed: rollout.allRequiredGatesPassed,
    }),
    methods,
    phases,
    failureModes,
    contractReadiness,
  };
}

export async function probeWriterPersistenceAdapterDesign(
  requestBody: unknown,
): Promise<WriterPersistenceAdapterDesignProbeResult> {
  const payload = await buildWriterPersistenceAdapterDesign();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      designMode: payload.designMode,
      summary:
        "Persistence adapter design probe blocked: request body must be a JSON object and no adapter method was executed.",
      schemaVerified: false,
      readyForWriterImplementation: false,
      adapterImplemented: false,
      adapterCanRun: false,
      transactionImplementationAllowed: false,
      allRuntimeEffectsBlocked: true,
      wouldImportRealWriterImplementation: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldPersistEvidence: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldWriteIdempotencyRows: false,
      wouldWriteCompensationRows: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldEnableWriters: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      wouldUnlockReports: false,
      blockedCodes: payload.blockedCodes,
      checks: payload.sharedChecks,
    };
  }

  const methodId = (requestBody as { methodId?: unknown }).methodId;

  if (!isMethodId(methodId)) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      designMode: payload.designMode,
      summary:
        "Persistence adapter design probe blocked: unknown method id and no adapter method was executed.",
      schemaVerified: false,
      readyForWriterImplementation: false,
      adapterImplemented: false,
      adapterCanRun: false,
      transactionImplementationAllowed: false,
      allRuntimeEffectsBlocked: true,
      wouldImportRealWriterImplementation: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldPersistEvidence: false,
      wouldWriteRows: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKeys: false,
      wouldWriteIdempotencyRows: false,
      wouldWriteCompensationRows: false,
      wouldApplyMigration: false,
      wouldCreateTables: false,
      wouldEnableWriters: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      wouldUnlockReports: false,
      blockedCodes: payload.blockedCodes,
      checks: payload.sharedChecks,
    };
  }

  const selectedMethod = payload.methods.find(
    (candidate) => candidate.id === methodId,
  );

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    designMode: payload.designMode,
    methodId,
    methodTitle: selectedMethod?.title,
    summary:
      "Persistence adapter design probe blocked as designed: the method shape, transaction boundary, and failure requirements were returned, but no service-role client, transaction, audit row, idempotency key, evidence record, compensation row, AI call, Stripe call, or report unlock was attempted.",
    schemaVerified: false,
    readyForWriterImplementation: false,
    adapterImplemented: false,
    adapterCanRun: false,
    transactionImplementationAllowed: false,
    allRuntimeEffectsBlocked: true,
    wouldImportRealWriterImplementation: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldPersistEvidence: false,
    wouldWriteRows: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteIdempotencyRows: false,
    wouldWriteCompensationRows: false,
    wouldApplyMigration: false,
    wouldCreateTables: false,
    wouldEnableWriters: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    blockedCodes: payload.blockedCodes,
    checks: selectedMethod?.checks ?? payload.sharedChecks,
  };
}
