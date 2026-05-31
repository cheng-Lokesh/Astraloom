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
  | "study"
  | "migration"
  | "self_direction"
  | "other";

export type GroundedDomainInference = {
  domain: GroundedDomain;
  confidence: number;
  signals: string[];
};

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
    id: "study",
    nodeType: "institution",
    pressureType: "institutional_constraint",
    label: "School or credential system",
    roleInSituation: "Study or credential node shaping deadlines, advisor expectations, and qualification signals.",
    resourcesControlled: ["credential path", "school timeline", "advisor access"],
    informationHeld: ["admission or assessment standards", "deadline requirements"],
    opportunitiesProvided: ["program entry", "credential progress", "advisor feedback"],
    constraintsCreated: ["application deadline", "course or credential requirement"],
    keywords: /study|school|university|college|advisor|professor|degree|credential|exam|deadline|application|course|learn|learning/i,
  },
  {
    id: "migration",
    nodeType: "institution",
    pressureType: "institutional_constraint",
    label: "Migration or relocation system",
    roleInSituation: "Relocation node shaping city choice, visa or policy timing, market fit, and family logistics.",
    resourcesControlled: ["visa or permit process", "relocation timing", "local access"],
    informationHeld: ["policy requirements", "city market signals", "family timing constraints"],
    opportunitiesProvided: ["new city option", "relocation path", "market access"],
    constraintsCreated: ["visa deadline", "housing or family logistics", "policy uncertainty"],
    keywords: /migration|relocat|move abroad|move to|visa|permit|city|country|immigration|housing|overseas|settle/i,
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
    keywords: /future|direction|choice|decision|change|plan|meaning|stuck|confused/i,
  },
];

const domainPriority: GroundedDomain[] = [
  "career",
  "relationship",
  "collaboration",
  "family",
  "study",
  "migration",
  "self_direction",
  "other",
];

function addDomainScore(
  scores: Map<GroundedDomain, number>,
  signals: string[],
  domain: GroundedDomain,
  amount: number,
  signal: string,
) {
  scores.set(domain, (scores.get(domain) ?? 0) + amount);
  signals.push(signal);
}

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

export function inferPrimaryGroundedDomain({
  seedContext,
  realityNodes = [],
  realityPressures = [],
}: {
  seedContext: SeedContextDraft;
  realityNodes?: Array<{
    label: string;
    nodeType: GroundedRealityNodeType;
    roleInSituation: string;
  }>;
  realityPressures?: Array<{
    pressureType: GroundedRealityPressureType;
  }>;
}): GroundedDomainInference {
  const seedText = getGroundedSeedText(seedContext);
  const combinedNodeText = realityNodes
    .map((node) => `${node.label} ${node.roleInSituation}`)
    .join("\n");
  const searchableText = `${seedText}\n${combinedNodeText}`;
  const scores = new Map<GroundedDomain, number>();
  const signals: string[] = [];

  extractGroundedDomains(searchableText).forEach((rule) => {
    addDomainScore(scores, signals, rule.id, 4, `keyword:${rule.id}`);
  });

  realityNodes.forEach((node) => {
    const nodeText = `${node.label} ${node.roleInSituation}`.toLowerCase();

    if (node.nodeType === "organization" || node.nodeType === "market") {
      addDomainScore(scores, signals, "career", 2, `node:${node.nodeType}`);
    }
    if (node.nodeType === "opportunity_source") {
      addDomainScore(scores, signals, "collaboration", 2, "node:opportunity_source");
      addDomainScore(scores, signals, "career", 1, "node:opportunity_source");
    }
    if (node.nodeType === "institution") {
      addDomainScore(scores, signals, "study", 1, "node:institution");
      addDomainScore(scores, signals, "migration", 1, "node:institution");
    }
    if (/parent|family|sibling|household|spouse|child|children/.test(nodeText)) {
      addDomainScore(scores, signals, "family", 3, "node:family_language");
    }
    if (/partner|dating|relationship|ex|boyfriend|girlfriend|marriage/.test(nodeText)) {
      addDomainScore(scores, signals, "relationship", 3, "node:relationship_language");
    }
    if (/advisor|school|university|credential|exam|degree|course/.test(nodeText)) {
      addDomainScore(scores, signals, "study", 3, "node:study_language");
    }
    if (/visa|city|relocat|migration|immigration|housing|overseas/.test(nodeText)) {
      addDomainScore(scores, signals, "migration", 3, "node:migration_language");
    }
  });

  realityPressures.forEach((pressure) => {
    if (pressure.pressureType === "emotional_pressure") {
      addDomainScore(scores, signals, "relationship", 2, "pressure:emotional_pressure");
      addDomainScore(scores, signals, "family", 1, "pressure:emotional_pressure");
    }
    if (pressure.pressureType === "institutional_constraint") {
      addDomainScore(scores, signals, "study", 2, "pressure:institutional_constraint");
      addDomainScore(scores, signals, "migration", 2, "pressure:institutional_constraint");
    }
    if (pressure.pressureType === "market_pressure") {
      addDomainScore(scores, signals, "career", 2, "pressure:market_pressure");
      addDomainScore(scores, signals, "migration", 1, "pressure:market_pressure");
    }
    if (pressure.pressureType === "resource_control") {
      addDomainScore(scores, signals, "career", 1, "pressure:resource_control");
      addDomainScore(scores, signals, "collaboration", 1, "pressure:resource_control");
    }
    if (pressure.pressureType === "opportunity_pull") {
      addDomainScore(scores, signals, "career", 1, "pressure:opportunity_pull");
      addDomainScore(scores, signals, "collaboration", 2, "pressure:opportunity_pull");
    }
    if (pressure.pressureType === "competition") {
      addDomainScore(scores, signals, "career", 1, "pressure:competition");
      addDomainScore(scores, signals, "collaboration", 1, "pressure:competition");
    }
    if (pressure.pressureType === "support") {
      addDomainScore(scores, signals, "family", 1, "pressure:support");
    }
    if (pressure.pressureType === "timing_pressure") {
      addDomainScore(scores, signals, "self_direction", 1, "pressure:timing_pressure");
    }
  });

  const bestDomain = domainPriority.reduce<GroundedDomain>((best, domain) => {
    const bestScore = scores.get(best) ?? 0;
    const score = scores.get(domain) ?? 0;
    return score > bestScore ? domain : best;
  }, "other");
  const bestScore = scores.get(bestDomain) ?? 0;

  if (bestScore <= 0) {
    return {
      domain: "other",
      confidence: 30,
      signals: ["domain:insufficient_grounded_signals"],
    };
  }

  return {
    domain: bestDomain,
    confidence: clampConfidence(Math.min(82, 34 + bestScore * 8)),
    signals: Array.from(new Set(signals)).slice(0, 8),
  };
}
