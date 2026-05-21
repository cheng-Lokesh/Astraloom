import { buildWriterPersistenceAuthorizationRemediationReviewNoGo } from "@/lib/server-writers/persistence-authorization-remediation-review-no-go";

import { WriterPersistenceAuthorizationRemediationReviewNoGoClientPage } from "./writer-persistence-authorization-remediation-review-no-go-client";

export default async function PersistenceAuthorizationRemediationReviewNoGoPage() {
  const payload =
    await buildWriterPersistenceAuthorizationRemediationReviewNoGo();

  return (
    <WriterPersistenceAuthorizationRemediationReviewNoGoClientPage
      payload={payload}
    />
  );
}
