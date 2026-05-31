import { saveAgentEcologyDraft } from "@/lib/agents/storage";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import { saveClaimLedgerDraft } from "@/lib/claims/storage";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { buildDestinyProfileDraft } from "@/lib/destiny/build-destiny-profile";
import {
  saveDestinyClimateDraft,
  saveDestinyProfileDraft,
} from "@/lib/destiny/storage";
import { buildDestinySituationFusionDraft } from "@/lib/destiny-fusion/build-destiny-situation-fusion";
import { saveDestinySituationFusionDraft } from "@/lib/destiny-fusion/storage";
import { buildDestinyPersonModifier } from "@/lib/grounded-social-simulation/build-destiny-person-modifier";
import { buildGroundedRealityModel } from "@/lib/grounded-social-simulation/build-grounded-reality-model";
import { saveGroundedSocialSimulationDraft } from "@/lib/grounded-social-simulation/storage";
import { simulateGroundedPaths } from "@/lib/grounded-social-simulation/simulate-grounded-paths";
import { saveKeyPeopleDraft } from "@/lib/people/storage";
import { buildRealityIntakeDraft } from "@/lib/reality-intake/build-manual-reality-intake";
import { saveRealityIntakeDraft } from "@/lib/reality-intake/storage";
import { buildRelationEdges } from "@/lib/relations/build";
import { saveRelationGraphDraft } from "@/lib/relations/storage";
import { buildSimulationRunDraft, queueSimulationRunDraft } from "@/lib/runs/build";
import { saveSimulationRunDraft } from "@/lib/runs/storage";
import { saveSeedContextDraft } from "@/lib/seed-context/storage";
import type {
  AgentProfileDraft,
  AgentProfileJson,
  AgentStance,
  AgentType,
} from "@/types/agent-profile";
import type { GroundedSocialSimulationDraft } from "@/types/grounded-social-simulation";
import type { KeyPersonDraft } from "@/types/key-person";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import type { SeedContextDraft } from "@/types/seed-context";

export const completeDestinySampleSeedContextId =
  "trial_seed_complete_destiny_career";

const seedContextId = completeDestinySampleSeedContextId;

export function isCompleteDestinySampleSeed(seedContextId?: string | null) {
  return seedContextId === completeDestinySampleSeedContextId;
}

function tuneCareerSampleEdges(edges: RelationEdgeDraft[]) {
  return edges.map((edge) => {
    if (edge.toAgentId === "agent_trial_manager") {
      return {
        ...edge,
        weights: {
          ...edge.weights,
          trust: 48,
          hostility: 24,
          dependency: 68,
          competition: 42,
          informationGap: 76,
          resourceControl: 86,
          emotionalDebt: 44,
        },
        trend: {
          trustDelta3Ticks: -4,
          hostilityDelta3Ticks: 7,
          volatility: 58,
        },
        confidence: 86,
        evidenceRefs: [
          ...edge.evidenceRefs,
          "sample:fusion:boss_resource_control",
          "sample:situation_model:promotion_timing_gap",
        ],
        lastInteraction: {
          ...edge.lastInteraction,
          summary:
            "Sample fusion marks the boss edge as resource control plus information gap pressure.",
        },
      } satisfies RelationEdgeDraft;
    }

    if (edge.toAgentId === "agent_trial_recruiter") {
      return {
        ...edge,
        weights: {
          ...edge.weights,
          trust: 54,
          hostility: 8,
          dependency: 32,
          attraction: 46,
          competition: 28,
          informationGap: 42,
          resourceControl: 52,
          emotionalDebt: 20,
        },
        trend: {
          trustDelta3Ticks: 5,
          hostilityDelta3Ticks: 1,
          volatility: 46,
        },
        confidence: 82,
        evidenceRefs: [
          ...edge.evidenceRefs,
          "sample:fusion:recruiter_opportunity_shift",
          "sample:situation_model:external_offer_window",
        ],
        lastInteraction: {
          ...edge.lastInteraction,
          summary:
            "Sample fusion marks the recruiter edge as an opportunity shift with a short answer window.",
        },
      } satisfies RelationEdgeDraft;
    }

    if (edge.toAgentId === "agent_trial_colleague") {
      return {
        ...edge,
        weights: {
          ...edge.weights,
          trust: 72,
          hostility: 4,
          dependency: 38,
          competition: 16,
          informationGap: 36,
          resourceControl: 24,
          emotionalDebt: 18,
        },
        confidence: 80,
        evidenceRefs: [
          ...edge.evidenceRefs,
          "sample:fusion:colleague_information_clue",
        ],
      } satisfies RelationEdgeDraft;
    }

    return edge;
  });
}

