import { buildWriterPersistenceOwnerSignoff } from "@/lib/server-writers/persistence-owner-signoff";

import { WriterPersistenceOwnerSignoffClientPage } from "./writer-persistence-owner-signoff-client";

export default async function WriterPersistenceOwnerSignoffPage() {
  const payload = await buildWriterPersistenceOwnerSignoff();

  return <WriterPersistenceOwnerSignoffClientPage payload={payload} />;
}
