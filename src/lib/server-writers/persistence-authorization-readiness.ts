import "server-only";

import { buildWriterPersistenceExternalApprovalArchive } from "@/lib/server-writers/persistence-external-approval-archive";
import type {
  WriterPersistenceAuthorizationReadinessItem,
  WriterPersistenceAuthorizationReadinessPayload,
  WriterPersistenceAuthorizationReadinessProbeResult,
  WriterPersistenceAuthorizationReadinessStatus,
} from "@/types/writer-persistence-authorization-readiness";

const blockedCodes = [
  "implementation_authorization_readiness_checklist_only",
  "source_external_archive_not_accepted",
  "external_approval_archive_acceptance_forbidden",
  "archive_completeness_acceptance_forbidden",
  "authorization_record_creation_forbidden",
  "authorization_decision_record_forbidden",
  "implementation_authorization_forbidden",
  "approval_artifact_storage_forbidden",
  "approval_artifact_upload_forbidden",
  "external_artifact_read_forbidden",
  "external_artifact_hash_forbidden",
  "archive_index_persistence_forbidden",
  "human_decision_record_forbidden",
  "human_decision_acceptance_forbidden",
  "decision_artifact_storage_forbidden",
  "release_go_decision_forbidden",
  "release_approval_forbidden",
  "feature_flag_enablement_forbidden",
  "deployment_approval_forbidden",
  "production_writer_approval_forbidden",
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

function readinessItem(
  input: WriterPersistenceAuthorizationReadinessItem,
): WriterPersistenceAuthorizationReadinessItem {
  return input;
}

function buildReadinessItems(): WriterPersistenceAuthorizationReadinessItem[] {
  return [
    readinessItem({
      id: "source_archive_invariant_readiness",
      category: "source_archive_invariant",
      title: "Source external archive invariant readiness",
      status: "blocked_by_external_archive",
      owner: "founder",
      intent:
        "Carry forward the rule that the previous archive checklist is not an accepted approval archive and cannot authorize implementation.",
      sourceArchiveItemIds: [
        "source_human_runbook_invariant_archive",
        "final_external_archive_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-external-approval-archive-checklist.md",
        "docs/writer-persistence-human-go-no-go-runbook.md",
      ],
      readinessQuestion:
        "Can a reviewer prove that the external archive exists, is complete, and is still not accepted by this app?",
      requiredEvidence: [
        "external archive identity manifest",
        "current/superseded artifact status list",
        "source archive blocker mapping",
      ],
      archiveAcceptanceCriteria: [
        "The external archive must be reviewable outside the app.",
        "The app must not store, upload, read, hash, index, or accept the archive.",
      ],
      authorizationBlockers: [
        "source external archive is not accepted",
        "source release remains blocked",
        "human decisions remain external",
      ],
      manualChecks: [
        "Confirm every source archive item is traceable by id.",
        "Confirm this route output is not treated as an approval artifact.",
      ],
      redactionRules: [
        "Use blocker ids and safe refs only.",
        "Do not paste private prompts, private narratives, provider payloads, or credentials.",
      ],
      forbiddenActions: [
        "accepting the external archive",
        "granting implementation authorization",
        "creating authorization records",
      ],
      nonExecutionClauses: [
        "This item does not inspect external artifacts.",
        "This item does not mark archive completeness.",
      ],
      nextIfBlocked: [
        "Prepare an external archive review summary outside the app.",
        "Keep implementation authorization false until a later no-write decision packet exists.",
      ],
    }),
    readinessItem({
      id: "authority_boundary_readiness",
      category: "authority_boundary",
      title: "Authority boundary readiness",
      status: "manual_required",
      owner: "founder",
      intent:
        "Define who may eventually authorize implementation and which powers remain outside the app until a separate decision exists.",
      sourceArchiveItemIds: [
        "owner_metadata_completeness_checklist",
        "final_external_archive_hard_stop",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-implementation-release-no-go.md",
      ],
      readinessQuestion:
        "Is the future implementation authority explicit, accountable, and unable to be inferred from a route response?",
      requiredEvidence: [
        "named accountable authority lane",
        "authorization scope statement",
        "explicit non-authority statement for this app route",
      ],
      archiveAcceptanceCriteria: [
        "Authority must be documented externally.",
        "Authority must reference exact blocker ids and owner lanes.",
      ],
      authorizationBlockers: [
        "no in-app authorization record exists",
        "no owner approval can be inferred",
        "no release go decision exists",
      ],
      manualChecks: [
        "Confirm authorization authority is not delegated to automation.",
        "Confirm authority does not include deployment or production writer execution.",
      ],
      redactionRules: [
        "Use business roles rather than private contact data.",
        "Do not include signatures or private identity artifacts in this app.",
      ],
      forbiddenActions: [
        "collecting signatures",
        "recording owner approval",
        "granting implementation approval",
      ],
      nonExecutionClauses: [
        "This item names authority requirements only.",
        "This item does not collect or persist authority decisions.",
      ],
      nextIfBlocked: [
        "Create an external authority ownership note.",
        "Keep branch creation and implementation files blocked.",
      ],
    }),
    readinessItem({
      id: "archive_coverage_readiness",
      category: "archive_coverage",
      title: "Archive coverage readiness",
      status: "manual_required",
      owner: "qa",
      intent:
        "Check whether every required lane, blocker, and evidence class has an external artifact before authorization is even reviewable.",
      sourceArchiveItemIds: [
        "archive_completeness_gate_checklist",
        "blocker_cross_reference_checklist",
      ],
      sourceRefs: [
        "docs/writer-persistence-acceptance-test-matrix.md",
        "docs/writer-persistence-no-go-evidence-packet.md",
      ],
      readinessQuestion:
        "Does the external archive cover every blocker that would prevent implementation authorization?",
      requiredEvidence: [
        "lane coverage matrix",
        "blocker cross-reference table",
        "missing evidence register",
      ],
      archiveAcceptanceCriteria: [
        "Every hard blocker maps to a current external artifact.",
        "Every missing artifact has an explicit no-go note.",
      ],
      authorizationBlockers: [
        "missing current artifact",
        "unmapped release blocker",
        "artifact status is superseded or rejected",
      ],
      manualChecks: [
        "Confirm there is one current artifact per required lane.",
        "Confirm missing evidence is not silently treated as passed.",
      ],
      redactionRules: [
        "Coverage summaries must not copy raw artifact bodies.",
        "Use yes/no/missing states and safe evidence refs.",
      ],
      forbiddenActions: [
        "marking coverage complete in the app",
        "persisting coverage results",
        "accepting archive completeness",
      ],
      nonExecutionClauses: [
        "This item does not validate real external artifacts.",
        "This item does not write coverage results.",
      ],
      nextIfBlocked: [
        "Return to the external archive owner for missing artifacts.",
        "Keep implementation authorization readiness false.",
      ],
    }),
    readinessItem({
      id: "owner_lane_readiness",
      category: "owner_lane_readiness",
      title: "Owner lane readiness",
      status: "manual_required",
      owner: "operator",
      intent:
        "Ensure founder, security, backend, QA, migration, operator, and data-protection lanes are externally represented before authorization review.",
      sourceArchiveItemIds: [
        "owner_metadata_completeness_checklist",
        "archive_identity_manifest_checklist",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-owner-signoff.md",
        "docs/writer-persistence-human-go-no-go-runbook.md",
      ],
      readinessQuestion:
        "Can every accountable lane be reviewed without creating an approval record inside the app?",
      requiredEvidence: [
        "owner lane table",
        "decision state per lane",
        "unresolved caveat register",
      ],
      archiveAcceptanceCriteria: [
        "Every required lane has one current external artifact.",
        "Every artifact names scope, date, status, and caveats.",
      ],
      authorizationBlockers: [
        "owner lane missing",
        "decision state unclear",
        "caveat not mapped to a blocker",
      ],
      manualChecks: [
        "Confirm no lane is represented only by chat memory or route output.",
        "Confirm all caveats remain visible to the future reviewer.",
      ],
      redactionRules: [
        "Do not copy private contact details.",
        "Use role names and lane ids for reviewer identity.",
      ],
      forbiddenActions: [
        "recording owner approvals",
        "creating approval records",
        "granting implementation approval",
      ],
      nonExecutionClauses: [
        "This item does not collect owner signatures.",
        "This item does not change owner status.",
      ],
      nextIfBlocked: [
        "Request missing lane artifacts outside the app.",
        "Keep all owner approval completion flags false.",
      ],
    }),
    readinessItem({
      id: "security_data_readiness",
      category: "security_readiness",
      title: "Security and data-protection readiness",
      status: "manual_required",
      owner: "security",
      intent:
        "Require explicit external review of service-role isolation, redaction, retention, and protected history before implementation is reviewable.",
      sourceArchiveItemIds: [
        "evidence_redaction_archive_checklist",
        "retention_access_control_checklist",
      ],
      sourceRefs: [
        "docs/service-role-isolation-test-harness.md",
        "docs/request-hashing-redaction-fixtures.md",
      ],
      readinessQuestion:
        "Are secrets, private evidence, protected history, and service-role boundaries reviewed before any implementation work starts?",
      requiredEvidence: [
        "service-role isolation note",
        "redaction review summary",
        "retention and protected-history statement",
      ],
      archiveAcceptanceCriteria: [
        "No raw private or credential-like material is archived.",
        "Protected audit, payment, consent, and generated history cannot be destructively deleted.",
      ],
      authorizationBlockers: [
        "service-role boundary not reviewed",
        "redaction rules incomplete",
        "retention owner missing",
      ],
      manualChecks: [
        "Confirm service-role secrets remain server-only and unread.",
        "Confirm rollback cannot delete protected history.",
      ],
      redactionRules: [
        "Exclude raw prompts, private narratives, provider payloads, debug bodies, secrets, tokens, and webhook bodies.",
        "Use hashes, safe refs, table names, and blocker ids.",
      ],
      forbiddenActions: [
        "creating service-role clients",
        "reading service-role secrets",
        "storing raw payloads",
      ],
      nonExecutionClauses: [
        "This item does not inspect secrets.",
        "This item does not read or store private evidence.",
      ],
      nextIfBlocked: [
        "Return to security and data-protection review outside the app.",
        "Keep service-role client creation and writes blocked.",
      ],
    }),
    readinessItem({
      id: "backend_schema_readiness",
      category: "backend_readiness",
      title: "Backend and schema readiness",
      status: "manual_required",
      owner: "backend",
      intent:
        "Require external evidence that schema, migration, adapter design, idempotency, audit, and transaction expectations are coherent before implementation authorization.",
      sourceArchiveItemIds: [
        "blocker_cross_reference_checklist",
        "tamper_evidence_checksum_checklist",
      ],
      sourceRefs: [
        "docs/writer-applied-schema-verification-harness.md",
        "docs/writer-persistence-adapter-design.md",
      ],
      readinessQuestion:
        "Is the future adapter implementation technically reviewable without creating code, migrations, service-role clients, or writes now?",
      requiredEvidence: [
        "applied-schema verification evidence",
        "adapter method contract summary",
        "transaction and idempotency order evidence",
      ],
      archiveAcceptanceCriteria: [
        "Schema readiness must be externally reviewed.",
        "Adapter design must still be design-only until authorization is separately granted.",
      ],
      authorizationBlockers: [
        "schema not externally verified",
        "transaction order not reviewed",
        "idempotency behavior not accepted",
      ],
      manualChecks: [
        "Confirm no new migration file is created by this stage.",
        "Confirm no service-role client factory exists.",
      ],
      redactionRules: [
        "Use table names and method names only.",
        "Do not include database credentials or private query payloads.",
      ],
      forbiddenActions: [
        "creating migration files",
        "applying migrations",
        "creating adapter code",
      ],
      nonExecutionClauses: [
        "This item does not inspect database state.",
        "This item does not create executable adapter code.",
      ],
      nextIfBlocked: [
        "Return to schema verification and adapter design review.",
        "Keep adapter implementation allowed=false.",
      ],
    }),
    readinessItem({
      id: "qa_acceptance_readiness",
      category: "qa_readiness",
      title: "QA and acceptance readiness",
      status: "manual_required",
      owner: "qa",
      intent:
        "Require external QA evidence for acceptance matrix, fixture coverage, browser boundaries, and route invariants before implementation authorization review.",
      sourceArchiveItemIds: [
        "archive_completeness_gate_checklist",
        "blocker_cross_reference_checklist",
      ],
      sourceRefs: [
        "docs/writer-persistence-fixture-harness.md",
        "docs/mvp-qa-environment.md",
      ],
      readinessQuestion:
        "Can QA explain what must pass after implementation without creating tests or running automated tests now?",
      requiredEvidence: [
        "acceptance matrix review summary",
        "fixture coverage summary",
        "route invariant checklist",
      ],
      archiveAcceptanceCriteria: [
        "Every required acceptance path has a planned assertion.",
        "Browser-write boundaries remain limited to user-authored draft tables.",
      ],
      authorizationBlockers: [
        "missing acceptance assertion",
        "fixture coverage incomplete",
        "browser boundary unclear",
      ],
      manualChecks: [
        "Confirm future tests are named but not created.",
        "Confirm generated/payment tables remain browser read-only.",
      ],
      redactionRules: [
        "Test evidence must use safe fixture refs.",
        "Do not paste user narratives into QA artifacts.",
      ],
      forbiddenActions: [
        "creating test files",
        "running automated implementation tests",
        "changing browser write policies",
      ],
      nonExecutionClauses: [
        "This item does not create tests.",
        "This item does not run QA automation.",
      ],
      nextIfBlocked: [
        "Return to acceptance matrix and fixture harness review.",
        "Keep readyForAdapterImplementation=false.",
      ],
    }),
    readinessItem({
      id: "rollback_observability_readiness",
      category: "rollback_observability",
      title: "Rollback and observability readiness",
      status: "manual_required",
      owner: "operator",
      intent:
        "Require rollback, compensation, observability, abort, and support handoff evidence before any implementation authorization is considered.",
      sourceArchiveItemIds: [
        "retention_access_control_checklist",
        "tamper_evidence_checksum_checklist",
      ],
      sourceRefs: [
        "docs/writer-rollback-compensation-model.md",
        "docs/writer-rollout-checklist.md",
      ],
      readinessQuestion:
        "Can operators detect, abort, compensate, and support a failed implementation without destructive rollback?",
      requiredEvidence: [
        "rollback compensation review note",
        "observability signal list",
        "abort and support handoff checklist",
      ],
      archiveAcceptanceCriteria: [
        "Compensation must not delete protected records.",
        "Abort criteria must exist before feature flags or writer execution.",
      ],
      authorizationBlockers: [
        "compensation behavior not reviewed",
        "observability signal missing",
        "support handoff undefined",
      ],
      manualChecks: [
        "Confirm rollback is compensating, not destructive.",
        "Confirm support can identify failed runs without private payloads.",
      ],
      redactionRules: [
        "Operational evidence must avoid raw payload bodies.",
        "Use event ids, safe refs, and summarized outcomes.",
      ],
      forbiddenActions: [
        "writing compensation rows",
        "enabling rollout gates",
        "deploying code",
      ],
      nonExecutionClauses: [
        "This item does not create compensation records.",
        "This item does not enable observability integrations.",
      ],
      nextIfBlocked: [
        "Return to rollback and rollout evidence review.",
        "Keep readyForReleaseExecution=false.",
      ],
    }),
    readinessItem({
      id: "implementation_scope_readiness",
      category: "implementation_scope",
      title: "Implementation scope readiness",
      status: "manual_required",
      owner: "backend",
      intent:
        "Define the future implementation scope boundary before any branch, patch, file, test, migration, or service-role work can begin.",
      sourceArchiveItemIds: [
        "artifact_naming_convention_checklist",
        "blocker_cross_reference_checklist",
      ],
      sourceRefs: [
        "docs/writer-persistence-implementation-branch-preflight.md",
        "docs/writer-persistence-implementation-diff-contract.md",
      ],
      readinessQuestion:
        "Is the future implementation scope narrow enough to review without starting implementation now?",
      requiredEvidence: [
        "allowed file list",
        "forbidden change list",
        "implementation phase order",
      ],
      archiveAcceptanceCriteria: [
        "Allowed scope must exclude unrelated refactors.",
        "Forbidden scope must preserve migrations, browser writes, AI, Stripe, and report unlock blocks.",
      ],
      authorizationBlockers: [
        "allowed files not named",
        "forbidden files not named",
        "phase order not reviewed",
      ],
      manualChecks: [
        "Confirm no branch is created by this stage.",
        "Confirm no patch is generated or applied.",
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
      nextIfBlocked: [
        "Return to branch preflight and diff contract review.",
        "Keep readyToCreateImplementationBranch=false.",
      ],
    }),
    readinessItem({
      id: "final_authorization_hard_stop",
      category: "final_authorization_hard_stop",
      title: "Final implementation authorization hard stop",
      status: "blocked_by_external_archive",
      owner: "founder",
      intent:
        "Keep implementation authorization blocked until a later no-write decision packet can externally review every readiness item.",
      sourceArchiveItemIds: [
        "final_external_archive_hard_stop",
        "archive_completeness_gate_checklist",
      ],
      sourceRefs: [
        "docs/writer-persistence-external-approval-archive-checklist.md",
        "docs/codex-next-task.md",
      ],
      readinessQuestion:
        "Is there still no archive acceptance, authorization record, implementation authorization, branch, patch, file, test, service-role client, transaction, migration, database write, AI call, Stripe call, report unlock, deployment, feature flag, or production writer run?",
      requiredEvidence: [
        "all readiness items reviewed externally",
        "all blockers mapped to explicit no-go/go state",
        "separate no-write authorization decision packet still required",
      ],
      archiveAcceptanceCriteria: [
        "Readiness review does not equal authorization.",
        "Authorization must remain false in this app.",
      ],
      authorizationBlockers: [
        "no authorization decision packet exists",
        "external archive acceptance is still false",
        "implementation branch readiness is still false",
      ],
      manualChecks: [
        "Confirm every runtime effect flag is blocked.",
        "Confirm the next stage is still read-only.",
      ],
      redactionRules: [
        "Final hard-stop notes use safe blocker ids only.",
        "Do not include private examples, provider payloads, or credential-like values.",
      ],
      forbiddenActions: [
        "granting implementation authorization",
        "creating authorization records",
        "starting implementation",
      ],
      nonExecutionClauses: [
        "This checklist is a readiness hard stop.",
        "This checklist does not authorize implementation.",
      ],
      nextIfBlocked: [
        "Prepare a read-only implementation authorization no-go decision packet.",
        "Keep every implementation execution path disabled.",
      ],
    }),
  ];
}

function countByStatus(
  items: WriterPersistenceAuthorizationReadinessItem[],
  status: WriterPersistenceAuthorizationReadinessStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReadinessItem[],
  key:
    | "requiredEvidence"
    | "archiveAcceptanceCriteria"
    | "authorizationBlockers"
    | "manualChecks"
    | "redactionRules"
    | "forbiddenActions",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReadinessPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    authorizationReadinessMode: payload.authorizationReadinessMode,
    authorizationReadinessChecklistOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    externalApprovalArchiveRequired: true as const,
    externalApprovalStorageExternal: true as const,
    externalApprovalArchiveAccepted: false as const,
    archiveCompletenessAccepted: false as const,
    implementationAuthorizationReady: false as const,
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

export async function buildWriterPersistenceAuthorizationReadiness(): Promise<WriterPersistenceAuthorizationReadinessPayload> {
  const sourceArchive = await buildWriterPersistenceExternalApprovalArchive();
  const readinessItems = buildReadinessItems();

  return {
    safeMode: true,
    readOnly: true,
    authorizationReadinessMode:
      "persistence_adapter_implementation_authorization_readiness_checklist_only",
    sourceArchiveChecklistMode: sourceArchive.archiveChecklistMode,
    checkedAt: new Date().toISOString(),
    readinessItemCount: readinessItems.length,
    blockedByExternalArchiveCount: countByStatus(
      readinessItems,
      "blocked_by_external_archive",
    ),
    manualRequiredCount: countByStatus(readinessItems, "manual_required"),
    requiredEvidenceCount: uniqueCount(readinessItems, "requiredEvidence"),
    archiveAcceptanceCriteriaCount: uniqueCount(
      readinessItems,
      "archiveAcceptanceCriteria",
    ),
    authorizationBlockerCount: uniqueCount(
      readinessItems,
      "authorizationBlockers",
    ),
    manualCheckCount: uniqueCount(readinessItems, "manualChecks"),
    redactionRuleCount: uniqueCount(readinessItems, "redactionRules"),
    forbiddenActionCount: uniqueCount(readinessItems, "forbiddenActions"),
    sourceArchiveItemCount: sourceArchive.archiveItemCount,
    sourceArchiveManualRequiredCount: sourceArchive.manualRequiredCount,
    authorizationReadinessChecklistReady: true,
    authorizationReadinessChecklistOnly: true,
    sourceArchiveChecklistReady: sourceArchive.archiveChecklistReady,
    sourceArchiveChecklistOnly: sourceArchive.archiveChecklistOnly,
    sourceReleaseStillBlocked: sourceArchive.sourceReleaseStillBlocked,
    externalApprovalArchiveRequired: sourceArchive.externalApprovalArchiveRequired,
    externalApprovalStorageExternal: sourceArchive.externalApprovalStorageExternal,
    externalApprovalArchiveAccepted: false,
    archiveCompletenessAccepted: false,
    implementationAuthorizationReady: false,
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
    authorizationReadinessRules: [
      "This endpoint is a read-only implementation authorization readiness checklist, not an authorization endpoint.",
      "It may define external evidence, owner, security, backend, QA, rollback, observability, and implementation-scope readiness requirements.",
      "It must not accept external archives, mark archive completeness, create authorization records, grant implementation authorization, record human decisions, store approvals, enable feature flags, deploy code, run production writers, accept patches, create files, create tests, create branches, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
      "Readiness review does not equal implementation approval; a later no-write authorization decision packet is still required.",
    ],
    externalAuthorizationRules: [
      "Future implementation authorization must be reviewed outside the app until a separate approved persistence model exists.",
      "External authorization evidence must name owner lane, blocker ids, safe evidence refs, redaction state, retention owner, decision scope, and unresolved caveats.",
      "External authorization evidence must exclude raw prompts, private narratives, provider payloads, private debug bodies, tokens, secrets, webhook bodies, and credential-like values.",
      "This app route response must not be archived as approval and must not be used to infer implementation authorization.",
      "A later no-write decision packet is required before any implementation branch, patch, test, migration, writer, deployment, AI, Stripe, or report unlock work proceeds.",
    ],
    sourceBlockedCodes: sourceArchive.blockedCodes,
    readinessItems,
  };
}

export async function probeWriterPersistenceAuthorizationReadiness(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReadinessProbeResult> {
  const payload = await buildWriterPersistenceAuthorizationReadiness();
  const blockedSummary =
    "Persistence authorization readiness probe blocked: no external archive acceptance, archive completeness acceptance, authorization record, implementation authorization, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      readinessItems: payload.readinessItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      readinessItems: payload.readinessItems,
    };
  }

  const selectedItem = payload.readinessItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      readinessItems: payload.readinessItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization readiness probe blocked as designed: the selected readiness item was returned, but no external archive acceptance, archive completeness acceptance, authorization record, implementation authorization, human decision record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, pull request, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    readinessItems: [selectedItem],
  };
}
