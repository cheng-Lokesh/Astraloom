import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const eventWriterStub = createBlockedServerWriterStub({
  contractId: "event_tick_append",
  category: "simulation",
  targetTables: ["events"],
  intendedOperation: "append",
  modulePath: "@/lib/server-writers/adapters/event-writer.server",
  exportedSymbol: "eventWriterStub",
  summary:
    "Event writer stub reserves the server-only boundary for future ordered simulation ticks without appending, reordering, scanning NPCs, or mutating event history.",
});

export function probeEventWriterStub() {
  return blockServerWriterStub(eventWriterStub);
}
