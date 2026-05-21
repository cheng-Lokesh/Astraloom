import { buildWriterPersistenceExternalApprovalArchive } from "@/lib/server-writers/persistence-external-approval-archive";

import { WriterPersistenceExternalApprovalArchiveClientPage } from "./writer-persistence-external-approval-archive-client";

export default async function WriterPersistenceExternalApprovalArchivePage() {
  const payload = await buildWriterPersistenceExternalApprovalArchive();

  return (
    <WriterPersistenceExternalApprovalArchiveClientPage payload={payload} />
  );
}
