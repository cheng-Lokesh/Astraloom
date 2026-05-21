import "server-only";

import { buildWriterPersistenceAuthorizationReadiness } from "@/lib/server-writers/persistence-authorization-readiness";
import type {
  WriterPersistenceAuthorizationNoGoItem,
  WriterPersistenceAuthorizationNoGoPayload,
  WriterPersistenceAuthorizationNoGoProbeResult,
  WriterPersistenceAuthorizationNoGoStatus,
} from "@/types/writer-persistence-authorization-no-go";

const blockedCodes = [
  "implementation_authorization_no_go_decision_packet_only",
  "source_authorization_readiness_still_false",
  "external_archive_acceptance_forbidden",
  "archive_completeness_acceptance_forbidden",
  "authorization_record_creation_forbidden",
  "authorization_decision_record_forbidden",
  "authorization_no_go_acceptance_forbidden",
  "implementation_authorization_denial_record_forbidden",
  "implementation_authorization_grant_forbidden",
  "approval_artifact_storage_forbidden",
  "approval_artifact_upload_forbidden",
  "external_artifact_read_forbidden",
  "external_artifact_hash_forbidden",
  "archive_index_persistence_forbidden",
  "human_decision_record_forbidden",
  "release_go_decision_forbidden",
  "release_approval_forbidden",
  "feature_flag_enablement_forbidden",
  "deployment_approval_forbidden",
  "production_writer_execution_forbidden",
  "owner_approval_record_forbidden",
  "patch_review_acceptance_forbidden",
  "patch_generation_forbidden",
  "patch_application_forbidden",
  "file_creation_forbidden",
  "file_modification_forbidden",
  "test_creation_forbidden",
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
  wouldAcceptExternalApprovalArchive: false,
  wouldStoreApprovalArtifact: false,
  wouldUploadApprovalArtifact: false,
  wouldReadExternalArtifact: false,
  wouldHashExternalArtifact: false,
  wouldPersistArchiveIndex: false,
  wouldMarkArchiveComplete: false,
  wouldCreateAuthorizationRecord: false,
  wouldRecordAuthorizationDecision: false,
  wouldRecordAuthorizationNoGoDecision: false,
  wouldAcceptAuthorizationNoGoDecision: false,
  wouldDenyImplementationAuthorization: false,
  wouldGrantImplementationAuthorization: false,
  wouldRecordHumanDecision: false,
  wouldAcceptHumanDecision: false,
  wouldStoreDecisionArtifact: false,
  wouldAcceptReleaseNoGo: false,
  wouldRecordGoDecision: false,
  wouldGrantReleaseApproval: false,
  wouldEnableFeatureFlag: false,
  wouldDeployCode: false,
  wouldRunProductionWriter: false,
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

function decisionItem(
  input: WriterPersistenceAuthorizationNoGoItem,
): WriterPersistenceAuthorizationNoGoItem {
  return input;
}

function buildDecisionItems(): WriterPersistenceAuthorizationNoGoItem[] {
  return [
    decisionItem({
      id: "source_readiness_invariant_no_go",
      category: "source_readiness_invariant",
      title: "Source readiness invariant no-go",
      status: "no_go",
      owner: "founder",
      intent:
        "Carry forward the readiness checklist result without turning it into an authorization record.",
      sourceReadinessItemIds: [
        "source_archive_invariant_readiness",
        "final_authorization_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-authorization-readiness-checklist.md",
        "docs/writer-persistence-external-approval-archive-checklist.md",
      ],
      decisionQuestion:
        "Can implementation authorization be granted while the source readiness checklist still says authorization is not ready?",
      noGoReason:
        "No. The source readiness checklist is evidence-only and keeps implementation authorization readiness false.",
      requiredEvidence: [
        "source readiness mode",
        "source external archive accepted=false",
        "source implementation authorization ready=false",
      ],
      unresolvedBlockers: [
        "authorization readiness is not accepted",
        "external archive is not accepted",
        "release remains blocked",
      ],
      decisionCriteria: [
        "A no-go packet may summarize blockers but cannot accept them.",
        "A later remediation plan is required before any authorization can be reconsidered.",
      ],
      manualReviewSteps: [
        "Confirm readiness output is not treated as approval.",
        "Confirm source blockers remain visible by id.",
      ],
      redactionRules: [
        "Use safe blocker ids only.",
        "Do not include private prompts, narratives, provider payloads, or credentials.",
      ],
      forbiddenActions: [
        "recording authorization decisions",
        "granting implementation authorization",
        "accepting readiness as complete",
      ],
      nonExecutionClauses: [
        "This item does not read external archive artifacts.",
        "This item does not record a no-go decision.",
      ],
      remediationActions: [
        "Prepare a read-only remediation plan.",
        "Keep all implementation execution paths blocked.",
      ],
    }),
    decisionItem({
      id: "archive_acceptance_no_go",
      category: "archive_acceptance_no_go",
      title: "External archive acceptance no-go",
      status: "no_go",
      owner: "founder",
      intent:
        "State that implementation cannot be authorized while external approval archive acceptance is still false.",
      sourceReadinessItemIds: [
        "source_archive_invariant_readiness",
        "archive_coverage_readiness",
      ],
      sourceRefs: [
        "docs/writer-persistence-external-approval-archive-checklist.md",
        "docs/writer-persistence-implementation-authorization-readiness-checklist.md",
      ],
      decisionQuestion:
        "Can this app accept the external archive as complete or authoritative?",
      noGoReason:
        "No. External archive acceptance is explicitly forbidden in this stage and archive completeness remains false.",
      requiredEvidence: [
        "external archive identity",
        "coverage matrix",
        "safe missing-evidence register",
      ],
      unresolvedBlockers: [
        "archive completeness is not accepted",
        "archive index is not persisted",
        "archive artifacts are not read or hashed",
      ],
      decisionCriteria: [
        "Archive review must remain external.",
        "This app response cannot be the approval artifact.",
      ],
      manualReviewSteps: [
        "Confirm no external artifact was uploaded or read.",
        "Confirm missing evidence remains no-go.",
      ],
      redactionRules: [
        "Archive summaries must not paste artifact bodies.",
        "Use safe refs and yes/no/missing states.",
      ],
      forbiddenActions: [
        "accepting external archives",
        "marking archive completeness",
        "persisting archive indexes",
      ],
      nonExecutionClauses: [
        "This item does not inspect external storage.",
        "This item does not create archive metadata.",
      ],
      remediationActions: [
        "Resolve missing external archive coverage outside the app.",
        "Return to archive readiness review after remediation.",
      ],
    }),
    decisionItem({
      id: "authority_boundary_no_go",
      category: "authority_no_go",
      title: "Authority boundary no-go",
      status: "manual_review_required",
      owner: "founder",
      intent:
        "Prevent implied authority from route output, automation, chat history, or unchecked owner lanes.",
      sourceReadinessItemIds: [
        "authority_boundary_readiness",
        "owner_lane_readiness",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-human-go-no-go-runbook.md",
      ],
      decisionQuestion:
        "Can implementation authority be inferred from this route, owner labels, or prior readiness pages?",
      noGoReason:
        "No. Authority must be an explicit external decision and this route cannot collect, record, or accept it.",
      requiredEvidence: [
        "external authority owner",
        "owner lane scope",
        "non-authority statement",
      ],
      unresolvedBlockers: [
        "no authorization authority artifact is accepted",
        "owner approvals are not recorded",
        "release go decision is absent",
      ],
      decisionCriteria: [
        "No automation can grant authority.",
        "No owner lane is complete until externally reviewed.",
      ],
      manualReviewSteps: [
        "Confirm authority is named outside the app.",
        "Confirm the authority artifact does not include private contact data.",
      ],
      redactionRules: [
        "Use role names and lane ids.",
        "Do not store signatures or private identity artifacts.",
      ],
      forbiddenActions: [
        "collecting signatures",
        "recording owner approval",
        "creating approval records",
      ],
      nonExecutionClauses: [
        "This item does not collect authority decisions.",
        "This item does not persist owner status.",
      ],
      remediationActions: [
        "Prepare external authority ownership evidence.",
        "Keep implementation authorization granted=false.",
      ],
    }),
    decisionItem({
      id: "owner_lane_no_go",
      category: "owner_lane_no_go",
      title: "Owner lane no-go",
      status: "manual_review_required",
      owner: "operator",
      intent:
        "Keep implementation blocked until all owner lanes are externally represented and unresolved caveats are mapped.",
      sourceReadinessItemIds: [
        "owner_lane_readiness",
        "archive_coverage_readiness",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-implementation-release-no-go.md",
      ],
      decisionQuestion:
        "Are all owner lanes complete enough to support implementation authorization?",
      noGoReason:
        "No. Owner approvals are not recorded, allOwnerApprovalsComplete remains false, and caveats still require external review.",
      requiredEvidence: [
        "owner lane table",
        "decision state by lane",
        "unresolved caveat register",
      ],
      unresolvedBlockers: [
        "owner lane completion is false",
        "caveats may remain unmapped",
        "approval records are forbidden",
      ],
      decisionCriteria: [
        "Every lane must have a current external artifact.",
        "Every caveat must map to a blocker or remediation action.",
      ],
      manualReviewSteps: [
        "Confirm each lane artifact is current.",
        "Confirm no owner approval was recorded in the app.",
      ],
      redactionRules: [
        "Use lane ids instead of private identities.",
        "Do not include private contact details.",
      ],
      forbiddenActions: [
        "recording owner approvals",
        "granting implementation approval",
        "accepting patch review",
      ],
      nonExecutionClauses: [
        "This item does not mark owner lanes complete.",
        "This item does not create approval records.",
      ],
      remediationActions: [
        "Complete missing owner lane artifacts externally.",
        "Return to readiness review before any implementation scope review.",
      ],
    }),
    decisionItem({
      id: "security_data_no_go",
      category: "security_no_go",
      title: "Security and data-protection no-go",
      status: "no_go",
      owner: "security",
      intent:
        "Block authorization until service-role isolation, redaction, retention, and protected-history rules are externally reviewed.",
      sourceReadinessItemIds: [
        "security_data_readiness",
        "rollback_observability_readiness",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/request-hashing-redaction-fixtures.md",
      ],
      decisionQuestion:
        "Can code implementation start before security and data-protection evidence is externally accepted?",
      noGoReason:
        "No. Service-role secrets remain unread, no privileged client exists, and raw evidence storage remains forbidden.",
      requiredEvidence: [
        "service-role isolation review",
        "redaction policy confirmation",
        "protected-history retention statement",
      ],
      unresolvedBlockers: [
        "service-role boundary not authorized",
        "raw payload storage forbidden",
        "protected history rollback risk remains",
      ],
      decisionCriteria: [
        "No implementation branch until secret handling is externally approved.",
        "No rollback plan may delete protected audit, payment, consent, or generated history.",
      ],
      manualReviewSteps: [
        "Confirm service-role client factory is absent.",
        "Confirm no raw payloads or secrets are persisted.",
      ],
      redactionRules: [
        "Exclude prompts, private narratives, provider payloads, debug bodies, secrets, tokens, and webhook bodies.",
        "Use hashes, safe refs, and blocker ids.",
      ],
      forbiddenActions: [
        "creating service-role clients",
        "reading service-role secrets",
        "storing raw payloads",
      ],
      nonExecutionClauses: [
        "This item does not inspect secrets.",
        "This item does not modify RLS or permissions.",
      ],
      remediationActions: [
        "Complete external security and data-protection signoff.",
        "Keep privileged client and writes blocked.",
      ],
    }),
    decisionItem({
      id: "backend_schema_no_go",
      category: "backend_schema_no_go",
      title: "Backend and schema no-go",
      status: "manual_review_required",
      owner: "backend",
      intent:
        "Keep adapter implementation blocked until schema, migration, transaction, audit, and idempotency evidence are externally reconciled.",
      sourceReadinessItemIds: [
        "backend_schema_readiness",
        "implementation_scope_readiness",
      ],
      sourceRefs: [
        "docs/writer-applied-schema-verification-harness.md",
        "docs/writer-persistence-adapter-design.md",
      ],
      decisionQuestion:
        "Can the adapter be implemented before schema and transaction evidence is accepted?",
      noGoReason:
        "No. Schema verification and transaction behavior remain review evidence only and no adapter code may be created.",
      requiredEvidence: [
        "schema verification result",
        "transaction order review",
        "idempotency and audit behavior review",
      ],
      unresolvedBlockers: [
        "schema readiness is not accepted",
        "migration creation is forbidden",
        "adapter implementation allowed=false",
      ],
      decisionCriteria: [
        "No adapter code until schema and transaction order are accepted externally.",
        "No migration file may be created by this stage.",
      ],
      manualReviewSteps: [
        "Confirm migration directory remains unchanged.",
        "Confirm adapter implementation files are absent.",
      ],
      redactionRules: [
        "Use table names, method names, and safe refs only.",
        "Do not include database credentials or private query bodies.",
      ],
      forbiddenActions: [
        "creating migration files",
        "creating adapter code",
        "running transactions",
      ],
      nonExecutionClauses: [
        "This item does not inspect privileged database state.",
        "This item does not create code.",
      ],
      remediationActions: [
        "Resolve schema and transaction evidence externally.",
        "Keep adapterImplemented=false.",
      ],
    }),
    decisionItem({
      id: "qa_acceptance_no_go",
      category: "qa_acceptance_no_go",
      title: "QA and acceptance no-go",
      status: "manual_review_required",
      owner: "qa",
      intent:
        "Block implementation until acceptance assertions, fixtures, route invariants, and browser-write boundaries are reviewed.",
      sourceReadinessItemIds: [
        "qa_acceptance_readiness",
        "archive_coverage_readiness",
      ],
      sourceRefs: [
        "docs/writer-persistence-fixture-harness.md",
        "docs/mvp-qa-environment.md",
      ],
      decisionQuestion:
        "Can implementation begin before QA acceptance evidence is externally accepted?",
      noGoReason:
        "No. Acceptance remains planned, no test files are created, and generated/payment tables must remain browser read-only.",
      requiredEvidence: [
        "acceptance assertion list",
        "fixture coverage map",
        "route invariant checklist",
      ],
      unresolvedBlockers: [
        "acceptance tests are not created",
        "automated tests are not run",
        "browser boundary remains a release blocker",
      ],
      decisionCriteria: [
        "Every future implementation path needs a planned assertion.",
        "Browser writes stay limited to user-authored draft tables.",
      ],
      manualReviewSteps: [
        "Confirm QA artifacts are external and redacted.",
        "Confirm no test files were created by this stage.",
      ],
      redactionRules: [
        "Use fixture refs and safe route names.",
        "Do not paste user narratives into QA evidence.",
      ],
      forbiddenActions: [
        "creating test files",
        "running automated implementation tests",
        "changing browser write policies",
      ],
      nonExecutionClauses: [
        "This item does not create tests.",
        "This item does not run test automation.",
      ],
      remediationActions: [
        "Complete external QA acceptance mapping.",
        "Return to readiness review after coverage is complete.",
      ],
    }),
    decisionItem({
      id: "rollback_observability_no_go",
      category: "rollback_observability_no_go",
      title: "Rollback and observability no-go",
      status: "manual_review_required",
      owner: "operator",
      intent:
        "Block authorization until operators can detect, abort, compensate, and support future implementation failures.",
      sourceReadinessItemIds: [
        "rollback_observability_readiness",
        "security_data_readiness",
      ],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-rollout-checklist.md",
      ],
      decisionQuestion:
        "Can implementation start before rollback and observability evidence is accepted?",
      noGoReason:
        "No. Compensation rows are not written, rollout gates are not enabled, and release execution remains false.",
      requiredEvidence: [
        "compensation behavior review",
        "observability signal list",
        "abort and support handoff",
      ],
      unresolvedBlockers: [
        "compensation behavior not accepted",
        "observability signals not accepted",
        "release execution remains false",
      ],
      decisionCriteria: [
        "Compensation must never destructively delete protected history.",
        "Abort rules must precede feature flags and production writers.",
      ],
      manualReviewSteps: [
        "Confirm protected history is not mutated.",
        "Confirm support evidence uses safe refs only.",
      ],
      redactionRules: [
        "Use event ids, safe refs, and summarized outcomes.",
        "Do not include raw payload bodies.",
      ],
      forbiddenActions: [
        "writing compensation rows",
        "enabling rollout gates",
        "deploying code",
      ],
      nonExecutionClauses: [
        "This item does not write compensation records.",
        "This item does not enable rollout or observability systems.",
      ],
      remediationActions: [
        "Complete external rollback and observability review.",
        "Keep readyForReleaseExecution=false.",
      ],
    }),
    decisionItem({
      id: "implementation_scope_no_go",
      category: "implementation_scope_no_go",
      title: "Implementation scope no-go",
      status: "no_go",
      owner: "backend",
      intent:
        "Prevent implementation work from starting before allowed files, forbidden changes, and phase order are externally accepted.",
      sourceReadinessItemIds: [
        "implementation_scope_readiness",
        "backend_schema_readiness",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-branch-preflight.md",
        "docs/writer-persistence-implementation-diff-contract.md",
      ],
      decisionQuestion:
        "Can a branch, patch, file, test, or adapter implementation be created now?",
      noGoReason:
        "No. Branch creation, patch generation, file creation, test creation, and adapter code remain forbidden.",
      requiredEvidence: [
        "allowed file list",
        "forbidden change list",
        "phase order and rollback checkpoints",
      ],
      unresolvedBlockers: [
        "branch creation is not approved",
        "implementation scope is not accepted",
        "readyToCreateImplementationBranch=false",
      ],
      decisionCriteria: [
        "No implementation branch until scope is externally accepted.",
        "No patch may be generated from this decision packet.",
      ],
      manualReviewSteps: [
        "Confirm no git command is run.",
        "Confirm no implementation file is created or modified.",
      ],
      redactionRules: [
        "Scope evidence should reference paths and symbols only.",
        "Do not include private payload examples.",
      ],
      forbiddenActions: [
        "creating branches",
        "generating patches",
        "creating files",
      ],
      nonExecutionClauses: [
        "This item does not create implementation plans.",
        "This item does not modify files.",
      ],
      remediationActions: [
        "Prepare external scope remediation.",
        "Keep readyToCreateImplementationBranch=false.",
      ],
    }),
    decisionItem({
      id: "final_authorization_no_go",
      category: "final_authorization_no_go",
      title: "Final implementation authorization no-go",
      status: "no_go",
      owner: "founder",
      intent:
        "State the final current decision shape: implementation authorization is not granted and no execution work may start.",
      sourceReadinessItemIds: [
        "final_authorization_hard_stop",
        "source_archive_invariant_readiness",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-authorization-readiness-checklist.md",
        "docs/codex-next-task.md",
      ],
      decisionQuestion:
        "Is there any path from this packet to implementation authorization, branch creation, code changes, migrations, writes, AI, Stripe, deployment, feature flags, production writers, or report unlocks?",
      noGoReason:
        "No. This is a no-go packet only; implementation authorization remains false and all runtime effects remain blocked.",
      requiredEvidence: [
        "all decision items visible",
        "all runtime effect flags blocked",
        "remediation plan still required",
      ],
      unresolvedBlockers: [
        "no authorization decision is recorded",
        "no archive is accepted",
        "no implementation readiness is accepted",
      ],
      decisionCriteria: [
        "No-go packet ready does not equal decision acceptance.",
        "Remediation must be planned before reconsidering authorization.",
      ],
      manualReviewSteps: [
        "Confirm every forbidden runtime effect is false.",
        "Confirm the next stage remains read-only.",
      ],
      redactionRules: [
        "Use safe blocker ids and summaries only.",
        "Do not include private examples, provider payloads, or credential-like values.",
      ],
      forbiddenActions: [
        "accepting the no-go decision in the app",
        "denying or granting authorization in the app",
        "starting implementation",
      ],
      nonExecutionClauses: [
        "This packet is a read-only current-state no-go summary.",
        "This packet does not record or accept any decision.",
      ],
      remediationActions: [
        "Prepare a read-only authorization remediation plan.",
        "Keep every implementation execution path disabled.",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceAuthorizationNoGoItem[],
  status: WriterPersistenceAuthorizationNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationNoGoItem[],
  key:
    | "requiredEvidence"
    | "unresolvedBlockers"
    | "decisionCriteria"
    | "manualReviewSteps"
    | "redactionRules"
    | "forbiddenActions"
    | "remediationActions",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(payload: WriterPersistenceAuthorizationNoGoPayload) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    authorizationNoGoMode: payload.authorizationNoGoMode,
    authorizationNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    externalApprovalArchiveAccepted: false as const,
    archiveCompletenessAccepted: false as const,
    implementationAuthorizationDecisionReady: false as const,
    implementationAuthorizationDecisionRecorded: false as const,
    implementationAuthorizationNoGoAccepted: false as const,
    implementationAuthorizationDenied: false as const,
    implementationAuthorizationGranted: false as const,
    implementationAuthorized: false as const,
    authorizationDecisionRecorded: false as const,
    authorizationArtifactStored: false as const,
    implementationApprovalGranted: false as const,
    implementationBranchApproved: false as const,
    implementationPlanApproved: false as const,
    readyToApplyPatch: false as const,
    readyToCreateImplementationBranch: false as const,
    readyForAdapterImplementation: false as const,
    readyForReleaseExecution: false as const,
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

export async function buildWriterPersistenceAuthorizationNoGo(): Promise<WriterPersistenceAuthorizationNoGoPayload> {
  const sourceReadiness = await buildWriterPersistenceAuthorizationReadiness();
  const decisionItems = buildDecisionItems();

  return {
    safeMode: true,
    readOnly: true,
    authorizationNoGoMode:
      "persistence_adapter_implementation_authorization_no_go_decision_packet_only",
    sourceAuthorizationReadinessMode:
      sourceReadiness.authorizationReadinessMode,
    checkedAt: new Date().toISOString(),
    decisionItemCount: decisionItems.length,
    noGoCount: countByStatus(decisionItems, "no_go"),
    manualReviewRequiredCount: countByStatus(
      decisionItems,
      "manual_review_required",
    ),
    requiredEvidenceCount: uniqueCount(decisionItems, "requiredEvidence"),
    unresolvedBlockerCount: uniqueCount(decisionItems, "unresolvedBlockers"),
    decisionCriteriaCount: uniqueCount(decisionItems, "decisionCriteria"),
    manualReviewStepCount: uniqueCount(decisionItems, "manualReviewSteps"),
    redactionRuleCount: uniqueCount(decisionItems, "redactionRules"),
    forbiddenActionCount: uniqueCount(decisionItems, "forbiddenActions"),
    remediationActionCount: uniqueCount(decisionItems, "remediationActions"),
    sourceReadinessItemCount: sourceReadiness.readinessItemCount,
    sourceManualRequiredCount: sourceReadiness.manualRequiredCount,
    authorizationNoGoPacketReady: true,
    authorizationNoGoPacketOnly: true,
    sourceAuthorizationReadinessReady:
      sourceReadiness.authorizationReadinessChecklistReady,
    sourceAuthorizationReadinessOnly:
      sourceReadiness.authorizationReadinessChecklistOnly,
    sourceReleaseStillBlocked: sourceReadiness.sourceReleaseStillBlocked,
    sourceImplementationAuthorizationReady:
      sourceReadiness.implementationAuthorizationReady,
    sourceExternalApprovalArchiveAccepted:
      sourceReadiness.externalApprovalArchiveAccepted,
    externalApprovalArchiveAccepted: false,
    archiveCompletenessAccepted: false,
    implementationAuthorizationDecisionReady: false,
    implementationAuthorizationDecisionRecorded: false,
    implementationAuthorizationNoGoAccepted: false,
    implementationAuthorizationDenied: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    authorizationDecisionRecorded: false,
    authorizationArtifactStored: false,
    implementationApprovalGranted: false,
    implementationBranchApproved: false,
    implementationPlanApproved: false,
    readyToApplyPatch: false,
    readyToCreateImplementationBranch: false,
    readyForAdapterImplementation: false,
    readyForReleaseExecution: false,
    adapterImplemented: false,
    adapterImplementationApproved: false,
    adapterImplementationAllowed: false,
    implementationReviewComplete: false,
    allOwnerApprovalsComplete: false,
    allBlockingEvidenceReady: false,
    ...runtimeBlockedFlags,
    blockedCodes,
    authorizationNoGoRules: [
      "This endpoint is a read-only implementation authorization no-go decision packet, not an authorization system.",
      "It may summarize current no-go reasons, unresolved blockers, decision criteria, manual review steps, redaction rules, forbidden actions, and remediation actions.",
      "It must not accept external archives, mark archive completeness, create authorization records, record or accept no-go decisions, deny or grant implementation authorization, record human decisions, store approvals, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
      "No-go packet readiness does not equal persisted decision acceptance; a later remediation plan is still required.",
    ],
    remediationRules: [
      "Future remediation must remain external or read-only until an approved persistence model exists.",
      "Remediation evidence must use safe blocker ids, owner lanes, safe evidence refs, redaction state, retention owner, and unresolved caveats.",
      "Remediation evidence must exclude raw prompts, private narratives, provider payloads, private debug bodies, tokens, secrets, webhook bodies, and credential-like values.",
      "This app route response must not be archived as approval, denial, or authorization.",
      "A later read-only remediation plan is required before any implementation branch, patch, test, migration, writer, deployment, AI, Stripe, or report unlock work proceeds.",
    ],
    sourceBlockedCodes: sourceReadiness.blockedCodes,
    decisionItems,
  };
}

export async function probeWriterPersistenceAuthorizationNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationNoGoProbeResult> {
  const payload = await buildWriterPersistenceAuthorizationNoGo();
  const blockedSummary =
    "Persistence authorization no-go probe blocked: no archive acceptance, archive completeness acceptance, authorization record, authorization decision record, no-go decision acceptance, implementation authorization denial record, implementation authorization grant, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      decisionItems: payload.decisionItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      decisionItems: payload.decisionItems,
    };
  }

  const selectedItem = payload.decisionItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      decisionItems: payload.decisionItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization no-go probe blocked as designed: the selected no-go item was returned, but no archive acceptance, archive completeness acceptance, authorization record, authorization decision record, no-go decision acceptance, implementation authorization denial record, implementation authorization grant, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    decisionItems: [selectedItem],
  };
}
