import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationRemediation } from "@/lib/server-writers/persistence-authorization-reconsideration-remediation";
import type { WriterPersistenceAuthorizationReconsiderationRemediationItem } from "@/types/writer-persistence-authorization-reconsideration-remediation";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewPayload,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewProbeResult,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation-review";

const blockedCodes = [
  "implementation_authorization_reconsideration_remediation_review_checklist_only",
  "source_reconsideration_remediation_plan_still_blocks_authorization",
  "reconsideration_remediation_review_acceptance_forbidden",
  "reconsideration_remediation_review_record_forbidden",
  "reconsideration_remediation_review_evidence_storage_forbidden",
  "reconsideration_external_remediation_review_mark_forbidden",
  "authorization_reconsideration_promotion_forbidden",
  "reconsideration_remediation_acceptance_forbidden",
  "reconsideration_remediation_evidence_record_forbidden",
  "reconsideration_blocker_resolution_forbidden",
  "reconsideration_remediation_ticket_creation_forbidden",
  "reconsideration_no_go_acceptance_forbidden",
  "reconsideration_no_go_record_forbidden",
  "preflight_acceptance_forbidden",
  "preflight_record_forbidden",
  "reconsideration_eligibility_forbidden",
  "authorization_reconsideration_readiness_forbidden",
  "authorization_reconsideration_start_forbidden",
  "remediation_review_acceptance_forbidden",
  "remediation_review_evidence_storage_forbidden",
  "remediation_review_no_go_acceptance_forbidden",
  "remediation_review_no_go_record_forbidden",
  "external_remediation_state_acceptance_forbidden",
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
  wouldAcceptReconsiderationRemediationReview: false,
  wouldRecordReconsiderationRemediationReview: false,
  wouldStoreReconsiderationRemediationReviewEvidence: false,
  wouldMarkReconsiderationExternalRemediationReviewed: false,
  wouldPromoteToAuthorizationReconsideration: false,
  wouldAcceptReconsiderationRemediation: false,
  wouldRecordReconsiderationRemediationEvidence: false,
  wouldMarkReconsiderationBlockerResolved: false,
  wouldCreateReconsiderationRemediationTicket: false,
  wouldAcceptReconsiderationNoGo: false,
  wouldRecordReconsiderationNoGo: false,
  wouldDenyImplementationAuthorizationFromReconsideration: false,
  wouldPromoteToReconsiderationRemediation: false,
  wouldAcceptReconsiderationPreflight: false,
  wouldRecordReconsiderationPreflight: false,
  wouldMarkReconsiderationReady: false,
  wouldStartAuthorizationReconsideration: false,
  wouldAcceptRemediationReviewNoGo: false,
  wouldRecordRemediationReviewNoGo: false,
  wouldAcceptRemediationReview: false,
  wouldRecordRemediationReview: false,
  wouldStoreRemediationReviewEvidence: false,
  wouldMarkExternalRemediationReviewed: false,
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
} as const satisfies WriterPersistenceAuthorizationReconsiderationRemediationReviewRuntimeFlags;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function reviewStatus(
  item: WriterPersistenceAuthorizationReconsiderationRemediationItem,
): WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus {
  return item.status === "external_remediation_required"
    ? "external_evidence_missing"
    : "manual_reviewer_required";
}

function reviewTitle(
  item: WriterPersistenceAuthorizationReconsiderationRemediationItem,
) {
  if (item.title.endsWith(" remediation")) {
    return item.title.replace(/ remediation$/, " review");
  }

  return `${item.title} review`;
}

function buildReviewItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationRemediationItem,
): WriterPersistenceAuthorizationReconsiderationRemediationReviewItem {
  const externalMissing = sourceItem.status === "external_remediation_required";

  return {
    id: `${sourceItem.id}_review`,
    category: sourceItem.category,
    title: reviewTitle(sourceItem),
    status: reviewStatus(sourceItem),
    owner: sourceItem.owner,
    sourceReconsiderationRemediationStatus: sourceItem.status,
    sourceReconsiderationRemediationItemIds: [sourceItem.id],
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    reviewQuestion: externalMissing
      ? `Is the external evidence state for ${sourceItem.title} complete, redacted, owner-backed, and reviewable without accepting it in the app?`
      : `Is the manual reviewer state for ${sourceItem.title} complete, caveated, owner-backed, and reviewable without accepting it in the app?`,
    requiredExternalState: externalMissing
      ? "A safe external evidence entry exists with source item id, owner role, state, redaction status, review question, and caveats."
      : "A safe external reviewer entry exists with reviewer role, review question, caveat state, blocker state, and redaction status.",
    safeExternalEvidenceRefs: unique([
      "source reconsideration remediation item id",
      "source reconsideration no-go item id",
      "owner role",
      "external state",
      "redaction state",
      "future review question id",
      ...sourceItem.safeEvidenceRequirements,
    ]),
    completenessChecks: unique([
      `The external review packet includes source item id ${sourceItem.id}.`,
      "Every source no-go id remains mapped and visible.",
      "Every source preflight gap remains mapped or explicitly still blocking.",
      "The owner role matches the source remediation owner.",
      "External state is one of missing, present, stale, rejected, or reviewer_required.",
      "The review packet does not claim implementation authorization was granted.",
    ]),
    redactionChecks: unique([
      ...sourceItem.redactionRules,
      "Only safe ids, owner roles, state labels, redaction states, and short reviewer questions are referenced.",
      "Raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies are absent.",
    ]),
    rejectionTriggers: unique([
      "Any source no-go id is removed or renamed without traceability.",
      "Any source preflight gap is marked resolved inside the app.",
      "The review packet treats this route as an approval artifact.",
      "The review packet grants authorization or starts implementation.",
      "Any credential-like value, raw private narrative, raw prompt, provider payload, webhook body, or external artifact body is included.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonExecutionClauses,
      "This review item does not accept reconsideration remediation.",
      "This review item does not record review evidence.",
      "This review item does not mark external remediation reviewed.",
      "This review item does not promote the project to authorization reconsideration.",
    ]),
    passCriteriaForFutureReview: unique([
      ...sourceItem.acceptanceCriteria,
      "A later no-go/go packet can inspect the external state without private data.",
      "Every remaining blocker has an owner role, state, caveat, and next review question.",
    ]),
    failCriteriaForCurrentReview: unique([
      "reconsiderationRemediationReviewAccepted remains false.",
      "reconsiderationRemediationReviewRecorded remains false.",
      "externalRemediationStatesAccepted remains false.",
      "implementationAuthorizationReconsiderationReady remains false.",
      "implementationAuthorizationGranted remains false.",
      "readyForAdapterImplementation remains false.",
    ]),
    stillBlockedBecause: unique([
      ...sourceItem.residualRisks,
      "External remediation states are not accepted by this app route.",
      "No authorization decision artifact exists in app state.",
      "A later read-only no-go packet is required before any implementation authorization reconsideration can proceed.",
    ]),
    nextGate:
      "authorization_reconsideration_remediation_review_no_go_packet",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationRemediationReviewItem[],
  status: WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationRemediationReviewItem[],
  key: "completenessChecks" | "redactionChecks" | "rejectionTriggers",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationRemediationReviewPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    reconsiderationRemediationReviewChecklistMode:
      payload.reconsiderationRemediationReviewChecklistMode,
    reconsiderationRemediationReviewChecklistOnly: true as const,
    sourceReconsiderationRemediationPlanOnly: true as const,
    sourceReconsiderationNoGoPacketOnly: true as const,
    sourcePreflightChecklistOnly: true as const,
    sourceReviewNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    preflightAccepted: false as const,
    preflightRecorded: false as const,
    reconsiderationEligible: false as const,
    reconsiderationNoGoAccepted: false as const,
    reconsiderationNoGoRecorded: false as const,
    reconsiderationRemediationAccepted: false as const,
    reconsiderationRemediationRecorded: false as const,
    reconsiderationRemediationReviewAccepted: false as const,
    reconsiderationRemediationReviewRecorded: false as const,
    reconsiderationRemediationReviewComplete: false as const,
    implementationAuthorizationReconsiderationReady: false as const,
    implementationAuthorizationGranted: false as const,
    implementationAuthorized: false as const,
    authorizationDecisionRecorded: false as const,
    authorizationArtifactStored: false as const,
    externalRemediationStatesAccepted: false as const,
    remediationReviewAccepted: false as const,
    remediationReviewComplete: false as const,
    remediationReviewNoGoAccepted: false as const,
    remediationReviewNoGoRecorded: false as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationRemediationReview(): Promise<WriterPersistenceAuthorizationReconsiderationRemediationReviewPayload> {
  const sourceRemediation =
    await buildWriterPersistenceAuthorizationReconsiderationRemediation();
  const reviewItems = sourceRemediation.remediationItems.map(buildReviewItem);

  return {
    safeMode: true,
    readOnly: true,
    reconsiderationRemediationReviewChecklistMode:
      "persistence_adapter_implementation_authorization_reconsideration_remediation_review_checklist_only",
    sourceReconsiderationRemediationMode:
      sourceRemediation.reconsiderationRemediationMode,
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
    reconsiderationStillBlockedCount: reviewItems.length,
    completenessCheckCount: uniqueCount(reviewItems, "completenessChecks"),
    redactionCheckCount: uniqueCount(reviewItems, "redactionChecks"),
    rejectionTriggerCount: uniqueCount(reviewItems, "rejectionTriggers"),
    sourceRemediationItemCount: sourceRemediation.remediationItemCount,
    sourceExternalRemediationRequiredCount:
      sourceRemediation.externalRemediationRequiredCount,
    sourceManualReviewRequiredCount:
      sourceRemediation.manualReviewRequiredCount,
    sourceNoGoItemCount: sourceRemediation.sourceNoGoItemCount,
    sourceNoGoCount: sourceRemediation.sourceNoGoCount,
    sourceManualReviewBlockedCount:
      sourceRemediation.sourceManualReviewBlockedCount,
    sourceReconsiderationStillBlockedCount:
      sourceRemediation.sourceReconsiderationStillBlockedCount,
    reconsiderationRemediationReviewChecklistReady: true,
    reconsiderationRemediationReviewChecklistOnly: true,
    sourceReconsiderationRemediationPlanReady:
      sourceRemediation.reconsiderationRemediationPlanReady,
    sourceReconsiderationRemediationPlanOnly:
      sourceRemediation.reconsiderationRemediationPlanOnly,
    sourceReconsiderationNoGoPacketReady:
      sourceRemediation.sourceReconsiderationNoGoPacketReady,
    sourceReconsiderationNoGoPacketOnly:
      sourceRemediation.sourceReconsiderationNoGoPacketOnly,
    sourcePreflightChecklistReady:
      sourceRemediation.sourcePreflightChecklistReady,
    sourcePreflightChecklistOnly:
      sourceRemediation.sourcePreflightChecklistOnly,
    sourceReviewNoGoPacketReady: sourceRemediation.sourceReviewNoGoPacketReady,
    sourceReviewNoGoPacketOnly: sourceRemediation.sourceReviewNoGoPacketOnly,
    sourceReleaseStillBlocked: sourceRemediation.sourceReleaseStillBlocked,
    preflightPassed: false,
    preflightAccepted: false,
    preflightRecorded: false,
    reconsiderationEligible: false,
    reconsiderationNoGoAccepted: false,
    reconsiderationNoGoRecorded: false,
    reconsiderationRemediationAccepted: false,
    reconsiderationRemediationRecorded: false,
    reconsiderationRemediationReviewAccepted: false,
    reconsiderationRemediationReviewRecorded: false,
    reconsiderationRemediationReviewComplete: false,
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
    externalRemediationStatesAccepted: false,
    remediationReviewAccepted: false,
    remediationReviewComplete: false,
    remediationReviewNoGoAccepted: false,
    remediationReviewNoGoRecorded: false,
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
      "This endpoint is a read-only authorization reconsideration remediation review checklist, not a remediation acceptance system.",
      "It may define how a future reviewer should inspect external reconsideration remediation states, safe evidence refs, completeness checks, redaction checks, rejection triggers, and next gates.",
      "It must not accept reconsideration remediation, record review outcomes, store evidence, mark blockers resolved, mark external remediation reviewed, promote to authorization reconsideration, accept no-go packets, accept preflight results, accept archives, create authorization records, deny or grant authorization, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Because the app cannot accept external remediation states in this stage, authorization reconsideration remains blocked by default.",
    ],
    currentRejectionRules: [
      "Reject any review input that attempts to paste private narratives, prompts, provider payloads, tokens, secrets, webhook bodies, raw artifact contents, signatures, or credential-like values.",
      "Reject any review input that treats this route as a go decision, approval artifact, implementation authorization, or blocker-resolution record.",
      "Reject any review input that removes source no-go ids or preflight gaps without traceability.",
      "Reject any review input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      "The read-only implementation authorization reconsideration remediation review no-go packet, final decision packet, external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet.",
    ],
    sourceBlockedCodes: sourceRemediation.blockedCodes,
    reviewItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationRemediationReview(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationRemediationReviewProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReview();
  const blockedSummary =
    "Persistence authorization reconsideration remediation review probe blocked: no reconsideration remediation review acceptance, review record, evidence storage, external remediation review mark, authorization reconsideration promotion, remediation acceptance, remediation evidence record, blocker resolution, ticket creation, no-go acceptance, preflight acceptance, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

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
      "Persistence authorization reconsideration remediation review probe blocked as designed: the selected review item was returned, but no reconsideration remediation review acceptance, review record, evidence storage, external remediation review mark, authorization reconsideration promotion, remediation acceptance, remediation evidence record, blocker resolution, ticket creation, no-go acceptance, preflight acceptance, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    reviewItems: [selectedItem],
  };
}
