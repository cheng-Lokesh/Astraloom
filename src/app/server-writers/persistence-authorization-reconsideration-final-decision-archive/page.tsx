import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchive } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-archive-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionArchivePage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchive();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveClientPage
      payload={payload}
    />
  );
}
