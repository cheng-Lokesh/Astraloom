import type {
  DestinyPersonModifier,
  GroundedRealityNode,
  GroundedRealityPressure,
  GroundedSimulationPathEvent,
} from "@/types/grounded-social-simulation";
import type { SeedContextDraft } from "@/types/seed-context";

import { clampConfidence, stableGroundedHash } from "./grounded-social-language";

function refsForNodes(nodes: GroundedRealityNode[]) {
  return Array.from(new Set(nodes.flatMap((node) => node.evidenceRefs)));
}

function topGroundedNodes(nodes: GroundedRealityNode[]) {
  const externalNodes = nodes.filter((node) => node.nodeType !== "user");
  return (externalNodes.length ? externalNodes : nodes).slice(0, 3);
}

function pressurePhrase(pressures: GroundedRealityPressure[]) {
  if (!pressures.length) return "Pressure remains broad because few grounded pressures exist.";

  const types = Array.from(new Set(pressures.slice(0, 3).map((pressure) => pressure.pressureType)));
  return `Pressure may shift around ${types.map((type) => type.replaceAll("_", " ")).join(", ")}.`;
}

export function simulateGroundedPaths({
  seedContext,
  realityNodes,
  realityPressures,
  destinyPersonModifier,
}: {
  seedContext: SeedContextDraft;
  realityNodes: GroundedRealityNode[];
  realityPressures: GroundedRealityPressure[];
  destinyPersonModifier: DestinyPersonModifier;
}) {
  const focusedNodes = topGroundedNodes(realityNodes);
  const nodeRefs = refsForNodes(focusedNodes);
  const pressureRefs = realityPressures.flatMap((pressure) => pressure.evidenceRefs);
  const evidenceRefs = Array.from(new Set([...nodeRefs, ...pressureRefs])).slice(0, 8);
  const baseConfidence = clampConfidence(
    Math.min(
      72,
      destinyPersonModifier.confidence,
      focusedNodes.reduce((sum, node) => sum + node.confidence, 0) /
        Math.max(1, focusedNodes.length),
    ),
  );
  const nodeIds = focusedNodes.map((node) => node.id);
  const primaryNode = focusedNodes[0]?.label ?? "the grounded situation";
  const pressureSummary = pressurePhrase(realityPressures);

  const pathEvents: GroundedSimulationPathEvent[] = [
    {
      id: `gpe_${stableGroundedHash(`${seedContext.id}:baseline:1`)}`,
      branchId: "baseline",
      step: 1,
      realityNodeIds: nodeIds,
      userAction: "Continue with the current visible pattern and observe the next concrete signal.",
      expectedRealityReaction: `${primaryNode} is expected to reveal more practical constraints or response timing through ordinary interaction.`,
      destinyModifierEffect: destinyPersonModifier.timingSensitivity,
      pressureChange: pressureSummary,
      informationChange: "Information improves only if the user receives a concrete response, deadline, offer, or boundary signal.",
      opportunityChange: "Opportunity stays conditional until a real node provides a clearer opening.",
      userFacingSummary: "Baseline path keeps the current situation moving while watching for observable signals.",
      evidenceRefs,
      confidence: baseConfidence,
    },
    {
      id: `gpe_${stableGroundedHash(`${seedContext.id}:cautious:2`)}`,
      branchId: "cautious_self",
      step: 2,
      realityNodeIds: nodeIds,
      userAction: "Ask for one missing piece of information or set one small reversible boundary.",
      expectedRealityReaction: "Grounded stakeholders or constraints should become clearer without requiring a high-risk commitment.",
      destinyModifierEffect: destinyPersonModifier.boundaryStyle,
      pressureChange: "Pressure may ease if ambiguity lowers, but may rise if the boundary exposes a real constraint.",
      informationChange: "Information gap should narrow around the most important unknown.",
      opportunityChange: "Opportunity quality improves only if the response creates a concrete next step.",
      userFacingSummary: "Cautious path tests reality with a small clarification move.",
      evidenceRefs,
      confidence: clampConfidence(baseConfidence - 4),
    },
    {
      id: `gpe_${stableGroundedHash(`${seedContext.id}:decisive:3`)}`,
      branchId: "decisive_self",
      step: 3,
      realityNodeIds: nodeIds,
      userAction: "Commit to the most realistic option that matches known resources and constraints.",
      expectedRealityReaction: "The grounded environment may respond faster, but hidden constraints become more costly if they were not clarified first.",
      destinyModifierEffect: `${destinyPersonModifier.decisionStyle} ${destinyPersonModifier.opportunityResponse}`,
      pressureChange: "Resource and timing pressure may rise because action makes tradeoffs visible.",
      informationChange: "Information becomes more concrete after commitment, but late discoveries may be harder to absorb.",
      opportunityChange: "Opportunity can open faster when a real opportunity source or resource holder is already grounded.",
      userFacingSummary: "Decisive path favors momentum, with confidence limited by current evidence.",
      evidenceRefs,
      confidence: clampConfidence(baseConfidence - 8),
    },
  ];

  return {
    pathEvents,
    simulationSummary:
      "Grounded Social Simulation V1 generated local rule-based paths from real-world nodes and pressures, then applied destiny only as a user-level reaction and timing modifier.",
  };
}
