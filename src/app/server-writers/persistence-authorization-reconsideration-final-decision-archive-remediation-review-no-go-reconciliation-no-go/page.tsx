import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGoClientPage
      payload={payload}
    />
  );
}
