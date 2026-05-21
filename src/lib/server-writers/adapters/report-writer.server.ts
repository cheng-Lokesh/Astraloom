import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const reportWriterStub = createBlockedServerWriterStub({
  contractId: "report_generation",
  category: "reporting",
  targetTables: ["reports"],
  intendedOperation: "upsert",
  modulePath: "@/lib/server-writers/adapters/report-writer.server",
  exportedSymbol: "reportWriterStub",
  summary:
    "Report writer stub reserves the server-only boundary for future report assembly without creating, updating, unlocking, or exposing report content.",
});

export function probeReportWriterStub() {
  return blockServerWriterStub(reportWriterStub);
}
