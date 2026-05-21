import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-archive-remediation-review-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewClientPage
      payload={payload}
    />
  );
}
