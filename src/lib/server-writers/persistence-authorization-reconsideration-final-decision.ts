import "server-only";

import { buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-remediation-review-no-go";
import type {
  WriterPersistenceAuthorizationReconsiderationFinalDecisionItem,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionProbeResult,
  WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
} from "@/types/writer-persistence-authorization-reconsideration-final-decision";
import type {
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem,
  WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
} from "@/types/writer-persistence-authorization-reconsideration-remediation-review-no-go";

const finalDecisionBlockedCodes = [
  "implementation_authorization_reconsideration_final_decision_packet_only",
  "source_reconsideration_remediation_review_no_go_still_blocks_authorization",
  "final_go_decision_forbidden",
  "final_go_record_forbidden",
  "final_no_go_acceptance_forbidden",
  "final_no_go_record_forbidden",
  "authorization_reconsideration_final_decision_acceptance_forbidden",
  "authorization_reconsideration_final_decision_record_forbidden",
  "implementation_authorization_reconsideration_readiness_forbidden",
  "implementation_authorization_grant_forbidden",
  "implementation_authorization_denial_forbidden",
  "authorization_artifact_storage_forbidden",
  "approval_storage_forbidden",
  "external_final_decision_archive_acceptance_forbidden",
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
  "migration_creation_forbidden",
  "ai_stripe_report_side_effects_forbidden",
];

const finalRuntimeBlockedFlags = {
  wouldAcceptFinalDecision: false,
  wouldRecordFinalDecision: false,
  wouldAcceptFinalNoGo: false,
  wouldRecordFinalNoGo: false,
  wouldRecordFinalGo: false,
  wouldGrantImplementationAuthorizationFromFinalDecision: false,
  wouldDenyImplementationAuthorizationFromFinalDecision: false,
} as const;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function mapStatus(
  status: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoStatus,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus {
  return status === "no_go_external_evidence_missing"
    ? "final_no_go_external_evidence_missing"
    : "final_no_go_manual_review_blocked";
}

function buildDecisionItem(
  sourceItem: WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoItem,
): WriterPersistenceAuthorizationReconsiderationFinalDecisionItem {
  const externalEvidenceMissing =
    sourceItem.status === "no_go_external_evidence_missing";

  return {
    id: `${sourceItem.id}_final_decision`,
    category: sourceItem.category,
    title: `${sourceItem.title} final decision`,
    status: mapStatus(sourceItem.status),
    owner: sourceItem.owner,
    sourceNoGoStatus: sourceItem.status,
    sourceNoGoItemIds: unique([sourceItem.id, ...sourceItem.sourceNoGoItemIds]),
    sourceReviewItemIds: sourceItem.sourceReviewItemIds,
    sourceReconsiderationRemediationItemIds:
      sourceItem.sourceReconsiderationRemediationItemIds,
    sourcePreflightItemIds: sourceItem.sourcePreflightItemIds,
    sourceOriginalRemediationItemIds: sourceItem.sourceOriginalRemediationItemIds,
    sourceRefs: sourceItem.sourceRefs,
    finalQuestion:
      "Can implementation authorization be granted after reconsideration now?",
    finalConclusion: externalEvidenceMissing
      ? "No. External evidence remains missing or unaccepted, so the final reconsideration outcome is no-go."
      : "No. Manual review is still required, so the final reconsideration outcome is no-go.",
    blockingEvidence: unique([
      ...sourceItem.blockingEvidence,
      "finalDecisionPacketReady=true",
      "finalDecisionPacketOnly=true",
      "finalNoGoPacketReady=true",
      "finalNoGoPacketOnly=true",
      "finalGoDecisionReady=false",
      "authorizationReconsiderationFinalDecisionAccepted=false",
      "implementationAuthorizationGranted=false",
      "readyForAdapterImplementation=false",
    ]),
    unresolvedDecisionGaps: unique([
      ...sourceItem.unresolvedReviewGaps,
      "No final go decision exists.",
      "No final no-go decision has been accepted, signed, or recorded by the application.",
      "No external final decision archive exists in app state.",
      "No implementation authorization artifact exists in app state.",
    ]),
    forbiddenGoShortcuts: unique([
      ...sourceItem.forbiddenShortcuts,
      "Do not treat this final decision packet as a final human signature, an accepted no-go record, an authorization denial, an authorization grant, or implementation approval.",
      "Do not unlock adapter implementation from a generated packet; a separate external human authorization process would be required first.",
    ]),
    goPrerequisitesForFuture: unique([
      ...sourceItem.finalDecisionPrerequisites,
      "A future go path would need accepted external evidence, named human reviewer approval, redacted artifact references, owner signoff, and an explicit implementation authorization artifact outside this read-only packet.",
      "A future go path would need a separate implementation branch preflight before files, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, deployments, production writers, or report unlocks are considered.",
    ]),
    safeDecisionRefs: sourceItem.safeEscalationRefs,
    redactionRules: sourceItem.redactionRules,
    nonAcceptanceClauses: unique([
      ...sourceItem.nonAcceptanceClauses,
      "This final decision item is generated for inspection only and is not accepted, signed, stored, or promoted by the app.",
      "Final no-go visibility does not equal authorization denial recording, authorization grant, or implementation readiness.",
    ]),
    nextSafeAction:
      "Keep implementation authorization blocked; the read-only external final decision archive remediation review checklist now exists, and the next safe packet is a read-only external final decision archive remediation review no-go packet.",
  };
}

function countByStatus(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionItem[],
  status: WriterPersistenceAuthorizationReconsiderationFinalDecisionStatus,
) {
  return items.filter((item) => item.status === status).length;
}

function uniqueCount(
  items: WriterPersistenceAuthorizationReconsiderationFinalDecisionItem[],
  key:
    | "blockingEvidence"
    | "unresolvedDecisionGaps"
    | "forbiddenGoShortcuts"
    | "goPrerequisitesForFuture",
) {
  return new Set(items.flatMap((item) => item[key])).size;
}

function baseProbeFields(
  payload: WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload,
) {
  return {
    ...payload,
    blocked: true as const,
    finalDecisionPacketOnly: true as const,
    finalNoGoPacketOnly: true as const,
    sourceReviewNoGoPacketOnly: true as const,
    sourceReconsiderationRemediationReviewChecklistOnly: true as const,
    sourceReconsiderationRemediationPlanOnly: true as const,
    sourceReconsiderationNoGoPacketOnly: true as const,
    sourcePreflightChecklistOnly: true as const,
    sourceReleaseStillBlocked: true as const,
  };
}

export async function buildWriterPersistenceAuthorizationReconsiderationFinalDecision(): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionPayload> {
  const sourceNoGo =
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo();
  const decisionItems = sourceNoGo.noGoItems.map(buildDecisionItem);
  const blockedCodes = unique([
    ...sourceNoGo.blockedCodes,
    ...finalDecisionBlockedCodes,
  ]);

  return {
    ...sourceNoGo,
    safeMode: true,
    readOnly: true,
    authorizationReconsiderationFinalDecisionMode:
      "persistence_adapter_implementation_authorization_reconsideration_final_decision_packet_only",
    sourceReconsiderationRemediationReviewNoGoMode:
      sourceNoGo.reconsiderationRemediationReviewNoGoMode,
    checkedAt: new Date().toISOString(),
    decisionItemCount: decisionItems.length,
    finalNoGoCount: decisionItems.length,
    finalGoCount: 0,
    externalEvidenceNoGoCount: countByStatus(
      decisionItems,
      "final_no_go_external_evidence_missing",
    ),
    manualReviewNoGoCount: countByStatus(
      decisionItems,
      "final_no_go_manual_review_blocked",
    ),
    authorizationStillBlockedCount: decisionItems.length,
    sourceNoGoItemCount: sourceNoGo.noGoItemCount,
    sourceNoGoCount: sourceNoGo.noGoCount,
    sourceManualReviewBlockedCount: sourceNoGo.manualReviewBlockedCount,
    sourceReconsiderationStillBlockedCount:
      sourceNoGo.reconsiderationStillBlockedCount,
    unresolvedDecisionGapCount: uniqueCount(
      decisionItems,
      "unresolvedDecisionGaps",
    ),
    forbiddenGoShortcutCount: uniqueCount(
      decisionItems,
      "forbiddenGoShortcuts",
    ),
    goPrerequisiteCount: uniqueCount(decisionItems, "goPrerequisitesForFuture"),
    finalDecisionPacketReady: true,
    finalDecisionPacketOnly: true,
    finalNoGoPacketReady: true,
    finalNoGoPacketOnly: true,
    sourceReviewNoGoPacketReady: sourceNoGo.sourceReviewNoGoPacketReady,
    sourceReviewNoGoPacketOnly: sourceNoGo.sourceReviewNoGoPacketOnly,
    sourceReconsiderationRemediationReviewChecklistReady:
      sourceNoGo.sourceReconsiderationRemediationReviewChecklistReady,
    sourceReconsiderationRemediationReviewChecklistOnly:
      sourceNoGo.sourceReconsiderationRemediationReviewChecklistOnly,
    sourceReconsiderationRemediationPlanReady:
      sourceNoGo.sourceReconsiderationRemediationPlanReady,
    sourceReconsiderationRemediationPlanOnly:
      sourceNoGo.sourceReconsiderationRemediationPlanOnly,
    sourceReconsiderationNoGoPacketReady:
      sourceNoGo.sourceReconsiderationNoGoPacketReady,
    sourceReconsiderationNoGoPacketOnly:
      sourceNoGo.sourceReconsiderationNoGoPacketOnly,
    sourcePreflightChecklistReady: sourceNoGo.sourcePreflightChecklistReady,
    sourcePreflightChecklistOnly: sourceNoGo.sourcePreflightChecklistOnly,
    sourceReleaseStillBlocked: sourceNoGo.sourceReleaseStillBlocked,
    finalGoDecisionReady: false,
    finalGoDecisionRecorded: false,
    finalNoGoDecisionAccepted: false,
    finalNoGoDecisionRecorded: false,
    authorizationReconsiderationFinalDecisionAccepted: false,
    authorizationReconsiderationFinalDecisionRecorded: false,
    implementationAuthorizationReconsiderationReady: false,
    implementationAuthorizationGranted: false,
    implementationAuthorized: false,
    authorizationDecisionRecorded: false,
    authorizationArtifactStored: false,
    readyForAdapterImplementation: false,
    allRuntimeEffectsBlocked: true,
    ...finalRuntimeBlockedFlags,
    blockedCodes,
    finalDecisionRules: [
      "This endpoint is a read-only final authorization reconsideration decision packet, not a human decision system.",
      "It may summarize the final no-go/go shape from the reconsideration remediation review no-go packet.",
      "It must not accept a final no-go, record a final no-go, record a final go, deny authorization, grant authorization, store approval artifacts, create authorization records, create branches, create files, create tests, create privileged clients, open transactions, create migrations, write rows, call AI, call Stripe, deploy, enable flags, run production writers, or unlock reports.",
      "All current decision items remain final no-go because external evidence or manual review remains unresolved.",
      "Final packet readiness does not mean a decision was accepted, signed, stored, denied, granted, or promoted.",
    ],
    finalDecisionBoundaryRules: [
      "The final decision packet must start from the source reconsideration remediation review no-go packet and source item ids.",
      "Only safe ids, owner roles, status labels, redacted evidence refs, timestamps, and short conclusions may be displayed.",
      "Raw artifacts, private narratives, prompts, provider payloads, webhook bodies, signatures, tokens, secrets, credentials, and full external document bodies are forbidden.",
      "A future human go process would need a separate external archive, explicit owner authorization, and a new implementation preflight; this packet does not create any of them.",
      "The read-only external final decision archive remediation review checklist now exists; the next safe stage is a read-only external final decision archive remediation review no-go packet, and it must still remain non-executable.",
    ],
    sourceReviewNoGoRules: sourceNoGo.reviewNoGoRules,
    sourceNoGoItems: sourceNoGo.noGoItems,
    sourceBlockedCodes: sourceNoGo.blockedCodes,
    decisionItems,
  };
}

export async function probeWriterPersistenceAuthorizationReconsiderationFinalDecision(
  requestBody: unknown,
): Promise<WriterPersistenceAuthorizationReconsiderationFinalDecisionProbeResult> {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecision();
  const blockedSummary =
    "Persistence authorization reconsideration final decision probe blocked: no final decision acceptance, final decision record, final no-go acceptance, final no-go record, final go record, authorization denial, authorization grant, approval storage, external archive acceptance, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.";

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Request body must be a JSON object.`,
      decisionItems: payload.decisionItems,
    };
  }

  const itemId =
    (requestBody as { itemId?: unknown; decisionItemId?: unknown }).itemId ??
    (requestBody as { decisionItemId?: unknown }).decisionItemId;

  if (typeof itemId !== "string") {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} itemId must be a string.`,
      decisionItems: payload.decisionItems,
    };
  }

  const selectedItem = payload.decisionItems.find(
    (candidate) => candidate.id === itemId,
  );

  if (!selectedItem) {
    return {
      ...baseProbeFields(payload),
      summary: `${blockedSummary} Unknown item id.`,
      decisionItems: payload.decisionItems,
    };
  }

  return {
    ...baseProbeFields(payload),
    itemId: selectedItem.id,
    itemTitle: selectedItem.title,
    itemStatus: selectedItem.status,
    summary:
      "Persistence authorization reconsideration final decision probe blocked as designed: the selected final decision item was returned, but no final decision acceptance, final decision record, final no-go acceptance, final no-go record, final go record, authorization denial, authorization grant, approval storage, external archive acceptance, branch, file change, test, privileged client, transaction, migration, row write, AI call, Stripe call, deployment, production writer, or report unlock was performed.",
    decisionItems: [selectedItem],
  };
}
