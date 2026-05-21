import { buildWriterPersistenceAuthorizationReconsiderationPreflight } from "@/lib/server-writers/persistence-authorization-reconsideration-preflight";

import { WriterPersistenceAuthorizationReconsiderationPreflightClientPage } from "./writer-persistence-authorization-reconsideration-preflight-client";

export default async function PersistenceAuthorizationReconsiderationPreflightPage() {
  const payload =
    await buildWriterPersistenceAuthorizationReconsiderationPreflight();

  return (
    <WriterPersistenceAuthorizationReconsiderationPreflightClientPage
      payload={payload}
    />
  );
}
