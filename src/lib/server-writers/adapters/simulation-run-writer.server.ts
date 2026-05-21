import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const simulationRunWriterStub = createBlockedServerWriterStub({
  contractId: "simulation_run_create",
  category: "simulation",
  targetTables: ["simulation_runs"],
  intendedOperation: "insert",
  modulePath: "@/lib/server-writers/adapters/simulation-run-writer.server",
  exportedSymbol: "simulationRunWriterStub",
  summary:
    "Simulation run writer stub reserves the server-only boundary for future run creation without starting execution, spending model budget, or writing run rows.",
});

export function probeSimulationRunWriterStub() {
  return blockServerWriterStub(simulationRunWriterStub);
}
