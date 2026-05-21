import "server-only";

import { buildWriterPersistenceAuthorizationRemediation } from "@/lib/server-writers/persistence-authorization-remediation";
import type {
  WriterPersistenceAuthorizationRemediationItem,
  WriterPersistenceAuthorizationRemediationStatus,
} from "@/types/writer-persistence-authorization-remediation";
import type {
  WriterPersistenceAuthorizationRemediationReviewItem,
  WriterPersistenceAuthorizationRemediationReviewPayload,
  WriterPersistenceAuthorizationRemediationReviewProbeResult,
  WriterPersistenceAuthorizationRemediationReviewRuntimeFlags,
  WriterPersistenceAuthorizationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-remediation-review";

type ReviewDefinition = {
  sourceId: string;
  title: string;
  reviewQuestion: string;
  requiredExternalState: string;
  safeExternalEvidenceRefs: string[];
  completenessChecks: string[];
  redactionChecks: string[];
  rejectionTriggers: string[];
  nonAcceptanceClauses: string[];
  passCriteriaForFutureReview: string[];
  failCriteriaForCurrentReview: string[];
  stillBlockedBecause: string[];
  nextGate: string;
};

const blockedCodes = [
  "implementation_authorization_remediation_review_checklist_only",
  "source_remediation_plan_still_blocks_release",
  "external_remediation_state_acceptance_forbidden",
  "remediation_review_acceptance_forbidden",
  "remediation_review_record_forbidden",
  "remediation_review_evidence_storage_forbidden",
  "external_remediation_review_mark_forbidden",
  "authorization_reconsideration_promotion_forbidden",
  "remediation_plan_acceptance_forbidden",
  "remediation_evidence_record_forbidden",
  "blocker_resolution_record_forbidden",
  "external_archive_acceptance_forbidden",
  "archive_completeness_acceptance_forbidden",
  "authorization_record_creation_forbidden",
  "authorization_decision_record_forbidden",
  "authorization_no_go_acceptance_forbidden",
  "authorization_denial_forbidden",
  "authorization_grant_forbidden",
  "approval_storage_forbidden",
  "feature_flag_enablement_forbidden",
  "deployment_forbidden",
  "production_writer_execution_forbidden",
  "patch_review_acceptance_forbidden",
  "patch_generation_forbidden",
  "patch_application_forbidden",
  "file_creation_forbidden",
  "file_modification_forbidden",
  "test_creation_forbidden",
  "git_command_forbidden",
  "branch_creation_forbidden",
  "adapter_code_forbidden",
  "service_role_client_forbidden",
  "transaction_forbidden",
  "database_writes_forbidden",
  "audit_idempotency_writes_forbidden",
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const runtimeBlockedFlags = {
  allRuntimeEffectsBlocked: true,
  wouldAcceptRemediationReview: false,
  wouldRecordRemediationReview: false,
  wouldStoreRemediationReviewEvidence: false,
  wouldMarkExternalRemediationReviewed: false,
  wouldPromoteToAuthorizationReconsideration: false,
  wouldAcceptExternalRemediationState: false,
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
  wouldAcceptRemediationPlan: false,
  wouldRecordRemediationEvidence: false,
  wouldMarkBlockerResolved: false,
  wouldCreateRemediationTicket: false,
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
} as const satisfies WriterPersistenceAuthorizationRemediationReviewRuntimeFlags;

const reviewDefinitions: ReviewDefinition[] = [
  {
    sourceId: "source_invariant_remediation",
    title: "Source invariant remediation review",
    reviewQuestion:
      "Can every source no-go item be traced to an external remediation owner without changing any app-side authorization state?",
    requiredExternalState:
      "A redacted blocker register exists outside the app and maps every source no-go id to an owner, state, and caveat.",
    safeExternalEvidenceRefs: [
      "external blocker register ref",
      "source no-go id coverage table",
      "owner lane state summary",
    ],
    completenessChecks: [
      "Every source no-go id appears exactly once in the external register.",
      "Every blocker state is one of present, missing, stale, rejected, or still blocking.",
      "The register does not claim implementation authorization was granted.",
    ],
    redactionChecks: [
      "Reviewer summaries contain only safe ids and role labels.",
      "Private user narratives, prompts, provider payloads, and credentials are absent.",
    ],
    rejectionTriggers: [
      "Any source no-go id is missing.",
      "Any source blocker is marked resolved without an external owner.",
      "The artifact attempts to grant authorization.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not accept the blocker register.",
      "This checklist does not mark any source blocker resolved.",
    ],
    passCriteriaForFutureReview: [
      "All source no-go ids are mapped to external states.",
      "No blocker is silently removed from reconsideration.",
    ],
    failCriteriaForCurrentReview: [
      "The app has no accepted external remediation state.",
      "The source no-go packet still keeps implementation authorization false.",
    ],
    stillBlockedBecause: [
      "Remediation evidence is not stored or accepted in the app.",
      "A later no-go/go reconsideration packet is required.",
    ],
    nextGate: "authorization_remediation_review_no_go_packet",
  },
  {
    sourceId: "archive_remediation",
    title: "External archive remediation review",
    reviewQuestion:
      "Are archive coverage gaps externally reviewable without uploading, reading, hashing, indexing, or accepting archive artifacts in the app?",
    requiredExternalState:
      "A redacted archive coverage matrix exists outside the app with artifact classes, coverage states, retention owners, and access rules.",
    safeExternalEvidenceRefs: [
      "archive coverage matrix ref",
      "artifact class id list",
      "retention owner summary",
    ],
    completenessChecks: [
      "Every required artifact class has a coverage state.",
      "Missing, stale, or rejected classes have owner actions.",
      "The matrix does not include artifact bodies.",
    ],
    redactionChecks: [
      "Artifact contents, signatures, private identity details, and file bodies are absent.",
      "Only artifact class ids and coverage states are referenced.",
    ],
    rejectionTriggers: [
      "Any artifact body is pasted into the app.",
      "Archive completeness is claimed as accepted by this route.",
      "A missing artifact class has no owner.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not accept the external archive.",
      "This checklist does not mark archive completeness.",
    ],
    passCriteriaForFutureReview: [
      "Archive coverage can be checked by class without app-side artifact access.",
      "All archive gaps have explicit external owners.",
    ],
    failCriteriaForCurrentReview: [
      "externalApprovalArchiveAccepted remains false.",
      "archiveCompletenessAccepted remains false.",
    ],
    stillBlockedBecause: [
      "The app cannot store or validate external archive artifacts.",
      "A human reviewer must accept archive coverage outside this route.",
    ],
    nextGate: "archive_coverage_review_no_go_packet",
  },
  {
    sourceId: "authority_remediation",
    title: "Authority boundary remediation review",
    reviewQuestion:
      "Is the future authorizing authority externally named without treating this app route as an approval artifact?",
    requiredExternalState:
      "An external authority statement names the role, scope, caveats, and artifact type required for a later authorization review.",
    safeExternalEvidenceRefs: [
      "authority role statement ref",
      "decision lane id",
      "authority caveat list",
    ],
    completenessChecks: [
      "Authority role and scope are explicit.",
      "Caveats that limit authority are listed.",
      "The app route is not cited as the source of approval.",
    ],
    redactionChecks: [
      "Use role labels instead of private identity details.",
      "Do not store signatures, email bodies, or private contact data.",
    ],
    rejectionTriggers: [
      "Authority is inferred from chat history or route output.",
      "The artifact contains private signature data.",
      "Authority scope is ambiguous.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not collect a signature.",
      "This checklist does not record owner approval.",
    ],
    passCriteriaForFutureReview: [
      "Authority source is explicit and external.",
      "Authority caveats can be reviewed without private data.",
    ],
    failCriteriaForCurrentReview: [
      "No authorization artifact is stored.",
      "No authorization decision is recorded.",
    ],
    stillBlockedBecause: [
      "Named authority does not imply approval.",
      "The app cannot validate authority artifacts in this stage.",
    ],
    nextGate: "authority_boundary_review_no_go_packet",
  },
  {
    sourceId: "owner_lane_remediation",
    title: "Owner lane remediation review",
    reviewQuestion:
      "Are all owner lanes externally mapped to evidence states and caveats without recording owner approvals in the app?",
    requiredExternalState:
      "A lane-by-lane external review table lists founder, backend, security, QA, operator, and data-protection states.",
    safeExternalEvidenceRefs: [
      "owner lane coverage table ref",
      "lane caveat id list",
      "review order summary",
    ],
    completenessChecks: [
      "Every required owner lane appears in the external table.",
      "Every lane has an evidence state and caveat state.",
      "No lane is marked approved by this app.",
    ],
    redactionChecks: [
      "Use lane ids and role labels only.",
      "Private contact details and signatures are excluded.",
    ],
    rejectionTriggers: [
      "Any required lane is missing.",
      "A lane claims approval without an external artifact ref.",
      "Private signer data is included.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not record owner approvals.",
      "This checklist does not mark all owner approvals complete.",
    ],
    passCriteriaForFutureReview: [
      "Every owner lane has a state, owner role, and caveat status.",
      "A future reviewer can see which lane still blocks authorization.",
    ],
    failCriteriaForCurrentReview: [
      "allOwnerApprovalsComplete remains false.",
      "implementationApprovalGranted remains false.",
    ],
    stillBlockedBecause: [
      "Owner approvals are not app-side records.",
      "External lane evidence is not accepted here.",
    ],
    nextGate: "owner_lane_review_no_go_packet",
  },
  {
    sourceId: "security_data_remediation",
    title: "Security and data-protection remediation review",
    reviewQuestion:
      "Can security and data-protection remediation be reviewed from safe refs without exposing secrets, prompts, narratives, raw payloads, or service-role config?",
    requiredExternalState:
      "External security review notes cover service-role isolation, redaction, retention, protected-history rules, and rollback safety.",
    safeExternalEvidenceRefs: [
      "security review ref",
      "redaction policy state ref",
      "protected-history rule matrix",
    ],
    completenessChecks: [
      "Secret isolation and service-role boundary questions are answered externally.",
      "Redaction policy covers prompts, narratives, provider payloads, debug bodies, tokens, and webhook bodies.",
      "Protected-history compensation rules are non-destructive.",
    ],
    redactionChecks: [
      "No credential-like values are present.",
      "No raw private narrative or provider payload text is present.",
    ],
    rejectionTriggers: [
      "Any secret, token, refresh token, API key, webhook body, or service-role config appears.",
      "Protected history can be deleted or overwritten.",
      "Raw prompts or narratives are included as evidence.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not inspect secrets.",
      "This checklist does not create a service-role client.",
      "This checklist does not persist evidence.",
    ],
    passCriteriaForFutureReview: [
      "Security review can be judged from safe ids and summarized outcomes.",
      "Data-protection blockers have owners and redacted external refs.",
    ],
    failCriteriaForCurrentReview: [
      "wouldCreateServiceRoleClient remains false.",
      "wouldReadServiceRoleSecret remains false.",
      "wouldStoreRawPayload remains false.",
    ],
    stillBlockedBecause: [
      "Security evidence is external and unaccepted.",
      "Service-role implementation remains forbidden.",
    ],
    nextGate: "security_data_review_no_go_packet",
  },
  {
    sourceId: "backend_schema_remediation",
    title: "Backend and schema remediation review",
    reviewQuestion:
      "Is backend/schema remediation externally reviewable without creating migrations, transactions, files, privileged clients, or row writes?",
    requiredExternalState:
      "A backend review packet summarizes schema state, transaction order, failure behavior, audit persistence, and idempotency behavior.",
    safeExternalEvidenceRefs: [
      "schema state summary ref",
      "transaction phase review ref",
      "failure mode matrix",
    ],
    completenessChecks: [
      "Schema state is described without credentials.",
      "Transaction phase order and rollback behavior are reviewable.",
      "Audit and idempotency write order is mapped to future server-only operations.",
    ],
    redactionChecks: [
      "No database credentials, raw query bodies, or service-role config are present.",
      "Only table names, method names, and failure ids are referenced.",
    ],
    rejectionTriggers: [
      "The review creates or edits migration files.",
      "The review assumes transactions already run.",
      "The review includes raw database secrets or query payloads.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not create migration files.",
      "This checklist does not run transactions.",
      "This checklist does not write rows.",
    ],
    passCriteriaForFutureReview: [
      "Schema and transaction questions are externally answerable.",
      "Future adapter boundaries remain server-only and non-browser.",
    ],
    failCriteriaForCurrentReview: [
      "adapterImplemented remains false.",
      "wouldRunTransaction remains false.",
      "wouldCreateMigrationFile remains false.",
    ],
    stillBlockedBecause: [
      "Backend/schema evidence is not accepted in app state.",
      "A later implementation authorization decision is still required.",
    ],
    nextGate: "backend_schema_review_no_go_packet",
  },
  {
    sourceId: "qa_acceptance_remediation",
    title: "QA acceptance remediation review",
    reviewQuestion:
      "Does planned QA coverage map future write paths to assertions without creating test files, running implementation tests, or changing browser write boundaries?",
    requiredExternalState:
      "A QA coverage matrix maps future writer behaviors to assertion ids, fixture ids, route names, and expected boolean states.",
    safeExternalEvidenceRefs: [
      "QA coverage matrix ref",
      "fixture id list",
      "assertion id list",
    ],
    completenessChecks: [
      "Every future write path has a planned assertion.",
      "Browser-owned and server-owned tables remain separately asserted.",
      "Redaction, idempotency, audit, rollback, and rollout cases are represented.",
    ],
    redactionChecks: [
      "Fixture ids and route names are used instead of private payload examples.",
      "Prompts, narratives, and provider payload bodies are absent.",
    ],
    rejectionTriggers: [
      "Test files are created in this stage.",
      "Implementation tests are run against real writes.",
      "Browser write boundaries are loosened.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not create tests.",
      "This checklist does not run automated implementation tests.",
    ],
    passCriteriaForFutureReview: [
      "Future write behavior has planned assertion coverage.",
      "QA can detect browser/server boundary regressions later.",
    ],
    failCriteriaForCurrentReview: [
      "wouldCreateTestFiles remains false.",
      "wouldRunAutomatedTests remains false.",
    ],
    stillBlockedBecause: [
      "QA coverage is planned, not executed.",
      "No implementation branch exists to test.",
    ],
    nextGate: "qa_acceptance_review_no_go_packet",
  },
  {
    sourceId: "rollback_observability_remediation",
    title: "Rollback and observability remediation review",
    reviewQuestion:
      "Are abort, compensation, observability, and support handoff states externally reviewable without enabling rollout or writing compensation records?",
    requiredExternalState:
      "An operator readiness packet lists abort triggers, support handoff refs, observability signals, and non-destructive compensation behavior.",
    safeExternalEvidenceRefs: [
      "operator readiness packet ref",
      "abort trigger list",
      "observability signal list",
    ],
    completenessChecks: [
      "Every release failure class has an abort or support handoff path.",
      "Compensation behavior is non-destructive.",
      "Observability signals are named without enabling production systems.",
    ],
    redactionChecks: [
      "Event ids and summarized outcomes are used.",
      "Raw payloads, private narratives, and secrets are absent.",
    ],
    rejectionTriggers: [
      "Compensation rows are written.",
      "Feature flags or rollout gates are enabled.",
      "Protected history can be mutated destructively.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not write compensation records.",
      "This checklist does not enable rollout or observability systems.",
    ],
    passCriteriaForFutureReview: [
      "Operator readiness can be reviewed from safe refs.",
      "Rollback and observability blockers have external owners.",
    ],
    failCriteriaForCurrentReview: [
      "wouldWriteCompensationRows remains false.",
      "wouldEnableFeatureFlag remains false.",
      "readyForReleaseExecution remains false.",
    ],
    stillBlockedBecause: [
      "Operator evidence is not accepted here.",
      "Release execution remains blocked.",
    ],
    nextGate: "rollback_observability_review_no_go_packet",
  },
  {
    sourceId: "implementation_scope_remediation",
    title: "Implementation scope remediation review",
    reviewQuestion:
      "Is future implementation scope bounded enough for review without creating branches, patches, files, tests, or adapter code?",
    requiredExternalState:
      "A scope packet lists allowed paths, forbidden paths, forbidden symbols, phase order, and rollback checkpoints.",
    safeExternalEvidenceRefs: [
      "scope packet ref",
      "allowed path pattern list",
      "rollback checkpoint list",
    ],
    completenessChecks: [
      "Allowed and forbidden path patterns are explicit.",
      "Forbidden symbols and privileged boundary rules are explicit.",
      "Each future patch phase has a rollback checkpoint.",
    ],
    redactionChecks: [
      "Only file paths, symbol names, and blocker ids are referenced.",
      "Private payload examples are absent.",
    ],
    rejectionTriggers: [
      "A branch is created.",
      "A patch is generated or applied.",
      "Implementation files or tests are created.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not create implementation plans.",
      "This checklist does not modify files or create branches.",
    ],
    passCriteriaForFutureReview: [
      "Future implementation scope is narrow enough for a later authorization decision.",
      "Forbidden paths and symbols are visible before any code work begins.",
    ],
    failCriteriaForCurrentReview: [
      "wouldCreateBranch remains false.",
      "wouldCreateFiles remains false.",
      "readyToCreateImplementationBranch remains false.",
    ],
    stillBlockedBecause: [
      "Scope evidence is external and unaccepted.",
      "Authorization reconsideration has not happened.",
    ],
    nextGate: "implementation_scope_review_no_go_packet",
  },
  {
    sourceId: "final_reconsideration_remediation",
    title: "Final authorization reconsideration remediation review",
    reviewQuestion:
      "Can the project safely proceed to a future read-only no-go/go reconsideration packet without granting implementation authorization now?",
    requiredExternalState:
      "A founder-facing external review packet aggregates every remediation item state, caveat, owner role, and future review question.",
    safeExternalEvidenceRefs: [
      "founder review packet ref",
      "remediation state summary",
      "future reconsideration question list",
    ],
    completenessChecks: [
      "Every remediation item has an external state.",
      "Every still-blocking item remains visible.",
      "The packet does not grant or deny authorization inside the app.",
    ],
    redactionChecks: [
      "Only safe summaries and blocker ids are used.",
      "Private examples, provider payloads, and credential-like values are absent.",
    ],
    rejectionTriggers: [
      "The packet attempts to start implementation.",
      "The packet grants authorization.",
      "The packet omits unresolved blockers.",
    ],
    nonAcceptanceClauses: [
      "This checklist does not accept remediation.",
      "This checklist does not deny or grant authorization.",
      "This checklist does not start implementation.",
    ],
    passCriteriaForFutureReview: [
      "A later no-go/go reconsideration packet has enough safe structure to review.",
      "Every implementation execution path remains disabled until a separate decision exists.",
    ],
    failCriteriaForCurrentReview: [
      "implementationAuthorizationGranted remains false.",
      "implementationAuthorized remains false.",
      "allRuntimeEffectsBlocked remains true.",
    ],
    stillBlockedBecause: [
      "Current stage is review-only.",
      "No authorization decision artifact exists in app state.",
    ],
    nextGate: "authorization_reconsideration_no_go_packet",
  },
];

function mapStatus(
  sourceStatus: WriterPersistenceAuthorizationRemediationStatus,
): WriterPersistenceAuthorizationRemediationReviewStatus {
  return sourceStatus === "external_remediation_required"
    ? "external_evidence_missing"
    : "manual_reviewer_required";
}

function buildReviewItem(
  definition: ReviewDefinition,
  sourceItem: WriterPersistenceAuthorizationRemediationItem,
): WriterPersistenceAuthorizationRemediationReviewItem {
  return {
    id: `${definition.sourceId}_review`,
    category: sourceItem.category,
    title: definition.title,
    status: mapStatus(sourceItem.status),
    owner: sourceItem.owner,
    sourceRemediationItemIds: [sourceItem.id],
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceRefs: sourceItem.sourceRefs,
    reviewQuestion: definition.reviewQuestion,
    requiredExternalState: definition.requiredExternalState,
    safeExternalEvidenceRefs: definition.safeExternalEvidenceRefs,
    completenessChecks: definition.completenessChecks,
    redactionChecks: definition.redactionChecks,
    rejectionTriggers: definition.rejectionTriggers,
    nonAcceptanceClauses: definition.nonAcceptanceClauses,
    passCriteriaForFutureReview: definition.passCriteriaForFutureReview,
    failCriteriaForCurrentReview: definition.failCriteriaForCurrentReview,
    stillBlockedBecause: definition.stillBlockedBecause,
    nextGate: definition.nextGate,
  };
}

function buildReviewItems(
  sourceItems: WriterPersistenceAuthorizationRemediationItem[],
): WriterPersistenceAuthorizationRemediationReviewItem[] {
  return reviewDefinitions.map((definition) => {
    const sourceItem = sourceItems.find(
      (candidate) => candidate.id === definition.sourceId,
    );

    if (!sourceItem) {
      throw new Error(`Missing source remediation item: ${definition.sourceId}`);
    }

    return buildReviewItem(definition, sourceItem);
  });
}

function countByStatus(
  items: WriterPersistenceAuthorizationRemediationReviewItem[],
  status: WriterPersistenceAuthorizationRemediationReviewStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationRemediationReviewItem[],
  key: "completenessChecks" | "redactionChecks" | "rejectionTriggers",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationRemediationReviewPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    remediationReviewChecklistMode: payload.remediationReviewChecklistMode,
    reviewChecklistOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    externalRemediationStatesAccepted: false as const,
    remediationReviewAccepted: false as const,
    remediationReviewComplete: false as const,
    implementationAuthorizationReconsiderationReady: false as const,
    implementationAuthorizationGranted: false as const,
    implementationAuthorized: false as const,
    authorizationDecisionRecorded: false as const,
    authorizationArtifactStored: false as const,
    externalApprovalArchiveAccepted: false as const,
    archiveCompletenessAccepted: false as const,
    readyToCreateImplementationBranch: false as const,
    readyForAdapterImplementation: false as const,
    readyForReleaseExecution: false as const,
    adapterImplemented: false as const,
    adapterImplementationApproved: false as const,
    adapterImplementationAllowed: false as const,
    allOwnerApprovalsComplete: false as const,
    allBlockingEvidenceReady: false as const,
    ...runtimeBlockedFlags,
    blockedCodes: payload.blockedCodes,
  };
}

export async function buildWriterPersistenceAuthorizationRemediationReview(): Promise<WriterPersistenceAuthorizationRemediationReviewPayload> {
  const sourceRemediation =
    await buildWriterPersistenceAuthorizationRemediation();
  const reviewItems = buildReviewItems(sourceRemediation.remediationItems);

  return {
    safeMode: true,
    readOnly: true,
    remediationReviewChecklistMode:
      "persistence_adapter_implementation_authorization_remediation_review_checklist_only",
    sourceRemediationPlanMode: sourceRemediation.remediationPlanMode,
    checkedAt: new Date().toISOString(),
    reviewItemCount: reviewItems.length,
    externalEvidenceMissingCount: countByStatus(
      reviewItems,
      "external_evidence_missing",
    ),
    manualReviewerRequiredCount: countByStatus(
      reviewItems,
      "manual_reviewer_required",
    ),
    reconsiderationBlockedCount: reviewItems.length,
    completenessCheckCount: uniqueCount(reviewItems, "completenessChecks"),
    redactionCheckCount: uniqueCount(reviewItems, "redactionChecks"),
    rejectionTriggerCount: uniqueCount(reviewItems, "rejectionTriggers"),
    sourceRemediationItemCount: sourceRemediation.remediationItemCount,
    sourceExternalRemediationRequiredCount:
      sourceRemediation.externalRemediationRequiredCount,
    sourceManualReviewRequiredCount: sourceRemediation.manualReviewRequiredCount,
    reviewChecklistReady: true,
    reviewChecklistOnly: true,
    sourceRemediationPlanReady: sourceRemediation.remediationPlanReady,
    sourceRemediationPlanOnly: sourceRemediation.remediationPlanOnly,
    sourceAuthorizationNoGoPacketReady:
      sourceRemediation.sourceAuthorizationNoGoPacketReady,
    sourceReleaseStillBlocked: sourceRemediation.sourceReleaseStillBlocked,
    externalRemediationStatesAccepted: false,
    remediationReviewAccepted: false,
    remediationReviewComplete: false,
    implementationAuthorizationReconsiderationReady: false,
    implementationAuthorizationRemediationAccepted: false,
    implementationAuthorizationDecisionReady: false,
    implementationAuthorizationDecisionRecorded: false,
    implementationAuthorizationNoGoAccepted: false,
    implementationAuthorizationDenied: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    authorizationDecisionRecorded: false,
    authorizationArtifactStored: false,
    externalApprovalArchiveAccepted: false,
    archiveCompletenessAccepted: false,
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
    reviewChecklistRules: [
      "This endpoint is a read-only remediation review checklist, not a remediation acceptance system.",
      "It may define how a future reviewer should inspect external remediation states, safe evidence refs, completeness checks, redaction checks, rejection triggers, and next gates.",
      "It must not accept external remediation states, accept the remediation plan, record review outcomes, store evidence, mark blockers resolved, accept archives, create authorization records, deny or grant authorization, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
      "Because the app cannot accept external remediation evidence in this stage, reconsideration remains blocked by default.",
    ],
    currentRejectionRules: [
      "Reject any review input that attempts to paste private narratives, prompts, provider payloads, tokens, secrets, webhook bodies, raw artifact contents, or credential-like values.",
      "Reject any review input that treats this route as an approval artifact.",
      "Reject any review input that marks a source blocker resolved inside the app.",
      "Reject any review input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      "The remediation review no-go packet and authorization reconsideration preflight checklist now exist; the next safe stage is a read-only authorization reconsideration no-go packet.",
    ],
    sourceBlockedCodes: sourceRemediation.blockedCodes,
    reviewItems,
  };
}

export async function probeWriterPersistenceAuthorizationRemediationReview(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationRemediationReviewProbeResult> {
  const payload = await buildWriterPersistenceAuthorizationRemediationReview();
  const blockedSummary =
    "Persistence authorization remediation review probe blocked: no external remediation state acceptance, remediation review acceptance, review record, evidence storage, blocker resolution, authorization reconsideration promotion, archive acceptance, archive completeness acceptance, authorization record, no-go decision acceptance, implementation authorization denial, implementation authorization grant, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      reviewItems: payload.reviewItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      reviewItems: payload.reviewItems,
    };
  }

  const selectedItem = payload.reviewItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      reviewItems: payload.reviewItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization remediation review probe blocked as designed: the selected review item was returned, but no external remediation state acceptance, remediation review acceptance, review record, evidence storage, blocker resolution, authorization reconsideration promotion, archive acceptance, archive completeness acceptance, authorization record, no-go decision acceptance, implementation authorization denial, implementation authorization grant, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    reviewItems: [selectedItem],
  };
}
