import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const relationEdgeWriterStub = createBlockedServerWriterStub({
  contractId: "relation_edge_generation",
  category: "agent_ecology",
  targetTables: ["relation_edges"],
  intendedOperation: "upsert",
  modulePath: "@/lib/server-writers/adapters/relation-edge-writer.server",
  exportedSymbol: "relationEdgeWriterStub",
  summary:
    "Relation edge writer stub reserves the server-only boundary for future read-only relationship graph generation without calculating or writing edge weights.",
});

export function probeRelationEdgeWriterStub() {
  return blockServerWriterStub(relationEdgeWriterStub);
}
