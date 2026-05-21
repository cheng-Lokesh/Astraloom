import { buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-remediation-review-no-go";

import { WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoClientPage } from "./writer-persistence-authorization-reconsideration-remediation-review-no-go-client";

export default async function PersistenceAuthorizationReconsiderationRemediationReviewNoGoPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo();

  return (
    <WriterPersistenceAuthorizationReconsiderationRemediationReviewNoGoClientPage
      payload={payload}
    />
  );
}
