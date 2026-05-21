import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation";

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationBlockedCodes =
  [
    "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_plan_only",
    "source_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_packet_still_blocks_authorization",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_evidence_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_blocker_resolution_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_ticket_creation_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_state_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_promotion_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_acceptance_forbidden",
    "archive_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_acceptance_forbidden",
    "archive_remediation_acceptance_forbidden",
    "archive_blocker_resolution_forbidden",
    "archive_no_go_acceptance_forbidden",
    "external_archive_acceptance_forbidden",
    "final_decision_acceptance_forbidden",
    "authorization_denial_forbidden",
    "implementation_authorization_grant_forbidden",
    "authorization_record_creation_forbidden",
    "approval_storage_forbidden",
    "feature_flag_enablement_forbidden",
    "deployment_forbidden",
    "production_writer_execution_forbidden",
    "branch_creation_forbidden",
    "file_creation_forbidden",
    "file_modification_forbidden",
    "test_creation_forbidden",
    "service_role_client_forbidden",
    "transaction_forbidden",
    "database_writes_forbidden",
    "audit_idempotency_writes_forbidden",
    "migration_creation_forbidden",
    "ai_stripe_report_side_effects_forbidden",
  ];

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationEvidence:
      false,
    wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationBlockerResolved:
      false,
    wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationTicket:
      false,
    wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationState:
      false,
    wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationEvidence"
    | "wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationBlockerResolved"
    | "wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationTicket"
    | "wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationState"
    | "wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapRemediationStatus(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatus {
  return item.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved"
    ? "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_external_evidence_required"
    : "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_manual_review_required";
}

function remediationTitle(
  item: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem,
) {
  if (item.title.endsWith(" no-go")) {
    return item.title.replace(/ no-go$/, " remediation");
  }

  return `${item.title} remediation`;
}

function buildNoGoRemediationItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem {
  const externalEvidenceRequired =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_external_evidence_unresolved";

  return {
    id: `${sourceItem.id}_remediation`,
    category: sourceItem.category,
    title: remediationTitle(sourceItem),
    status: mapRemediationStatus(sourceItem),
    owner: sourceItem.owner,
    sourceReconciliationNoGoStatus: sourceItem.status,
    sourceReconciliationNoGoItemIds: unique([
      sourceItem.id,
      ...sourceItem.sourceReconciliationNoGoItemIds,
    ]),
    sourceReconciliationItemIds: sourceItem.sourceReconciliationItemIds,
    sourceNoGoItemIds: sourceItem.sourceNoGoItemIds,
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceRemediationItemIds: sourceItem.sourceRemediationItemIds,
    sourceArchiveNoGoItemIds: sourceItem.sourceArchiveNoGoItemIds,
    sourceArchiveRemediationItemIds: sourceItem.sourceArchiveRemediationItemIds,
    sourceArchiveItemIds: sourceItem.sourceArchiveItemIds,
    sourceDecisionItemIds: sourceItem.sourceDecisionItemIds,
    sourceNoGoItemIdsFromReconsideration:
      sourceItem.sourceNoGoItemIdsFromReconsideration,
    sourceReviewItemIdsFromReconsideration:
      sourceItem.sourceReviewItemIdsFromReconsideration,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    blockerSummary: sourceItem.noGoConclusion,
    remediationQuestion:
      "What external remediation shape would be required before this reconciliation no-go item can be reviewed again without enabling implementation?",
    remediationPlan: externalEvidenceRequired
      ? "Collect a safe external evidence state, owner role, redaction status, tamper-evidence status, and future reviewer question for this reconciliation no-go item while keeping the app read-only."
      : "Assign a safe manual reviewer lane, reviewer question set, owner role, redaction status, tamper-evidence status, and future reviewer conclusion placeholder while keeping the app read-only.",
    requiredExternalState: externalEvidenceRequired
      ? "external_evidence_present_redacted_tamper_evident_and_ready_for_later_review"
      : "manual_reviewer_assigned_with_safe_conclusion_placeholder_and_ready_for_later_review",
    safeEvidenceRequirements: unique([
      "source reconciliation no-go item id",
      "source reconciliation item id",
      "source review no-go item id",
      "source review item id",
      "source remediation item id",
      "source archive remediation review no-go item id",
      "source archive remediation review item id",
      "source archive remediation item id",
      "source archive no-go item id",
      "source final decision item id",
      "owner role",
      "external evidence state",
      "redaction state",
      "tamper-evidence state",
      "future remediation review question id",
      ...sourceItem.safeNoGoRefs,
    ]),
    manualReviewRequirements: unique([
      "manual reviewer role",
      "manual reviewer assignment state",
      "manual reviewer independence check",
      "manual reviewer conflict check",
      "manual reviewer safe conclusion placeholder",
      "manual reviewer rejection reason placeholder",
      "manual reviewer escalation owner",
      ...sourceItem.futureResolutionPrerequisites,
    ]),
    verificationSteps: unique([
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted=false.",
      "Confirm externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted=false.",
      "Confirm authorizationReconsiderationFinalDecisionAccepted=false.",
      "Confirm implementationAuthorizationGranted=false.",
      "Confirm readyForAdapterImplementation=false.",
      "Confirm wouldWriteRows=false, wouldRunTransaction=false, and wouldCreateServiceRoleClient=false.",
    ]),
    acceptanceCriteria: unique([
      "Every source reconciliation no-go item remains mapped to this remediation item.",
      "External evidence is represented only by safe state labels, safe ids, owner roles, redaction state, and tamper-evidence state.",
      "Manual reviewer requirements are represented only by role, assignment state, independence check, conclusion placeholder, and escalation state.",
      "No app-side no-go acceptance, remediation acceptance, reconciliation acceptance, authorization denial, authorization grant, branch, file, test, migration, privileged client, deployment, AI, Stripe, report unlock, or database write occurs.",
      "A later read-only remediation review checklist can evaluate the safe evidence shape without accepting it.",
    ]),
    residualRisks: unique([
      "External evidence may still be missing, stale, tampered, rejected, private, or inaccessible.",
      "Manual reviewers may reject the remediation, require narrower scope, or demand additional external artifacts.",
      "The later remediation review may still produce another no-go packet.",
      "Readiness of this remediation plan does not mean implementation authorization exists.",
      ...sourceItem.unresolvedReconciliationGaps,
    ]),
    redactionRules: unique([
      ...sourceItem.redactionRules,
      "Expose only safe ids, owner roles, external state labels, reviewer state labels, redaction labels, tamper-evidence labels, and short reviewer questions.",
      "Do not expose raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
    ]),
    rejectionTriggers: unique([
      ...sourceItem.sourceChecklistFailures,
      "Reject remediation evidence that drops source no-go, reconciliation, review, remediation, archive, or final decision ids.",
      "Reject remediation evidence that contains raw private narrative, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full artifact bodies.",
      "Reject remediation evidence that claims remediation acceptance, no-go acceptance, reconciliation acceptance, review acceptance, archive acceptance, final decision acceptance, authorization denial, or authorization grant.",
      "Reject remediation evidence that starts implementation, branch, patch, file, test, migration, service-role client, transaction, database write, deployment, AI, Stripe, feature flag, production writer, or report unlock work.",
    ]),
    forbiddenActions: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not accept this remediation plan in the app.",
      "Do not record remediation evidence or mark any reconciliation blocker resolved.",
      "Do not create remediation tickets, authorization records, approval records, branches, files, tests, service-role clients, transactions, migrations, deployments, feature flags, production writers, AI calls, Stripe calls, or report unlocks.",
    ]),
    nonExecutionClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This remediation item is a read-only plan, not an accepted remediation state.",
      "This remediation item does not accept no-go outcomes, accept reconciliation, accept reviews, accept final decisions, deny authorization, grant authorization, or start implementation work.",
    ]),
    futureAcceptanceGates: unique([
      "A later read-only remediation review checklist must inspect this plan and the source no-go ids.",
      "A later human authorization mechanism must explicitly accept external evidence outside this route before implementation authorization can be reconsidered.",
      "A later implementation step must still pass service-role isolation, transaction, audit, idempotency, rollback, rollout, RLS, and manual owner gates.",
      "All real writes must remain blocked until a separate explicit authorization stage changes the hard constraints.",
    ]),
    nextReviewGate:
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_checklist",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItem[],
  key:
    | "safeEvidenceRequirements"
    | "manualReviewRequirements"
    | "verificationSteps"
    | "acceptanceCriteria"
    | "residualRisks"
    | "redactionRules"
    | "rejectionTriggers"
    | "forbiddenActions"
    | "futureAcceptanceGates",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted:
      false as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted:
      false as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo();
  const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems =
    sourceNoGo.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems.map(
      buildNoGoRemediationItem,
    );
  const blockedCodes = unique([
    ...sourceNoGo.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationBlockedCodes,
  ]);

  return {
    ...sourceNoGo,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_plan_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoMode,
    checkedAt: new Date().toISOString(),
    remediationItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems.length,
    externalReconciliationNoGoRemediationRequiredCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_external_evidence_required",
    ),
    manualReconciliationNoGoReviewRequiredCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_manual_review_required",
    ),
    safeEvidenceRequirementCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "safeEvidenceRequirements",
    ),
    manualReviewRequirementCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "manualReviewRequirements",
    ),
    verificationStepCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "verificationSteps",
    ),
    acceptanceCriteriaCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "acceptanceCriteria",
    ),
    residualRiskCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "residualRisks",
    ),
    redactionRuleCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "redactionRules",
    ),
    rejectionTriggerCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "rejectionTriggers",
    ),
    forbiddenActionCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "forbiddenActions",
    ),
    futureAcceptanceGateCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
      "futureAcceptanceGates",
    ),
    sourceReconciliationNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceReconciliationNoGoCount: sourceNoGo.reconciliationNoGoItemCount,
    sourceExternalEvidenceReconciliationNoGoCount:
      sourceNoGo.externalEvidenceReconciliationNoGoCount,
    sourceManualReviewerReconciliationNoGoCount:
      sourceNoGo.manualReviewerReconciliationNoGoCount,
    sourceReconciliationStillBlockedCount:
      sourceNoGo.reconciliationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      sourceNoGo.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoAccepted: false,
    finalDecisionArchiveRemediationReviewAccepted: false,
    externalFinalDecisionArchiveRemediationAccepted: false,
    finalDecisionArchiveNoGoAccepted: false,
    externalFinalDecisionArchiveAccepted: false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanRules:
      [
        "This endpoint is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation plan, not a remediation acceptance system.",
        "It may map source no-go items to safe evidence requirements, manual reviewer requirements, verification steps, acceptance criteria, residual risks, redaction rules, rejection triggers, forbidden actions, non-execution clauses, and future acceptance gates.",
        "It must not accept remediation, record remediation evidence, resolve reconciliation blockers, create remediation tickets, accept no-go outcomes, deny authorization, promote no-go items to authorization decisions, accept reconciliation, accept review no-go outcomes, accept review outcomes, accept archives, accept final decisions, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
        "Remediation plan readiness does not mean any blocker was resolved, any no-go result was accepted, any authorization denial was recorded, or implementation authorization was granted.",
      ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRules:
      [
        "A later remediation review checklist must start from this plan and the source reconciliation no-go item ids.",
        "External archive evidence may be referenced only by safe item id, owner role, status, redaction state, tamper-evidence state, and short review question.",
        "Manual reviewer output may be referenced only by role, assignment state, independence check, safe conclusion placeholder, redaction state, and escalation state.",
        "Reject raw prompts, private narratives, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies.",
        "No implementation branch, patch, test, migration, service-role client, database write, deployment, feature flag, production writer, AI, Stripe, or report unlock may start from this plan.",
      ],
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRules:
      sourceNoGo.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRules,
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems:
      sourceNoGo.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation probe blocked: no remediation acceptance, remediation evidence record, blocker resolution, ticket creation, remediation state acceptance, remediation review promotion, no-go acceptance, no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, review no-go acceptance, review acceptance, remediation acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; remediationItemId?: unknown }).itemId ??
    (requestBody as { remediationItemId?: unknown }).remediationItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation probe blocked as designed: the selected remediation item was returned, but no remediation acceptance, remediation evidence record, blocker resolution, ticket creation, remediation state acceptance, remediation review promotion, no-go acceptance, no-go record, authorization denial, authorization decision promotion, reconciliation acceptance, review no-go acceptance, review acceptance, remediation acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems:
      [selectedItem],
  };
}
