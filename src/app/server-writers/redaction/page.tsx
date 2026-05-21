import { buildRequestRedactionFixtures } from "@/lib/server-writers/request-redaction";

import { RequestRedactionClientPage } from "./request-redaction-client";

export default function RequestRedactionPage() {
  return (
    <RequestRedactionClientPage payload={buildRequestRedactionFixtures()} />
  );
}
