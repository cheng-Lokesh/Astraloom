import { buildWriterRollbackModel } from "@/lib/server-writers/rollback";

import { WriterRollbackClientPage } from "./writer-rollback-client";

export default function WriterRollbackPage() {
  return <WriterRollbackClientPage payload={buildWriterRollbackModel()} />;
}
