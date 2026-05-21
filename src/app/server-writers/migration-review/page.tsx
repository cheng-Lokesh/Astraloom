import { buildWriterMigrationReviewChecklist } from "@/lib/server-writers/migration-review";

import { WriterMigrationReviewClientPage } from "./writer-migration-review-client";

export default function WriterMigrationReviewPage() {
  const payload = buildWriterMigrationReviewChecklist();

  return <WriterMigrationReviewClientPage payload={payload} />;
}