function profileJson(
  stance: AgentStance,
  role: string,
  relationshipToUser: string,
  confidence: number,
  evidenceRefs: string[],
  resources: AgentProfileJson["resources"],
  state: AgentProfileJson["state"],
): AgentProfileJson {
  return {
    stance,
    role,
    origin: "trial_sample",
    relationshipToUser,
    source: {
      confidence,
      sourceType: stance === "confirmed_npc" ? "user_confirmed" : "default",
      evidenceRefs,
    },
    fieldSources: {
      stance: "default",
      role: stance === "confirmed_npc" ? "user_confirmed" : "default",
      origin: "default",
      relationshipToUser:
        stance === "confirmed_npc" ? "user_confirmed" : "default",
      motivation: "default",
      resources: "default",
      behaviorPolicy: "default",
      state: "default",
      traits: "default",
      constraints: "default",
      missingFields: "default",
    },
    motivation: {
      primaryGoal: "Keep the decision reversible while improving the quality of information.",
      fear: "Committing too early before the relationship and timing evidence is clear.",
      avoidancePattern: "Delay hard conversations when the next step feels socially costly.",
    },
    resources,
    behaviorPolicy: {
      actionSpeed: stance === "decisive_parallel" ? 76 : 52,
      initiative: stance === "confirmed_npc" ? 58 : 62,
      cooperationBias: relationshipToUser === "boss" ? 48 : 66,
      communicationStyle: "formal",
    },
    state,
    traits: [
      "trial sample",
      "evidence-linked",
      "local deterministic preview",
    ],
    constraints: [
      "Do not infer hidden thoughts as fact.",
      "Do not present the scenario as a certain prediction.",
    ],
    missingFields: [],
  };
}

function agent(
  id: string,
  sourceKeyPersonId: string | null,
  agentType: AgentType,
  label: string,
  role: string,
  relationshipToUser: string,
  confidence: number,
  evidenceRefs: string[],
  profile: AgentProfileJson,
  now: string,
): AgentProfileDraft {
  return {
    id,
    seedContextId,
    sourceKeyPersonId,
    agentType,
    label,
    role,
    relationshipToUser,
    confidence,
    evidenceRefs,
    version: "local-deterministic-v0",
    traceId: `trial:${id}`,
    profileJson: profile,
    promptVersion: "unreleased",
    modelVersion: "unreleased",
    createdAt: now,
    updatedAt: now,
  };
}

function person(
  id: string,
  label: string,
  role: string,
  relationshipToUser: string,
  confidence: number,
  evidenceRef: string,
  now: string,
): KeyPersonDraft {
  return {
    id,
    seedContextId,
    label,
    role,
    relationshipToUser,
    roleType: role,
    confidence,
    knownEvidence:
      "The trial context names this person as relevant to the career crossroad.",
    missingFields: [],
    evidenceRefs: [evidenceRef],
    userNote: "",
    confirmed: true,
    status: "confirmed",
    source: "manual",
    evidenceText:
      "Trial sample: a higher-paying new role, a current manager promise, recruiter timing, and one trusted colleague.",
    createdAt: now,
    updatedAt: now,
  };
}

