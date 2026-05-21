import "server-only";

import { buildWriterPersistenceBranchPreflight } from "@/lib/server-writers/persistence-branch-preflight";
import type {
  WriterPersistenceDiffContractEntry,
  WriterPersistenceDiffContractPayload,
  WriterPersistenceDiffContractProbeResult,
  WriterPersistenceDiffContractStatus,
} from "@/types/writer-persistence-diff-contract";

const blockedCodes = [
  "diff_contract_only",
  "branch_preflight_not_accepted",
  "implementation_diff_forbidden",
  "patch_generation_forbidden",
  "patch_application_forbidden",
  "file_creation_forbidden",
  "file_modification_forbidden",
  "test_creation_forbidden",
  "approval_record_forbidden",
  "git_command_forbidden",
  "branch_creation_forbidden",
  "pull_request_forbidden",
  "adapter_code_forbidden",
  "service_role_client_forbidden",
  "transaction_forbidden",
  "database_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldGeneratePatch: false,
  wouldApplyPatch: false,
  wouldModifyFiles: false,
  wouldCreateFiles: false,
  wouldDeleteFiles: false,
  wouldRunGitCommand: false,
  wouldCreateBranch: false,
  wouldCheckoutBranch: false,
  wouldCreatePullRequest: false,
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

function entry(
  input: WriterPersistenceDiffContractEntry,
): WriterPersistenceDiffContractEntry {
  return input;
}

function buildEntries(): WriterPersistenceDiffContractEntry[] {
  return [
    entry({
      id: "source_preflight_invariant_diff_contract",
      category: "source_preflight_invariant",
      title: "Source preflight invariant diff contract",
      status: "blocked_by_preflight",
      owner: "founder",
      futureFile: "docs/writer-persistence-implementation-diff-contract.md",
      futureChangeKind: "future_doc",
      intent:
        "Keep the branch preflight checklist as the source of truth for future file scope before any implementation diff exists.",
      sourcePreflightCheckIds: [
        "approval_packet_route_invariant_preflight",
        "final_branch_no_go_preflight",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-branch-preflight.md",
        "docs/writer-persistence-implementation-approval-packet.md",
      ],
      allowedFutureSymbols: ["diff contract summary only"],
      forbiddenChanges: [
        "accepting the approval packet in code",
        "marking branch creation as approved",
        "creating implementation patch files",
      ],
      requiredAssertions: [
        "sourceBranchPreflightAccepted remains false",
        "implementationDiffApproved remains false",
        "readyToApplyDiff remains false",
      ],
      reviewQuestions: [
        "Does this contract preserve every no-go from the branch preflight checklist?",
        "Does this contract avoid granting implementation approval by implication?",
      ],
      blockingConditions: [
        "Any owner approval is implied by this endpoint.",
        "Any runtime flag indicates patch generation, patch application, or branch creation.",
      ],
      nonExecutionClauses: [
        "This entry does not create an implementation diff.",
        "This entry does not approve any future diff.",
      ],
      rollbackNotes: [
        "Remove the future diff contract if it drifts from the branch preflight no-go list.",
      ],
    }),
    entry({
      id: "type_surface_diff_contract",
      category: "type_surface",
      title: "Type surface diff contract",
      status: "manual_required",
      owner: "backend",
      futureFile: "src/lib/server-writers/persistence-adapter.types.ts",
      futureChangeKind: "future_add",
      intent:
        "Define the future adapter input, result, audit draft, idempotency draft, and compensation draft types before runtime code is written.",
      sourcePreflightCheckIds: [
        "allowed_file_scope_preflight",
        "qa_test_preflight",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      allowedFutureSymbols: [
        "PersistenceAdapterInput",
        "PersistenceAdapterResult",
        "AuditEventDraft",
        "IdempotencyReservationDraft",
        "CompensationDraft",
      ],
      forbiddenChanges: [
        "browser exports",
        "database client creation",
        "environment variable reads",
        "raw payload fields",
      ],
      requiredAssertions: [
        "types remain importable without server credentials",
        "type names map to acceptance matrix evidence",
        "raw payload storage is not represented",
      ],
      reviewQuestions: [
        "Are type names narrow enough for audit and idempotency only?",
        "Can client code import only safe type-only material?",
      ],
      blockingConditions: [
        "Types include payment entitlement, report unlock, AI generation, or product object writes.",
        "Types expose raw request bodies or private narrative fields.",
      ],
      nonExecutionClauses: [
        "This entry does not create the type file.",
        "This entry does not make the adapter executable.",
      ],
      rollbackNotes: [
        "Drop the type surface if it pulls product generation scope into persistence work.",
      ],
    }),
    entry({
      id: "adapter_orchestrator_diff_contract",
      category: "adapter_orchestrator",
      title: "Adapter orchestrator diff contract",
      status: "blocked_by_preflight",
      owner: "backend",
      futureFile: "src/lib/server-writers/persistence-adapter.server.ts",
      futureChangeKind: "future_add",
      intent:
        "Define the future server-only orchestration file that would coordinate preflight, idempotency, audit, future target writer, finalize, and compensation handoff.",
      sourcePreflightCheckIds: [
        "allowed_file_scope_preflight",
        "security_boundary_preflight",
        "final_branch_no_go_preflight",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      allowedFutureSymbols: [
        "runPersistenceAdapter",
        "validatePersistencePreflight",
        "finalizePersistenceAttempt",
      ],
      forbiddenChanges: [
        "calling future target writers",
        "creating a privileged client without separate approval",
        "running transactions before schema verification",
        "unlocking reports or granting entitlements",
      ],
      requiredAssertions: [
        "server-only boundary is enforced",
        "phase order matches the adapter design",
        "fail-closed behavior is explicit",
      ],
      reviewQuestions: [
        "Does orchestration reserve idempotency before target writes?",
        "Does audit attempt happen before and after the future target writer?",
      ],
      blockingConditions: [
        "The orchestrator imports real writer implementations before approval.",
        "The orchestrator can run with missing schema or missing owner approvals.",
      ],
      nonExecutionClauses: [
        "This entry does not create orchestration code.",
        "This entry does not import real writer implementations.",
      ],
      rollbackNotes: [
        "Remove the orchestrator from a future diff if it cannot stay server-only and fail-closed.",
      ],
    }),
    entry({
      id: "audit_persistence_diff_contract",
      category: "audit_persistence",
      title: "Audit persistence diff contract",
      status: "manual_required",
      owner: "security",
      futureFile: "src/lib/server-writers/persistence-audit.server.ts",
      futureChangeKind: "future_add",
      intent:
        "Define the future audit append boundary using redacted metadata and request hashes only.",
      sourcePreflightCheckIds: [
        "security_boundary_preflight",
        "allowed_file_scope_preflight",
      ],
      sourceRefs: [
        "docs/writer-audit-event-model.md",
        "docs/request-hashing-redaction-fixtures.md",
      ],
      allowedFutureSymbols: [
        "appendWriterAuditEvent",
        "buildAuditEventDraft",
        "assertAuditPayloadIsRedacted",
      ],
      forbiddenChanges: [
        "raw prompt or narrative storage",
        "provider payload storage",
        "credential or token serialization",
        "audit failure allowing high-impact writes to continue",
      ],
      requiredAssertions: [
        "audit drafts contain hashes and safe refs only",
        "forbidden fields are rejected",
        "append failure blocks execution",
      ],
      reviewQuestions: [
        "Which audit fields are allowed?",
        "Does the future code reject unsafe debug payloads?",
      ],
      blockingConditions: [
        "Raw source material appears in audit drafts.",
        "Audit write errors are swallowed before high-impact writes.",
      ],
      nonExecutionClauses: [
        "This entry does not write audit rows.",
        "This entry does not persist evidence.",
      ],
      rollbackNotes: [
        "Remove audit persistence from a future diff if redaction fixtures are incomplete.",
      ],
    }),
    entry({
      id: "idempotency_persistence_diff_contract",
      category: "idempotency_persistence",
      title: "Idempotency persistence diff contract",
      status: "manual_required",
      owner: "backend",
      futureFile: "src/lib/server-writers/persistence-idempotency.server.ts",
      futureChangeKind: "future_add",
      intent:
        "Define the future reservation, replay, conflict, finalize, failed, and expired idempotency behavior.",
      sourcePreflightCheckIds: [
        "allowed_file_scope_preflight",
        "qa_test_preflight",
      ],
      sourceRefs: [
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-persistence-adapter-design.md",
      ],
      allowedFutureSymbols: [
        "reserveIdempotencyKey",
        "resolveIdempotencyReplay",
        "finalizeIdempotencyKey",
        "markIdempotencyFailed",
      ],
      forbiddenChanges: [
        "reservation after target writer execution",
        "same key plus different request hash replay",
        "duplicate writes after failed or expired states",
      ],
      requiredAssertions: [
        "same key plus same hash is replay-safe",
        "same key plus different hash is blocked",
        "reservation occurs before future target writes",
      ],
      reviewQuestions: [
        "What state is returned for replay?",
        "What state blocks duplicate target writes after failure?",
      ],
      blockingConditions: [
        "Idempotency reservation is not first-class in the phase order.",
        "Conflicting request hashes can proceed.",
      ],
      nonExecutionClauses: [
        "This entry does not reserve idempotency keys.",
        "This entry does not write idempotency rows.",
      ],
      rollbackNotes: [
        "Remove idempotency persistence from a future diff if replay behavior is ambiguous.",
      ],
    }),
    entry({
      id: "compensation_handoff_diff_contract",
      category: "compensation_handoff",
      title: "Compensation handoff diff contract",
      status: "manual_required",
      owner: "operator",
      futureFile: "src/lib/server-writers/persistence-compensation.server.ts",
      futureChangeKind: "future_add",
      intent:
        "Define the future data-preserving compensation handoff when persistence or target writer phases are ambiguous or failed.",
      sourcePreflightCheckIds: [
        "rollback_checkpoint_preflight",
        "owner_handoff_preflight",
      ],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      allowedFutureSymbols: [
        "buildCompensationHandoff",
        "queueOperatorReview",
        "markGeneratedRecordSuperseded",
      ],
      forbiddenChanges: [
        "destructive deletion of audit history",
        "destructive deletion of payment or consent history",
        "automatic compensation for ambiguous outcomes",
      ],
      requiredAssertions: [
        "history is preserved",
        "operator review is required for ambiguous outcomes",
        "support-safe copy is available",
      ],
      reviewQuestions: [
        "Which records can be superseded?",
        "Who owns customer escalation after compensation?",
      ],
      blockingConditions: [
        "Rollback logic deletes protected history.",
        "Compensation bypasses operator review.",
      ],
      nonExecutionClauses: [
        "This entry does not write compensation rows.",
        "This entry does not mutate generated history.",
      ],
      rollbackNotes: [
        "Remove compensation code from a future diff if operator ownership is unclear.",
      ],
    }),
    entry({
      id: "server_boundary_test_diff_contract",
      category: "server_boundary_test",
      title: "Server boundary test diff contract",
      status: "manual_required",
      owner: "security",
      futureFile: "src/lib/server-writers/persistence-server-boundary.test.ts",
      futureChangeKind: "future_test",
      intent:
        "Define future negative tests proving server-only persistence modules cannot enter client bundles or serialize sensitive material.",
      sourcePreflightCheckIds: [
        "security_boundary_preflight",
        "qa_test_preflight",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      allowedFutureSymbols: [
        "server-only import boundary assertions",
        "response redaction assertions",
      ],
      forbiddenChanges: [
        "tests requiring production credentials",
        "tests reading privileged environment values",
        "tests writing rows",
      ],
      requiredAssertions: [
        "client imports are blocked",
        "responses do not expose secret-like values",
        "dangerous runtime flags remain false",
      ],
      reviewQuestions: [
        "Can the test run locally without privileged credentials?",
        "Does the test fail if server-only code reaches a client component?",
      ],
      blockingConditions: [
        "A test requires production credentials.",
        "A test mutates remote state.",
      ],
      nonExecutionClauses: [
        "This entry does not create test files.",
        "This entry does not run tests.",
      ],
      rollbackNotes: [
        "Remove future boundary tests if they require live privileged secrets.",
      ],
    }),
    entry({
      id: "adapter_unit_test_diff_contract",
      category: "adapter_unit_test",
      title: "Adapter unit test diff contract",
      status: "manual_required",
      owner: "qa",
      futureFile: "src/lib/server-writers/persistence-adapter.test.ts",
      futureChangeKind: "future_test",
      intent:
        "Define future unit tests for phase order, audit redaction, idempotency replay, rollback handoff, and blocked side effects.",
      sourcePreflightCheckIds: [
        "qa_test_preflight",
        "local_command_preflight",
      ],
      sourceRefs: [
        "docs/writer-persistence-fixture-harness.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      allowedFutureSymbols: [
        "phase order tests",
        "idempotency replay tests",
        "audit redaction tests",
        "rollback handoff tests",
      ],
      forbiddenChanges: [
        "tests that create real rows",
        "tests that call AI or Stripe",
        "tests that pass when dangerous flags are true",
      ],
      requiredAssertions: [
        "preflight happens before reservation",
        "reservation happens before future target writes",
        "audit result happens before finalize",
        "dangerous side effects stay blocked in dry-run mode",
      ],
      reviewQuestions: [
        "Does every test map to an acceptance matrix item?",
        "Do negative tests cover writes, SQL, AI, Stripe, and report unlocks?",
      ],
      blockingConditions: [
        "Tests are created before owner approval.",
        "Tests rely on remote mutation.",
      ],
      nonExecutionClauses: [
        "This entry does not create tests.",
        "This entry does not run tests.",
      ],
      rollbackNotes: [
        "Remove future test cases if they cannot run locally without mutations.",
      ],
    }),
    entry({
      id: "documentation_diff_contract",
      category: "documentation",
      title: "Documentation diff contract",
      status: "contract_ready",
      owner: "founder",
      futureFile: "docs/writer-persistence-implementation-patch-review.md",
      futureChangeKind: "future_doc",
      intent:
        "Define the future review packet that would compare an implementation patch against this dry-run diff contract.",
      sourcePreflightCheckIds: [
        "owner_handoff_preflight",
        "final_branch_no_go_preflight",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-branch-preflight.md",
        "docs/writer-persistence-implementation-approval-packet.md",
      ],
      allowedFutureSymbols: [
        "patch review checklist",
        "owner signoff table",
        "negative assertion list",
      ],
      forbiddenChanges: [
        "implementation approval by documentation alone",
        "branch creation by documentation alone",
        "release approval by documentation alone",
      ],
      requiredAssertions: [
        "documentation does not approve implementation",
        "documentation names unresolved blockers",
        "documentation keeps dangerous effects false",
      ],
      reviewQuestions: [
        "Can a future reviewer compare the patch against this contract?",
        "Are unresolved owner approvals visible?",
      ],
      blockingConditions: [
        "Documentation claims implementation is approved.",
        "Documentation removes branch preflight blockers.",
      ],
      nonExecutionClauses: [
        "This entry does not create the future review document.",
        "This entry does not approve a patch.",
      ],
      rollbackNotes: [
        "Remove the future review packet if it implies implementation is approved.",
      ],
    }),
    entry({
      id: "final_diff_no_go_contract",
      category: "final_no_go",
      title: "Final diff no-go contract",
      status: "blocked_by_preflight",
      owner: "security",
      futureFile: "no file may be created by this endpoint",
      futureChangeKind: "future_doc",
      intent:
        "Keep every implementation diff blocked until a later owner-approved patch review gate exists.",
      sourcePreflightCheckIds: ["final_branch_no_go_preflight"],
      sourceRefs: [
        "docs/writer-persistence-implementation-branch-preflight.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      allowedFutureSymbols: ["no-op final stop"],
      forbiddenChanges: [
        "generating a patch",
        "applying a patch",
        "creating files",
        "modifying files",
        "creating branches",
        "creating pull requests",
      ],
      requiredAssertions: [
        "wouldGeneratePatch=false",
        "wouldApplyPatch=false",
        "wouldCreateFiles=false",
        "wouldModifyFiles=false",
        "wouldCreateAdapterCode=false",
        "wouldWriteRows=false",
      ],
      reviewQuestions: [
        "Is this endpoint still only a contract?",
        "Are all implementation and runtime side effects still blocked?",
      ],
      blockingConditions: [
        "Any file is created by this endpoint.",
        "Any patch is generated or applied by this endpoint.",
        "Any implementation code is created.",
      ],
      nonExecutionClauses: [
        "This endpoint is the current hard stop.",
        "This endpoint does not create a diff artifact.",
      ],
      rollbackNotes: [
        "Revert to branch preflight if the future diff scope becomes executable.",
      ],
    }),
  ];
}

function countByStatus(
  entries: WriterPersistenceDiffContractEntry[],
  status: WriterPersistenceDiffContractStatus,
) {
  return entries.filter((currentEntry) => currentEntry.status === status).length;
}

function uniqueCount(
  entries: WriterPersistenceDiffContractEntry[],
  key: "futureFile" | "forbiddenChanges" | "requiredAssertions",
) {
  if (key === "futureFile") {
    return new Set(entries.map((currentEntry) => currentEntry.futureFile)).size;
  }

  return new Set(entries.flatMap((currentEntry) => currentEntry[key])).size;
}

function baseProbeFields(payload: WriterPersistenceDiffContractPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    diffContractMode: payload.diffContractMode,
    diffContractOnly: true as const,
    sourceBranchPreflightAccepted: false as const,
    implementationDiffApproved: false as const,
    implementationPatchCreated: false as const,
    implementationPatchApplied: false as const,
    implementationFilesCreated: false as const,
    implementationFilesModified: false as const,
    implementationTestsCreated: false as const,
    implementationApprovalGranted: false as const,
    implementationBranchApproved: false as const,
    branchCreationApproved: false as const,
    branchCreated: false as const,
    pullRequestCreated: false as const,
    implementationPlanApproved: false as const,
    readyToApplyDiff: false as const,
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

export async function buildWriterPersistenceDiffContract(): Promise<WriterPersistenceDiffContractPayload> {
  const preflight = await buildWriterPersistenceBranchPreflight();
  const entries = buildEntries();

  return {
    safeMode: true,
    readOnly: true,
    diffContractMode:
      "persistence_adapter_implementation_dry_run_diff_contract_only",
    sourceBranchPreflightMode: preflight.branchPreflightMode,
    checkedAt: new Date().toISOString(),
    diffEntryCount: entries.length,
    contractReadyCount: countByStatus(entries, "contract_ready"),
    blockedEntryCount: countByStatus(entries, "blocked_by_preflight"),
    manualRequiredEntryCount: countByStatus(entries, "manual_required"),
    futureFileCount: uniqueCount(entries, "futureFile"),
    forbiddenChangeCount: uniqueCount(entries, "forbiddenChanges"),
    requiredAssertionCount: uniqueCount(entries, "requiredAssertions"),
    sourcePreflightCheckCount: preflight.checkCount,
    sourcePreflightBlockedCheckCount: preflight.blockedCheckCount,
    sourcePreflightManualRequiredCheckCount:
      preflight.manualRequiredCheckCount,
    diffContractReady: true,
    diffContractOnly: true,
    sourceBranchPreflightReady: preflight.branchPreflightReady,
    sourceBranchPreflightOnly: preflight.branchPreflightOnly,
    sourceBranchPreflightAccepted: false,
    implementationDiffApproved: false,
    implementationPatchCreated: false,
    implementationPatchApplied: false,
    implementationFilesCreated: false,
    implementationFilesModified: false,
    implementationTestsCreated: false,
    implementationApprovalGranted: false,
    implementationBranchApproved: false,
    branchCreationApproved: false,
    branchCreated: false,
    pullRequestCreated: false,
    implementationPlanApproved: false,
    readyToApplyDiff: false,
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
    diffContractRules: [
      "This endpoint is a read-only dry-run diff contract, not a patch generator.",
      "It may name future files, change categories, allowed symbols, forbidden changes, assertions, review questions, rollback notes, and source preflight refs.",
      "It must not generate patches, apply patches, create files, modify files, delete files, create tests, run tests, run git, create branches, create pull requests, create adapter code, read privileged secrets, create service-role clients, open transactions, write rows, create migrations, call AI, call Stripe, or unlock reports.",
      "The source branch preflight is not accepted, so every implementation diff, patch, file, branch, review, and runtime effect remains blocked.",
    ],
    futureDiffGates: [
      "Branch preflight is accepted by a later approved owner mechanism.",
      "Each future file maps to an allowed preflight file and an acceptance matrix requirement.",
      "Every forbidden change remains explicitly excluded.",
      "Required assertions cover phase order, idempotency, audit redaction, rollback, server-only boundaries, and blocked side effects.",
      "A later patch review gate explicitly authorizes any real file creation or modification.",
    ],
    entries,
  };
}

export async function probeWriterPersistenceDiffContract(
  requestBody: unknown,
): Promise<WriterPersistenceDiffContractProbeResult> {
  const payload = await buildWriterPersistenceDiffContract();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence diff contract probe blocked: request body must be a JSON object and no patch, file change, test, git command, branch, pull request, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      entries: payload.entries,
    };
  }

  const entryId = (requestBody as { entryId?: unknown }).entryId;

  if (typeof entryId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence diff contract probe blocked: entryId must be a string and no patch, file change, test, git command, branch, pull request, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      entries: payload.entries,
    };
  }

  const selectedEntry = payload.entries.find(
    (candidate) => candidate.id === entryId,
  );

  if (!selectedEntry) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence diff contract probe blocked: unknown entry id and no patch, file change, test, git command, branch, pull request, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      entries: payload.entries,
    };
  }

  return {
    ...baseProbeFields(payload),
    entryId: selectedEntry.id,
    entryTitle: selectedEntry.title,
    entryStatus: selectedEntry.status,
    summary:
      "Persistence diff contract probe blocked as designed: the selected diff entry was returned, but no patch, file creation, file modification, test creation, git command, branch, pull request, adapter code, service-role client, transaction, migration, row write, AI call, Stripe call, or report unlock was created.",
    entries: [selectedEntry],
  };
}
