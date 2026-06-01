import type { KeyPersonDraft } from "@/types/key-person";
import type {
  ExternalRealitySource,
  ManualRealitySource,
  RealityIntakeDraft,
} from "@/types/reality-intake";
import type { SeedContextDraft } from "@/types/seed-context";
import type {
  GroundedRealityNode,
  GroundedRealityNodeType,
  GroundedRealityPressure,
  GroundedRealityPressureType,
} from "@/types/grounded-social-simulation";

import {
  clampConfidence,
  extractGroundedDomains,
  getGroundedSeedText,
  inferPrimaryGroundedDomain,
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

const localAssumptionConfidenceCap = 62;
const manualRealityConfidenceCap = 76;
const externalRealityConfidenceCap = 80;

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) ?? "";
}

function uniqueRefs(refs: string[]) {
  return Array.from(new Set(refs.filter(Boolean)));
}

function confidenceCapForIntake(realityIntake: RealityIntakeDraft) {
  if (realityIntake.mode === "external_reality") return 82;
  if (realityIntake.mode === "manual_reality") return manualRealityConfidenceCap;
  return localAssumptionConfidenceCap;
}

function capNodeConfidence(
  node: GroundedRealityNode,
  realityIntake: RealityIntakeDraft,
): GroundedRealityNode {
  return {
    ...node,
    confidence: clampConfidence(
      Math.min(node.confidence, confidenceCapForIntake(realityIntake)),
    ),
  };
}