export function createTrialWorkspace() {
  const now = new Date().toISOString();
  const birthInfo = {
    birthDate: "1992-08-16",
    birthTime: "07:40",
    birthPlace: "Shanghai",
    gender: "not_specified",
    timezone: "Asia/Shanghai",
  };
  const currentQuestionDescription =
    "Sample: I am deciding whether to accept a recruiter-led role with better pay or stay for a promised promotion. My boss controls promotion budget and timing, the recruiter needs an answer next week, and a trusted colleague hinted budget approval may be slower than expected. I want the sandbox to map career resource pressure, boss resource control, the information gap, and the recruiter opportunity without treating anyone's private motives as certain.";
  const seedContext: SeedContextDraft = {
    id: seedContextId,
    questionText:
      "Should I accept a higher-paying but uncertain new role, or stay with my current team while waiting for a promised promotion?",
    trackType: "crossroad",
    timeWindow: "90_days",
    destinyBirthInfo:
      "Birth date: 1992-08-16; Birth time: 07:40; Birth place: Shanghai; Gender: not_specified; Timezone: Asia/Shanghai",
    currentQuestionDescription,
    situationSummary:
      "Sample destiny-situation model: career resource pressure is centered on promotion timing, boss resource control, a recruiter opportunity window, and an information gap around budget approval.",
    recentEvents:
      "The recruiter asked for a decision next week. The current manager expressed support but did not give written timing. A trusted colleague hinted that budget approval may be slower than expected.",
    recentEventsText:
      "The recruiter asked for a decision next week. The current manager expressed support but did not give written timing. A trusted colleague hinted that budget approval may be slower than expected.",
    keyPeopleText:
      "Current manager, recruiter, trusted colleague, cautious self, decisive self",
    decisionOptions:
      "Accept the new role. Stay and negotiate a written promotion timeline. Ask both sides for one more week before deciding.",
    decisionOptionsText:
      "Accept the new role. Stay and negotiate a written promotion timeline. Ask both sides for one more week before deciding.",
    worries:
      "The promotion may remain vague, the new role may carry hidden risk, and a rushed decision could damage trust with either side.",
    forbiddenActions:
      "Do not burn bridges, disclose confidential team information, or treat a vague promotion promise as confirmed evidence.",
    forbiddenActionsText:
      "Do not burn bridges, disclose confidential team information, or treat a vague promotion promise as confirmed evidence.",
    safetyBoundaries:
      "Keep communication low-pressure and professional. Do not infer private motives as fact.",
    desiredOutput:
      "Compare destiny climate, situation models, relationship pressure points, evidence to watch, and low-risk communication options over the next 90 days.",
    desiredOutputText:
      "Compare destiny climate, situation models, relationship pressure points, evidence to watch, and low-risk communication options over the next 90 days.",
    contextQualityScore: 100,
    missingContextHints: [],
    privacyAck: true,
    privacySafetyAck: true,
    locale: "en",
    status: "submitted",
    createdAt: now,
    updatedAt: now,
  };

  const people = [
    person(
      "kp_trial_manager",
      "Current manager",
      "Promotion and resource owner",
      "boss",
      88,
      "seed:trial:manager",
      now,
    ),
    person(
      "kp_trial_recruiter",
      "Recruiter",
      "Opportunity source",
      "opportunity_source",
      84,
      "seed:trial:recruiter",
      now,
    ),
    person(
      "kp_trial_colleague",
      "Trusted colleague",
      "Internal signal source",
      "colleague",
      81,
      "seed:trial:colleague",
      now,
    ),
  ];

  const agents = [
    agent(
      "agent_trial_self",
      null,
      "self",
      "Current self",
      "Decision owner",
      "self",
      88,
      ["seed:trial:self"],
      profileJson(
        "baseline",
        "Decision owner",
        "self",
        88,
        ["seed:trial:self"],
        { authority: 42, information: 62, socialCapital: 58, emotionalLeverage: 46 },
        {
          stress: 64,
          trustInUser: 100,
          hostilityToUser: 0,
          currentIntention: "Compare reversible next steps before committing.",
        },
      ),
      now,
    ),
    agent(
      "agent_trial_cautious",
      null,
      "parallel_self",
      "Cautious self",
      "Parallel strategy",
      "self",
      74,
      ["seed:trial:self:cautious"],
      profileJson(
        "cautious_parallel",
        "Parallel strategy",
        "self",
        74,
        ["seed:trial:self:cautious"],
        { authority: 36, information: 70, socialCapital: 64, emotionalLeverage: 52 },
        {
          stress: 58,
          trustInUser: 100,
          hostilityToUser: 0,
          currentIntention: "Delay commitment until internal timing is clearer.",
        },
      ),
      now,
    ),
    agent(
      "agent_trial_decisive",
      null,
      "parallel_self",
      "Decisive self",
      "Parallel strategy",
      "self",
      73,
      ["seed:trial:self:decisive"],
      profileJson(
        "decisive_parallel",
        "Parallel strategy",
        "self",
        73,
        ["seed:trial:self:decisive"],
        { authority: 44, information: 56, socialCapital: 50, emotionalLeverage: 48 },
        {
          stress: 61,
          trustInUser: 100,
          hostilityToUser: 0,
          currentIntention: "Test the new role while preserving a graceful exit path.",
        },
      ),
      now,
    ),
    agent(
      "agent_trial_manager",
      "kp_trial_manager",
      "npc",
      "Current manager",
      "Promotion and resource owner",
      "boss",
      88,
      ["seed:trial:manager"],
      profileJson(
        "confirmed_npc",
        "Promotion and resource owner",
        "boss",
        88,
        ["seed:trial:manager"],
        { authority: 82, information: 66, socialCapital: 70, emotionalLeverage: 58 },
        {
          stress: 55,
          trustInUser: 52,
          hostilityToUser: 18,
          currentIntention:
            "Resource-control pressure remains unresolved while promotion timing stays uncertain.",
        },
      ),
      now,
    ),
    agent(
      "agent_trial_recruiter",
      "kp_trial_recruiter",
      "npc",
      "Recruiter",
      "Opportunity source",
      "opportunity_source",
      84,
      ["seed:trial:recruiter"],
      profileJson(
        "confirmed_npc",
        "Opportunity source",
        "opportunity_source",
        84,
        ["seed:trial:recruiter"],
        { authority: 46, information: 78, socialCapital: 54, emotionalLeverage: 42 },
        {
          stress: 42,
          trustInUser: 48,
          hostilityToUser: 8,
          currentIntention:
            "The external opportunity window needs a response before the hiring process cools.",
        },
      ),
      now,
    ),
    agent(
      "agent_trial_colleague",
      "kp_trial_colleague",
      "npc",
      "Trusted colleague",
      "Internal signal source",
      "colleague",
      81,
      ["seed:trial:colleague"],
      profileJson(
        "confirmed_npc",
        "Internal signal source",
        "colleague",
        81,
        ["seed:trial:colleague"],
        { authority: 28, information: 74, socialCapital: 68, emotionalLeverage: 44 },
        {
          stress: 38,
          trustInUser: 66,
          hostilityToUser: 5,
          currentIntention:
            "The trusted colleague can act as an information clue if the conversation stays low-risk.",
        },
      ),
      now,
    ),
  ];

  const destinyProfile = buildDestinyProfileDraft({
    birthInfo,
    seedContextId: seedContext.id,
    now,
  });
  const destinyClimate = buildDestinyClimateDraft({
    profile: destinyProfile,
    referenceDate: now,
    timeWindow: seedContext.timeWindow,
    topic: currentQuestionDescription,
  });
  const destinyFusion = buildDestinySituationFusionDraft({
    seedContext,
    destinyClimate,
    keyPeople: people,
    now,
  });
  const realityIntake = buildRealityIntakeDraft({
    seedContext,
    manualSources: [],
    externalSources: [],
    now,
  });
  const groundedRealityModel = buildGroundedRealityModel({
    seedContext,
    keyPeople: people,
    realityIntake,
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
  const groundedSocialSimulation: GroundedSocialSimulationDraft = {
    id: `gss_${seedContext.id}`,
    seedContextId: seedContext.id,
    destinyProfileId: destinyPersonModifier.destinyProfileId,
    destinyClimateId: destinyPersonModifier.destinyClimateId,
    realityIntake,
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
  const relationEdges = tuneCareerSampleEdges(
    buildRelationEdges(seedContext.id, agents),
  );
  const graph = {
    seedContextId: seedContext.id,
    version: "local-deterministic-v0" as const,
    agents,
    edges: relationEdges,
    graphLocked: true,
    lockedAt: now,
    updatedAt: now,
  };
  const simulationRun = queueSimulationRunDraft(
    buildSimulationRunDraft(
      seedContext,
      { seedContextId, includeParallelSelves: true, agents, updatedAt: now },
      relationEdges,
      undefined,
      undefined,
      destinyFusion,
      groundedSocialSimulation,
    ),
  );
  const claimLedger = buildClaimLedgerDraft(seedContext.id, simulationRun);

  saveSeedContextDraft(seedContext);
  saveDestinyProfileDraft(destinyProfile);
  saveDestinyClimateDraft(destinyClimate);
  saveDestinySituationFusionDraft(destinyFusion);
  saveRealityIntakeDraft(realityIntake);
  saveGroundedSocialSimulationDraft(groundedSocialSimulation);
  saveKeyPeopleDraft({ seedContextId: seedContext.id, people, updatedAt: now });
  saveAgentEcologyDraft({
    seedContextId: seedContext.id,
    includeParallelSelves: true,
    agents,
    updatedAt: now,
  });
  saveRelationGraphDraft(graph);
  saveSimulationRunDraft(simulationRun);
  saveClaimLedgerDraft(claimLedger);

  return {
    seedContext,
    people,
    agents,
    destinyProfile,
    destinyClimate,
    destinyFusion,
    groundedSocialSimulation,
    relationEdges,
    simulationRun,
    claimLedger,
  };
}
