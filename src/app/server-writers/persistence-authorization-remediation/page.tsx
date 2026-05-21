import { buildWriterPersistenceAuthorizationRemediation } from "@/lib/server-writers/persistence-authorization-remediation";

import { WriterPersistenceAuthorizationRemediationClientPage } from "./writer-persistence-authorization-remediation-client";

export default async function PersistenceAuthorizationRemediationPage() {
  const payload = await buildWriterPersistenceAuthorizationRemediation();

  return (
    <WriterPersistenceAuthorizationRemediationClientPage payload={payload} />
  );
}
