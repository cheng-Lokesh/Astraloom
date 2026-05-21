import "server-only";

import { buildWriterPersistenceApprovalPacket } from "@/lib/server-writers/persistence-approval-packet";
import type {
  WriterPersistenceBranchPreflightCheck,
  WriterPersistenceBranchPreflightPayload,
  WriterPersistenceBranchPreflightProbeResult,
  WriterPersistenceBranchPreflightStatus,
} from "@/types/writer-persistence-branch-preflight";

const blockedCodes = [
  "branch_preflight_checklist_only",
  "approval_packet_not_accepted",
  "owner_approval_incomplete",
  "git_command_forbidden",
  "branch_creation_forbidden",
  "pull_request_forbidden",
  "file_modification_forbidden",
  "implementation_plan_forbidden",
  "adapter_code_forbidden",
  "service_role_client_forbidden",
  "transaction_forbidden",
  "database_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldRunGitCommand: false,
  wouldCreateBranch: false,
  wouldCheckoutBranch: false,
  wouldCreatePullRequest: false,
  wouldModifyFiles: false,
  wouldRecordOwnerApproval: false,
  wouldGrantImplementationApproval: false,
  wouldCreateApprovalRecord: false,
  wouldCreateTestFiles: false,
  wouldRunAutomatedTests: false,
  wouldCreateImplementationPlan: false,
  wouldCreateImplementationBranch: false,
  wouldCreateAdapterCode: false,
  wouldImportRealWriterImplementation: false,
  wouldRunTransaction: false,
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
  wouldCreateMigrationFile: false,
  wouldApplyMigration: false,
  wouldCreateTables: false,
  wouldEnableWriters: false,
  wouldCallAi: false,
  wouldCallStripe: false,
  wouldUnlockReports: false,
} as const;

function check(
  input: WriterPersistenceBranchPreflightCheck,
): WriterPersistenceBranchPreflightCheck {
  return input;
}

