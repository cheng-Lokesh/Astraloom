import { buildWriterPersistenceAcceptanceTestMatrix } from "@/lib/server-writers/persistence-acceptance-tests";

import { WriterPersistenceAcceptanceTestMatrixClientPage } from "./writer-persistence-acceptance-test-matrix-client";

export default async function WriterPersistenceAcceptanceTestMatrixPage() {
  const payload = await buildWriterPersistenceAcceptanceTestMatrix();

  return <WriterPersistenceAcceptanceTestMatrixClientPage payload={payload} />;
}
