import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const consentWriterStub = createBlockedServerWriterStub({
  contractId: "consent_event_record",
  category: "compliance",
  targetTables: ["consent_events"],
  intendedOperation: "append",
  modulePath: "@/lib/server-writers/adapters/consent-writer.server",
  exportedSymbol: "consentWriterStub",
  summary:
    "Consent writer stub reserves the server-only boundary for future append-only consent events without writing consent history or deleting prior consent records.",
});

export function probeConsentWriterStub() {
  return blockServerWriterStub(consentWriterStub);
}