function buildChecks(): WriterPersistenceBranchPreflightCheck[] {
  return [
    check({
      id: "approval_packet_route_invariant_preflight",
      category: "source_packet_invariant",
      title: "Approval packet route invariant preflight",
      status: "blocked_by_approval",
      owner: "founder",
      intent:
        "Lock the approval packet as the source of truth for any later implementation branch without accepting it in this stage.",
      sourceApprovalItemIds: [
        "founder_scope_lock_approval",
        "final_implementation_no_go_approval",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-approval-packet.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      allowedFutureFiles: [
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      forbiddenFutureFiles: [
        "src/lib/server-writers/persistence-adapter.server.ts",
        "src/lib/server-writers/service-role-client.server.ts",
        "supabase/migrations/*.sql",
      ],
      localCommands: [
        "GET /api/system-writers/persistence-approval",
        "GET /api/system-writers/persistence-branch-preflight",
      ],
      rollbackCheckpoints: [
        "Abort any later branch handoff if the approval packet is missing owner-specific unresolved decisions.",
      ],
      handoffRules: [
        "Founder must confirm the packet still excludes AI, Stripe, report unlock, and product-generation scope.",
        "No check on this page is an approval record.",
      ],
      preflightQuestions: [
        "Does the approval packet still report implementation approval as false?",
        "Does the branch preflight still report branch creation approval as false?",
      ],
      blockingConditions: [
        "The source approval packet is accepted by code instead of by a future human handoff.",
        "Any runtime flag implies branch creation or implementation has started.",
      ],
      nonExecutionClauses: [
        "This check does not accept the approval packet.",
        "This check does not create approval records.",
      ],
    }),
    check({
      id: "allowed_file_scope_preflight",
      category: "allowed_files",
      title: "Allowed file scope preflight",
      status: "manual_required",
      owner: "backend",
      intent:
        "Name the narrow future files a later branch may touch if owners approve implementation.",
      sourceApprovalItemIds: [
        "backend_branch_scope_approval",
        "backend_idempotency_transaction_approval",
        "security_audit_redaction_approval",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-proposal-scaffold.md",
        "docs/writer-persistence-adapter-design.md",
      ],
      allowedFutureFiles: [
        "src/lib/server-writers/persistence-adapter.types.ts",
        "src/lib/server-writers/persistence-adapter.server.ts",
        "src/lib/server-writers/persistence-audit.server.ts",
        "src/lib/server-writers/persistence-idempotency.server.ts",
        "src/lib/server-writers/persistence-compensation.server.ts",
        "src/lib/server-writers/persistence-adapter.test.ts",
        "src/lib/server-writers/persistence-server-boundary.test.ts",
      ],
      forbiddenFutureFiles: [
        "src/app/billing/**",
        "src/app/reports/**",
        "src/app/sync/**",
        "src/lib/ai/**",
        "src/lib/stripe/**",
        "supabase/migrations/*.sql",
      ],
      localCommands: [
        "Future branch diff review against the allowed file list",
        "Future server-only import boundary check",
      ],
      rollbackCheckpoints: [
        "Stop the future branch if implementation touches files outside the owner-approved list.",
      ],
      handoffRules: [
        "Backend owner must sign off on each runtime file before code is written.",
        "Security owner must sign off before any server-only module can be imported by runtime code.",
      ],
      preflightQuestions: [
        "Is every future runtime file server-only or type-only?",
        "Are tests separated from implementation files?",
      ],
      blockingConditions: [
        "The allowed list includes payment, report, AI, sync, or SQL files.",
        "The allowed list includes a privileged client factory without separate approval.",
      ],
      nonExecutionClauses: [
        "This check does not create the listed files.",
        "This check does not modify implementation code.",
      ],
    }),
    check({
      id: "forbidden_file_scope_preflight",
      category: "forbidden_files",
      title: "Forbidden file scope preflight",
      status: "preflight_ready",
      owner: "security",
      intent:
        "Keep high-risk client, payment, report, AI, environment, and migration files outside the first implementation branch.",
      sourceApprovalItemIds: [
        "security_service_role_boundary_approval",
        "backend_migration_boundary_approval",
        "operator_rollout_observability_approval",
      ],
      sourceRefs: [
        "docs/disabled-service-role-adapter.md",
        "docs/writer-migration-review-checklist.md",
        "docs/writer-rollout-checklist.md",
      ],
      allowedFutureFiles: [
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      forbiddenFutureFiles: [
        ".env*",
        "supabase/migrations/*.sql",
        "src/app/billing/**",
        "src/app/reports/**",
        "src/lib/ai/**",
        "src/lib/stripe/**",
        "src/lib/supabase/client.ts",
        "src/components/language-provider.tsx",
      ],
      localCommands: [
        "Future diff must contain no forbidden file pattern.",
        "Future diff must contain no client bundle import of server-only persistence code.",
      ],
      rollbackCheckpoints: [
        "Split the work into a separate reviewed path if any forbidden file becomes necessary.",
      ],
      handoffRules: [
        "Security owns exceptions for secrets and browser boundaries.",
        "Founder owns exceptions for report unlock, payment, and AI scope.",
      ],
      preflightQuestions: [
        "Does the future file list avoid all forbidden patterns?",
        "Does the future file list avoid language, billing, report, AI, Stripe, and SQL surfaces?",
      ],
      blockingConditions: [
        "A forbidden file appears in the future branch plan.",
        "A future branch requires editing environment files or migration files.",
      ],
      nonExecutionClauses: [
        "This check does not inspect secrets.",
        "This check does not create a branch diff.",
      ],
    }),
    check({
      id: "local_command_preflight",
      category: "local_commands",
      title: "Local command preflight",
      status: "manual_required",
      owner: "qa",
      intent:
        "Define safe future verification commands while keeping this route from running tests or git commands.",
      sourceApprovalItemIds: ["qa_acceptance_evidence_approval"],
      sourceRefs: [
        "docs/mvp-qa-environment.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      allowedFutureFiles: [
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      forbiddenFutureFiles: [
        "package.json test script changes without owner approval",
        "supabase/migrations/*.sql",
      ],
      localCommands: [
        "npm run lint",
        "npm run build",
        "GET /api/system-writers/persistence-branch-preflight",
        "POST /api/system-writers/persistence-branch-preflight with checkId only",
        "Route health check for all read-only writer pages and APIs",
      ],
      rollbackCheckpoints: [
        "Remove any future command that requires production credentials or database mutation.",
      ],
      handoffRules: [
        "QA must verify command output includes no secret-like values.",
        "QA must verify probes are blocked and dangerous flags remain false.",
      ],
      preflightQuestions: [
        "Can the future commands run locally without production credentials?",
        "Do the future commands avoid migration application and row writes?",
      ],
      blockingConditions: [
        "A future command applies SQL.",
        "A future command writes rows or reserves keys.",
        "A future command requires privileged production credentials.",
      ],
      nonExecutionClauses: [
        "This check lists commands only.",
        "This check does not create or run automated test files.",
      ],
    }),
    check({
      id: "security_boundary_preflight",
      category: "security_boundary",
      title: "Security boundary preflight",
      status: "blocked_by_approval",
      owner: "security",
      intent:
        "Keep privileged secrets, browser serialization, raw payloads, and server-only imports blocked until security approval exists.",
      sourceApprovalItemIds: [
        "security_service_role_boundary_approval",
        "security_audit_redaction_approval",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/request-hashing-redaction-fixtures.md",
      ],
      allowedFutureFiles: [
        "src/lib/server-writers/persistence-server-boundary.test.ts",
        "src/lib/server-writers/persistence-audit.server.ts",
      ],
      forbiddenFutureFiles: [
        ".env*",
        "src/lib/supabase/client.ts",
        "src/app/**/page.tsx importing persistence server modules",
      ],
      localCommands: [
        "Future response scan for secret-like values and auth token markers",
        "Future client bundle check for server-only persistence modules",
      ],
      rollbackCheckpoints: [
        "Stop implementation if privileged values appear in HTML, JSON, logs, or test output.",
      ],
      handoffRules: [
        "Security must approve redaction fixtures before audit persistence can be implemented.",
        "Security must approve any privileged boundary before runtime imports are allowed.",
      ],
      preflightQuestions: [
        "Can privileged code enter the browser bundle?",
        "Can API JSON serialize raw payloads or secret-like material?",
      ],
      blockingConditions: [
        "A privileged client factory is created in this stage.",
        "A route reads privileged environment values in this stage.",
        "Raw source payload storage is introduced.",
      ],
      nonExecutionClauses: [
        "This check does not create a privileged client.",
        "This check does not read privileged environment values.",
        "This check does not persist evidence.",
      ],
    }),
    check({
      id: "qa_test_preflight",
      category: "test_preflight",
      title: "QA test preflight",
      status: "manual_required",
      owner: "qa",
      intent:
        "Map future test coverage to acceptance requirements without creating tests in this stage.",
      sourceApprovalItemIds: ["qa_acceptance_evidence_approval"],
      sourceRefs: [
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      allowedFutureFiles: [
        "src/lib/server-writers/persistence-adapter.test.ts",
        "src/lib/server-writers/persistence-server-boundary.test.ts",
      ],
      forbiddenFutureFiles: [
        "tests that require production credentials",
        "tests that write rows before adapter approval",
      ],
      localCommands: [
        "Future unit tests for phase order, idempotency replay, and audit redaction",
        "Future negative tests for client bundle leakage and dangerous flags",
      ],
      rollbackCheckpoints: [
        "Remove any future test that mutates remote state before implementation approval.",
      ],
      handoffRules: [
        "QA maps each future test to an acceptance matrix id.",
        "Backend reviews server-only test fixtures.",
      ],
      preflightQuestions: [
        "Does every future test trace to a matrix item?",
        "Do negative assertions fail if writes, branch creation, AI, Stripe, or report unlocks become true?",
      ],
      blockingConditions: [
        "Tests are created before owner approval.",
        "Tests require production credentials.",
        "Tests pass while dangerous flags are true.",
      ],
      nonExecutionClauses: [
        "This check does not create tests.",
        "This check does not run tests.",
      ],
    }),
    check({
      id: "migration_boundary_preflight",
      category: "migration_boundary",
      title: "Migration boundary preflight",
      status: "preflight_ready",
      owner: "backend",
      intent:
        "Keep SQL creation and migration application out of the first implementation branch.",
      sourceApprovalItemIds: ["backend_migration_boundary_approval"],
      sourceRefs: [
        "docs/writer-migration-review-checklist.md",
        "docs/writer-migration-application-runbook.md",
      ],
      allowedFutureFiles: [
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      forbiddenFutureFiles: [
        "supabase/migrations/*.sql",
        "src/app/api/supabase-setup/migration/**",
      ],
      localCommands: [
        "Migration directory contains only approved existing SQL.",
        "Future branch diff contains no SQL file creation.",
      ],
      rollbackCheckpoints: [
        "Return to migration review if implementation needs schema changes.",
      ],
      handoffRules: [
        "Backend owns any decision to split schema work into the existing migration path.",
        "Operator must review manual migration application separately.",
      ],
      preflightQuestions: [
        "Can the adapter implementation proceed against the current verified schema?",
        "If schema changes are needed, are they excluded from this branch?",
      ],
      blockingConditions: [
        "A new SQL file is included.",
        "A route applies migrations automatically.",
        "Schema verification mutates database state.",
      ],
      nonExecutionClauses: [
        "This check does not create migration files.",
        "This check does not apply SQL.",
      ],
    }),
    check({
      id: "rollback_checkpoint_preflight",
      category: "rollback_checkpoint",
      title: "Rollback checkpoint preflight",
      status: "manual_required",
      owner: "operator",
      intent:
        "Define future stop, revert, and compensation checkpoints without mutating history.",
      sourceApprovalItemIds: ["operator_rollback_compensation_approval"],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      allowedFutureFiles: [
        "docs/writer-persistence-implementation-branch-preflight.md",
        "docs/writer-persistence-compensation-approval.md",
      ],
      forbiddenFutureFiles: [
        "code that deletes audit, idempotency, payment, consent, or report history",
      ],
      localCommands: [
        "Future branch notes include rollback owner and abort criteria.",
        "Future branch notes include support-safe escalation copy.",
      ],
      rollbackCheckpoints: [
        "Stop implementation if compensation ownership is unclear.",
        "Stop implementation if rollback requires destructive deletion.",
      ],
      handoffRules: [
        "Operator owns compensation handoff and support escalation.",
        "Founder reviews any rollback behavior visible to users.",
      ],
      preflightQuestions: [
        "Which records are superseded instead of deleted?",
        "Who owns support escalation if an adapter write becomes ambiguous?",
      ],
      blockingConditions: [
        "Rollback deletes audit, payment, consent, or idempotency history.",
        "Compensation is automatic without operator review for ambiguous outcomes.",
      ],
      nonExecutionClauses: [
        "This check does not write compensation rows.",
        "This check does not mutate generated history.",
      ],
    }),
    check({
      id: "owner_handoff_preflight",
      category: "owner_handoff",
      title: "Owner handoff preflight",
      status: "manual_required",
      owner: "founder",
      intent:
        "Define the future handoff order among founder, backend, security, QA, and operator owners.",
      sourceApprovalItemIds: [
        "founder_scope_lock_approval",
        "final_implementation_no_go_approval",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-approval-packet.md",
        "docs/controlled-backend-writers.md",
      ],
      allowedFutureFiles: [
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      forbiddenFutureFiles: [
        "any implementation file before owner handoff completion",
      ],
      localCommands: [
        "Review this checklist and approval packet together.",
        "Confirm every owner-specific blocker remains visible.",
      ],
      rollbackCheckpoints: [
        "Abort future branch creation if an owner is skipped.",
      ],
      handoffRules: [
        "Founder confirms narrow infrastructure scope.",
        "Backend confirms exact file scope and phase order.",
        "Security confirms secret boundary and audit redaction.",
        "QA confirms verification commands and negative tests.",
        "Operator confirms rollback, compensation, rollout, and support owner.",
      ],
      preflightQuestions: [
        "Is every owner named with a concrete decision?",
        "Is any owner approval implied by code rather than recorded by a future approved mechanism?",
      ],
      blockingConditions: [
        "Any owner is missing.",
        "Any owner approval is implied by this route.",
      ],
      nonExecutionClauses: [
        "This check does not record owner approval.",
        "This check does not grant implementation approval.",
      ],
    }),
    check({
      id: "final_branch_no_go_preflight",
      category: "final_no_go",
      title: "Final branch no-go preflight",
      status: "blocked_by_approval",
      owner: "security",
      intent:
        "Keep branch creation blocked until approvals, evidence, commands, file scope, rollback, and handoff are complete.",
      sourceApprovalItemIds: ["final_implementation_no_go_approval"],
      sourceRefs: [
        "docs/writer-persistence-no-go-evidence-packet.md",
        "docs/writer-persistence-implementation-approval-packet.md",
      ],
      allowedFutureFiles: [
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      forbiddenFutureFiles: [
        "any file creation by this read-only stage",
        "any git branch creation by this read-only stage",
      ],
      localCommands: [
        "branchCreationApproved=false",
        "branchCreated=false",
        "wouldRunGitCommand=false",
        "wouldCreateBranch=false",
        "wouldCreateImplementationBranch=false",
        "wouldCreateAdapterCode=false",
        "wouldWriteRows=false",
      ],
      rollbackCheckpoints: [
        "Keep final no-go active until a later human-approved implementation handoff exists.",
      ],
      handoffRules: [
        "The next stage may define a patch review packet only.",
        "No future branch may start from this checklist alone.",
      ],
      preflightQuestions: [
        "Are all owner approvals complete?",
        "Are all blocking evidence packets complete?",
        "Are branch creation and implementation still false in the runtime payload?",
      ],
      blockingConditions: [
        "Any owner approval is incomplete.",
        "Any blocking evidence remains unresolved.",
        "Any runtime flag enables branch creation, implementation code, writes, SQL, AI, Stripe, or report unlocks.",
      ],
      nonExecutionClauses: [
        "This check does not create a branch.",
        "This check does not create a pull request.",
        "This check does not create implementation files.",
      ],
    }),
  ];
}

function countByStatus(
  checks: WriterPersistenceBranchPreflightCheck[],
  status: WriterPersistenceBranchPreflightStatus,
) {
  return checks.filter((currentCheck) => currentCheck.status === status).length;
}

function uniqueCount(
  checks: WriterPersistenceBranchPreflightCheck[],
  key:
    | "allowedFutureFiles"
    | "forbiddenFutureFiles"
    | "localCommands"
    | "rollbackCheckpoints"
    | "handoffRules",
) {
  return new Set(checks.flatMap((currentCheck) => currentCheck[key])).size;
}

function baseProbeFields(payload: WriterPersistenceBranchPreflightPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    branchPreflightMode: payload.branchPreflightMode,
    branchPreflightOnly: true as const,
    sourceApprovalPacketAccepted: false as const,
    implementationApprovalGranted: false as const,
    implementationBranchApproved: false as const,
    branchCreationApproved: false as const,
    branchCreated: false as const,
    implementationPlanApproved: false as const,
    readyToCreateImplementationBranch: false as const,
    readyForAdapterImplementation: false as const,
    schemaVerified: false as const,
    adapterImplemented: false as const,
    adapterImplementationApproved: false as const,
    adapterImplementationAllowed: false as const,
    implementationReviewComplete: false as const,
    allOwnerApprovalsComplete: false as const,
    allBlockingEvidenceReady: false as const,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
  };
}

export async function buildWriterPersistenceBranchPreflight(): Promise<WriterPersistenceBranchPreflightPayload> {
  const approvalPacket = await buildWriterPersistenceApprovalPacket();
  const checks = buildChecks();

  return {
    safeMode: true,
    readOnly: true,
    branchPreflightMode:
      "persistence_adapter_implementation_branch_preflight_checklist_only",
    sourceApprovalPacketMode: approvalPacket.approvalPacketMode,
    checkedAt: new Date().toISOString(),
    checkCount: checks.length,
    preflightReadyCount: countByStatus(checks, "preflight_ready"),
    blockedCheckCount: countByStatus(checks, "blocked_by_approval"),
    manualRequiredCheckCount: countByStatus(checks, "manual_required"),
    allowedFileRefCount: uniqueCount(checks, "allowedFutureFiles"),
    forbiddenFileRefCount: uniqueCount(checks, "forbiddenFutureFiles"),
    commandCount: uniqueCount(checks, "localCommands"),
    rollbackCheckpointCount: uniqueCount(checks, "rollbackCheckpoints"),
    handoffRuleCount: uniqueCount(checks, "handoffRules"),
    sourceApprovalItemCount: approvalPacket.approvalItemCount,
    sourceApprovalBlockedItemCount: approvalPacket.blockedItemCount,
    sourceApprovalManualRequiredItemCount:
      approvalPacket.manualRequiredItemCount,
    branchPreflightReady: true,
    branchPreflightOnly: true,
    sourceApprovalPacketReady: approvalPacket.approvalPacketReady,
    sourceApprovalPacketOnly: approvalPacket.approvalPacketOnly,
    sourceApprovalPacketAccepted: false,
    implementationApprovalGranted: false,
    implementationBranchApproved: false,
    branchCreationApproved: false,
    branchCreated: false,
    implementationPlanApproved: false,
    readyToCreateImplementationBranch: false,
    readyForAdapterImplementation: false,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allOwnerApprovalsComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    checklistRules: [
      "This endpoint is a read-only implementation branch preflight checklist, not a branch creator.",
      "It may name future branch prerequisites, allowed files, forbidden files, local command references, rollback checkpoints, and owner handoff rules.",
      "It must not run git, create branches, create pull requests, modify files, record approvals, create implementation plans, create adapter code, read privileged secrets, create service-role clients, run transactions, write rows, create migrations, call AI, call Stripe, or unlock reports.",
      "The source approval packet is not accepted, so every implementation and branch creation flag remains false.",
    ],
    branchCreationGates: [
      "The approval packet is accepted by founder, backend, security, QA, and operator through a future approved mechanism.",
      "Allowed and forbidden file scope is signed off before implementation code exists.",
      "Local commands are confirmed to be credential-free, non-mutating, and safe for local verification.",
      "Rollback checkpoints and owner handoff rules are explicit.",
      "A later task explicitly authorizes branch creation; this checklist alone never does.",
    ],
    checks,
  };
}

export async function probeWriterPersistenceBranchPreflight(
  requestBody: unknown,
): Promise<WriterPersistenceBranchPreflightProbeResult> {
  const payload = await buildWriterPersistenceBranchPreflight();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence branch preflight probe blocked: request body must be a JSON object and no git command, branch, file mutation, approval record, implementation plan, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      checks: payload.checks,
    };
  }

  const checkId = (requestBody as { checkId?: unknown }).checkId;

  if (typeof checkId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence branch preflight probe blocked: checkId must be a string and no git command, branch, file mutation, approval record, implementation plan, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      checks: payload.checks,
    };
  }

  const selectedCheck = payload.checks.find(
    (candidate) => candidate.id === checkId,
  );

  if (!selectedCheck) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence branch preflight probe blocked: unknown check id and no git command, branch, file mutation, approval record, implementation plan, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      checks: payload.checks,
    };
  }

  return {
    ...baseProbeFields(payload),
    checkId: selectedCheck.id,
    checkTitle: selectedCheck.title,
    checkStatus: selectedCheck.status,
    summary:
      "Persistence branch preflight probe blocked as designed: the selected checklist item was returned, but no git command, branch, pull request, file mutation, approval record, implementation plan, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was created.",
    checks: [selectedCheck],
  };
}
