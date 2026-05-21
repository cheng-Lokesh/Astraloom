import { buildServerWriterStubStatus } from "@/lib/server-writers/server-writer-stubs";

import { ServerWriterStubsClientPage } from "./server-writer-stubs-client";

export default function ServerWriterStubsPage() {
  return (
    <ServerWriterStubsClientPage payload={buildServerWriterStubStatus()} />
  );
}
