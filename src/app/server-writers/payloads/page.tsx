import { buildWriterPayloadParity } from "@/lib/server-writers/payload-parity";

import { WriterPayloadParityClientPage } from "./writer-payload-parity-client";

export default function WriterPayloadParityPage() {
  return (
    <WriterPayloadParityClientPage payload={buildWriterPayloadParity()} />
  );
}
