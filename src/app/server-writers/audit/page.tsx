import { buildWriterAuditModel } from "@/lib/server-writers/audit";

import { WriterAuditClientPage } from "./writer-audit-client";

export default function WriterAuditPage() {
  return <WriterAuditClientPage payload={buildWriterAuditModel()} />;
}
