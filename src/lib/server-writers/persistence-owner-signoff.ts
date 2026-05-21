import "server-only";

import { buildWriterPersistencePatchReview } from "@/lib/server-writers/persistence-patch-review";
import type {
  WriterPersistenceOwnerSignoffItem,
  WriterPersistenceOwnerSignoffPayload,
  WriterPersistenceOwnerSignoffProbeResult,
  WriterPersistenceOwnerSignoffStatus,
} from "@/types/writer-persistence-owner-signoff";

const blockedCodes = [
  "owner_signoff_packet_only",
  "patch_review_not_accepted",
  "signature_collection_forbidden",
  "owner_approval_record_forbidden",
  "implementation_approval_forbidden",
  "patch_review_acceptance_forbidden",
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
  wouldCollectSignature: false,
  wouldRecordOwnerApproval: false,
  wouldGrantImplementationApproval: false,
  wouldCreateApprovalRecord: false,
  wouldAcceptPatchReview: false,
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

function signoffItem(
  input: WriterPersistenceOwnerSignoffItem,
): WriterPersistenceOwnerSignoffItem {
  return input;
}

function buildSignoffItems(): WriterPersistenceOwnerSignoffItem[] {
  return [
    signoffItem({
      id: "source_patch_review_invariant_signoff",
      category: "source_patch_review_invariant",
      title: "Source patch review invariant signoff",
      status: "blocked_by_patch_review",
      owner: "founder",
      intent:
        "Confirm the patch review packet remains read-only and unaccepted before any future owner signoff can be considered.",
      sourceReviewItemIds: [
        "source_diff_contract_invariant_review",
        "final_patch_no_go_review",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-patch-review.md",
        "docs/writer-persistence-implementation-diff-contract.md",
      ],
      requiredEvidence: [
        "Patch review payload still reports patchReviewPacketOnly=true.",
        "Patch review payload still reports sourceDiffContractAccepted=false.",
        "Patch review payload still reports implementationPatchApproved=false.",
      ],
      signoffQuestions: [
        "Does the source patch review packet still block real patch review and patch acceptance?",
        "Does the owner signoff packet avoid converting review questions into approval?",
      ],
      approvalBoundaries: [
        "This item may define future signoff evidence only.",
        "This item may not approve implementation, branch creation, patch review, or file changes.",
      ],
      forbiddenDelegations: [
        "delegating owner approval to an automated endpoint",
        "treating the patch review packet as an accepted review",
        "allowing a single owner to bypass another required owner lane",
      ],
      blockingConditions: [
        "Any patch review flag indicates accepted or approved implementation.",
        "Any runtime flag indicates approval recording, patch acceptance, file mutation, branch creation, or writes.",
      ],
      nonExecutionClauses: [
        "This item does not collect signatures.",
        "This item does not record owner approval.",
      ],
      futureSignoffArtifacts: [
        "source patch review checksum",
        "owner lane signoff inventory",
        "unaccepted patch review evidence note",
      ],
    }),
    signoffItem({
      id: "founder_scope_signoff_packet",
      category: "founder_signoff",
      title: "Founder scope signoff packet",
      status: "manual_required",
      owner: "founder",
      intent:
        "Define the founder-only scope confirmation needed before any future patch review can move toward implementation.",
      sourceReviewItemIds: [
        "scope_review_packet",
        "final_patch_no_go_review",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-patch-review.md",
        "docs/database-schema.md",
      ],
      requiredEvidence: [
        "The patch remains limited to persistence adapter plumbing.",
        "No AI, Stripe, report unlock, graph editing, or paid feature behavior is enabled.",
        "Browser writes remain limited to user-authored draft tables.",
      ],
      signoffQuestions: [
        "Is the future implementation still within the persistence adapter scope only?",
        "Does it avoid shipping visible paid or generated product behavior?",
      ],
      approvalBoundaries: [
        "Founder scope signoff can only confirm product scope.",
        "Founder scope signoff cannot replace security, backend, QA, or operator lanes.",
      ],
      forbiddenDelegations: [
        "delegating product scope approval to code",
        "allowing scope signoff to approve database writes",
        "allowing scope signoff to enable AI, Stripe, or report unlocks",
      ],
      blockingConditions: [
        "Future implementation changes user-facing report, payment, AI, or graph editing behavior.",
        "Future implementation expands file scope beyond the dry-run diff contract.",
      ],
      nonExecutionClauses: [
        "This item does not record founder approval.",
        "This item does not enable paid or generated product behavior.",
      ],
      futureSignoffArtifacts: [
        "founder scope checklist",
        "product non-goal attestation",
        "browser write boundary note",
      ],
    }),
    signoffItem({
      id: "security_boundary_signoff_packet",
      category: "security_signoff",
      title: "Security boundary signoff packet",
      status: "manual_required",
      owner: "security",
      intent:
        "Define the security evidence required for server-only isolation, credential containment, response redaction, and private payload exclusion.",
      sourceReviewItemIds: [
        "security_boundary_review_packet",
        "audit_persistence_review_packet",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/request-hashing-redaction-fixtures.md",
      ],
      requiredEvidence: [
        "Server-only modules cannot enter client bundles.",
        "No privileged environment value is read or serialized by review endpoints.",
        "Raw prompts, narratives, provider payloads, and private debug bodies remain excluded.",
      ],
      signoffQuestions: [
        "Can security review run without production credentials?",
        "Does every response stay free of credential-like and private payload fields?",
      ],
      approvalBoundaries: [
        "Security signoff can only confirm isolation and redaction evidence.",
        "Security signoff cannot approve product scope, QA completeness, or branch creation alone.",
      ],
      forbiddenDelegations: [
        "delegating security signoff to a positive route response",
        "allowing privileged credential reads during signoff",
        "allowing unsafe debug payloads for convenience",
      ],
      blockingConditions: [
        "A future path requires privileged credentials for local review.",
        "Any response can expose private payloads or credential-like values.",
      ],
      nonExecutionClauses: [
        "This item does not create a privileged client.",
        "This item does not read privileged secrets.",
      ],
      futureSignoffArtifacts: [
        "security owner checklist",
        "redaction evidence report",
        "server-only boundary report",
      ],
    }),
    signoffItem({
      id: "backend_phase_order_signoff_packet",
      category: "backend_signoff",
      title: "Backend phase order signoff packet",
      status: "manual_required",
      owner: "backend",
      intent:
        "Define backend signoff requirements for phase order, idempotency gating, audit append behavior, and fail-closed outcomes.",
      sourceReviewItemIds: [
        "adapter_orchestrator_review_packet",
        "idempotency_persistence_review_packet",
        "audit_persistence_review_packet",
      ],
      sourceRefs: [
        "docs/writer-persistence-adapter-design.md",
        "docs/writer-idempotency-registry-model.md",
        "docs/writer-audit-event-model.md",
      ],
      requiredEvidence: [
        "Preflight, idempotency reservation, target write, audit result, finalize, and compensation handoff order is explicit.",
        "Conflicting request hashes are blocked before target writer side effects.",
        "Audit failure blocks high-impact target writes.",
      ],
      signoffQuestions: [
        "Does the phase order match the adapter design exactly?",
        "Does every ambiguous outcome have an operator-visible handoff?",
      ],
      approvalBoundaries: [
        "Backend signoff can confirm code architecture and phase order evidence.",
        "Backend signoff cannot approve security isolation or production rollout alone.",
      ],
      forbiddenDelegations: [
        "delegating phase-order approval to green build output",
        "allowing idempotency to be advisory rather than blocking",
        "allowing audit append failures to be swallowed before target writes",
      ],
      blockingConditions: [
        "Target writes can run before idempotency reservation.",
        "The adapter can run with missing schema verification or missing owner lanes.",
      ],
      nonExecutionClauses: [
        "This item does not implement adapter orchestration.",
        "This item does not run a transaction.",
      ],
      futureSignoffArtifacts: [
        "backend phase-order checklist",
        "idempotency state table approval note",
        "fail-closed scenario review",
      ],
    }),
    signoffItem({
      id: "qa_negative_test_signoff_packet",
      category: "qa_signoff",
      title: "QA negative test signoff packet",
      status: "manual_required",
      owner: "qa",
      intent:
        "Define QA signoff requirements for local-only tests, negative assertions, and acceptance matrix coverage.",
      sourceReviewItemIds: [
        "qa_assertion_review_packet",
        "security_boundary_review_packet",
      ],
      sourceRefs: [
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/writer-persistence-fixture-harness.md",
      ],
      requiredEvidence: [
        "Every future test maps to an acceptance matrix item.",
        "Negative tests fail when dangerous side-effect flags become true.",
        "Tests can run locally without remote mutation or production credentials.",
      ],
      signoffQuestions: [
        "Do tests prove writes, SQL, AI, Stripe, reports, secrets, and private payloads remain blocked?",
        "Can QA reproduce results without mutating remote state?",
      ],
      approvalBoundaries: [
        "QA signoff can confirm evidence coverage and test reproducibility.",
        "QA signoff cannot approve security exceptions or implementation scope alone.",
      ],
      forbiddenDelegations: [
        "delegating QA signoff to route 200 checks only",
        "allowing remote mutations in local QA",
        "allowing tests to pass while dangerous flags are true",
      ],
      blockingConditions: [
        "Tests require real rows, production credentials, AI, Stripe, or report unlocks.",
        "Negative assertions do not cover all blocked runtime effects.",
      ],
      nonExecutionClauses: [
        "This item does not create test files.",
        "This item does not run automated tests.",
      ],
      futureSignoffArtifacts: [
        "QA signoff checklist",
        "negative assertion evidence table",
        "local-only test command plan",
      ],
    }),
    signoffItem({
      id: "operator_compensation_signoff_packet",
      category: "operator_signoff",
      title: "Operator compensation signoff packet",
      status: "manual_required",
      owner: "operator",
      intent:
        "Define operator signoff requirements for ambiguous outcomes, customer support handoff, and non-destructive compensation policy.",
      sourceReviewItemIds: ["compensation_handoff_review_packet"],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      requiredEvidence: [
        "Ambiguous persistence outcomes require operator review.",
        "Protected audit, payment, and consent histories are not deleted.",
        "Support-safe copy is available without private payloads.",
      ],
      signoffQuestions: [
        "Who owns customer escalation after an ambiguous write?",
        "Which records can be superseded instead of deleted?",
      ],
      approvalBoundaries: [
        "Operator signoff can confirm escalation and compensation readiness.",
        "Operator signoff cannot approve target writer execution alone.",
      ],
      forbiddenDelegations: [
        "delegating compensation decisions to automatic rollback",
        "allowing destructive deletion for cleanup",
        "allowing support copy to include private payloads",
      ],
      blockingConditions: [
        "Compensation bypasses operator review.",
        "Rollback logic removes protected historical records.",
      ],
      nonExecutionClauses: [
        "This item does not write compensation rows.",
        "This item does not mutate generated history.",
      ],
      futureSignoffArtifacts: [
        "operator escalation checklist",
        "compensation handoff record template",
        "support-safe response copy",
      ],
    }),
    signoffItem({
      id: "data_protection_signoff_packet",
      category: "data_protection_signoff",
      title: "Data protection signoff packet",
      status: "manual_required",
      owner: "security",
      intent:
        "Define data protection signoff requirements for audit-safe metadata, request hash handling, and raw payload exclusion.",
      sourceReviewItemIds: [
        "audit_persistence_review_packet",
        "security_boundary_review_packet",
      ],
      sourceRefs: [
        "docs/request-hashing-redaction-fixtures.md",
        "docs/writer-evidence-handoff-fixtures.md",
      ],
      requiredEvidence: [
        "Only hashes, safe refs, event names, statuses, and redacted metadata can be persisted in a future implementation.",
        "Raw request bodies and provider payloads remain excluded from persistence.",
        "Evidence persistence cannot occur before explicit future approval.",
      ],
      signoffQuestions: [
        "Are all future persisted fields explicitly allowed?",
        "Does evidence handling avoid raw narrative and provider payload storage?",
      ],
      approvalBoundaries: [
        "Data protection signoff can confirm allowed field boundaries.",
        "Data protection signoff cannot approve database writes or schema changes alone.",
      ],
      forbiddenDelegations: [
        "delegating redaction approval to naming conventions",
        "allowing raw payload storage for debugging",
        "allowing evidence persistence before approval",
      ],
      blockingConditions: [
        "Any future evidence field can contain raw user narrative.",
        "Any future audit field can contain provider payload or credential-like material.",
      ],
      nonExecutionClauses: [
        "This item does not persist evidence.",
        "This item does not store raw payloads.",
      ],
      futureSignoffArtifacts: [
        "allowed field inventory",
        "redaction proof checklist",
        "raw payload exclusion note",
      ],
    }),
    signoffItem({
      id: "product_scope_signoff_packet",
      category: "product_scope_signoff",
      title: "Product scope signoff packet",
      status: "manual_required",
      owner: "founder",
      intent:
        "Define product scope signoff requirements that keep implementation infrastructure separate from user-facing generation, payment, and report behavior.",
      sourceReviewItemIds: ["scope_review_packet"],
      sourceRefs: [
        "docs/mvp-qa-environment.md",
        "docs/controlled-backend-writers.md",
      ],
      requiredEvidence: [
        "The future implementation does not unlock reports.",
        "The future implementation does not call AI or Stripe.",
        "The future implementation does not make graph edges editable.",
      ],
      signoffQuestions: [
        "Does the future implementation stay invisible to end-user product behavior?",
        "Does it preserve the MVP rule that paid deep simulation remains blocked?",
      ],
      approvalBoundaries: [
        "Product scope signoff can confirm non-goals and release boundaries.",
        "Product scope signoff cannot enable production writer flags alone.",
      ],
      forbiddenDelegations: [
        "delegating product release scope to implementation engineers only",
        "allowing infrastructure signoff to unlock reports",
        "allowing payment or AI behavior to ride along with persistence work",
      ],
      blockingConditions: [
        "The patch changes report, payment, AI, or relationship editing behavior.",
        "The patch makes generated or payment-owned records browser-writable.",
      ],
      nonExecutionClauses: [
        "This item does not call AI.",
        "This item does not call Stripe.",
        "This item does not unlock reports.",
      ],
      futureSignoffArtifacts: [
        "product non-goal checklist",
        "release scope exclusion list",
        "MVP boundary note",
      ],
    }),
    signoffItem({
      id: "signoff_record_no_write_packet",
      category: "signoff_record_no_write",
      title: "Signoff record no-write packet",
      status: "packet_ready",
      owner: "backend",
      intent:
        "Define the future shape of owner signoff records while keeping this endpoint unable to create or store approval records.",
      sourceReviewItemIds: [
        "source_diff_contract_invariant_review",
        "final_patch_no_go_review",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-patch-review.md",
        "docs/writer-persistence-implementation-approval-packet.md",
      ],
      requiredEvidence: [
        "Future signoff records must name owner lane, evidence refs, explicit no-go acknowledgements, and timestamp source.",
        "Future signoff records must not contain raw private payloads.",
        "This endpoint keeps approval record creation disabled.",
      ],
      signoffQuestions: [
        "What exact fields would a future signoff record need?",
        "Which fields remain forbidden even in a manual signoff record?",
      ],
      approvalBoundaries: [
        "This packet can describe a future signoff record shape.",
        "This packet cannot write or approve any signoff record.",
      ],
      forbiddenDelegations: [
        "creating approval records from this endpoint",
        "treating descriptive fields as stored signoff",
        "storing raw private payloads in signoff evidence",
      ],
      blockingConditions: [
        "Any approval record is created.",
        "Any endpoint records owner approval or grants implementation approval.",
      ],
      nonExecutionClauses: [
        "This item does not collect signatures.",
        "This item does not write approval records.",
      ],
      futureSignoffArtifacts: [
        "future signoff record field list",
        "forbidden signoff field list",
        "manual approval storage no-go note",
      ],
    }),
    signoffItem({
      id: "final_owner_signoff_no_go",
      category: "final_no_go",
      title: "Final owner signoff no-go",
      status: "blocked_by_patch_review",
      owner: "founder",
      intent:
        "Keep owner signoff as a no-go packet until a later release no-go gate defines how all unresolved blockers are handled.",
      sourceReviewItemIds: ["final_patch_no_go_review"],
      sourceRefs: [
        "docs/writer-persistence-implementation-patch-review.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      requiredEvidence: [
        "No owner signature is collected.",
        "No owner approval is recorded.",
        "No implementation approval, patch acceptance, branch creation, file mutation, migration, write, AI call, Stripe call, or report unlock exists.",
      ],
      signoffQuestions: [
        "Is this endpoint still only a signoff packet?",
        "Are all approval, patch, file, branch, test, database, AI, Stripe, and report effects still blocked?",
      ],
      approvalBoundaries: [
        "Final owner signoff is not granted in this stage.",
        "A later release no-go packet must still preserve every unresolved blocker.",
      ],
      forbiddenDelegations: [
        "recording owner approval",
        "granting implementation approval",
        "creating approval records",
        "accepting patch review",
        "creating branches or implementation files",
      ],
      blockingConditions: [
        "Any owner signoff is recorded.",
        "Any future reviewer treats this packet as permission to implement.",
      ],
      nonExecutionClauses: [
        "This endpoint is the current hard stop.",
        "This endpoint does not collect, record, or grant owner signoff.",
      ],
      futureSignoffArtifacts: [
        "release no-go packet",
        "manual owner signoff runbook",
        "final unresolved blocker inventory",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceOwnerSignoffItem[],
  status: WriterPersistenceOwnerSignoffStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceOwnerSignoffItem[],
  key:
    | "requiredEvidence"
    | "signoffQuestions"
    | "approvalBoundaries"
    | "forbiddenDelegations",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(payload: WriterPersistenceOwnerSignoffPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    ownerSignoffMode: payload.ownerSignoffMode,
    ownerSignoffPacketOnly: true as const,
    sourcePatchReviewAccepted: false as const,
    ownerSignoffSubmitted: false as const,
    ownerSignoffRecorded: false as const,
    ownerSignoffComplete: false as const,
    implementationPatchReviewAccepted: false as const,
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
    readyForReleaseNoGoPacket: false as const,
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

export async function buildWriterPersistenceOwnerSignoff(): Promise<WriterPersistenceOwnerSignoffPayload> {
  const sourcePatchReview = await buildWriterPersistencePatchReview();
  const signoffItems = buildSignoffItems();

  return {
    safeMode: true,
    readOnly: true,
    ownerSignoffMode:
      "persistence_adapter_implementation_owner_signoff_packet_only",
    sourcePatchReviewMode: sourcePatchReview.patchReviewMode,
    checkedAt: new Date().toISOString(),
    signoffItemCount: signoffItems.length,
    packetReadyCount: countByStatus(signoffItems, "packet_ready"),
    blockedSignoffCount: countByStatus(signoffItems, "blocked_by_patch_review"),
    manualSignoffCount: countByStatus(signoffItems, "manual_required"),
    requiredEvidenceCount: uniqueCount(signoffItems, "requiredEvidence"),
    signoffQuestionCount: uniqueCount(signoffItems, "signoffQuestions"),
    approvalBoundaryCount: uniqueCount(signoffItems, "approvalBoundaries"),
    forbiddenDelegationCount: uniqueCount(signoffItems, "forbiddenDelegations"),
    sourcePatchReviewItemCount: sourcePatchReview.reviewItemCount,
    sourcePatchReviewBlockedCount: sourcePatchReview.blockedReviewCount,
    sourcePatchReviewManualCount: sourcePatchReview.manualReviewCount,
    ownerSignoffPacketReady: true,
    ownerSignoffPacketOnly: true,
    sourcePatchReviewPacketReady: sourcePatchReview.patchReviewPacketReady,
    sourcePatchReviewPacketOnly: sourcePatchReview.patchReviewPacketOnly,
    sourcePatchReviewAccepted: false,
    ownerSignoffSubmitted: false,
    ownerSignoffRecorded: false,
    ownerSignoffComplete: false,
    implementationPatchReviewAccepted: false,
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
    readyForReleaseNoGoPacket: false,
    schemaVerified: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allOwnerApprovalsComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    signoffPacketRules: [
      "This endpoint is a read-only owner signoff packet, not a signature collector or approval recorder.",
      "It may define required owner lanes, evidence requirements, signoff questions, approval boundaries, forbidden delegations, blocking conditions, and future artifacts.",
      "It must not collect signatures, record owner approval, grant implementation approval, accept patch review, review a real patch, accept a patch, generate patches, apply patches, create files, modify files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create privileged clients, read privileged secrets, open transactions, write rows, create migrations, call AI, call Stripe, or unlock reports.",
      "The source patch review packet is not accepted, so every owner signoff, implementation patch, file, branch, approval, review, and runtime effect remains blocked.",
    ],
    futureReleaseNoGoGates: [
      "A later release no-go packet explicitly carries forward unresolved owner-lane blockers.",
      "Founder, security, backend, QA, operator, data protection, and product scope lanes are all represented.",
      "No single owner lane can approve implementation without the other required lanes.",
      "Every future signoff artifact excludes raw private payloads and credential-like fields.",
      "Implementation remains blocked until a later non-code human process explicitly records owner decisions outside this endpoint.",
    ],
    signoffItems,
  };
}

export async function probeWriterPersistenceOwnerSignoff(
  requestBody: unknown,
): Promise<WriterPersistenceOwnerSignoffProbeResult> {
  const payload = await buildWriterPersistenceOwnerSignoff();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence owner signoff probe blocked: request body must be a JSON object and no signature collection, owner approval record, implementation approval, patch review acceptance, real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      signoffItems: payload.signoffItems,
    };
  }

  const signoffId = (requestBody as { signoffId?: unknown }).signoffId;

  if (typeof signoffId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence owner signoff probe blocked: signoffId must be a string and no signature collection, owner approval record, implementation approval, patch review acceptance, real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      signoffItems: payload.signoffItems,
    };
  }

  const selectedSignoff = payload.signoffItems.find(
    (candidate) => candidate.id === signoffId,
  );

  if (!selectedSignoff) {
    return {
      ...baseProbeFields(payload),
      summary:
        "Persistence owner signoff probe blocked: unknown signoff id and no signature collection, owner approval record, implementation approval, patch review acceptance, real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
      signoffItems: payload.signoffItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    signoffId: selectedSignoff.id,
    signoffTitle: selectedSignoff.title,
    signoffStatus: selectedSignoff.status,
    summary:
      "Persistence owner signoff probe blocked as designed: the selected signoff item was returned, but no signature collection, owner approval record, implementation approval, patch review acceptance, real patch review, patch acceptance, patch creation, patch application, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    signoffItems: [selectedSignoff],
  };
}
