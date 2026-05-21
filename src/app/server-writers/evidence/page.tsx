import { buildWriterEvidenceHandoff } from "@/lib/server-writers/evidence-handoff";

import { WriterEvidenceHandoffClientPage } from "./writer-evidence-handoff-client";

export default function WriterEvidenceHandoffPage() {
  return <WriterEvidenceHandoffClientPage payload={buildWriterEvidenceHandoff()} />;
}
