import {
  blockedAllowedActions,
  downgradedAllowedActions,
  generationActions,
  safeAllowedActions,
  safetyRules,
} from "./safety-rules";
import { getSeedContextNarrative } from "@/lib/seed-context/context-text";
import type {
  SafetyDecision,
  SafetyFlag,
  SafetyLevel,
  SafetyVerifierInput,
} from "./safety-types";

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function maxLevel(levels: SafetyLevel[]) {
  if (levels.includes("blocked")) return "blocked";
  if (levels.includes("downgraded")) return "downgraded";
  if (levels.includes("caution")) return "caution";
  return "safe";
}

function buildSearchText(input: SafetyVerifierInput) {
  const seed = input.seedContext;
  const claimText = input.claims
    ?.map((claim) => `${claim.summary} ${claim.safetyNotes.join(" ")}`)
    .join("\n");
  const agentText = input.agents
    ?.map((agent) => {
      return [
        agent.label,
        agent.role,
        agent.relationshipToUser,
        agent.profileJson.motivation.primaryGoal,
        agent.profileJson.motivation.fear,
        agent.profileJson.state.currentIntention,
      ].join(" ");
    })
    .join("\n");
  const relationText = input.relationEdges
    ?.map((edge) => `${edge.relationshipType} ${edge.lastInteraction.summary}`)
    .join("\n");
  const eventText = input.simulationRun?.events
    .map((event) => event.summary)
    .join("\n");

  return [
    getSeedContextNarrative(seed),
    claimText,
    agentText,
    relationText,
    eventText,
  ]
    .filter(Boolean)
    .join("\n");
}

function messageFor(level: SafetyLevel) {
  if (level === "blocked") {
    return "This situation includes safety-critical content, so MiroFish stops simulation and report generation here. The sandbox can only show a safety notice and support paths.";
  }

  if (level === "downgraded") {
    return "This situation touches a sensitive area. MiroFish will stay in a downgraded mode: relationship structure and low-risk communication options only, without strong claims or unlock expansion.";
  }

  if (level === "caution") {
    return "This situation can continue, but MiroFish will keep non-deterministic wording and avoid certainty about outcomes or another person's private thoughts.";
  }

  return "Safety check passed for the local sandbox flow.";
}

function restrictionsFor(level: SafetyLevel, flags: SafetyFlag[]) {
  if (level === "blocked") {
    return [
      "Do not run simulation ticks.",
      "Do not render report claims.",
      "Do not start paid unlock.",
      "Show SafetyDowngradeNotice instead.",
    ];
  }

  if (level === "downgraded") {
    return [
      "Hide high-risk strong claims.",
      "Show only relationship structure and low-risk communication options.",
      "Do not provide monitoring, revenge, coercion, medical, legal, investment, or therapy steps.",
      "Do not expand restricted content through paid unlock.",
    ];
  }

  if (flags.length) {
    return [
      "Avoid deterministic fate language.",
      "Do not guarantee reconciliation or final outcomes.",
      "Keep claims evidence-linked and probabilistic.",
    ];
  }

  return [];
}

export function verifySafety(input: SafetyVerifierInput): SafetyDecision {
  const searchText = buildSearchText(input);
  const hits = safetyRules.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(searchText)),
  );
  const flags = unique(hits.map((hit) => hit.flag));
  const safetyLevel = maxLevel(["safe", ...hits.map((hit) => hit.level)]);
  const allowedActions =
    safetyLevel === "blocked"
      ? blockedAllowedActions
      : safetyLevel === "downgraded"
        ? downgradedAllowedActions
        : safeAllowedActions;
  const blockedActions =
    safetyLevel === "safe" || safetyLevel === "caution"
      ? []
      : generationActions.filter((action) => !allowedActions.includes(action));

  return {
    safetyLevel,
    flags,
    userMessage: messageFor(safetyLevel),
    allowedActions,
    blockedActions,
    reportRestrictions: restrictionsFor(safetyLevel, flags),
  };
}

export function shouldBlockAction(
  decision: SafetyDecision,
  action: string,
) {
  return decision.blockedActions.includes(action);
}

export function filterClaimsBySafety<TClaim extends { riskLevel: string }>(
  claims: TClaim[],
  decision: SafetyDecision,
) {
  if (decision.safetyLevel === "blocked") {
    return [];
  }

  if (decision.safetyLevel === "downgraded") {
    return claims.filter((claim) => claim.riskLevel !== "high");
  }

  return claims;
}
