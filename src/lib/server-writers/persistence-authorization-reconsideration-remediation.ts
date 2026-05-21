import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-no-go";
import type { WriterPersistenceAuthorizationReconsiderationNoGoItem } from "@/types/writer-persistence-authorization-reconsideration-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationItem,
  WriterPersistenceAuthorizationReconsiderationRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationRemediationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation";

const blockedCodes = [
  "implementation_authorization_reconsideration_remediation_plan_only",
  "source_reconsideration_no_go_packet_still_blocks_authorization",
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
} as const satisfies WriterPersistenceAuthorizationReconsiderationRemediationRuntimeFlags;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function remediationStatus(
  item: WriterPersistenceAuthorizationReconsiderationNoGoItem,
): WriterPersistenceAuthorizationReconsiderationRemediationStatus {
  return item.status === "no_go_external_evidence_missing"
    ? "external_remediation_required"
    : "manual_review_required";
}

function buildRemediationItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationNoGoItem,
): WriterPersistenceAuthorizationReconsiderationRemediationItem {
  const externalEvidenceMissing =
    sourceItem.status === "no_go_external_evidence_missing";
  const title = sourceItem.title.endsWith(" no-go")
    ? sourceItem.title.replace(/ no-go$/, " remediation")
    : `${sourceItem.title} remediation`;

  return {
    id: `${sourceItem.id}_remediation`,
    category: sourceItem.category,
    title,
    status: remediationStatus(sourceItem),
    owner: sourceItem.owner,
    sourceNoGoStatus: sourceItem.status,
    sourceNoGoItemIds: [sourceItem.id],
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    blockerSummary: sourceItem.noGoConclusion,
    remediationObjective: externalEvidenceMissing
      ? "Define the external evidence, redaction state, owner, and verification path required before this reconsideration blocker can be reviewed again."
      : "Define the manual reviewer lane, reviewer question set, redaction state, and verification path required before this reconsideration blocker can be reviewed again.",
    externalActions: unique([
      `Create an external remediation entry keyed by source no-go item id ${sourceItem.id}.`,
      externalEvidenceMissing
        ? "Collect safe external evidence status without uploading artifact bodies into the app."
        : "Assign an external reviewer role and keep reviewer conclusions outside the app.",
      "Map every unresolved preflight gap to an owner, evidence state, and future review question.",
      "Keep preflight acceptance, no-go acceptance, authorization records, branches, files, tests, migrations, deployments, and writes disabled.",
    ]),
    safeEvidenceRequirements: unique([
      "source no-go item id",
      "source preflight item id",
      "owner role",
      "external state: missing, present, stale, rejected, or reviewer_required",
      "redaction state",
      "future review question id",
      ...sourceItem.safeEscalationRefs,
    ]),
    verificationSteps: unique([
      "Confirm reconsiderationRemediationAccepted=false.",
      "Confirm reconsiderationNoGoAccepted=false.",
      "Confirm preflightAccepted=false.",
      "Confirm implementationAuthorizationGranted=false.",
      "Confirm readyForAdapterImplementation=false.",
      "Confirm wouldWriteRows=false and wouldCreateServiceRoleClient=false.",
    ]),
    acceptanceCriteria: unique([
      "Every source no-go item remains visible and mapped to this remediation plan.",
      "Every unresolved preflight gap has a safe external owner or remains explicitly blocking.",
      "No raw private narrative, prompt, provider payload, credential, webhook body, or artifact body is included.",
      "A later read-only remediation review checklist can inspect the evidence shape without accepting it.",
    ]),
    residualRisks: unique([
      "External evidence may still be incomplete, stale, or rejected.",
      "Manual reviewers may require narrower implementation scope before reconsideration can proceed.",
      "This plan may still result in another no-go after review.",
    ]),
    redactionRules: unique([
      ...sourceItem.redactionRules,
      "Reference only safe ids, owner roles, coverage states, redaction states, and short reviewer questions.",
      "Do not include raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, or full external document bodies.",
    ]),
    forbiddenActions: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not accept this remediation plan in the app.",
      "Do not record remediation evidence or mark any blocker resolved.",
      "Do not create tickets, authorization records, approval records, branches, files, tests, service-role clients, transactions, migrations, deployments, feature flags, production writers, AI calls, Stripe calls, or report unlocks.",
    ]),
    nonExecutionClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This remediation item is a read-only map, not an accepted remediation state.",
      "This remediation item does not deny or grant implementation authorization.",
      "This remediation item does not start implementation work.",
    ]),
    exitCriteria: unique([
      "The source no-go item has an external owner and safe evidence state.",
      "All unresolved preflight gaps are mapped to future review questions.",
      "A later read-only remediation review checklist can decide whether the item remains blocked.",
      "All runtime side effects remain blocked.",
    ]),
    nextReviewGate:
      "authorization_reconsideration_remediation_review_checklist",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationRemediationItem[],
  status: WriterPersistenceAuthorizationReconsiderationRemediationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationRemediationItem[],
  key:
    | "externalActions"
    | "safeEvidenceRequirements"
    | "verificationSteps"
    | "acceptanceCriteria"
    | "residualRisks"
    | "redactionRules"
    | "forbiddenActions"
    | "exitCriteria",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationRemediationPayload,
) {
  return {
    safeMode: true as const,
    readOnly: true as const,
    blocked: true as const,
    reconsiderationRemediationMode: payload.reconsiderationRemediationMode,
    reconsiderationRemediationPlanOnly: true as const,
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

export async function buildWriterPersistenceAuthorizationReconsiderationRemediation(): Promise<WriterPersistenceAuthorizationReconsiderationRemediationPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationNoGo();
  const remediationItems = sourceNoGo.noGoItems.map(buildRemediationItem);

  return {
    safeMode: true,
    readOnly: true,
    reconsiderationRemediationMode:
      "persistence_adapter_implementation_authorization_reconsideration_remediation_plan_only",
    sourceReconsiderationNoGoMode: sourceNoGo.reconsiderationNoGoMode,
    checkedAt: new Date().toISOString(),
    remediationItemCount: remediationItems.length,
    externalRemediationRequiredCount: countByStatus(
      remediationItems,
      "external_remediation_required",
    ),
    manualReviewRequiredCount: countByStatus(
      remediationItems,
      "manual_review_required",
    ),
    externalActionCount: uniqueCount(remediationItems, "externalActions"),
    safeEvidenceRequirementCount: uniqueCount(
      remediationItems,
      "safeEvidenceRequirements",
    ),
    verificationStepCount: uniqueCount(remediationItems, "verificationSteps"),
    acceptanceCriteriaCount: uniqueCount(
      remediationItems,
      "acceptanceCriteria",
    ),
    residualRiskCount: uniqueCount(remediationItems, "residualRisks"),
    redactionRuleCount: uniqueCount(remediationItems, "redactionRules"),
    forbiddenActionCount: uniqueCount(remediationItems, "forbiddenActions"),
    exitCriteriaCount: uniqueCount(remediationItems, "exitCriteria"),
    sourceNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceNoGoCount: sourceNoGo.noGoCount,
    sourceManualReviewBlockedCount: sourceNoGo.manualReviewBlockedCount,
    sourceReconsiderationStillBlockedCount:
      sourceNoGo.reconsiderationStillBlockedCount,
    reconsiderationRemediationPlanReady: true,
    reconsiderationRemediationPlanOnly: true,
    sourceReconsiderationNoGoPacketReady:
      sourceNoGo.reconsiderationNoGoPacketReady,
    sourceReconsiderationNoGoPacketOnly:
      sourceNoGo.reconsiderationNoGoPacketOnly,
    sourcePreflightChecklistReady: sourceNoGo.sourcePreflightChecklistReady,
    sourcePreflightChecklistOnly: sourceNoGo.sourcePreflightChecklistOnly,
    sourceReviewNoGoPacketReady: sourceNoGo.sourceReviewNoGoPacketReady,
    sourceReviewNoGoPacketOnly: sourceNoGo.sourceReviewNoGoPacketOnly,
    sourceReleaseStillBlocked: sourceNoGo.sourceReleaseStillBlocked,
    preflightPassed: false,
    preflightAccepted: false,
    preflightRecorded: false,
    reconsiderationEligible: false,
    reconsiderationNoGoAccepted: false,
    reconsiderationNoGoRecorded: false,
    reconsiderationRemediationAccepted: false,
    reconsiderationRemediationRecorded: false,
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
    remediationPlanRules: [
      "This endpoint is a read-only authorization reconsideration remediation plan, not a remediation acceptance system.",
      "It may map source reconsideration no-go items to external owner actions, safe evidence requirements, verification steps, acceptance criteria, residual risks, redaction rules, forbidden actions, exit criteria, and future review gates.",
      "It must not accept reconsideration remediation, record remediation evidence, mark blockers resolved, create tickets, accept no-go items, accept preflight results, start reconsideration, accept external remediation states, accept archives, store approvals, create authorization records, deny or grant implementation authorization, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "Remediation plan readiness does not mean any blocker is resolved; a later read-only remediation review checklist is required.",
    ],
    remediationReviewRules: [
      "A later reconsideration remediation review checklist must start from this plan and the source no-go item ids.",
      "External evidence may be referenced only by safe item id, owner role, status, redaction state, and review question.",
      "Reject raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies.",
      "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this plan.",
      "The read-only implementation authorization reconsideration remediation review checklist, remediation review no-go packet, final decision packet, external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet.",
    ],
    sourceBlockedCodes: sourceNoGo.blockedCodes,
    remediationItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationRemediation(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationRemediationProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationRemediation();
  const blockedSummary =
    "Persistence authorization reconsideration remediation probe blocked: no reconsideration remediation acceptance, remediation evidence record, blocker resolution, ticket creation, no-go acceptance, preflight acceptance, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      remediationItems: payload.remediationItems,
    };
  }

  const itemId = (requestBody as { itemId?: unknown }).itemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      remediationItems: payload.remediationItems,
    };
  }

  const selectedItem = payload.remediationItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      remediationItems: payload.remediationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration remediation probe blocked as designed: the selected remediation item was returned, but no reconsideration remediation acceptance, remediation evidence record, blocker resolution, ticket creation, no-go acceptance, preflight acceptance, reconsideration readiness, reconsideration start, authorization denial, authorization grant, external remediation state acceptance, archive acceptance, authorization record, feature flag, deployment, production writer execution, owner approval, patch acceptance, file change, test, git command, branch, adapter code, privileged client, transaction, migration, row write, AI call, Stripe call, or report unlock was performed.",
    remediationItems: [selectedItem],
  };
}
