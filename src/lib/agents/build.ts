import type {
  AgentProfileDraft,
  AgentProfileJson,
  AgentStance,
  AgentType,
} from "@/types/agent-profile";
import type { KeyPersonDraft } from "@/types/key-person";
import { getSeedContextNarrative } from "@/lib/seed-context/context-text";
import type { SeedContextDraft } from "@/types/seed-context";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function scoreFromText(value: string, salt: string, min = 28, max = 82) {
  const seed = Number.parseInt(hashText(`${value}:${salt}`).slice(0, 6), 36);
  return min + (seed % (max - min + 1));
}

function createAgentProfile(
  seedContextId: string,
  sourceKeyPersonId: string | null,
  agentType: AgentType,
  label: string,
  role: string,
  relationshipToUser: string,
  confidence: number,
  evidenceRefs: string[],
  profileJson: AgentProfileJson,
  now: string,
): AgentProfileDraft {
  return {
    id: `agent_${hashText(
      `${seedContextId}:${sourceKeyPersonId ?? agentType}:${label}`,
    )}`,
    seedContextId,
    sourceKeyPersonId,
    agentType,
    label,
    role,
    relationshipToUser,
    confidence,
    evidenceRefs,
    version: "local-deterministic-v0",
    traceId: `local-agent:${seedContextId}:${hashText(label)}`,
    profileJson,
    promptVersion: "unreleased",
    modelVersion: "unreleased",
    createdAt: now,
    updatedAt: now,
  };
}

function selfProfile(
  seedContext: SeedContextDraft,
  stance: AgentStance,
): AgentProfileJson {
  const narrative = getSeedContextNarrative(seedContext);
  const stanceLabels: Record<AgentStance, string> = {
    baseline: "Current self",
    cautious_parallel: "Cautious self variant",
    decisive_parallel: "Decisive self variant",
    confirmed_npc: "Confirmed NPC",
  };
  const speed =
    stance === "cautious_parallel" ? 34 : stance === "decisive_parallel" ? 76 : 54;
  const fieldSources = {
    stance: "default",
    role: "default",
    origin: "default",
    relationshipToUser: "default",
    motivation: "default",
    resources: "default",
    behaviorPolicy: "default",
    state: "default",
    traits: "default",
    constraints: "default",
    missingFields: "default",
  } as const;

  return {
    stance,
    role: "self",
    origin: "seed_context",
    relationshipToUser: "self",
    source: {
      confidence: stance === "baseline" ? 86 : 72,
      sourceType: "default",
      evidenceRefs: [`seed:${seedContext.id}:self:${stance}`],
    },
    fieldSources,
    motivation: {
      primaryGoal:
        seedContext.trackType === "crossroad"
          ? "Keep the decision reversible while comparing near-term relationship dynamics."
          : "Track the long-horizon relationship climate and preparation windows.",
      fear:
        "Acting before the evidence is strong enough, or misreading how key people affect the scenario.",
      avoidancePattern:
        stance === "cautious_parallel"
          ? "Delays direct commitment until more signals are available."
          : stance === "decisive_parallel"
            ? "Tests options faster, with less buffer for relationship friction."
            : "Keeps weighing options when evidence is incomplete.",
    },
    resources: {
      authority: scoreFromText(seedContext.questionText, `${stance}:authority`, 35, 65),
      information: scoreFromText(narrative, `${stance}:info`, 38, 78),
      socialCapital: scoreFromText(seedContext.keyPeopleText, `${stance}:social`, 30, 70),
      emotionalLeverage: scoreFromText(seedContext.questionText, `${stance}:emotion`, 32, 76),
    },
    behaviorPolicy: {
      actionSpeed: speed,
      initiative: stance === "decisive_parallel" ? 78 : 52,
      cooperationBias: stance === "decisive_parallel" ? 52 : 68,
      communicationStyle: stance === "decisive_parallel" ? "sharp" : "formal",
    },
    state: {
      stress: scoreFromText(seedContext.questionText, `${stance}:stress`, 42, 76),
      trustInUser: 100,
      hostilityToUser: 0,
      currentIntention:
        stance === "baseline"
          ? "Wait for the graph to freeze before simulation starts."
          : "Act as a comparison branch during simulation.",
    },
    traits: [stanceLabels[stance], "local deterministic draft", "evidence-linked input"],
    constraints: [
      "This is a simulation model, not a truth claim about a person.",
      "No report claims are generated at the Agent Profile step.",
    ],
    missingFields: [],
  };
}

