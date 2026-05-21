import { buildWriterPersistenceAuthorizationRemediationReview } from "@/lib/server-writers/persistence-authorization-remediation-review";

import { WriterPersistenceAuthorizationRemediationReviewClientPage } from "./writer-persistence-authorization-remediation-review-client";

export default async function PersistenceAuthorizationRemediationReviewPage() {
  const payload = await buildWriterPersistenceAuthorizationRemediationReview();

  return (
    <WriterPersistenceAuthorizationRemediationReviewClientPage
      payload={payload}
    />
  );
}
