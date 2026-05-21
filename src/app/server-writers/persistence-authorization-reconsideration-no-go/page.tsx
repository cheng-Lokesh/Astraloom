import { buildWriterPersistenceAuthorizationReconsiderationNoGo } from "@/lib/server-writers/persistence-authorization-reconsideration-no-go";

import { WriterPersistenceAuthorizationReconsiderationNoGoClientPage } from "./writer-persistence-authorization-reconsideration-no-go-client";

export default async function PersistenceAuthorizationReconsiderationNoGoPage() {
  const payload = await buildWriterPersistenceAuthorizationReconsiderationNoGo();

  return (
    <WriterPersistenceAuthorizationReconsiderationNoGoClientPage
      payload={payload}
    />
  );
}
