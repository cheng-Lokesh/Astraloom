import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";
import type {
  GroundedRealityNode,
  GroundedRealityPressure,
} from "@/types/grounded-social-simulation";

import {
  clampConfidence,
  extractGroundedDomains,
  getGroundedSeedText,
  seedEvidenceRef,
  stableGroundedHash,
} from "./grounded-social-language";

export type GroundedRealityModelDraft = {
  realityNodes: GroundedRealityNode[];
  realityPressures: GroundedRealityPressure[];
  keyUncertainties: string[];
  observableSignals: string[];
  confidence: number;
};

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) ?? "";
}

function uniqueRefs(refs: string[]) {
  return Array.from(new Set(refs.filter(Boolean)));
}

function userNode(seedContext: SeedContextDraft): GroundedRealityNode {
  const evidenceText = getGroundedSeedText(seedContext);

  return {
    id: `grn_${seedContext.id}_user`,
    label: "User",
    nodeType: "user",
    source: "user_input",
    roleInSituation: "Decision-maker and primary person whose future paths are being simulated.",
    resourcesControlled: ["attention", "time", "choices", "boundaries"],
    informationHeld: ["personal context", "current question", "private priorities"],
    opportunitiesProvided: ["self-directed action", "clarifying next step"],
    constraintsCreated: ["limited bandwidth", "personal risk tolerance"],
    evidenceRefs: [seedEvidenceRef(seedContext.id, "question", evidenceText)],
    confidence: evidenceText.trim() ? 86 : 45,
  };
}

function nodeForPerson(person: KeyPersonDraft): GroundedRealityNode {
  const confidence = person.source === "manual"
    ? Math.min(90, person.confidence)
    : Math.min(82, person.confidence);

  return {
    id: `grn_person_${person.id}`,
    label: person.displayName || person.label,
    nodeType: person.roleType === "opportunity" ? "opportunity_source" : "person",
    source: person.source === "manual" ? "user_input" : "inferred_from_user_context",
    roleInSituation: person.role,
    resourcesControlled:
      person.roleType === "resource" || person.roleType === "authority"
        ? ["access", "approval", "practical resources"]
        : [],
    informationHeld: ["their observable stance", "recent interaction context"],
    opportunitiesProvided:
      person.roleType === "opportunity" ? ["possible opportunity"] : [],
    constraintsCreated:
      person.roleType === "conflict" || person.roleType === "authority"
        ? ["coordination or approval pressure"]
        : [],
    evidenceRefs: person.evidenceRefs,
    confidence: clampConfidence(confidence),
  };
}

function pressureForNode(
  seedContextId: string,
  node: GroundedRealityNode,
  userNodeId: string,
): GroundedRealityPressure {
  const pressureType =
    node.nodeType === "opportunity_source"
      ? "opportunity_pull"
      : node.nodeType === "institution"
        ? "institutional_constraint"
        : node.nodeType === "market"
          ? "market_pressure"
          : node.constraintsCreated.length
            ? "resource_control"
            : node.opportunitiesProvided.length
              ? "support"
              : "information_gap";

  return {
    id: `grp_${stableGroundedHash(`${seedContextId}:${node.id}:${pressureType}`)}`,
    sourceNodeId: node.id,
    targetNodeId: userNodeId,
    pressureType,
    explanation: `${node.label} affects the user's path through ${pressureType.replaceAll("_", " ")} grounded in the current context.`,
    evidenceRefs: node.evidenceRefs,
    confidence: clampConfidence(Math.min(node.confidence, 78)),
  };
}

