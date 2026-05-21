import { buildServerWriterStatus } from "@/lib/server-writers/status";

import { ServerWritersClientPage } from "./server-writers-client";

export default function ServerWritersPage() {
  return <ServerWritersClientPage status={buildServerWriterStatus()} />;
}
