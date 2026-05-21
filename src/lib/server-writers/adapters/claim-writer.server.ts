import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const claimWriterStub = createBlockedServerWriterStub({
  contractId: "claim_generation",
  category: "reporting",
  targetTables: ["claims"],
  intendedOperation: "insert",
  modulePath: "@/lib/server-writers/adapters/claim-writer.server",
  exportedSymbol: "claimWriterStub",
  summary:
    "Claim writer stub reserves the server-only boundary for future evidence-backed claim generation without generating model output or writing claims.",
});

export function probeClaimWriterStub() {
  return blockServerWriterStub(claimWriterStub);
}
