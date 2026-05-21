import "server-only";

import { buildWriterPersistenceAuthorizationRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationPreflightItem,
  WriterPersistenceAuthorizationReconsiderationPreflightPayload,
  WriterPersistenceAuthorizationReconsiderationPreflightProbeResult,
  WriterPersistenceAuthorizationReconsiderationPreflightRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationPreflightStatus,
} from "@/types/writer-persistence-authorization-reconsideration-preflight";

const blockedCodes = [
  "implementation_authorization_reconsideration_preflight_only",
  "source_remediation_review_no_go_packet_still_blocks_reconsideration",
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
} as const satisfies WriterPersistenceAuthorizationReconsiderationPreflightRuntimeFlags;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  status: WriterPersistenceAuthorizationRemediationReviewNoGoStatus,
): WriterPersistenceAuthorizationReconsiderationPreflightStatus {
  return status === "no_go"
    ? "blocked_external_evidence_missing"
    : "blocked_manual_review_required";
}

function buildPreflightItem(
  sourceItem: WriterPersistenceAuthorizationRemediationReviewNoGoItem,
): WriterPersistenceAuthorizationReconsiderationPreflightItem {
  const externalEvidenceMissing = sourceItem.status === "no_go";

  return {
    id: `${sourceItem.id}_preflight`,
    category: sourceItem.category,
    title: `${sourceItem.title} reconsideration preflight`,
    status: mapStatus(sourceItem.status),
    owner: sourceItem.owner,
    sourceNoGoItemIds: [sourceItem.id, ...sourceItem.sourceNoGoItemIds],
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceNoGoStatus: sourceItem.status,
    sourceRefs: sourceItem.sourceRefs,
    preflightQuestion:
      "What must be true before this no-go item can be reconsidered for implementation authorization?",
    currentFinding: externalEvidenceMissing
      ? "Blocked. Required external remediation evidence is still missing or unaccepted, so this item cannot enter authorization reconsideration."
      : "Blocked. A human reviewer is still required, and this app cannot substitute for that external review.",
    missingPrerequisites: unique([
      ...sourceItem.unresolvedReviewGaps,
      "externalRemediationStatesAccepted=false",
      "remediationReviewNoGoAccepted=false",
      "implementationAuthorizationReconsiderationReady=false",
      "implementationAuthorizationGranted=false",
    ]),
    requiredExternalInputs: unique([
      ...sourceItem.reconsiderationRequirements,
      ...sourceItem.safeEscalationRefs,
      "External reviewer must provide a redacted, off-app evidence reference.",
      "External reviewer must confirm whether the source no-go item is superseded, still valid, or requires more remediation.",
    ]),
    reviewerQuestions: unique([
      sourceItem.noGoQuestion,
      "Which exact source no-go item is being reconsidered?",
      "Which external evidence reference proves the blocker changed?",
      "Who reviewed the external evidence outside the app?",
      "What redacted conclusion can be safely copied into a future checklist without raw artifacts?",
    ]),
    redactionRules: unique([
      ...sourceItem.redactionRules,
      "Do not copy raw private narratives, prompts, provider payloads, webhook bodies, artifact contents, signatures, tokens, secrets, or credential-like values.",
      "Use only safe owner roles, item ids, timestamps, redacted external references, and plain-language conclusions.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not treat preflight completion as authorization reconsideration readiness.",
      "Do not accept this no-go item, store a decision, create a branch, create files, create tests, create migrations, create privileged clients, open transactions, write rows, call AI, call Stripe, deploy, enable flags, or unlock reports.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This preflight item is a checklist only; it does not accept evidence, accept no-go reversal, or record authorization outcomes.",
    ]),
    reconsiderationExitCriteria: unique([
      "A future external reviewer supplies a redacted evidence reference for every source no-go item.",
      "A future external reviewer explicitly resolves every missing prerequisite listed by this preflight item.",
      "The future review still passes redaction and does not expose raw artifacts or secrets.",
      "A later read-only no-go or decision packet is created before any implementation authorization can be granted.",
    ]),
    nextSafeAction:
      "Keep this item blocked until a future read-only reconsideration no-go or decision packet can cite external review evidence.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationPreflightItem[],
  status: WriterPersistenceAuthorizationReconsiderationPreflightStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationPreflightItem[],
  key:
    | "missingPrerequisites"
    | "requiredExternalInputs"
    | "reviewerQuestions"
    | "redactionRules"
    | "forbiddenShortcuts"
    | "reconsiderationExitCriteria",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationPreflightPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    reconsiderationPreflightMode: payload.reconsiderationPreflightMode,
    reconsiderationPreflightChecklistOnly: true as const,
    sourceReviewNoGoPacketOnly: true as const,
    sourceReleaseStillBlocked: true as const,
    preflightAccepted: false as const,
    preflightRecorded: false as const,
    reconsiderationEligible: false as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationPreflight(): Promise<WriterPersistenceAuthorizationReconsiderationPreflightPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationRemediationReviewNoGo();
  const preflightItems = sourceNoGo.noGoItems.map(buildPreflightItem);

  return {
    safeMode: true,
    readOnly: true,
    reconsiderationPreflightMode:
      "persistence_adapter_implementation_authorization_reconsideration_preflight_checklist_only",
    sourceReviewNoGoMode: sourceNoGo.remediationReviewNoGoMode,
    checkedAt: new Date().toISOString(),
    preflightItemCount: preflightItems.length,
    blockedPreflightItemCount: preflightItems.length,
    externalEvidenceMissingCount: countByStatus(
      preflightItems,
      "blocked_external_evidence_missing",
    ),
    manualReviewerRequiredCount: countByStatus(
      preflightItems,
      "blocked_manual_review_required",
    ),
    missingPrerequisiteCount: uniqueCount(
      preflightItems,
      "missingPrerequisites",
    ),
    requiredExternalInputCount: uniqueCount(
      preflightItems,
      "requiredExternalInputs",
    ),
    reviewerQuestionCount: uniqueCount(preflightItems, "reviewerQuestions"),
    redactionRuleCount: uniqueCount(preflightItems, "redactionRules"),
    forbiddenShortcutCount: uniqueCount(preflightItems, "forbiddenShortcuts"),
    exitCriteriaCount: uniqueCount(
      preflightItems,
      "reconsiderationExitCriteria",
    ),
    sourceNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceNoGoCount: sourceNoGo.noGoCount,
    sourceManualReviewBlockedCount: sourceNoGo.manualReviewBlockedCount,
    sourceReconsiderationStillBlockedCount:
      sourceNoGo.reconsiderationStillBlockedCount,
    reconsiderationPreflightChecklistReady: true,
    reconsiderationPreflightChecklistOnly: true,
    sourceReviewNoGoPacketReady: sourceNoGo.reviewNoGoPacketReady,
    sourceReviewNoGoPacketOnly: sourceNoGo.reviewNoGoPacketOnly,
    sourceReleaseStillBlocked: sourceNoGo.sourceReleaseStillBlocked,
    preflightPassed: false,
    preflightAccepted: false,
    preflightRecorded: false,
    reconsiderationEligible: false,
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
    preflightRules: [
      "This endpoint is a read-only authorization reconsideration preflight checklist, not a reconsideration decision system.",
      "It may enumerate what a future external reviewer must provide before implementation authorization can be reconsidered.",
      "It must not accept preflight results, accept no-go packets, accept remediation states, accept archives, store approvals, create authorization records, grant or deny authorization, create implementation branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "A ready checklist does not mean the source no-go packet was accepted, reversed, or superseded.",
    ],
    reconsiderationBoundaryRules: [
      "Reconsideration remains blocked until every source no-go item has a redacted external evidence reference and an external reviewer conclusion.",
      "Only safe item ids, owner roles, redacted evidence refs, timestamps, and plain-language conclusions may be used.",
      "Raw artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies are forbidden.",
      "Any future authorization decision must be represented by another read-only packet before real implementation can begin.",
      "The read-only implementation authorization reconsideration no-go packet, remediation plan, remediation review checklist, remediation review no-go packet, final decision packet, external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet.",
    ],
    sourceBlockedCodes: sourceNoGo.blockedCodes,
    preflightItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationPreflight(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationPreflightProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationPreflight();
  const blockedSummary =
    "Persistence authorization reconsideration preflight probe blocked: no preflight acceptance, preflight record, reconsideration readiness, reconsideration start, no-go acceptance, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      preflightItems: payload.preflightItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; preflightItemId?: unknown }).itemId ??
    (requestBody as { preflightItemId?: unknown }).preflightItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      preflightItems: payload.preflightItems,
    };
  }

  const selectedItem = payload.preflightItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      preflightItems: payload.preflightItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration preflight probe blocked as designed: the selected preflight item was returned, but no preflight acceptance, preflight record, reconsideration readiness, reconsideration start, no-go acceptance, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    preflightItems: [selectedItem],
  };
}