function capPressureConfidence(
  pressure: GroundedRealityPressure,
  realityIntake: RealityIntakeDraft,
): GroundedRealityPressure {
  return {
    ...pressure,
    confidence: clampConfidence(
      Math.min(pressure.confidence, confidenceCapForIntake(realityIntake)),
    ),
  };
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
  preferredPressureType?: GroundedRealityPressure["pressureType"],
): GroundedRealityPressure {
  const pressureType =
    preferredPressureType ??
    (node.nodeType === "opportunity_source"
      ? "opportunity_pull"
      : node.nodeType === "institution"
        ? "institutional_constraint"
        : node.nodeType === "market"
          ? "market_pressure"
          : node.constraintsCreated.length
            ? "resource_control"
            : node.opportunitiesProvided.length
              ? "support"
              : "information_gap");

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

function nodeTypeForManualSource(
  source: ManualRealitySource,
): GroundedRealityNode["nodeType"] {
  if (source.sourceType === "company_info") return "organization";
  if (source.sourceType === "policy_info") return "policy";
  if (source.sourceType === "market_note" || source.sourceType === "news_summary") {
    return "market";
  }
  if (source.sourceType === "offer_terms" || source.sourceType === "job_description") {
    return "opportunity_source";
  }
  if (source.sourceType === "agreement_summary") return "constraint";

  const hints = source.extractedNodeHints.join(" ");
  if (/organization/.test(hints)) return "organization";
  if (/policy|institution/.test(hints)) return "policy";
  if (/market/.test(hints)) return "market";
  if (/opportunity/.test(hints)) return "opportunity_source";
  if (/constraint/.test(hints)) return "constraint";
  if (/authority person/.test(hints)) return "person";

  return "information_source";
}

function pressureTypeForManualSource(
  source: ManualRealitySource,
): GroundedRealityPressure["pressureType"] {
  const hints = source.extractedPressureHints.join(" ");
  if (/timing/.test(hints)) return "timing_pressure";
  if (/resource|approval/.test(hints)) return "resource_control";
  if (/information/.test(hints)) return "information_gap";
  if (/competition/.test(hints)) return "competition";
  if (/constraint/.test(hints)) return "institutional_constraint";
  if (source.sourceType === "market_note") return "market_pressure";
  if (source.sourceType === "policy_info" || source.sourceType === "agreement_summary") {
    return "institutional_constraint";
  }
  if (source.sourceType === "offer_terms" || source.sourceType === "job_description") {
    return "opportunity_pull";
  }

  return "information_gap";
}

function manualSourceNode(
  seedContextId: string,
  source: ManualRealitySource,
): GroundedRealityNode {
  const nodeType = nodeTypeForManualSource(source);

  return {
    id: `grn_manual_${source.id}`,
    label: source.title,
    nodeType,
    source: "manual_reality_source",
    roleInSituation: `User-provided ${source.sourceType.replaceAll("_", " ")} used as grounded material for the current question.`,
    resourcesControlled:
      nodeType === "organization" ||
      nodeType === "market" ||
      nodeType === "resource_holder"
        ? ["budget", "access", "practical resources"]
        : [],
    informationHeld: uniqueRefs([
      source.relevanceToQuestion,
      ...source.extractedNodeHints,
      "manual real-world material",
    ]),
    opportunitiesProvided:
      nodeType === "opportunity_source" ? ["explicit opportunity terms"] : [],
    constraintsCreated: uniqueRefs(source.extractedPressureHints),
    evidenceRefs: [
      `manual-reality:${seedContextId}:${source.id}:${stableGroundedHash(source.content)}`,
    ],
    confidence: clampConfidence(Math.min(source.confidence, manualRealityConfidenceCap)),
  };
}

function nodeTypeForExternalSource(
  source: ExternalRealitySource,
): GroundedRealityNode["nodeType"] {
  if (source.sourceType === "company") return "organization";
  if (source.sourceType === "policy" || source.sourceType === "migration") {
    return "policy";
  }
  if (
    source.sourceType === "job_market" ||
    source.sourceType === "industry" ||
    source.sourceType === "finance"
  ) {
    return "market";
  }
  if (source.sourceType === "education") return "institution";
  if (source.sourceType === "city") return "environment";
  if (source.sourceType === "relationship_context") return "information_source";
  return "information_source";
}

function pressureTypeForExternalSource(
  source: ExternalRealitySource,
): GroundedRealityPressure["pressureType"] {
  if (source.sourceType === "policy" || source.sourceType === "migration") {
    return "institutional_constraint";
  }
  if (
    source.sourceType === "job_market" ||
    source.sourceType === "industry" ||
    source.sourceType === "finance"
  ) {
    return "market_pressure";
  }
  if (source.sourceType === "company") return "resource_control";
  if (source.sourceType === "education") return "institutional_constraint";
  if (source.sourceType === "news") return "information_gap";
  return "information_gap";
}

function externalSourceNode(
  seedContextId: string,
  source: ExternalRealitySource,
): GroundedRealityNode {
  const nodeType = nodeTypeForExternalSource(source);
  const summary = source.summary || source.contentSummary || source.title;

  return {
    id: `grn_external_${source.id}`,
    label: source.title,
    nodeType,
    source: "external_reality_source",
    roleInSituation: `External ${source.sourceType.replaceAll("_", " ")} source retrieved for the current question. Treat as contextual evidence, not an absolute fact or final conclusion.`,
    resourcesControlled:
      nodeType === "organization" || nodeType === "market"
        ? ["public context", "market or institutional signal"]
        : [],
    informationHeld: uniqueRefs([
      summary,
      ...source.relevantNodes,
      ...source.limitations,
    ]).slice(0, 8),
    opportunitiesProvided: source.relevantNodes
      .filter((item) => /opportunity|opening|option|role|program/i.test(item))
      .slice(0, 4),
    constraintsCreated: uniqueRefs([
      ...source.relevantPressures,
      ...source.limitations,
    ]).slice(0, 8),
    evidenceRefs: [
      `external-reality:${seedContextId}:${source.questionId}:${source.id}:${stableGroundedHash(`${source.url}:${summary}`)}`,
    ],
    confidence: clampConfidence(Math.min(source.confidence, externalRealityConfidenceCap)),
  };
}

function groundedNodeType(value: string): GroundedRealityNodeType {
  const allowed: GroundedRealityNodeType[] = [
    "user",
    "person",
    "organization",
    "institution",
    "market",
    "policy",
    "opportunity_source",
    "resource_holder",
    "information_source",
    "constraint",
    "environment",
  ];
  return allowed.includes(value as GroundedRealityNodeType)
    ? (value as GroundedRealityNodeType)
    : "information_source";
}

function groundedPressureType(value: string): GroundedRealityPressureType {
  const allowed: GroundedRealityPressureType[] = [
    "resource_control",
    "information_gap",
    "timing_pressure",
    "market_pressure",
    "institutional_constraint",
    "emotional_pressure",
    "opportunity_pull",
    "competition",
    "support",
  ];
  return allowed.includes(value as GroundedRealityPressureType)
    ? (value as GroundedRealityPressureType)
    : "information_gap";
}

function llmExtractionNode(
  seedContextId: string,
  labelIndex: number,
  node: NonNullable<RealityIntakeDraft["llmExtraction"]>["groundedRealityNodes"][number],
): GroundedRealityNode {
  return {
    id: `grn_llm_${seedContextId}_${stableGroundedHash(`${labelIndex}:${node.label}:${node.sourceText}`)}`,
    label: node.label,
    nodeType: groundedNodeType(node.nodeType),
    source: "llm_extraction",
    roleInSituation: node.roleInSituation,
    resourcesControlled: node.resourcesControlled,
    informationHeld: node.informationHeld,
    opportunitiesProvided: node.opportunitiesProvided,
    constraintsCreated: node.constraintsCreated,
    evidenceRefs: node.evidenceRefs,
    confidence: clampConfidence(Math.min(node.confidence, 65)),
  };
}

function observableSignalsForDomain(
  domain: ReturnType<typeof inferPrimaryGroundedDomain>["domain"],
) {
  if (domain === "career") {
    return [
      "A manager, recruiter, team, or work market signal makes timing, budget, or evaluation criteria explicit.",
      "Portfolio evidence, written timeline, or compensation terms become concrete enough to compare.",
    ];
  }

  if (domain === "relationship") {
    return [
      "The other person's observable reply pattern, availability, or boundary response becomes clearer.",
      "Emotional pressure eases or rises after one low-pressure clarification or step-back boundary.",
    ];
  }

  if (domain === "collaboration") {
    return [
      "A client, collaborator, or partner clarifies budget, ownership, roles, or delivery expectations.",
      "Trust improves only if benefit boundaries and responsibilities become explicit.",
    ];
  }

  if (domain === "family") {
    return [
      "Family expectations, support availability, or obligation timing becomes explicit.",
      "The user can observe whether a boundary protects time while preserving practical connection.",
    ];
  }

  if (domain === "migration") {
    return [
      "A city, visa, market, housing, or family-logistics constraint becomes explicit enough to schedule.",
      "Relocation pressure changes when policy timing and alternative locations can be compared.",
    ];
  }

  if (domain === "study") {
    return [
      "A school, advisor, credential, course, or deadline requirement becomes explicit.",
      "Study pressure changes when application timing and qualification gaps are made visible.",
    ];
  }

  return [
    "A named stakeholder changes availability, stance, or response time.",
    "A resource, deadline, offer, or approval condition becomes explicit.",
  ];
}

export function buildGroundedRealityModel({
  seedContext,
  keyPeople,
  realityIntake,
}: {
  seedContext: SeedContextDraft;
  keyPeople: KeyPersonDraft[];
  realityIntake: RealityIntakeDraft;
}): GroundedRealityModelDraft {
  const text = getGroundedSeedText(seedContext);
  const nodes = new Map<string, GroundedRealityNode>();
  const preferredPressureByNodeId = new Map<
    string,
    GroundedRealityPressure["pressureType"]
  >();
  const rootUserNode = userNode(seedContext);
  nodes.set(rootUserNode.id, capNodeConfidence(rootUserNode, realityIntake));

  keyPeople
    .filter((person) => person.status !== "deleted" && person.status !== "rejected")
    .forEach((person) => {
      const node = nodeForPerson(person);
      nodes.set(node.id, capNodeConfidence(node, realityIntake));
    });

  realityIntake.manualSources.forEach((source) => {
    const node = manualSourceNode(seedContext.id, source);
    nodes.set(node.id, capNodeConfidence(node, realityIntake));
    preferredPressureByNodeId.set(node.id, pressureTypeForManualSource(source));
  });

  realityIntake.externalSources.forEach((source) => {
    const node = externalSourceNode(seedContext.id, source);
    nodes.set(node.id, capNodeConfidence(node, realityIntake));
    preferredPressureByNodeId.set(node.id, pressureTypeForExternalSource(source));
  });

  const llmNodesByLabel = new Map<string, GroundedRealityNode>();
  realityIntake.llmExtraction?.groundedRealityNodes.forEach((extractedNode, index) => {
    const node = llmExtractionNode(seedContext.id, index, extractedNode);
    nodes.set(node.id, capNodeConfidence(node, realityIntake));
    llmNodesByLabel.set(node.label, node);
  });

  realityIntake.llmExtraction?.groundedRealityPressures.forEach((pressure) => {
    const node = llmNodesByLabel.get(pressure.sourceLabel);
    if (node) {
      preferredPressureByNodeId.set(node.id, groundedPressureType(pressure.pressureType));
    }
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

    nodes.set(node.id, capNodeConfidence(node, realityIntake));
    preferredPressureByNodeId.set(node.id, rule.pressureType);
  });

  const decisionText = firstText(
    seedContext.decisionOptions,
    seedContext.decisionOptionsText,
  );
  if (decisionText.trim()) {
    nodes.set(`grn_${seedContext.id}_decision_options`, capNodeConfidence({
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
    }, realityIntake));
  }

  const worriesText = seedContext.worries ?? "";
  if (worriesText.trim()) {
    nodes.set(`grn_${seedContext.id}_worries`, capNodeConfidence({
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
    }, realityIntake));
  }

  const realityNodes = Array.from(nodes.values());
  const realityPressures = realityNodes
    .filter((node) => node.id !== rootUserNode.id)
    .map((node) =>
      capPressureConfidence(pressureForNode(
        seedContext.id,
        node,
        rootUserNode.id,
        preferredPressureByNodeId.get(node.id),
      ), realityIntake),
    );
  const llmPressures =
    realityIntake.llmExtraction?.groundedRealityPressures
      .map((pressure, index): GroundedRealityPressure | null => {
        const sourceNode = llmNodesByLabel.get(pressure.sourceLabel);
        const targetNode =
          llmNodesByLabel.get(pressure.targetLabel) ?? rootUserNode;
        if (!sourceNode) return null;

        return capPressureConfidence({
          id: `grp_llm_${stableGroundedHash(`${seedContext.id}:${index}:${pressure.sourceLabel}:${pressure.targetLabel}`)}`,
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
          pressureType: groundedPressureType(pressure.pressureType),
          explanation: pressure.explanation,
          evidenceRefs: uniqueRefs(pressure.evidenceRefs),
          confidence: clampConfidence(Math.min(pressure.confidence, sourceNode.confidence, 65)),
        }, realityIntake);
      })
      .filter((pressure): pressure is GroundedRealityPressure => Boolean(pressure)) ?? [];
  const primaryDomain = inferPrimaryGroundedDomain({
    seedContext,
    realityNodes,
    realityPressures,
  });
  const keyUncertainties = [
    ...(seedContext.missingContextHints ?? []),
    ...(keyPeople.length === 0 ? ["No specific external stakeholder was grounded from the current context."] : []),
    ...(realityIntake.mode === "local_assumption"
      ? ["No manual or external reality material was provided; reality judgments are capped and must stay provisional."]
      : []),
    ...(realityIntake.missingExternalInfo ?? []),
    ...(realityIntake.llmExtraction?.externalInfoNeeded
      ? ["DeepSeek Reality Intake marked external reality search as still needed before high-confidence social grounding."]
      : []),
    ...(realityIntake.llmStatus?.fallback
      ? ["DeepSeek Reality Intake did not participate successfully; this grounded model uses local fallback only."]
      : []),
    ...(realityIntake.realitySearchStatus?.fallback
      ? ["External reality search did not participate successfully; source-backed reality remains limited."]
      : []),
    ...(realityIntake.externalSources.length === 0 &&
    realityIntake.llmExtraction?.externalInfoNeeded
      ? ["Search questions exist, but no validated external source has been attached yet."]
      : []),
    ...(realityNodes.length <= 2 ? ["Reality model has few grounded nodes; later clarification may improve path quality."] : []),
    ...(decisionText.trim() ? [] : ["Decision options are not explicit, so path branches stay broad."]),
    ...(primaryDomain.domain === "other" || primaryDomain.confidence < 50
      ? ["Primary domain is not strongly grounded, so path language stays conservative."]
      : []),
  ];
  const observableSignals = [
    ...observableSignalsForDomain(primaryDomain.domain),
    "The user observes whether pressure rises after a small boundary or information request.",
  ];
  const averageNodeConfidence =
    realityNodes.reduce((sum, node) => sum + node.confidence, 0) /
    Math.max(1, realityNodes.length);
  const uncertaintyPenalty = Math.min(24, keyUncertainties.length * 6);

  return {
    realityNodes,
    realityPressures: [...realityPressures, ...llmPressures].map((pressure) => ({
      ...pressure,
      evidenceRefs: uniqueRefs(pressure.evidenceRefs),
    })),
    keyUncertainties,
    observableSignals,
    confidence: clampConfidence(averageNodeConfidence - uncertaintyPenalty),
  };
}
