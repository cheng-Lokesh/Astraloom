import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-archive-remediation-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationClientPage
      payload={payload}
    />
  );
}