export function buildGroundedRealityModel({
  seedContext,
  keyPeople,
}: {
  seedContext: SeedContextDraft;
  keyPeople: KeyPersonDraft[];
}): GroundedRealityModelDraft {
  const text = getGroundedSeedText(seedContext);
  const nodes = new Map<string, GroundedRealityNode>();
  const rootUserNode = userNode(seedContext);
  nodes.set(rootUserNode.id, rootUserNode);

  keyPeople
    .filter((person) => person.status !== "deleted" && person.status !== "rejected")
    .forEach((person) => {
      const node = nodeForPerson(person);
      nodes.set(node.id, node);
    });

  extractGroundedDomains(text).forEach((rule) => {
    const evidenceRef = seedEvidenceRef(seedContext.id, rule.id, text);
    const node: GroundedRealityNode = {
      id: `grn_${seedContext.id}_${rule.id}`,
      label: rule.label,
      nodeType: rule.nodeType,
      source: "inferred_from_user_context",
      roleInSituation: rule.roleInSituation,
      resourcesControlled: rule.resourcesControlled,
      informationHeld: rule.informationHeld,
      opportunitiesProvided: rule.opportunitiesProvided,
      constraintsCreated: rule.constraintsCreated,
      evidenceRefs: [evidenceRef],
      confidence: clampConfidence(text.length > 180 ? 70 : 58),
    };

    nodes.set(node.id, node);
  });

  const decisionText = firstText(
    seedContext.decisionOptions,
    seedContext.decisionOptionsText,
  );
  if (decisionText.trim()) {
    nodes.set(`grn_${seedContext.id}_decision_options`, {
      id: `grn_${seedContext.id}_decision_options`,
      label: "Current decision options",
      nodeType: "opportunity_source",
      source: "user_input",
      roleInSituation: "Explicit options the user is considering.",
      resourcesControlled: [],
      informationHeld: ["available options"],
      opportunitiesProvided: ["branchable future paths"],
      constraintsCreated: ["choice tradeoff"],
      evidenceRefs: [seedEvidenceRef(seedContext.id, "decision_options", decisionText)],
      confidence: 82,
    });
  }

  const worriesText = seedContext.worries ?? "";
  if (worriesText.trim()) {
    nodes.set(`grn_${seedContext.id}_worries`, {
      id: `grn_${seedContext.id}_worries`,
      label: "Named worry or constraint",
      nodeType: "constraint",
      source: "user_input",
      roleInSituation: "Constraint or risk the user explicitly named.",
      resourcesControlled: [],
      informationHeld: ["risk concern"],
      opportunitiesProvided: [],
      constraintsCreated: ["stress load", "avoidance pressure"],
      evidenceRefs: [seedEvidenceRef(seedContext.id, "worries", worriesText)],
      confidence: 80,
    });
  }

  const realityNodes = Array.from(nodes.values());
  const realityPressures = realityNodes
    .filter((node) => node.id !== rootUserNode.id)
    .map((node) => pressureForNode(seedContext.id, node, rootUserNode.id));
  const keyUncertainties = [
    ...(seedContext.missingContextHints ?? []),
    ...(keyPeople.length === 0 ? ["No specific external stakeholder was grounded from the current context."] : []),
    ...(realityNodes.length <= 2 ? ["Reality model has few grounded nodes; later clarification may improve path quality."] : []),
    ...(decisionText.trim() ? [] : ["Decision options are not explicit, so path branches stay broad."]),
  ];
  const observableSignals = [
    "A named stakeholder changes availability, stance, or response time.",
    "A resource, deadline, offer, or approval condition becomes explicit.",
    "The user observes whether pressure rises after a small boundary or information request.",
  ];
  const averageNodeConfidence =
    realityNodes.reduce((sum, node) => sum + node.confidence, 0) /
    Math.max(1, realityNodes.length);
  const uncertaintyPenalty = Math.min(24, keyUncertainties.length * 6);

  return {
    realityNodes,
    realityPressures: realityPressures.map((pressure) => ({
      ...pressure,
      evidenceRefs: uniqueRefs(pressure.evidenceRefs),
    })),
    keyUncertainties,
    observableSignals,
    confidence: clampConfidence(averageNodeConfidence - uncertaintyPenalty),
  };
}
