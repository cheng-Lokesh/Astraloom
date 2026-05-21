import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoClientPage
      payload={payload}
    />
  );
}
