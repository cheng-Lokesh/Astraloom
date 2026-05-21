import { buildWriterPersistenceAuthorizationReconsiderationRemediation } from "@/lib/server-writers/persistence-authorization-reconsideration-remediation";

import { WriterPersistenceAuthorizationReconsiderationRemediationClientPage } from "./writer-persistence-authorization-reconsideration-remediation-client";

export default async function PersistenceAuthorizationReconsiderationRemediationPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationRemediation();

  return (
    <WriterPersistenceAuthorizationReconsiderationRemediationClientPage
      payload={payload}
    />
  );
}
