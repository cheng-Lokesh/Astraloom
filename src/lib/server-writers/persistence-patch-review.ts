import "server-only";

import { buildWriterPersistenceDiffContract } from "@/lib/server-writers/persistence-diff-contract";
import type {
  WriterPersistencePatchReviewItem,
  WriterPersistencePatchReviewPayload,
  WriterPersistencePatchReviewProbeResult,
  WriterPersistencePatchReviewStatus,
} from "@/types/writer-persistence-patch-review";

const blockedCodes = [
  "patch_review_packet_only",
  "diff_contract_not_accepted",
  "real_patch_review_forbidden",
  "patch_acceptance_forbidden",
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
  wouldReviewRealPatch: false,
  wouldAcceptPatch: false,
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

function reviewItem(
  input: WriterPersistencePatchReviewItem,
): WriterPersistencePatchReviewItem {
  return input;
}

function buildReviewItems(): WriterPersistencePatchReviewItem[] {
  return [
    reviewItem({
      id: "source_diff_contract_invariant_review",
      category: "source_diff_invariant",
      title: "Source diff contract invariant review",
      status: "blocked_by_diff_contract",
      owner: "founder",
      intent:
        "Confirm the dry-run diff contract remains the only source for any future patch review and has not become an accepted implementation plan.",
      sourceDiffEntryIds: [
        "source_preflight_invariant_diff_contract",
        "final_diff_no_go_contract",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-diff-contract.md",
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      requiredEvidence: [
        "Diff contract payload still reports diffContractOnly=true.",
        "Diff contract payload still reports sourceBranchPreflightAccepted=false.",
        "Diff contract payload still reports implementationDiffApproved=false.",
      ],
      requiredAssertions: [
        "sourceDiffContractAccepted remains false",
        "implementationPatchSubmitted remains false",
        "implementationPatchApproved remains false",
      ],
      forbiddenChanges: [
        "treating the dry-run diff contract as an approved patch",
        "removing final no-go checks from the source diff contract",
        "recording owner approval from this packet",
      ],
      reviewQuestions: [
        "Does every review item map back to at least one source diff entry?",
        "Does the packet avoid approving implementation by implication?",
      ],
      blockingConditions: [
        "The source diff contract is missing or reports accepted implementation scope.",
        "Any runtime flag indicates patch creation, patch application, file changes, or database writes.",
      ],
      nonExecutionClauses: [
        "This item does not review a real patch.",
        "This item does not accept the source diff contract.",
      ],
      futureReviewArtifacts: [
        "source diff contract checksum",
        "owner-reviewed source diff entry list",
        "manual no-go comparison notes",
      ],
    }),
    reviewItem({
      id: "scope_review_packet",
      category: "scope_review",
      title: "Implementation scope review packet",
      status: "packet_ready",
      owner: "backend",
      intent:
        "Define the review questions a future patch must pass before any persistence adapter file can be created or modified.",
      sourceDiffEntryIds: [
        "type_surface_diff_contract",
        "adapter_orchestrator_diff_contract",
        "documentation_diff_contract",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-implementation-diff-contract.md",
      ],
      requiredEvidence: [
        "Patch file list is limited to source diff contract future files.",
        "Patch has no migrations, no route unlocks, and no feature flag enablement.",
        "Patch includes no client-side imports of server-only modules.",
      ],
      requiredAssertions: [
        "readyToApplyPatch remains false",
        "readyToCreateImplementationBranch remains false",
        "adapterImplementationAllowed remains false",
      ],
      forbiddenChanges: [
        "adding unlisted implementation files",
        "adding SQL migration files",
        "enabling system writer feature flags",
      ],
      reviewQuestions: [
        "Are all files inside the source diff contract scope?",
        "Does the patch avoid changing product behavior, payments, reports, and generation?",
      ],
      blockingConditions: [
        "Patch contains any file outside the source diff contract.",
        "Patch changes browser sync, report unlock, payment entitlement, or AI execution behavior.",
      ],
      nonExecutionClauses: [
        "This packet does not create a patch.",
        "This packet does not mark any future scope as accepted.",
      ],
      futureReviewArtifacts: [
        "future patch file manifest",
        "scope comparison table",
        "unlisted file exception log",
      ],
    }),
    reviewItem({
      id: "type_surface_review_packet",
      category: "type_surface_review",
      title: "Type surface review packet",
      status: "manual_required",
      owner: "backend",
      intent:
        "Review whether future adapter types are narrow, server-safe, and aligned with audit, idempotency, and compensation evidence.",
      sourceDiffEntryIds: ["type_surface_diff_contract"],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-acceptance-test-matrix.md",
      ],
      requiredEvidence: [
        "Type exports are safe for type-only imports.",
        "Types exclude raw prompt, narrative, provider payload, credential, and private debug fields.",
        "Types map to the acceptance matrix evidence names.",
      ],
      requiredAssertions: [
        "implementationFilesCreated remains false",
        "wouldStoreRawPayload remains false",
        "wouldStoreSecrets remains false",
      ],
      forbiddenChanges: [
        "adding runtime database access to type modules",
        "adding raw payload fields",
        "exporting browser-usable privileged helpers",
      ],
      reviewQuestions: [
        "Can each type be understood without exposing private data?",
        "Do result types distinguish blocked, replayed, succeeded, failed, and ambiguous outcomes?",
      ],
      blockingConditions: [
        "Type definitions include raw source material or credential-like fields.",
        "Types blur audit, idempotency, target write, and compensation responsibilities.",
      ],
      nonExecutionClauses: [
        "This packet does not create type files.",
        "This packet does not import future type files.",
      ],
      futureReviewArtifacts: [
        "type export inventory",
        "raw-field negative assertion list",
        "acceptance matrix mapping",
      ],
    }),
    reviewItem({
      id: "adapter_orchestrator_review_packet",
      category: "orchestrator_review",
      title: "Adapter orchestrator review packet",
      status: "blocked_by_diff_contract",
      owner: "backend",
      intent:
        "Define the future review for adapter phase order while keeping orchestration code, transactions, and target writer imports forbidden.",
      sourceDiffEntryIds: ["adapter_orchestrator_diff_contract"],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      requiredEvidence: [
        "Preflight precedes idempotency reservation.",
        "Idempotency reservation precedes any future target writer.",
        "Audit append and finalize phases are explicit and fail closed.",
      ],
      requiredAssertions: [
        "wouldImportRealWriterImplementation remains false",
        "wouldRunTransaction remains false",
        "wouldCreateServiceRoleClient remains false",
      ],
      forbiddenChanges: [
        "importing real writer implementations",
        "opening database transactions",
        "running with missing schema verification",
      ],
      reviewQuestions: [
        "Does the future orchestration preserve the documented phase sequence?",
        "How are ambiguous target-write outcomes handed to compensation?",
      ],
      blockingConditions: [
        "The orchestrator can execute before owner signoff.",
        "The orchestrator can write without schema verification and idempotency reservation.",
      ],
      nonExecutionClauses: [
        "This packet does not create adapter orchestration code.",
        "This packet does not execute any orchestration phase.",
      ],
      futureReviewArtifacts: [
        "phase-order diagram",
        "fail-closed scenario table",
        "ambiguous outcome handoff note",
      ],
    }),
    reviewItem({
      id: "audit_persistence_review_packet",
      category: "audit_review",
      title: "Audit persistence review packet",
      status: "manual_required",
      owner: "security",
      intent:
        "Define how a future audit persistence patch must prove redaction, append-only behavior, and failure blocking before it can be considered.",
      sourceDiffEntryIds: ["audit_persistence_diff_contract"],
      sourceRefs: [
        "docs/writer-audit-event-model.md",
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-evidence-handoff-fixtures.md",
      ],
      requiredEvidence: [
        "Audit drafts contain hashes, safe refs, event names, and status only.",
        "Forbidden private fields are rejected before any append attempt.",
        "Audit append failure blocks high-impact target writes.",
      ],
      requiredAssertions: [
        "wouldWriteAuditRows remains false",
        "wouldPersistEvidence remains false",
        "wouldStoreRawPayload remains false",
      ],
      forbiddenChanges: [
        "persisting raw prompts, narratives, provider payloads, or private debug bodies",
        "serializing credentials or token-like fields",
        "allowing target writes after audit append failure",
      ],
      reviewQuestions: [
        "Which exact audit fields are allowed?",
        "Does every failure path avoid private payload persistence?",
      ],
      blockingConditions: [
        "Audit data can contain raw user narrative or provider payload.",
        "Audit write failure is swallowed before high-impact writes proceed.",
      ],
      nonExecutionClauses: [
        "This packet does not write audit rows.",
        "This packet does not persist audit evidence.",
      ],
      futureReviewArtifacts: [
        "audit redaction fixture report",
        "allowed audit field table",
        "audit failure negative test list",
      ],
    }),
    reviewItem({
      id: "idempotency_persistence_review_packet",
      category: "idempotency_review",
      title: "Idempotency persistence review packet",
      status: "manual_required",
      owner: "backend",
      intent:
        "Define the review for future idempotency reservation, replay, conflict, finalize, failure, and expiry behavior.",
      sourceDiffEntryIds: ["idempotency_persistence_diff_contract"],
      sourceRefs: [
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      requiredEvidence: [
        "Same key plus same request hash returns a replay-safe result.",
        "Same key plus different request hash is blocked.",
        "Reservation happens before any future target writer side effect.",
      ],
      requiredAssertions: [
        "wouldReserveIdempotencyKeys remains false",
        "wouldWriteIdempotencyRows remains false",
        "wouldWriteRows remains false",
      ],
      forbiddenChanges: [
        "reserving idempotency after target writes",
        "allowing conflicting request hashes to proceed",
        "duplicating target writes after failed or expired states",
      ],
      reviewQuestions: [
        "What payload is returned on replay?",
        "What exact states block duplicate target writes?",
      ],
      blockingConditions: [
        "Idempotency is advisory rather than a gate.",
        "Conflicting request hashes can reach target writer code.",
      ],
      nonExecutionClauses: [
        "This packet does not reserve idempotency keys.",
        "This packet does not write idempotency rows.",
      ],
      futureReviewArtifacts: [
        "idempotency state transition table",
        "replay response fixture",
        "conflict negative test list",
      ],
    }),
    reviewItem({
      id: "compensation_handoff_review_packet",
      category: "compensation_review",
      title: "Compensation handoff review packet",
      status: "manual_required",
      owner: "operator",
      intent:
        "Define the review for future compensation handoff when persistence or target writer outcomes are failed or ambiguous.",
      sourceDiffEntryIds: ["compensation_handoff_diff_contract"],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      requiredEvidence: [
        "Ambiguous outcomes require operator review.",
        "Protected audit, payment, and consent history is never deleted.",
        "Support-safe compensation copy is available without private payloads.",
      ],
      requiredAssertions: [
        "wouldWriteCompensationRows remains false",
        "wouldDeleteFiles remains false",
        "wouldWriteRows remains false",
      ],
      forbiddenChanges: [
        "destructive deletion of audit history",
        "destructive deletion of payment or consent history",
        "automatic compensation for ambiguous outcomes",
      ],
      reviewQuestions: [
        "Which records can be superseded rather than deleted?",
        "Who owns customer escalation after an ambiguous write?",
      ],
      blockingConditions: [
        "Compensation bypasses operator review.",
        "Rollback logic removes protected historical records.",
      ],
      nonExecutionClauses: [
        "This packet does not write compensation rows.",
        "This packet does not mutate generated history.",
      ],
      futureReviewArtifacts: [
        "operator handoff checklist",
        "superseded-record policy",
        "support-safe copy fixture",
      ],
    }),
    reviewItem({
      id: "security_boundary_review_packet",
      category: "security_review",
      title: "Security boundary review packet",
      status: "manual_required",
      owner: "security",
      intent:
        "Define the future review proving server-only isolation, credential containment, response redaction, and browser bundle safety.",
      sourceDiffEntryIds: [
        "server_boundary_test_diff_contract",
        "audit_persistence_diff_contract",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/writer-persistence-implementation-branch-preflight.md",
      ],
      requiredEvidence: [
        "Server-only modules are not imported by client components.",
        "No privileged environment value is serialized in any response.",
        "Negative tests cover secret-like and private payload fields.",
      ],
      requiredAssertions: [
        "wouldCreateServiceRoleClient remains false",
        "wouldReadServiceRoleSecret remains false",
        "wouldStoreSecrets remains false",
      ],
      forbiddenChanges: [
        "creating a service-role client factory",
        "reading privileged secrets during review",
        "returning secret-like values from APIs or pages",
      ],
      reviewQuestions: [
        "Can this review run without production credentials?",
        "Does the patch fail closed if a server-only module reaches a client bundle?",
      ],
      blockingConditions: [
        "A review path requires privileged credentials.",
        "A response can contain credential-like or private payload fields.",
      ],
      nonExecutionClauses: [
        "This packet does not create a privileged client.",
        "This packet does not read privileged secrets.",
      ],
      futureReviewArtifacts: [
        "server-only import boundary report",
        "response redaction report",
        "credential-free local review instructions",
      ],
    }),
    reviewItem({
      id: "qa_assertion_review_packet",
      category: "qa_review",
      title: "QA assertion review packet",
      status: "manual_required",
      owner: "qa",
      intent:
        "Define how a future implementation patch must be tested without creating test files or running automated tests in this stage.",
      sourceDiffEntryIds: [
        "server_boundary_test_diff_contract",
        "adapter_unit_test_diff_contract",
      ],
      sourceRefs: [
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      requiredEvidence: [
        "Every future test maps to an acceptance matrix item.",
        "Negative tests cover writes, SQL, AI, Stripe, reports, secrets, and private payloads.",
        "Local tests can run without remote mutation or production credentials.",
      ],
      requiredAssertions: [
        "wouldCreateTestFiles remains false",
        "wouldRunAutomatedTests remains false",
        "wouldCallAi remains false",
        "wouldCallStripe remains false",
      ],
      forbiddenChanges: [
        "creating test files in this packet",
        "running automated tests as implementation acceptance",
        "using remote mutation in local QA",
      ],
      reviewQuestions: [
        "Does the future test plan prove phase order and fail-closed behavior?",
        "Do negative tests fail if any dangerous side effect becomes true?",
      ],
      blockingConditions: [
        "Tests require real rows, production credentials, AI, Stripe, or report unlocks.",
        "Tests can pass while dangerous side-effect flags are true.",
      ],
      nonExecutionClauses: [
        "This packet does not create tests.",
        "This packet does not run tests.",
      ],
      futureReviewArtifacts: [
        "test-to-matrix mapping",
        "negative assertion checklist",
        "local-only test command plan",
      ],
    }),
    reviewItem({
      id: "final_patch_no_go_review",
      category: "final_no_go",
      title: "Final patch no-go review",
      status: "blocked_by_diff_contract",
      owner: "founder",
      intent:
        "Keep the implementation patch review as a no-go packet until a later owner signoff gate explicitly authorizes a real patch review path.",
      sourceDiffEntryIds: ["final_diff_no_go_contract"],
      sourceRefs: [
        "docs/writer-persistence-implementation-diff-contract.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      requiredEvidence: [
        "No implementation patch is submitted.",
        "No implementation patch is accepted.",
        "No implementation branch, file change, migration, write, AI call, Stripe call, or report unlock exists.",
      ],
      requiredAssertions: [
        "wouldReviewRealPatch=false",
        "wouldAcceptPatch=false",
        "wouldGeneratePatch=false",
        "wouldApplyPatch=false",
        "wouldCreateFiles=false",
        "wouldModifyFiles=false",
        "wouldWriteRows=false",
      ],
      forbiddenChanges: [
        "reviewing a real patch",
        "accepting a real patch",
        "creating branches or pull requests",
        "creating implementation files or tests",
        "creating migrations or writing rows",
      ],
      reviewQuestions: [
        "Is this endpoint still only a review packet?",
        "Are all patch, file, branch, test, database, AI, Stripe, and report effects still blocked?",
      ],
      blockingConditions: [
        "Any runtime side effect becomes true.",
        "Any future reviewer treats this packet as approval to create or apply a patch.",
      ],
      nonExecutionClauses: [
        "This endpoint is the current hard stop.",
        "This endpoint does not review, accept, create, or apply any real patch.",
      ],
      futureReviewArtifacts: [
        "owner signoff packet",
        "release no-go packet",
        "manual implementation review record",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistencePatchReviewItem[],
  status: WriterPersistencePatchReviewStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistencePatchReviewItem[],
  key: "requiredEvidence" | "requiredAssertions" | "forbiddenChanges",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(payload: WriterPersistencePatchReviewPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    patchReviewMode: payload.patchReviewMode,
    patchReviewPacketOnly: true as const,
    sourceDiffContractAccepted: false as const,
    implementationPatchSubmitted: false as const,
    implementationPatchApproved: false as const,
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
    readyToApplyPatch: false as const,
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

export async function buildWriterPersistencePatchReview(): Promise<WriterPersistencePatchReviewPayload> {
  const sourceDiffContract = await buildWriterPersistenceDiffContract();
  const reviewItems = buildReviewItems();

  return {
    safeMode: true,
    readOnly: true,
    patchReviewMode: "persistence_adapter_implementation_patch_review_packet_only",
    sourceDiffContractMode: sourceDiffContract.diffContractMode,
    checkedAt: new Date().toISOString(),
    reviewItemCount: reviewItems.length,
    packetReadyCount: countByStatus(reviewItems, "packet_ready"),
    blockedReviewCount: countByStatus(reviewItems, "blocked_by_diff_contract"),
    manualReviewCount: countByStatus(reviewItems, "manual_required"),
    requiredEvidenceCount: uniqueCount(reviewItems, "requiredEvidence"),
    requiredAssertionCount: uniqueCount(reviewItems, "requiredAssertions"),
    forbiddenChangeCount: uniqueCount(reviewItems, "forbiddenChanges"),
    sourceDiffEntryCount: sourceDiffContract.diffEntryCount,
    sourceDiffBlockedEntryCount: sourceDiffContract.blockedEntryCount,
    sourceDiffManualRequiredEntryCount:
      sourceDiffContract.manualRequiredEntryCount,
    patchReviewPacketReady: true,
    patchReviewPacketOnly: true,
    sourceDiffContractReady: sourceDiffContract.diffContractReady,
    sourceDiffContractOnly: sourceDiffContract.diffContractOnly,
    sourceDiffContractAccepted: false,
    implementationPatchSubmitted: false,
    implementationPatchApproved: false,
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
    readyToApplyPatch: false,
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
    patchReviewRules: [
      "This endpoint is a read-only implementation patch review packet, not a patch reviewer or patch generator.",
      "It may define review owners, evidence requirements, assertions, forbidden changes, blocking conditions, and future artifacts.",
      "It must not review a real patch, accept a patch, generate a patch, apply a patch, create files, modify files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create privileged clients, read privileged secrets, open transactions, write rows, create migrations, call AI, call Stripe, or unlock reports.",
      "The source dry-run diff contract is not accepted, so every implementation patch, file, branch, approval, review, and runtime effect remains blocked.",
    ],
    futureOwnerSignoffGates: [
      "A later owner signoff packet explicitly accepts the source diff contract.",
      "Security signs off on server-only isolation, redaction, and credential containment.",
      "Backend signs off on file scope, phase order, idempotency, and fail-closed behavior.",
      "QA signs off on local-only negative tests without remote mutation.",
      "Founder signs off that implementation still does not enable AI, Stripe, report unlocks, or browser writes to generated records.",
    ],
    reviewItems,
  };
}

export async function probeWriterPersistencePatchReview(
  requestBody: unknown,
): Promise<WriterPersistencePatchReviewProbeResult> {
  const payload = await buildWriterPersistencePatchReview();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence patch review probe blocked: request body must be a JSON object and no real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      reviewItems: payload.reviewItems,
    };
  }

  const reviewId = (requestBody as { reviewId?: unknown }).reviewId;

  if (typeof reviewId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence patch review probe blocked: reviewId must be a string and no real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      reviewItems: payload.reviewItems,
    };
  }

  const selectedReview = payload.reviewItems.find(
    (candidate) => candidate.id === reviewId,
  );

  if (!selectedReview) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence patch review probe blocked: unknown review id and no real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      reviewItems: payload.reviewItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    reviewId: selectedReview.id,
    reviewTitle: selectedReview.title,
    reviewStatus: selectedReview.status,
    summary:
      "Persistence patch review probe blocked as designed: the selected review item was returned, but no real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    reviewItems: [selectedReview],
  };
}
