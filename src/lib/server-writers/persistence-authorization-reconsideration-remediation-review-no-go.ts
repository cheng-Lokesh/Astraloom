import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationRemediationReview } from "@/lib/server-writers/persistence-authorization-reconsideration-remediation-review";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationReviewItem,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation-review";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation-review-no-go";

const blockedCodes = [
  "implementation_authorization_reconsideration_remediation_review_no_go_packet_only",
  "source_reconsideration_remediation_review_still_blocks_authorization",
  "reconsideration_remediation_review_no_go_acceptance_forbidden",
  "reconsideration_remediation_review_no_go_record_forbidden",
  "authorization_reconsideration_final_decision_forbidden",
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
  wouldAcceptReconsiderationRemediationReviewNoGo: false,
  wouldRecordReconsiderationRemediationReviewNoGo: false,
  wouldDenyImplementationAuthorizationFromReconsiderationReview: false,
  wouldPromoteToAuthorizationReconsideration: false,
  wouldAcceptReconsiderationRemediationReview: false,
  wouldRecordReconsiderationRemediationReview: false,
  wouldStoreReconsiderationRemediationReviewEvidence: false,
  wouldMarkReconsiderationExternalRemediationReviewed: false,
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
} as const satisfies WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoRuntimeFlags;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  status: WriterPersistenceAuthorizationReconsiderationRemediationReviewStatus,
): WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus {
  return status === "external_evidence_missing"
    ? "no_go_external_evidence_missing"
    : "manual_review_blocked";
}

function buildNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationRemediationReviewItem,
): WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem {
  const externalEvidenceMissing =
    sourceItem.status === "external_evidence_missing";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: `${sourceItem.title} no-go`,
    status: mapStatus(sourceItem.status),
    owner: sourceItem.owner,
    sourceReviewStatus: sourceItem.status,
    sourceReviewItemIds: [sourceItem.id],
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    noGoQuestion:
      "Can this reconsideration remediation review item unlock implementation authorization now?",
    noGoConclusion: externalEvidenceMissing
      ? "No. Required external reconsideration remediation evidence remains missing or unaccepted, so implementation authorization cannot be reconsidered."
      : "No. A manual reviewer is still required, and this app route cannot substitute for that external review.",
    blockingEvidence: unique([
      ...sourceItem.failCriteriaForCurrentReview,
      ...sourceItem.stillBlockedBecause,
      "reconsiderationRemediationReviewNoGoAccepted=false",
      "reconsiderationRemediationReviewNoGoRecorded=false",
      "implementationAuthorizationReconsiderationReady=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedReviewGaps: unique([
      sourceItem.requiredExternalState,
      ...sourceItem.rejectionTriggers,
      "The application has not accepted or stored external reconsideration remediation evidence.",
      "No authorization reconsideration decision artifact exists in app state.",
      "The read-only final decision packet starts from this blocked item.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.nonAcceptanceClauses,
      "Do not treat this no-go packet as an accepted denial, accepted review, authorization grant, or implementation approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, AI calls, Stripe calls, or report unlocks from this packet.",
    ]),
    finalDecisionPrerequisites: unique([
      ...sourceItem.completenessChecks,
      ...sourceItem.passCriteriaForFutureReview,
      "The read-only final decision packet keeps all runtime side effects blocked.",
      "Any final human decision must remain external until a separate implementation authorization artifact is deliberately introduced.",
    ]),
    safeEscalationRefs: sourceItem.safeExternalEvidenceRefs,
    redactionRules: sourceItem.redactionChecks,
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This reconsideration remediation review no-go item is not stored, accepted, signed, or promoted by the app.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked; the read-only external final decision archive remediation review checklist now exists, and the next safe packet is a read-only external final decision archive remediation review no-go packet.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem[],
  key:
    | "blockingEvidence"
    | "unresolvedReviewGaps"
    | "forbiddenShortcuts"
    | "finalDecisionPrerequisites",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    reconsiderationRemediationReviewNoGoMode:
      payload.reconsiderationRemediationReviewNoGoMode,
    reconsiderationRemediationReviewNoGoPacketOnly: true as const,
    sourceReconsiderationRemediationReviewChecklistOnly: true as const,
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
    reconsiderationRemediationReviewNoGoAccepted: false as const,
    reconsiderationRemediationReviewNoGoRecorded: false as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoPayload> {
  const sourceReview =
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReview();
  const noGoItems = sourceReview.reviewItems.map(buildNoGoItem);

  return {
    safeMode: true,
    readOnly: true,
    reconsiderationRemediationReviewNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_remediation_review_no_go_packet_only",
    sourceReconsiderationRemediationReviewChecklistMode:
      sourceReview.reconsiderationRemediationReviewChecklistMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount: noGoItems.length,
    noGoCount: countByStatus(noGoItems, "no_go_external_evidence_missing"),
    manualReviewBlockedCount: countByStatus(
      noGoItems,
      "manual_review_blocked",
    ),
    reconsiderationStillBlockedCount: noGoItems.length,
    blockingEvidenceCount: uniqueCount(noGoItems, "blockingEvidence"),
    unresolvedReviewGapCount: uniqueCount(noGoItems, "unresolvedReviewGaps"),
    forbiddenShortcutCount: uniqueCount(noGoItems, "forbiddenShortcuts"),
    finalDecisionPrerequisiteCount: uniqueCount(
      noGoItems,
      "finalDecisionPrerequisites",
    ),
    sourceReviewItemCount: sourceReview.reviewItemCount,
    sourceExternalEvidenceMissingCount:
      sourceReview.externalEvidenceMissingCount,
    sourceManualReviewerRequiredCount:
      sourceReview.manualReviewerRequiredCount,
    sourceReconsiderationStillBlockedCount:
      sourceReview.reconsiderationStillBlockedCount,
    reconsiderationRemediationReviewNoGoPacketReady: true,
    reconsiderationRemediationReviewNoGoPacketOnly: true,
    sourceReconsiderationRemediationReviewChecklistReady:
      sourceReview.reconsiderationRemediationReviewChecklistReady,
    sourceReconsiderationRemediationReviewChecklistOnly:
      sourceReview.reconsiderationRemediationReviewChecklistOnly,
    sourceReconsiderationRemediationPlanReady:
      sourceReview.sourceReconsiderationRemediationPlanReady,
    sourceReconsiderationRemediationPlanOnly:
      sourceReview.sourceReconsiderationRemediationPlanOnly,
    sourceReconsiderationNoGoPacketReady:
      sourceReview.sourceReconsiderationNoGoPacketReady,
    sourceReconsiderationNoGoPacketOnly:
      sourceReview.sourceReconsiderationNoGoPacketOnly,
    sourcePreflightChecklistReady: sourceReview.sourcePreflightChecklistReady,
    sourcePreflightChecklistOnly: sourceReview.sourcePreflightChecklistOnly,
    sourceReviewNoGoPacketReady: sourceReview.sourceReviewNoGoPacketReady,
    sourceReviewNoGoPacketOnly: sourceReview.sourceReviewNoGoPacketOnly,
    sourceReleaseStillBlocked: sourceReview.sourceReleaseStillBlocked,
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
    reconsiderationRemediationReviewNoGoAccepted: false,
    reconsiderationRemediationReviewNoGoRecorded: false,
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
    reviewNoGoRules: [
      "This endpoint is a read-only authorization reconsideration remediation review no-go packet, not a reconsideration decision system.",
      "It may summarize why the reconsideration remediation review checklist still cannot unlock implementation authorization.",
      "It must not accept review no-go items, record no-go outcomes, accept remediation reviews, accept remediation, accept no-go packets, accept preflight results, accept archives, store approvals, create authorization records, deny authorization, grant authorization, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "No-go packet readiness does not mean any review result was accepted, any blocker was resolved, or any authorization decision was recorded.",
    ],
    finalDecisionBoundaryRules: [
      "The read-only final decision packet starts from this no-go packet and the source review item ids.",
      "Only safe item ids, owner roles, redacted evidence refs, timestamps, status labels, and plain-language conclusions may be referenced.",
      "Raw artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies are forbidden.",
      "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this no-go packet.",
      "The read-only final authorization reconsideration decision packet, external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet, and it must still remain non-executable until a separate human authorization process is deliberately introduced.",
    ],
    sourceBlockedCodes: sourceReview.blockedCodes,
    noGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration remediation review no-go probe blocked: no review no-go acceptance, no-go record, final authorization decision, review acceptance, review record, evidence storage, external remediation review mark, authorization reconsideration promotion, remediation acceptance, remediation evidence record, blocker resolution, ticket creation, reconsideration no-go acceptance, preflight acceptance, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

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

  const itemId =
    (requestBody as { itemId?: unknown; noGoItemId?: unknown }).itemId ??
    (requestBody as { noGoItemId?: unknown }).noGoItemId;

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
      "Persistence authorization reconsideration remediation review no-go probe blocked as designed: the selected no-go item was returned, but no review no-go acceptance, no-go record, final authorization decision, review acceptance, review record, evidence storage, external remediation review mark, authorization reconsideration promotion, remediation acceptance, remediation evidence record, blocker resolution, ticket creation, reconsideration no-go acceptance, preflight acceptance, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    noGoItems: [selectedItem],
  };
}
