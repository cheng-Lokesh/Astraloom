import { buildWriterMigrationRunbook } from "@/lib/server-writers/migration-runbook";

import { WriterMigrationRunbookClientPage } from "./writer-migration-runbook-client";

export default function WriterMigrationRunbookPage() {
  const payload = buildWriterMigrationRunbook();

  return <WriterMigrationRunbookClientPage payload={payload} />;
}
