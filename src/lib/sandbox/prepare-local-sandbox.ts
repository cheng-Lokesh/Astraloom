import { buildAgentProfiles } from "@/lib/agents/build";
import {
  extractPeopleCandidates,
  mergePeopleCandidates,
} from "@/lib/people/extract";
import { buildRelationEdges } from "@/lib/relations/build";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { KeyPeopleDraft } from "@/types/key-person";
import type { RelationGraphDraft } from "@/types/relation-edge";
import type { SeedContextDraft } from "@/types/seed-context";

type PrepareLocalSandboxResult =
  | {
      ok: true;
      keyPeople: KeyPeopleDraft;
      agentEcology: AgentEcologyDraft;
      relationGraph: RelationGraphDraft;
    }
  | {
      ok: false;
      errorCode: string;
    };

export function prepareLocalSandboxArtifacts(
  seedContext: SeedContextDraft,
): PrepareLocalSandboxResult {
  const repos = getRepositories();
  const now = new Date().toISOString();
  const existingPeople = repos.keyPeople.load(seedContext.id);
  const savedPeople = existingPeople.ok ? existingPeople.data?.people ?? [] : [];
  const extractedPeople = mergePeopleCandidates(
    savedPeople,
    extractPeopleCandidates(seedContext),
  ).map((person) => ({
    ...person,
    confirmed: person.status !== "deleted" && person.status !== "rejected",
    status:
      person.status === "deleted" || person.status === "rejected"
        ? person.status
        : ("confirmed" as const),
    updatedAt: now,
  }));

  const keyPeople: KeyPeopleDraft = {
    seedContextId: seedContext.id,
    people: extractedPeople,
    updatedAt: now,
  };
  const peopleResult = repos.keyPeople.save(keyPeople);
  if (!peopleResult.ok) return { ok: false, errorCode: peopleResult.errorCode };

  const confirmedPeople = extractedPeople.filter(
    (person) => person.confirmed && person.status === "confirmed",
  );
  const agentEcology: AgentEcologyDraft = {
    seedContextId: seedContext.id,
    includeParallelSelves: true,
    agents: buildAgentProfiles(seedContext, confirmedPeople, true),
    updatedAt: now,
  };
  const agentResult = repos.agentProfiles.save(agentEcology);
  if (!agentResult.ok) return { ok: false, errorCode: agentResult.errorCode };

  const relationGraph: RelationGraphDraft = {
    seedContextId: seedContext.id,
    version: "local-deterministic-v0",
    agents: agentEcology.agents,
    edges: buildRelationEdges(seedContext.id, agentEcology.agents),
    graphLocked: true,
    lockedAt: now,
    updatedAt: now,
  };
  const graphResult = repos.relationGraphs.save(relationGraph);
  if (!graphResult.ok) return { ok: false, errorCode: graphResult.errorCode };

  return {
    ok: true,
    keyPeople,
    agentEcology,
    relationGraph,
  };
}
