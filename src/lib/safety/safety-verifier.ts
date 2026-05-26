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
    return "This scenario is paused for safety. MiroFish can keep the setup available, but it will not run simulation ticks, build claims, or expand report depth from this input.";
  }

  if (level === "downgraded") {
    return "This scenario touches a sensitive area, so MiroFish is using adjusted mode: relationship structure and low-risk communication options only, without strong claims or depth expansion.";
  }

  if (level === "caution") {
    return "This scenario can continue with careful wording. MiroFish will avoid certainty about outcomes or another person's private thoughts.";
  }

  return "Safety check passed for the local sandbox flow.";
}

function restrictionsFor(level: SafetyLevel, flags: SafetyFlag[]) {
  if (level === "blocked") {
    return [
      "Simulation ticks stay unavailable.",
      "Report claims stay unavailable.",
      "Full-depth and paid-depth access stay unavailable.",
      "Only setup revision and support paths remain available.",
    ];
  }

  if (level === "downgraded") {
    return [
      "High-risk strong claims are hidden.",
      "Only relationship structure and low-risk communication options are shown.",
      "Monitoring, revenge, coercion, medical, legal, investment, and therapy steps are not shown.",
      "Full-depth and paid-depth views cannot expand restricted content.",
    ];
  }

  if (flags.length) {
    return [
      "Deterministic wording is avoided.",
      "Reconciliation or final outcomes are not guaranteed.",
      "Claims remain evidence-linked and confidence-scored.",
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
