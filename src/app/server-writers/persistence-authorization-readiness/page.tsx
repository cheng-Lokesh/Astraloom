import { buildWriterPersistenceAuthorizationReadiness } from "@/lib/server-writers/persistence-authorization-readiness";

import { WriterPersistenceAuthorizationReadinessClientPage } from "./writer-persistence-authorization-readiness-client";

export default async function PersistenceAuthorizationReadinessPage() {
  const payload = await buildWriterPersistenceAuthorizationReadiness();

  return <WriterPersistenceAuthorizationReadinessClientPage payload={payload} />;
}
