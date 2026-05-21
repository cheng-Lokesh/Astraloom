import { buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-no-go";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-archive-no-go-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGoClientPage
      payload={payload}
    />
  );
}
