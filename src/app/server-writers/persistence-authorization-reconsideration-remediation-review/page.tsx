import { buildWriterPersistenceAuthorizationReconsiderationRemediationReview } from "@/lib/server-writers/persistence-authorization-reconsideration-remediation-review";

import { WriterPersistenceAuthorizationReconsiderationRemediationReviewClientPage } from "./writer-persistence-authorization-reconsideration-remediation-review-client";

export default async function PersistenceAuthorizationReconsiderationRemediationReviewPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReview();

  return (
    <WriterPersistenceAuthorizationReconsiderationRemediationReviewClientPage
      payload={payload}
    />
  );
}
