import { buildWriterPersistenceBranchPreflight } from "@/lib/server-writers/persistence-branch-preflight";

import { WriterPersistenceBranchPreflightClientPage } from "./writer-persistence-branch-preflight-client";

export default async function WriterPersistenceBranchPreflightPage() {
  const payload = await buildWriterPersistenceBranchPreflight();

  return <WriterPersistenceBranchPreflightClientPage payload={payload} />;
}
