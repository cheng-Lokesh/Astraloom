import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewClientPage
      payload={payload}
    />
  );
}
