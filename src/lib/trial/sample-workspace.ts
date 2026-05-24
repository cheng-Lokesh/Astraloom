import { saveAgentEcologyDraft } from "@/lib/agents/storage";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import { saveClaimLedgerDraft } from "@/lib/claims/storage";
import { saveKeyPeopleDraft } from "@/lib/people/storage";
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
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

const seedContextId = "trial_seed_career_crossroad";

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
  const seedContext: SeedContextDraft = {
    id: seedContextId,
    questionText:
      "Should I accept a higher-paying but uncertain new role, or stay with my current team while waiting for a promised promotion?",
    trackType: "crossroad",
    timeWindow: "90_days",
    situationSummary:
      "The new company offers more responsibility and better pay, but the market risk is higher. The current manager verbally supports a promotion but has not given a clear date. One trusted colleague has useful internal context.",
    keyPeopleText:
      "Current manager, recruiter, trusted colleague, cautious self, decisive self",
    privacyAck: true,
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
          currentIntention: "Keep the user engaged while promotion timing stays uncertain.",
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
          currentIntention: "Move the hiring process forward before the window cools.",
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
          currentIntention: "Share useful context if the conversation stays low-risk.",
        },
      ),
      now,
    ),
  ];

  const relationEdges = buildRelationEdges(seedContext.id, agents);
  const graph = {
    seedContextId: seedContext.id,
    version: "local-deterministic-v0" as const,
    agents,
    edges: relationEdges,
    updatedAt: now,
  };
  const simulationRun = queueSimulationRunDraft(
    buildSimulationRunDraft(seedContext, { seedContextId, includeParallelSelves: true, agents, updatedAt: now }, relationEdges),
  );
  const claimLedger = buildClaimLedgerDraft(seedContext.id, simulationRun);

  saveSeedContextDraft(seedContext);
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
    relationEdges,
    simulationRun,
    claimLedger,
  };
}
