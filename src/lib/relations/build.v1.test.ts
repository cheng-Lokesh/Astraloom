import { describe, expect, it, vi } from "vitest";

import { buildRelationEdges } from "./build";
import { buildAgentProfiles } from "@/lib/agents/build";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import {
  buildConfirmedPeople,
  buildV1Seed,
  withoutTemporalFields,
} from "@/test/v1-fixtures";

const repositoryProvider = vi.hoisted(() => ({
  getRepositories: vi.fn(),
}));

vi.mock("@/lib/repositories/repository-provider", () => repositoryProvider);

function repositorySuccess<T>(data: T) {
  return {
    ok: true as const,
    data,
    errorCode: null,
    traceId: "repository:test",
  };
}

function createMemoryRepository<T>(initial: T | null = null) {
  return {
    load: vi.fn(() => repositorySuccess<T | null>(initial)),
    save: vi.fn((draft: T) => repositorySuccess(draft)),
    list: vi.fn(() => repositorySuccess(initial ? [initial] : [])),
    clearDraft: vi.fn(() => repositorySuccess(null)),
    markDeleted: vi.fn(() => repositorySuccess(null)),
  };
}

describe("Relation builder V1 baseline", () => {
  it("builds a deterministic, bounded edge ledger from V1 agents", () => {
    const seed = buildV1Seed();
    const agents = buildAgentProfiles(seed, buildConfirmedPeople(), true);
    const edges = buildRelationEdges(seed.id, agents);
    const self = agents.find((agent) => agent.agentType === "self")!;
    const nonSelfAgents = agents.filter((agent) => agent.id !== self.id);
    const agentIds = new Set(agents.map((agent) => agent.id));
    const edgeIds = edges.map((edge) => edge.id);

    expect(edges).toHaveLength(agents.length - 1);
    nonSelfAgents.forEach((agent) => {
      const connectingEdges = edges.filter(
        (edge) =>
          [edge.fromAgentId, edge.toAgentId].includes(self.id) &&
          [edge.fromAgentId, edge.toAgentId].includes(agent.id),
      );
      expect(connectingEdges).toHaveLength(1);
    });
    expect(new Set(edgeIds).size).toBe(edgeIds.length);
    expect(
      edges.every(
        (edge) =>
          agentIds.has(edge.fromAgentId) && agentIds.has(edge.toAgentId),
      ),
    ).toBe(true);
    expect(edges.every((edge) => edge.evidenceRefs.length > 0)).toBe(true);
    expect(
      edges.every((edge) =>
        Object.values(edge.weights).every((value) => value >= 0 && value <= 100),
      ),
    ).toBe(true);
    expect(
      edges.every(
        (edge) =>
          edge.confidence >= 0 &&
          edge.confidence <= 100 &&
          edge.trend.volatility >= 0 &&
          edge.trend.volatility <= 100,
      ),
    ).toBe(true);
    expect(edges.every((edge) => edge.version === "local-deterministic-v0")).toBe(
      true,
    );
    expect(
      withoutTemporalFields(buildRelationEdges(seed.id, agents)),
    ).toEqual(withoutTemporalFields(edges));
  });

  it("locks and saves the real production RelationGraph through the sandbox path", () => {
    const keyPeople = createMemoryRepository();
    const realityIntakes = createMemoryRepository();
    const destinyProfiles = createMemoryRepository();
    const destinyClimates = createMemoryRepository();
    const destinyFusions = createMemoryRepository();
    const groundedSocialSimulations = createMemoryRepository();
    const agentProfiles = createMemoryRepository();
    const relationGraphs = createMemoryRepository();
    repositoryProvider.getRepositories.mockReturnValue({
      keyPeople,
      realityIntakes,
      destinyProfiles,
      destinyClimates,
      destinyFusions,
      groundedSocialSimulations,
      agentProfiles,
      relationGraphs,
    });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = prepareLocalSandboxArtifacts(buildV1Seed());

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.errorCode);

    const agentIds = new Set(result.agentEcology.agents.map((agent) => agent.id));
    expect(result.relationGraph.graphLocked).toBe(true);
    expect(result.relationGraph.lockedAt).toBeTruthy();
    expect(result.relationGraph.agents).toBe(result.agentEcology.agents);
    expect(
      result.relationGraph.edges.every(
        (edge) =>
          agentIds.has(edge.fromAgentId) && agentIds.has(edge.toAgentId),
      ),
    ).toBe(true);
    expect(withoutTemporalFields(result.relationGraph.edges)).toEqual(
      withoutTemporalFields(
        buildRelationEdges(result.relationGraph.seedContextId, result.agentEcology.agents),
      ),
    );
    expect(relationGraphs.save).toHaveBeenCalledTimes(1);
    expect(relationGraphs.save).toHaveBeenCalledWith(result.relationGraph);
    expect(relationGraphs.save.mock.calls[0]![0]).toBe(result.relationGraph);
  });
});