function npcProfile(person: KeyPersonDraft): AgentProfileJson {
  const authority = scoreFromText(person.role, `${person.id}:authority`);
  const information = scoreFromText(person.knownEvidence, `${person.id}:info`);
  const emotionalLeverage = scoreFromText(
    person.relationshipToUser,
    `${person.id}:emotion`,
  );
  const confirmedSource =
    person.status === "confirmed" ? "user_confirmed" : "chat_inferred";
  const fieldSources = {
    stance: "default",
    role: confirmedSource,
    origin: confirmedSource,
    relationshipToUser: confirmedSource,
    motivation: "default",
    resources: "default",
    behaviorPolicy: "default",
    state: "default",
    traits: confirmedSource,
    constraints: "default",
    missingFields: confirmedSource,
  } as const;

  return {
    stance: "confirmed_npc",
    role: person.role || "unconfirmed role",
    origin:
      person.source === "manual"
        ? "user_added"
        : person.source === "key_people_text"
          ? "named_in_intake"
          : "detected_from_intake",
    relationshipToUser: person.relationshipToUser,
    source: {
      confidence: person.confidence,
      sourceType: confirmedSource,
      evidenceRefs: person.evidenceRefs,
    },
    fieldSources,
    motivation: {
      primaryGoal: `${person.role || "This actor"} stays represented as a resource, pressure, or signal in the scenario.`,
      fear:
        "The model may overread limited evidence, so confidence and evidence refs stay visible.",
      avoidancePattern: person.missingFields.length
        ? "Uses conservative behavior until missing fields are confirmed."
        : "Waits for the relationship graph and event rules to shape interactions.",
    },
    resources: {
      authority,
      information,
      socialCapital: scoreFromText(person.label, `${person.id}:social`),
      emotionalLeverage,
    },
    behaviorPolicy: {
      actionSpeed: scoreFromText(person.role, `${person.id}:speed`, 24, 74),
      initiative: scoreFromText(person.knownEvidence, `${person.id}:initiative`, 22, 76),
      cooperationBias: scoreFromText(person.relationshipToUser, `${person.id}:coop`, 30, 78),
      communicationStyle: "unknown",
    },
    state: {
      stress: scoreFromText(person.knownEvidence, `${person.id}:stress`, 30, 82),
      trustInUser: scoreFromText(person.label, `${person.id}:trust`, 24, 68),
      hostilityToUser: scoreFromText(person.role, `${person.id}:hostility`, 8, 42),
      currentIntention: person.userNote
        ? `User note: ${person.userNote}`
        : "Wait for graph generation to calibrate this actor's simulation role.",
    },
    traits: [
      "confirmed for this sandbox",
      person.status === "confirmed" ? "user-confirmed actor" : "candidate actor",
      `confidence ${person.confidence}%`,
    ],
    constraints: [
      "Do not infer private inner thoughts, loyalty, deception, or hidden intent as fact.",
      "Relation weights are generated later and are read-only to the user.",
    ],
    missingFields: person.missingFields,
  };
}

export function getConfirmedPeople(people: KeyPersonDraft[]) {
  return people.filter(
    (person) => person.confirmed && person.status === "confirmed",
  );
}

export function buildAgentProfiles(
  seedContext: SeedContextDraft,
  confirmedPeople: KeyPersonDraft[],
  includeParallelSelves: boolean,
) {
  const now = new Date().toISOString();
  const agents: AgentProfileDraft[] = [
    createAgentProfile(
      seedContext.id,
      null,
      "self",
      "Current self",
      "Decision owner",
      "self",
      86,
      [`seed:${seedContext.id}:self:baseline`],
      selfProfile(seedContext, "baseline"),
      now,
    ),
  ];

  if (includeParallelSelves) {
    agents.push(
      createAgentProfile(
        seedContext.id,
        null,
        "parallel_self",
        "Cautious self",
        "Comparison branch",
        "self",
        72,
        [`seed:${seedContext.id}:self:cautious_parallel`],
        selfProfile(seedContext, "cautious_parallel"),
        now,
      ),
      createAgentProfile(
        seedContext.id,
        null,
        "parallel_self",
        "Decisive self",
        "Comparison branch",
        "self",
        72,
        [`seed:${seedContext.id}:self:decisive_parallel`],
        selfProfile(seedContext, "decisive_parallel"),
        now,
      ),
    );
  }

  confirmedPeople.forEach((person) => {
    agents.push(
      createAgentProfile(
        seedContext.id,
        person.id,
        "npc",
        person.label,
        person.role,
        person.relationshipToUser,
        person.confidence,
        person.evidenceRefs,
        npcProfile(person),
        now,
      ),
    );
  });

  return agents;
}
