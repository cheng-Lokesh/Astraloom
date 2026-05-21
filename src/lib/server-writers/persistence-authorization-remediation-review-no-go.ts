import "server-only";

import { buildWriterPersistenceAuthorizationRemediationReview } from "@/lib/server-writers/persistence-authorization-remediation-review";
import type {
  WriterPersistenceAuthorizationRemediationReviewItem,
  WriterPersistenceAuthorizationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-remediation-review";
import type {
  WriterPersistenceAuthorizationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-remediation-review-no-go";

const blockedCodes = [
  "implementation_authorization_remediation_review_no_go_packet_only",
  "source_remediation_review_still_blocks_reconsideration",
  "external_remediation_state_acceptance_forbidden",
  "remediation_review_acceptance_forbidden",
  "remediation_review_no_go_acceptance_forbidden",
  "remediation_review_no_go_record_forbidden",
  "implementation_authorization_reconsideration_promotion_forbidden",
  "authorization_reconsideration_readiness_forbidden",
  "remediation_review_evidence_storage_forbidden",
  "external_remediation_review_mark_forbidden",
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
  wouldAcceptRemediationReviewNoGo: false,
  wouldRecordRemediationReviewNoGo: false,
  wouldDenyImplementationAuthorizationFromReview: false,
  wouldPromoteToAuthorizationReconsideration: false,
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
} as const satisfies WriterPersistenceAuthorizationRemediationReviewNoGoRuntimeFlags;

function mapStatus(
  sourceStatus: WriterPersistenceAuthorizationRemediationReviewStatus,
): WriterPersistenceAuthorizationRemediationReviewNoGoStatus {
  return sourceStatus === "external_evidence_missing"
    ? "no_go"
    : "manual_review_blocked";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function buildNoGoItem(
  sourceItem: WriterPersistenceAuthorizationRemediationReviewItem,
): WriterPersistenceAuthorizationRemediationReviewNoGoItem {
  const sourceStatus = sourceItem.status;
  const noGoConclusion =
    sourceStatus === "external_evidence_missing"
      ? "No. Required external remediation evidence is still missing or unaccepted, so authorization reconsideration cannot begin."
      : "No. A manual reviewer is still required, and this app route cannot substitute for that external review.";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: `${sourceItem.title} no-go`,
    status: mapStatus(sourceStatus),
    owner: sourceItem.owner,
    sourceReviewItemIds: [sourceItem.id],
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceRefs: sourceItem.sourceRefs,
    noGoQuestion:
      "Can this remediation review item unlock implementation authorization now?",
    noGoConclusion,
    blockingEvidence: unique([
      ...sourceItem.failCriteriaForCurrentReview,
      ...sourceItem.stillBlockedBecause,
      "externalRemediationStatesAccepted=false",
      "implementationAuthorizationReconsiderationReady=false",
      "implementationAuthorizationGranted=false",
    ]),
    unresolvedReviewGaps: unique([
      sourceItem.requiredExternalState,
      ...sourceItem.rejectionTriggers,
      "The application has not accepted or stored external remediation evidence.",
      "A future read-only reconsideration preflight would still need to start from this no-go item.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.nonAcceptanceClauses,
      "Do not treat this no-go packet as an accepted denial or approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, or row writes from this packet.",
    ]),
    reconsiderationRequirements: unique([
      ...sourceItem.completenessChecks,
      ...sourceItem.passCriteriaForFutureReview,
      "A later read-only reconsideration preflight must keep all runtime side effects blocked.",
    ]),
    safeEscalationRefs: sourceItem.safeExternalEvidenceRefs,
    redactionRules: sourceItem.redactionChecks,
    nonAcceptanceClauses: sourceItem.nonAcceptanceClauses,
    nextSafeAction: sourceItem.nextGate,
  };
}

function buildNoGoItems(
  sourceItems: WriterPersistenceAuthorizationRemediationReviewItem[],
): WriterPersistenceAuthorizationRemediationReviewNoGoItem[] {
  return sourceItems.map(buildNoGoItem);
}

function countByStatus(
  items: WriterPersistenceAuthorizationRemediationReviewNoGoItem[],
  status: WriterPersistenceAuthorizationRemediationReviewNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationRemediationReviewNoGoItem[],
  key:
    | "blockingEvidence"
    | "unresolvedReviewGaps"
    | "forbiddenShortcuts"
    | "reconsiderationRequirements",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationRemediationReviewNoGoPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    remediationReviewNoGoMode: payload.remediationReviewNoGoMode,
    reviewNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    externalRemediationStatesAccepted: false as const,
    remediationReviewAccepted: false as const,
    remediationReviewComplete: false as const,
    remediationReviewNoGoAccepted: false as const,
    remediationReviewNoGoRecorded: false as const,
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

export async function buildWriterPersistenceAuthorizationRemediationReviewNoGo(): Promise<WriterPersistenceAuthorizationRemediationReviewNoGoPayload> {
  const sourceReview =
    await buildWriterPersistenceAuthorizationRemediationReview();
  const noGoItems = buildNoGoItems(sourceReview.reviewItems);

  return {
    safeMode: true,
    readOnly: true,
    remediationReviewNoGoMode:
      "persistence_adapter_implementation_authorization_remediation_review_no_go_packet_only",
    sourceRemediationReviewChecklistMode:
      sourceReview.remediationReviewChecklistMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount: noGoItems.length,
    noGoCount: countByStatus(noGoItems, "no_go"),
    manualReviewBlockedCount: countByStatus(
      noGoItems,
      "manual_review_blocked",
    ),
    reconsiderationStillBlockedCount: noGoItems.length,
    blockingEvidenceCount: uniqueCount(noGoItems, "blockingEvidence"),
    unresolvedReviewGapCount: uniqueCount(noGoItems, "unresolvedReviewGaps"),
    forbiddenShortcutCount: uniqueCount(noGoItems, "forbiddenShortcuts"),
    reconsiderationRequirementCount: uniqueCount(
      noGoItems,
      "reconsiderationRequirements",
    ),
    sourceReviewItemCount: sourceReview.reviewItemCount,
    sourceExternalEvidenceMissingCount:
      sourceReview.externalEvidenceMissingCount,
    sourceManualReviewerRequiredCount:
      sourceReview.manualReviewerRequiredCount,
    reviewNoGoPacketReady: true,
    reviewNoGoPacketOnly: true,
    sourceReviewChecklistReady: sourceReview.reviewChecklistReady,
    sourceReviewChecklistOnly: sourceReview.reviewChecklistOnly,
    sourceRemediationPlanReady: sourceReview.sourceRemediationPlanReady,
    sourceRemediationPlanOnly: sourceReview.sourceRemediationPlanOnly,
    sourceReleaseStillBlocked: sourceReview.sourceReleaseStillBlocked,
    externalRemediationStatesAccepted: false,
    remediationReviewAccepted: false,
    remediationReviewComplete: false,
    remediationReviewNoGoAccepted: false,
    remediationReviewNoGoRecorded: false,
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
    reviewNoGoRules: [
      "This endpoint is a read-only remediation review no-go packet, not a decision acceptance system.",
      "It may summarize why the remediation review checklist still cannot unlock implementation authorization.",
      "It must not accept remediation review, record no-go outcomes, store evidence, deny authorization, grant authorization, promote authorization reconsideration, accept archives, create authorization records, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.",
      "No-go packet readiness does not mean any remediation state was accepted or any authorization decision was recorded.",
    ],
    reconsiderationRules: [
      "A later reconsideration preflight must start from this no-go packet, the source review item ids, the source remediation item ids, and the source no-go item ids.",
      "Only safe external refs, owner roles, item ids, coverage states, and redaction states may be referenced.",
      "Reject raw prompts, private narratives, provider payloads, tokens, secrets, webhook bodies, artifact bodies, signatures, or credential-like values.",
      "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this no-go packet.",
      "The read-only implementation authorization reconsideration preflight checklist, no-go packet, remediation plan, remediation review checklist, remediation review no-go packet, final decision packet, external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet.",
    ],
    sourceBlockedCodes: sourceReview.blockedCodes,
    noGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationRemediationReviewNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationRemediationReviewNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationRemediationReviewNoGo();
  const blockedSummary =
    "Persistence authorization remediation review no-go probe blocked: no remediation review no-go acceptance, no-go record, authorization denial, authorization grant, reconsideration promotion, external remediation state acceptance, archive acceptance, archive completeness acceptance, authorization record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      noGoItems: payload.noGoItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      noGoItems: payload.noGoItems,
    };
  }

  const selectedItem = payload.noGoItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      noGoItems: payload.noGoItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization remediation review no-go probe blocked as designed: the selected no-go item was returned, but no remediation review no-go acceptance, no-go record, authorization denial, authorization grant, reconsideration promotion, external remediation state acceptance, archive acceptance, archive completeness acceptance, authorization record, feature flag, deployment, production writer approval, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    noGoItems: [selectedItem],
  };
}
