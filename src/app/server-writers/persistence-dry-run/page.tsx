import { buildWriterPersistenceDryRunGate } from "@/lib/server-writers/persistence-dry-run";

import { WriterPersistenceDryRunClientPage } from "./writer-persistence-dry-run-client";

export default async function WriterPersistenceDryRunPage() {
  const payload = await buildWriterPersistenceDryRunGate();

  return <WriterPersistenceDryRunClientPage payload={payload} />;
}
