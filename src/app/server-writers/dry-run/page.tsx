import { buildSystemWriterDryRunCatalog } from "@/lib/server-writers/dry-run";

import { WriterDryRunClientPage } from "./writer-dry-run-client";

export default function WriterDryRunPage() {
  return <WriterDryRunClientPage catalog={buildSystemWriterDryRunCatalog()} />;
}
