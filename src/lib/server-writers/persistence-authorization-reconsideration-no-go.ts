import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationPreflight } from "@/lib/server-writers/persistence-authorization-reconsideration-preflight";
import type {
  WriterPersistenceAuthorizationReconsiderationPreflightItem,
  WriterPersistenceAuthorizationReconsiderationPreflightStatus,
} from "@/types/writer-persistence-authorization-reconsideration-preflight";
import type {
  WriterPersistenceAuthorizationReconsiderationNoGoItem,
  WriterPersistenceAuthorizationReconsiderationNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-no-go";

const blockedCodes = [
  "implementation_authorization_reconsideration_no_go_packet_only",
  "source_reconsideration_preflight_still_blocks_authorization",
  "reconsideration_no_go_acceptance_forbidden",
  "reconsideration_no_go_record_forbidden",
  "reconsideration_remediation_promotion_forbidden",
  "preflight_acceptance_forbidden",
  "preflight_record_forbidden",
  "reconsideration_eligibility_forbidden",
  "authorization_reconsideration_readiness_forbidden",
  "authorization_reconsideration_start_forbidden",
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
} as const satisfies WriterPersistenceAuthorizationReconsiderationNoGoRuntimeFlags;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  status: WriterPersistenceAuthorizationReconsiderationPreflightStatus,
): WriterPersistenceAuthorizationReconsiderationNoGoStatus {
  return status === "blocked_external_evidence_missing"
    ? "no_go_external_evidence_missing"
    : "manual_review_blocked";
}

function buildNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationPreflightItem,
): WriterPersistenceAuthorizationReconsiderationNoGoItem {
  const externalEvidenceMissing =
    sourceItem.status === "blocked_external_evidence_missing";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: `${sourceItem.title} no-go`,
    status: mapStatus(sourceItem.status),
    owner: sourceItem.owner,
    sourcePreflightItemIds: [sourceItem.id],
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourcePreflightStatus: sourceItem.status,
    sourceRefs: sourceItem.sourceRefs,
    noGoQuestion:
      "Can this preflight item unlock implementation authorization reconsideration now?",
    noGoConclusion: externalEvidenceMissing
      ? "No. Required external evidence remains missing or unaccepted, so implementation authorization reconsideration cannot start."
      : "No. A manual external reviewer is still required, and this app cannot substitute for that review.",
    blockingEvidence: unique([
      sourceItem.currentFinding,
      ...sourceItem.missingPrerequisites,
      "preflightAccepted=false",
      "preflightRecorded=false",
      "reconsiderationEligible=false",
      "implementationAuthorizationReconsiderationReady=false",
      "implementationAuthorizationGranted=false",
    ]),
    unresolvedPreflightGaps: unique([
      ...sourceItem.requiredExternalInputs,
      ...sourceItem.reviewerQuestions,
      "No app-side accepted preflight result exists.",
      "No redacted external reviewer conclusion has been accepted by the app.",
      "A future read-only reconsideration remediation plan would still need to start from this no-go item.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not treat this no-go packet as an accepted denial, accepted preflight, accepted reconsideration decision, or authorization grant.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, AI calls, Stripe calls, or report unlocks from this packet.",
    ]),
    reconsiderationRequirements: unique([
      ...sourceItem.reconsiderationExitCriteria,
      "A future read-only remediation plan must map every unresolved preflight gap before any new reconsideration review can happen.",
      "A later read-only reconsideration review must keep all runtime side effects blocked until a separate authorization packet exists.",
    ]),
    safeEscalationRefs: unique([
      ...sourceItem.sourceRefs,
      ...sourceItem.requiredExternalInputs.filter((input) =>
        input.toLowerCase().includes("external"),
      ),
    ]),
    redactionRules: sourceItem.redactionRules,
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This reconsideration no-go item is not stored, accepted, signed, or promoted by the app.",
    ]),
    nextSafeAction:
      "Keep authorization reconsideration blocked and define only a read-only reconsideration remediation plan next.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationNoGoItem[],
  key:
    | "blockingEvidence"
    | "unresolvedPreflightGaps"
    | "forbiddenShortcuts"
    | "reconsiderationRequirements",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationNoGoPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    reconsiderationNoGoMode: payload.reconsiderationNoGoMode,
    reconsiderationNoGoPacketOnly: true as const,
    sourcePreflightChecklistOnly: true as const,
    sourceReviewNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    preflightAccepted: false as const,
    preflightRecorded: false as const,
    reconsiderationEligible: false as const,
    reconsiderationNoGoAccepted: false as const,
    reconsiderationNoGoRecorded: false as const,
    implementationAuthorizationReconsiderationReady: false as const,
    implementationAuthorizationGranted: false as const,
    implementationAuthorized: false as const,
    authorizationDecisionRecorded: false as const,
    authorizationArtifactStored: false as const,
    externalRemediationStatesAccepted: false as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationNoGoPayload> {
  const sourcePreflight =
    await buildWriterPersistenceAuthorizationReconsiderationPreflight();
  const noGoItems = sourcePreflight.preflightItems.map(buildNoGoItem);

  return {
    safeMode: true,
    readOnly: true,
    reconsiderationNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_no_go_packet_only",
    sourceReconsiderationPreflightMode:
      sourcePreflight.reconsiderationPreflightMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount: noGoItems.length,
    noGoCount: countByStatus(noGoItems, "no_go_external_evidence_missing"),
    manualReviewBlockedCount: countByStatus(
      noGoItems,
      "manual_review_blocked",
    ),
    reconsiderationStillBlockedCount: noGoItems.length,
    blockingEvidenceCount: uniqueCount(noGoItems, "blockingEvidence"),
    unresolvedPreflightGapCount: uniqueCount(
      noGoItems,
      "unresolvedPreflightGaps",
    ),
    forbiddenShortcutCount: uniqueCount(noGoItems, "forbiddenShortcuts"),
    reconsiderationRequirementCount: uniqueCount(
      noGoItems,
      "reconsiderationRequirements",
    ),
    sourcePreflightItemCount: sourcePreflight.preflightItemCount,
    sourceBlockedPreflightItemCount:
      sourcePreflight.blockedPreflightItemCount,
    sourceExternalEvidenceMissingCount:
      sourcePreflight.externalEvidenceMissingCount,
    sourceManualReviewerRequiredCount:
      sourcePreflight.manualReviewerRequiredCount,
    reconsiderationNoGoPacketReady: true,
    reconsiderationNoGoPacketOnly: true,
    sourcePreflightChecklistReady:
      sourcePreflight.reconsiderationPreflightChecklistReady,
    sourcePreflightChecklistOnly:
      sourcePreflight.reconsiderationPreflightChecklistOnly,
    sourceReviewNoGoPacketReady: sourcePreflight.sourceReviewNoGoPacketReady,
    sourceReviewNoGoPacketOnly: sourcePreflight.sourceReviewNoGoPacketOnly,
    sourceReleaseStillBlocked: sourcePreflight.sourceReleaseStillBlocked,
    preflightPassed: false,
    preflightAccepted: false,
    preflightRecorded: false,
    reconsiderationEligible: false,
    reconsiderationNoGoAccepted: false,
    reconsiderationNoGoRecorded: false,
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
    noGoRules: [
      "This endpoint is a read-only authorization reconsideration no-go packet, not a reconsideration decision system.",
      "It may summarize why the preflight checklist still cannot unlock implementation authorization reconsideration.",
      "It must not accept reconsideration no-go items, record no-go outcomes, accept preflight results, mark reconsideration ready, start reconsideration, accept remediation states, accept archives, store approvals, create authorization records, deny authorization, grant authorization, create implementation branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "No-go packet readiness does not mean any preflight result was accepted or any authorization decision was recorded.",
    ],
    remediationBoundaryRules: [
      "A future reconsideration remediation plan must start from this no-go packet and the source preflight item ids.",
      "Only safe item ids, owner roles, redacted evidence refs, timestamps, and plain-language conclusions may be referenced.",
      "Raw artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies are forbidden.",
      "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this no-go packet.",
      "The read-only implementation authorization reconsideration remediation plan, remediation review checklist, remediation review no-go packet, final decision packet, external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet.",
    ],
    sourceBlockedCodes: sourcePreflight.blockedCodes,
    noGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration no-go probe blocked: no reconsideration no-go acceptance, no-go record, preflight acceptance, preflight record, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

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
      "Persistence authorization reconsideration no-go probe blocked as designed: the selected no-go item was returned, but no reconsideration no-go acceptance, no-go record, preflight acceptance, preflight record, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    noGoItems: [selectedItem],
  };
}
