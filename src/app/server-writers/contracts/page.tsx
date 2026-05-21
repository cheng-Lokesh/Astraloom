import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";

import { WriterContractsClientPage } from "./writer-contracts-client";

export default function WriterContractsPage() {
  return (
    <WriterContractsClientPage payload={buildSystemWriterContracts()} />
  );
}
