import { buildWriterPersistenceReleaseNoGo } from "@/lib/server-writers/persistence-release-no-go";

import { WriterPersistenceReleaseNoGoClientPage } from "./writer-persistence-release-no-go-client";

export default async function WriterPersistenceReleaseNoGoPage() {
  const payload = await buildWriterPersistenceReleaseNoGo();

  return <WriterPersistenceReleaseNoGoClientPage payload={payload} />;
}
