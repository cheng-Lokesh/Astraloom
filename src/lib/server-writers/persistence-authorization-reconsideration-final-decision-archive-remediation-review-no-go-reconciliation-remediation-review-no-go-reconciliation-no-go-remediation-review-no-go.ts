import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review";
import type { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem } from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRuntimeFlags,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockedCodes =
  [
    "implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_packet_only",
    "source_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_checklist_still_blocks_authorization",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_authorization_denial_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_authorization_decision_promotion_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_record_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_evidence_storage_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_mark_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_acceptance_forbidden",
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_acceptance_forbidden",
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

const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRuntimeBlockedFlags =
  {
    wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo:
      false,
    wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo:
      false,
    wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      false,
    wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoToAuthorizationDecision:
      false,
  } as const satisfies Pick<
    WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRuntimeFlags,
    | "wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo"
    | "wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo"
    | "wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview"
    | "wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoToAuthorizationDecision"
  >;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function noGoStatus(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus {
  return sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_external_evidence_missing"
    ? "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_external_evidence_missing"
    : "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_manual_reviewer_required";
}

function noGoTitle(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem,
) {
  if (sourceItem.title.endsWith(" review")) {
    return sourceItem.title.replace(/ review$/, " review no-go");
  }

  return `${sourceItem.title} no-go`;
}

function buildRemediationReviewNoGoItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem {
  const externalEvidenceMissing =
    sourceItem.status ===
    "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_external_evidence_missing";

  return {
    id: `${sourceItem.id}_no_go`,
    category: sourceItem.category,
    title: noGoTitle(sourceItem),
    status: noGoStatus(sourceItem),
    owner: sourceItem.owner,
    sourceRemediationReviewStatus: sourceItem.status,
    sourceRemediationReviewItemIds: [sourceItem.id],
    sourceNoGoRemediationItemIds: sourceItem.sourceNoGoRemediationItemIds,
    sourceReconciliationNoGoItemIds: sourceItem.sourceReconciliationNoGoItemIds,
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
    noGoQuestion:
      "Can this archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review unlock implementation authorization now?",
    noGoConclusion: externalEvidenceMissing
      ? "No. The remediation review checklist is traceable, but required external evidence remains missing and cannot support implementation authorization."
      : "No. The remediation review checklist is traceable, but required manual reviewer state remains unresolved and cannot be replaced by this read-only no-go packet.",
    blockerEvidence: unique([
      sourceItem.reviewQuestion,
      sourceItem.currentFinding,
      ...sourceItem.completenessChecks,
      ...sourceItem.manualReviewerChecks,
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted=false",
      "externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedReviewGaps: unique([
      ...sourceItem.stillBlockedBecause,
      ...sourceItem.rejectionTriggers,
      "No accepted external evidence state is present in app state.",
      "No accepted manual reviewer conclusion is present in app state.",
      "No remediation review no-go packet is accepted, recorded, stored, or promoted by this route.",
      "No authorization denial or implementation authorization can be inferred from this no-go packet.",
    ]),
    sourceChecklistFailures: unique([
      ...sourceItem.failCriteriaForCurrentReview,
      "The source remediation review checklist remains a checklist only and does not produce an accepted remediation review outcome.",
      "The source remediation review checklist explicitly keeps review acceptance, remediation acceptance, no-go acceptance, authorization denial, and implementation authorization false.",
    ]),
    forbiddenShortcuts: unique([
      ...sourceItem.nonAcceptanceClauses,
      "Do not treat this no-go packet as accepted no-go, accepted remediation review, accepted remediation, accepted reconciliation, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation approval.",
      "Do not create implementation files, tests, migrations, service-role clients, branches, transactions, row writes, feature flags, deployments, production writers, AI calls, Stripe calls, or report unlocks from this packet.",
    ]),
    futureResolutionPrerequisites: unique([
      ...sourceItem.passCriteriaForFutureReview,
      "A later external process must provide accepted safe evidence or accepted manual reviewer state before remediation review can be reconsidered.",
      "A later remediation or review path may organize unresolved gaps, but it must remain read-only until a separate human authorization mechanism is deliberately introduced.",
    ]),
    safeNoGoRefs: unique([
      sourceItem.id,
      ...sourceItem.sourceRefs,
      ...sourceItem.safeEvidenceRefs,
      ...sourceItem.sourceNoGoRemediationItemIds,
      ...sourceItem.sourceReconciliationNoGoItemIds,
      ...sourceItem.sourceReconciliationItemIds,
      ...sourceItem.sourceNoGoItemIds,
      ...sourceItem.sourceReviewItemIds,
      ...sourceItem.sourceRemediationItemIds,
      ...sourceItem.sourceArchiveNoGoItemIds,
      ...sourceItem.sourceArchiveRemediationItemIds,
      ...sourceItem.sourceArchiveItemIds,
      ...sourceItem.sourceDecisionItemIds,
    ]),
    redactionRules: unique([
      ...sourceItem.redactionChecks,
      "Only safe item ids, owner roles, state labels, redaction labels, blocker labels, caveats, and short no-go questions may be shown.",
      "Raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, and full external document bodies remain forbidden.",
    ]),
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This remediation review no-go item is not stored, accepted, signed, recorded, or promoted by the app.",
      "This remediation review no-go item does not deny authorization or grant authorization.",
      "This no-go packet is documentation of unresolved conditions only; it is not a runtime decision artifact.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked and define only a later read-only remediation path before any acceptance, recording, authorization, branch, migration, privileged client, deployment, AI, Stripe, report, or database-write work.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItem[],
  key:
    | "blockerEvidence"
    | "unresolvedReviewGaps"
    | "sourceChecklistFailures"
    | "forbiddenShortcuts"
    | "futureResolutionPrerequisites"
    | "redactionRules",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly:
      true as const,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly:
      true as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPayload> {
  const sourceReview =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview();
  const archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems =
    sourceReview.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems.map(
      buildRemediationReviewNoGoItem,
    );
  const blockedCodes = unique([
    ...sourceReview.blockedCodes,
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockedCodes,
  ]);

  return {
    ...sourceReview,
    safeMode: true,
    readOnly: true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoMode:
      "persistence_adapter_implementation_authorization_reconsideration_external_final_decision_archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_packet_only",
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistMode:
      sourceReview.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistMode,
    checkedAt: new Date().toISOString(),
    noGoItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems.length,
    remediationReviewNoGoItemCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems.length,
    externalEvidenceReviewNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_external_evidence_missing",
    ),
    manualReviewerReviewNoGoCount: countByStatus(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "archive_remediation_review_no_go_reconciliation_remediation_review_no_go_reconciliation_no_go_remediation_review_no_go_manual_reviewer_required",
    ),
    remediationReviewStillBlockedCount:
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems.length,
    blockerEvidenceCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "blockerEvidence",
    ),
    unresolvedReviewGapCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "unresolvedReviewGaps",
    ),
    sourceChecklistFailureCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "sourceChecklistFailures",
    ),
    forbiddenShortcutCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "forbiddenShortcuts",
    ),
    futureResolutionPrerequisiteCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "futureResolutionPrerequisites",
    ),
    redactionRuleCount: uniqueCount(
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
      "redactionRules",
    ),
    sourceReviewItemCount: sourceReview.reviewItemCount,
    sourceExternalEvidenceMissingCount: sourceReview.externalEvidenceMissingCount,
    sourceManualReviewerRequiredCount: sourceReview.manualReviewerRequiredCount,
    sourceNoGoRemediationStillBlockedCount:
      sourceReview.reconciliationNoGoRemediationStillBlockedCount,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady:
      true,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly:
      true,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady:
      sourceReview.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady,
    sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly:
      sourceReview.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted:
      false,
    externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted:
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
    ...archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRuntimeBlockedFlags,
    blockedCodes,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRules:
      [
        "This endpoint is a read-only archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review no-go packet, not an authorization decision and not an executable writer.",
        "It may summarize unresolved remediation review gaps, source ids, blocker evidence, redaction rules, forbidden shortcuts, future prerequisites, and safe no-go refs.",
        "It must not accept no-go outcomes, record no-go outcomes, deny authorization, promote no-go items to authorization decisions, accept remediation review, record review outcomes, store review evidence, mark remediation reviewed, accept remediation, accept reconciliation, accept review outcomes, accept archives, accept final decisions, grant authorization, store approvals, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
        "No-go packet readiness does not mean any blocker was resolved, any no-go result was accepted, any authorization denial was recorded, or implementation authorization was granted.",
      ],
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRejectionRules:
      [
        "Reject any input that removes source review, source remediation, source no-go, source reconciliation, source archive, or source final decision ids.",
        "Reject any input that includes raw archive artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, service-role config, or full external document bodies.",
        "Reject any input that treats no-go packet readiness as accepted no-go, accepted remediation review, accepted remediation, accepted reconciliation, accepted archive, accepted final decision, authorization denial, authorization grant, or implementation readiness.",
        "Reject any input that starts branch, patch, file, test, migration, privileged-client, transaction, database-write, AI, Stripe, deployment, feature-flag, production-writer, or report-unlock work.",
      ],
    sourceArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems:
      sourceReview.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems,
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo();
  const blockedSummary =
    "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review no-go probe blocked: no no-go acceptance, no-go record, authorization denial, authorization decision promotion, remediation review acceptance, review record, evidence storage, reviewed mark, remediation acceptance, no-go acceptance, reconciliation acceptance, review acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; noGoItemId?: unknown }).itemId ??
    (requestBody as { noGoItemId?: unknown }).noGoItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
    };
  }

  const selectedItem =
    payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems.find(
      (candidate) => candidate.id === itemId,
    );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems:
        payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review no-go probe blocked as designed: the selected no-go item was returned, but no no-go acceptance, no-go record, authorization denial, authorization decision promotion, remediation review acceptance, review record, evidence storage, reviewed mark, remediation acceptance, no-go acceptance, reconciliation acceptance, review acceptance, archive acceptance, final decision acceptance, authorization grant, approval storage, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems:
      [selectedItem],
  };
}
