import type {
  GroundedRealityNodeType,
  GroundedRealityPressureType,
} from "@/types/grounded-social-simulation";
import type { SeedContextDraft } from "@/types/seed-context";

export type GroundedDomain =
  | "career"
  | "relationship"
  | "family"
  | "collaboration"
  | "self_direction";

export type GroundedKeywordRule = {
  id: GroundedDomain;
  nodeType: GroundedRealityNodeType;
  pressureType: GroundedRealityPressureType;
  label: string;
  roleInSituation: string;
  resourcesControlled: string[];
  informationHeld: string[];
  opportunitiesProvided: string[];
  constraintsCreated: string[];
  keywords: RegExp;
};

export const groundedKeywordRules: GroundedKeywordRule[] = [
  {
    id: "career",
    nodeType: "organization",
    pressureType: "resource_control",
    label: "Work organization",
    roleInSituation: "Career setting that can affect role, evaluation, and access to resources.",
    resourcesControlled: ["role scope", "budget", "promotion path"],
    informationHeld: ["performance expectations", "hiring or promotion signals"],
    opportunitiesProvided: ["role growth", "internal mobility"],
    constraintsCreated: ["approval chain", "team capacity"],
    keywords: /career|job|work|manager|boss|promotion|salary|offer|interview|company|team|role|hiring/i,
  },
  {
    id: "relationship",
    nodeType: "person",
    pressureType: "emotional_pressure",
    label: "Relationship stakeholder",
    roleInSituation: "Personal relationship node affecting emotional pressure and communication choices.",
    resourcesControlled: ["attention", "commitment", "communication access"],
    informationHeld: ["relationship stance", "recent response pattern"],
    opportunitiesProvided: ["repair conversation", "clearer agreement"],
    constraintsCreated: ["emotional ambiguity", "boundary tension"],
    keywords: /relationship|partner|dating|marriage|breakup|ex|love|spouse|boyfriend|girlfriend/i,
  },
  {
    id: "family",
    nodeType: "resource_holder",
    pressureType: "support",
    label: "Family or household support system",
    roleInSituation: "Household or family node affecting time, emotional load, and practical support.",
    resourcesControlled: ["care support", "household time", "shared money"],
    informationHeld: ["family expectations", "support conditions"],
    opportunitiesProvided: ["practical support", "emotional backing"],
    constraintsCreated: ["family obligation", "shared schedule"],
    keywords: /family|parent|child|children|household|home|caregiving|spouse/i,
  },
  {
    id: "collaboration",
    nodeType: "opportunity_source",
    pressureType: "competition",
    label: "Collaboration or business opportunity",
    roleInSituation: "Shared-interest node that can open opportunities while adding coordination pressure.",
    resourcesControlled: ["deal access", "client access", "shared execution capacity"],
    informationHeld: ["commercial intent", "delivery expectations"],
    opportunitiesProvided: ["partnership", "new project", "client path"],
    constraintsCreated: ["coordination cost", "negotiation ambiguity"],
    keywords: /business|startup|cofounder|partner|client|investor|collaboration|contract|project/i,
  },
  {
    id: "self_direction",
    nodeType: "environment",
    pressureType: "timing_pressure",
    label: "Personal direction environment",
    roleInSituation: "Life-direction context shaping attention, timing, and decision bandwidth.",
    resourcesControlled: ["time", "energy", "focus"],
    informationHeld: ["personal priorities", "tradeoff tolerance"],
    opportunitiesProvided: ["self-directed adjustment", "new routine"],
    constraintsCreated: ["unclear priority", "decision fatigue"],
    keywords: /future|direction|choice|decision|change|move|study|learn|plan|meaning|stuck|confused/i,
  },
];

export function stableGroundedHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function clampConfidence(value: number) {
  return Math.max(5, Math.min(95, Math.round(value)));
}

export function getGroundedSeedText(seedContext: SeedContextDraft) {
  return [
    seedContext.questionText,
    seedContext.currentQuestionDescription,
    seedContext.situationSummary,
    seedContext.recentEvents,
    seedContext.recentEventsText,
    seedContext.keyPeopleText,
    seedContext.decisionOptions,
    seedContext.decisionOptionsText,
    seedContext.worries,
    seedContext.safetyBoundaries,
    seedContext.desiredOutput,
    seedContext.desiredOutputText,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}

export function seedEvidenceRef(
  seedContextId: string,
  field: string,
  value = "",
) {
  return `seed:${seedContextId}:${field}:${stableGroundedHash(value || field)}`;
}

export function extractGroundedDomains(text: string) {
  return groundedKeywordRules.filter((rule) => rule.keywords.test(text));
}
