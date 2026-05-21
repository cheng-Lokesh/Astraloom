import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const agentProfileWriterStub = createBlockedServerWriterStub({
  contractId: "agent_profile_generation",
  category: "agent_ecology",
  targetTables: ["agent_profiles"],
  intendedOperation: "insert",
  modulePath: "@/lib/server-writers/adapters/agent-profile-writer.server",
  exportedSymbol: "agentProfileWriterStub",
  summary:
    "Agent profile writer stub reserves the server-only boundary for future digital self, parallel self, and NPC profile generation without generating or writing profiles.",
});

export function probeAgentProfileWriterStub() {
  return blockServerWriterStub(agentProfileWriterStub);
}
