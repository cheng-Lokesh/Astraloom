import { buildWriterPersistenceAuthorizationReconsiderationFinalDecision } from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision";

import { WriterPersistenceAuthorizationReconsiderationFinalDecisionClientPage } from "./writer-persistence-authorization-reconsideration-final-decision-client";

export default async function PersistenceAuthorizationReconsiderationFinalDecisionPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecision();

  return (
    <WriterPersistenceAuthorizationReconsiderationFinalDecisionClientPage
      payload={payload}
    />
  );
}
