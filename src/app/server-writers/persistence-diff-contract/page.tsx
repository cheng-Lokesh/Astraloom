import { buildWriterPersistenceDiffContract } from "@/lib/server-writers/persistence-diff-contract";

import { WriterPersistenceDiffContractClientPage } from "./writer-persistence-diff-contract-client";

export default async function WriterPersistenceDiffContractPage() {
  const payload = await buildWriterPersistenceDiffContract();

  return <WriterPersistenceDiffContractClientPage payload={payload} />;
}
