import type { AgentProfileDraft } from "@/types/agent-profile";

import type { BranchPolicy } from "./simulation-types";

export const branchPolicies: BranchPolicy[] = [
  {
    id: "baseline",
    label: "Current inertia path",
    selfBias: "baseline",
    edgePressureBias: 0,
    disclosureBias: 0,
    cooperationBias: 0,
  },
  {
    id: "cautious_self",
    label: "Cautious observation path",
    selfBias: "cautious",
    edgePressureBias: 1,
    disclosureBias: -1,
    cooperationBias: -1,
  },
  {
    id: "decisive_self",
    label: "Active push path",
    selfBias: "decisive",
    edgePressureBias: 1,
    disclosureBias: 1,
    cooperationBias: 1,
  },
  {
    id: "boundary_adjustment",
    label: "Boundary adjustment path",
    selfBias: "boundary",
    edgePressureBias: 0,
    disclosureBias: 1,
    cooperationBias: 0,
    boundaryStabilizationBias: 2,
  },
];

export function agentForBranch(
  agents: AgentProfileDraft[],
  branch: BranchPolicy,
) {
  if (branch.id === "baseline") {
    return agents.find((agent) => agent.agentType === "self") ?? agents[0] ?? null;
  }

  const stance =
    branch.id === "cautious_self"
      ? "cautious_parallel"
      : branch.id === "decisive_self"
        ? "decisive_parallel"
        : "baseline_self";

  return (
    agents.find((agent) => agent.profileJson.stance === stance) ??
    agents.find((agent) => agent.agentType === "self") ??
    agents[0] ??
    null
  );
}
