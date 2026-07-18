import { describe, expect, it } from "vitest";

import { buildRelationEdges } from "./build";
import { buildAgentProfiles } from "@/lib/agents/build";
import { buildConfirmedPeople, buildV1Seed } from "@/test/v1-fixtures";

describe("Relation builder V1 baseline", () => {
  it("builds a lockable read-only edge ledger from V1 agents", () => {
    const seed = buildV1Seed();
    const agents = buildAgentProfiles(seed, buildConfirmedPeople(), true);
    const edges = buildRelationEdges(seed.id, agents);
    const graph = {
      seedContextId: seed.id,
      version: "local-deterministic-v0" as const,
      agents,
      edges,
      graphLocked: true,
      lockedAt: "2026-01-15T09:00:00.000Z",
      updatedAt: "2026-01-15T09:00:00.000Z",
    };
    const agentIds = new Set(agents.map((agent) => agent.id));

    expect(graph.graphLocked).toBe(true);
    expect(edges).toHaveLength(agents.length - 1);
    expect(
      edges.every(
        (edge) =>
          agentIds.has(edge.fromAgentId) && agentIds.has(edge.toAgentId),
      ),
    ).toBe(true);
    expect(edges.every((edge) => edge.version === "local-deterministic-v0")).toBe(
      true,
    );
  });
});
