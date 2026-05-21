import { buildWriterPersistenceAuthorizationNoGo } from "@/lib/server-writers/persistence-authorization-no-go";

import { WriterPersistenceAuthorizationNoGoClientPage } from "./writer-persistence-authorization-no-go-client";

export default async function PersistenceAuthorizationNoGoPage() {
  const payload = await buildWriterPersistenceAuthorizationNoGo();

  return <WriterPersistenceAuthorizationNoGoClientPage payload={payload} />;
}
