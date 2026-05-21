import type {
  AgentProfileDraft,
  AgentProfileJson,
  AgentStance,
  AgentType,
} from "@/types/agent-profile";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function createAgentProfile(
  seedContextId: string,
  sourceKeyPersonId: string | null,
  agentType: AgentType,
  label: string,
  role: string,
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
  const trackTrait =
    seedContext.trackType === "crossroad"
      ? "decision pressure"
      : "longer-horizon uncertainty";

  const stanceTraits: Record<AgentStance, string[]> = {
    baseline: ["self narrative", trackTrait, "current constraints"],
    cautious_parallel: [
      "risk-sensitive parallel self",
      trackTrait,
      "protective bias",
    ],
    decisive_parallel: [
      "action-biased parallel self",
      trackTrait,
      "opportunity bias",
    ],
    confirmed_npc: [],
  };

  return {
    stance,
    role: "self",
    origin: "seed_context",
    traits: stanceTraits[stance],
    constraints: [
      "No model-generated personality profile yet.",
      "No deterministic prediction claim yet.",
    ],
  };
}

function npcProfile(person: KeyPersonDraft): AgentProfileJson {
  return {
    stance: "confirmed_npc",
    role: person.role || "unknown",
    origin: person.source,
    traits: ["confirmed by user", "relationship participant"],
    constraints: [
      "No inferred inner motive yet.",
      "No editable relation weight exposed to user.",
    ],
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
      "User self",
      "self",
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
        "parallel self",
        selfProfile(seedContext, "cautious_parallel"),
        now,
      ),
      createAgentProfile(
        seedContext.id,
        null,
        "parallel_self",
        "Decisive self",
        "parallel self",
        selfProfile(seedContext, "decisive_parallel"),
        now,
      ),
    );
  }

  getConfirmedPeople(confirmedPeople).forEach((person) => {
    agents.push(
      createAgentProfile(
        seedContext.id,
        person.id,
        "npc",
        person.label,
        person.role || "unknown",
        npcProfile(person),
        now,
      ),
    );
  });

  return agents;
}
