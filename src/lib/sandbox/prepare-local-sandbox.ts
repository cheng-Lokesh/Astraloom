import { buildAgentProfiles } from "@/lib/agents/build";
import { buildDestinySituationFusionDraft } from "@/lib/destiny-fusion/build-destiny-situation-fusion";
import { buildDestinyPersonModifier } from "@/lib/grounded-social-simulation/build-destiny-person-modifier";
import { buildGroundedRealityModel } from "@/lib/grounded-social-simulation/build-grounded-reality-model";
import { simulateGroundedPaths } from "@/lib/grounded-social-simulation/simulate-grounded-paths";
import {
  extractPeopleCandidates,
  mergePeopleCandidates,
} from "@/lib/people/extract";
import { buildRelationEdges } from "@/lib/relations/build";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";
import type { GroundedSocialSimulationDraft } from "@/types/grounded-social-simulation";
import type { KeyPeopleDraft } from "@/types/key-person";
import type { RelationGraphDraft } from "@/types/relation-edge";
import type { SeedContextDraft } from "@/types/seed-context";

type PrepareLocalSandboxResult =
  | {
      ok: true;
      keyPeople: KeyPeopleDraft;
      destinyFusion: DestinySituationFusionDraft;
      groundedSocialSimulation: GroundedSocialSimulationDraft;
      agentEcology: AgentEcologyDraft;
      relationGraph: RelationGraphDraft;
      localWarnings: string[];
    }
  | {
      ok: false;
      errorCode: string;
    };

function warnLocal(message: string) {
  if (typeof console !== "undefined") {
    console.warn(message);
  }
}

function buildLowConfidenceFusionPlaceholder({
  seedContext,
  now,
  warning,
}: {
  seedContext: SeedContextDraft;
  now: string;
  warning: string;
}): DestinySituationFusionDraft {
  return {
    id: `fusion_placeholder_${seedContext.id}`,
    seedContextId: seedContext.id,
    version: "destiny-situation-fusion-local-v0",
    mappings: [],
    sourceTags: ["real situation"],
    evidenceRefs: {
      destinyBasis: [],
      realClues: [
        `seed:${seedContext.id}:question`,
        seedContext.currentQuestionDescription
          ? `seed:${seedContext.id}:current_question_description`
          : `seed:${seedContext.id}:situation_summary`,
      ],
    },
    localWarnings: [warning],
    createdAt: now,
    updatedAt: now,
  };
}

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
  const localWarnings: string[] = [];
  const climateResult = repos.destinyClimates.load(seedContext.id);
  const profileResult = repos.destinyProfiles.load(seedContext.id);
  const destinyProfile = profileResult.ok ? profileResult.data : null;
  let destinyFusion: DestinySituationFusionDraft;
  const destinyClimate = climateResult.ok ? climateResult.data : null;
  if (!destinyProfile) {
    localWarnings.push(
      "Grounded Social Simulation warning: DestinyProfileDraft was not available, so DestinyPersonModifier uses a low-confidence placeholder while the grounded reality model continues.",
    );
  }
  if (!destinyClimate) {
    localWarnings.push(
      "Grounded Social Simulation warning: DestinyClimateDraft was not available, so DestinyPersonModifier timing sensitivity stays low confidence while the grounded reality model continues.",
    );
  }

  if (destinyClimate) {
    destinyFusion = buildDestinySituationFusionDraft({
      seedContext,
      destinyClimate,
      keyPeople: confirmedPeople,
      now,
    });

    const fusionResult = repos.destinyFusions.save(destinyFusion);
    if (!fusionResult.ok) {
      return { ok: false, errorCode: fusionResult.errorCode };
    }
  } else {
    const warning =
      "Local Destiny-Situation Fusion warning: DestinyClimateDraft was not available, so a low-confidence placeholder fusion was saved and the local sandbox flow continued.";
    localWarnings.push(warning);
    warnLocal(warning);
    destinyFusion = buildLowConfidenceFusionPlaceholder({
      seedContext,
      now,
      warning,
    });
    const fusionResult = repos.destinyFusions.save(destinyFusion);
    if (!fusionResult.ok) {
      localWarnings.push(
        "Local Destiny-Situation Fusion warning: placeholder fusion could not be saved, but people, agents, and relation graph preparation continued.",
      );
    }
  }

  const groundedRealityModel = buildGroundedRealityModel({
    seedContext,
    keyPeople: confirmedPeople,
  });
  const destinyPersonModifier = buildDestinyPersonModifier({
    seedContext,
    destinyProfile,
    destinyClimate,
  });
  const groundedPaths = simulateGroundedPaths({
    seedContext,
    realityNodes: groundedRealityModel.realityNodes,
    realityPressures: groundedRealityModel.realityPressures,
    destinyPersonModifier,
  });
  if (
    !groundedPaths.pathEvents.some(
      (event) => event.branchId === "boundary_adjustment",
    )
  ) {
    localWarnings.push(
      "Grounded Social Simulation warning: boundary_adjustment path event is not generated in V1 and should be added in a follow-up task.",
    );
  }
  const groundedSocialSimulation: GroundedSocialSimulationDraft = {
    id: `gss_${seedContext.id}`,
    seedContextId: seedContext.id,
    destinyProfileId: destinyPersonModifier.destinyProfileId,
    destinyClimateId: destinyPersonModifier.destinyClimateId,
    realityNodes: groundedRealityModel.realityNodes,
    realityPressures: groundedRealityModel.realityPressures,
    destinyPersonModifier,
    pathEvents: groundedPaths.pathEvents,
    simulationSummary: groundedPaths.simulationSummary,
    keyUncertainties: groundedRealityModel.keyUncertainties,
    observableSignals: groundedRealityModel.observableSignals,
    confidence: Math.min(
      groundedRealityModel.confidence,
      destinyPersonModifier.confidence,
      ...groundedPaths.pathEvents.map((event) => event.confidence),
    ),
    createdAt: now,
  };
  const groundedResult =
    repos.groundedSocialSimulations.save(groundedSocialSimulation);
  if (!groundedResult.ok) {
    return { ok: false, errorCode: groundedResult.errorCode };
  }

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
    destinyFusion,
    groundedSocialSimulation,
    agentEcology,
    relationGraph,
    localWarnings,
  };
}
