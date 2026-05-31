import type {
  DestinyPersonModifier,
  GroundedRealityNode,
  GroundedRealityPressure,
  GroundedSimulationPathEvent,
} from "@/types/grounded-social-simulation";
import type { SeedContextDraft } from "@/types/seed-context";

import {
  clampConfidence,
  inferPrimaryGroundedDomain,
  stableGroundedHash,
  type GroundedDomain,
} from "./grounded-social-language";

type PathCopy = Pick<
  GroundedSimulationPathEvent,
  | "userAction"
  | "expectedRealityReaction"
  | "pressureChange"
  | "informationChange"
  | "opportunityChange"
  | "userFacingSummary"
>;

type PathCopyByBranch = {
  baseline: PathCopy;
  cautious_self: PathCopy;
  decisive_self: PathCopy;
  boundary_adjustment: PathCopy;
};

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

function groundedAnchor(nodes: GroundedRealityNode[], fallback: string) {
  const labels = nodes
    .filter((node) => node.nodeType !== "user")
    .slice(0, 2)
    .map((node) => node.label)
    .filter(Boolean);

  if (!labels.length) return fallback;
  if (labels.length === 1) return labels[0] ?? fallback;

  return `${labels[0]} and ${labels[1]}`;
}

function pressureTypes(pressures: GroundedRealityPressure[]) {
  return Array.from(new Set(pressures.map((pressure) => pressure.pressureType)));
}

function domainPathCopy({
  domain,
  anchor,
  pressures,
  lowInformation,
  genericPressureSummary,
}: {
  domain: GroundedDomain;
  anchor: string;
  pressures: GroundedRealityPressure[];
  lowInformation: boolean;
  genericPressureSummary: string;
}): PathCopyByBranch {
  const pressureSet = pressureTypes(pressures);
  const pressureList = pressureSet.length
    ? pressureSet.map((type) => type.replaceAll("_", " ")).join(", ")
    : "broad grounded pressure";
  const uncertaintyNote = lowInformation
    ? " Grounded evidence is still thin, so this branch stays conservative and should be treated as a low-confidence probe."
    : "";

  if (domain === "career") {
    return {
      baseline: {
        userAction:
          "Keep the current work track moving and watch for the next concrete workplace signal.",
        expectedRealityReaction: `${anchor} may clarify role scope, approval timing, recruiter deadline, market demand, or portfolio evidence only through observable work signals.`,
        pressureChange: `Career pressure stays tied to ${pressureList}, especially resource access, timing, and evaluation criteria.${uncertaintyNote}`,
        informationChange:
          "Information improves when a manager, recruiter, team, or market-facing signal becomes specific enough to compare.",
        opportunityChange:
          "Opportunity remains conditional until compensation, role scope, approval path, or external offer timing becomes concrete.",
        userFacingSummary:
          "Career baseline keeps the current work pattern visible while waiting for concrete approval, market, or timing evidence.",
      },
      cautious_self: {
        userAction:
          "Ask for one missing work signal, such as written timing, role scope, budget range, or decision deadline.",
        expectedRealityReaction: `${anchor} should either make the workplace constraint clearer or reveal that the approval path is still soft.`,
        pressureChange:
          "Resource pressure may ease if the work condition becomes explicit, but may rise if the request exposes a real budget or authority constraint.",
        informationChange:
          "Information gap narrows around promotion timing, hiring deadline, portfolio proof, or evaluation criteria.",
        opportunityChange:
          "Opportunity quality improves only if the work-side response creates a comparable next step.",
        userFacingSummary:
          "Career cautious path tests the job reality before committing more time or leverage.",
      },
      decisive_self: {
        userAction:
          "Commit to the most realistic work option based on known resources, deadlines, and evaluation signals.",
        expectedRealityReaction: `${anchor} may respond faster once the user chooses a work direction, but weak assumptions around budget, role scope, or market timing become costlier.`,
        pressureChange:
          "Career resource and timing pressure can rise because commitment makes tradeoffs with manager approval, recruiter timing, or market fit visible.",
        informationChange:
          "Information becomes concrete after action, while late discoveries about approval or fit are harder to absorb.",
        opportunityChange:
          "Opportunity can open faster when a grounded work node already controls access, budget, or external demand.",
        userFacingSummary:
          "Career decisive path favors momentum while keeping confidence limited by current workplace evidence.",
      },
      boundary_adjustment: {
        userAction:
          "Set a clearer work time box, written condition, or fallback option before the career situation drifts further.",
        expectedRealityReaction: `${anchor} needs to respond under clearer workplace conditions, such as deadline, scope, budget, or alternative-offer timing.`,
        pressureChange:
          "Resource pressure may become more manageable when the user defines acceptable terms and keeps a real fallback option available.",
        informationChange:
          "Information gap may narrow because the work node must react to clearer conditions instead of vague promotion, hiring, or market signals.",
        opportunityChange:
          "Opportunity becomes more comparable when the current role, outside option, or portfolio path can be weighed against the same time box.",
        userFacingSummary:
          "Career boundary path turns workplace uncertainty into testable timing, terms, and fallback evidence.",
      },
    };
  }

  if (domain === "relationship") {
    return {
      baseline: {
        userAction:
          "Continue the current communication rhythm and observe the next concrete response pattern.",
        expectedRealityReaction: `${anchor} may reveal more through reply timing, availability, consistency, or boundary response rather than assumed intent.`,
        pressureChange: `Relationship pressure stays tied to ${pressureList}, especially ambiguity, emotional load, and communication access.${uncertaintyNote}`,
        informationChange:
          "Information improves only when an observable response pattern changes, not from guessing private feelings.",
        opportunityChange:
          "Opportunity for repair or clarity stays conditional until the interaction produces a concrete next step.",
        userFacingSummary:
          "Relationship baseline watches the current dynamic without turning ambiguity into certainty.",
      },
      cautious_self: {
        userAction:
          "Send one low-pressure clarification or ask for one missing relationship signal.",
        expectedRealityReaction: `${anchor} should become clearer through an observable reply, delay, availability change, or respectful boundary response.`,
        pressureChange:
          "Emotional pressure may ease if ambiguity lowers, but may rise if the boundary exposes mismatch or avoidance.",
        informationChange:
          "Information gap narrows around communication consistency and mutual willingness to clarify.",
        opportunityChange:
          "Opportunity improves only if the response supports a concrete and respectful next interaction.",
        userFacingSummary:
          "Relationship cautious path tests ambiguity without escalating pressure.",
      },
      decisive_self: {
        userAction:
          "Choose the clearest relationship stance that matches observable behavior and personal boundaries.",
        expectedRealityReaction: `${anchor} may become less ambiguous after a clearer stance, but unresolved emotional pressure can surface faster.`,
        pressureChange:
          "Emotional and boundary pressure may rise because directness makes mismatch, readiness, or reciprocity more visible.",
        informationChange:
          "Information becomes more concrete after the stance is expressed, while late ambiguity may be harder to ignore.",
        opportunityChange:
          "Opportunity can open if both sides respond to clarity with consistent action rather than vague warmth.",
        userFacingSummary:
          "Relationship decisive path favors clarity while avoiding claims about hidden feelings.",
      },
      boundary_adjustment: {
        userAction:
          "Set a clearer communication boundary, time box, or step-back option before the relationship ambiguity drifts further.",
        expectedRealityReaction: `${anchor} needs to respond within clearer emotional and communication conditions instead of open-ended ambiguity.`,
        pressureChange:
          "Emotional pressure may become more manageable when the user defines what kind of contact, timing, or distance is acceptable.",
        informationChange:
          "Information gap may narrow because the response to a respectful boundary is observable.",
        opportunityChange:
          "Opportunity becomes more comparable when continued contact and stepping back can be weighed against the same boundary.",
        userFacingSummary:
          "Relationship boundary path turns ambiguity into observable communication conditions.",
      },
    };
  }

  if (domain === "collaboration") {
    return {
      baseline: {
        userAction:
          "Keep the collaboration conversation moving and watch for the next concrete delivery or budget signal.",
        expectedRealityReaction: `${anchor} may reveal whether client demand, partner reliability, role clarity, or benefit sharing is real.`,
        pressureChange: `Collaboration pressure stays tied to ${pressureList}, especially trust, resources, and coordination cost.${uncertaintyNote}`,
        informationChange:
          "Information improves when budget, ownership, role split, or delivery expectation becomes explicit.",
        opportunityChange:
          "Opportunity stays conditional until the collaboration has concrete terms and accountable next steps.",
        userFacingSummary:
          "Collaboration baseline observes whether the opportunity has enough structure to be trusted.",
      },
      cautious_self: {
        userAction:
          "Ask for one missing collaboration condition, such as budget, role split, delivery scope, or written responsibility.",
        expectedRealityReaction: `${anchor} should clarify whether the benefit boundary and execution responsibility are real.`,
        pressureChange:
          "Coordination pressure may ease if responsibilities become explicit, but may rise if the request exposes misaligned incentives.",
        informationChange:
          "Information gap narrows around trust, client confirmation, and practical workload.",
        opportunityChange:
          "Opportunity quality improves only if the collaboration creates a concrete and fair next step.",
        userFacingSummary:
          "Collaboration cautious path tests trust and benefit boundaries before deeper commitment.",
      },
      decisive_self: {
        userAction:
          "Commit to the collaboration only if known client, partner, and resource signals support execution.",
        expectedRealityReaction: `${anchor} may move faster after commitment, but unclear roles or benefits become harder to renegotiate.`,
        pressureChange:
          "Resource and trust pressure may rise because action makes delivery responsibility and benefit sharing visible.",
        informationChange:
          "Information becomes concrete after commitment, while missing budget or ownership details become costlier.",
        opportunityChange:
          "Opportunity can open faster when a grounded client, partner, or project source already confirms demand.",
        userFacingSummary:
          "Collaboration decisive path favors momentum with evidence-limited trust.",
      },
      boundary_adjustment: {
        userAction:
          "Set a clearer role boundary, benefit condition, or alternative delivery option before the collaboration drifts.",
        expectedRealityReaction: `${anchor} needs to respond under clearer terms for scope, ownership, budget, or responsibility.`,
        pressureChange:
          "Resource pressure may become more manageable when roles and fallback options are defined before execution starts.",
        informationChange:
          "Information gap may narrow because unclear partners or clients must respond to concrete conditions.",
        opportunityChange:
          "Opportunity becomes more comparable when the project can be weighed against an alternative use of time and capacity.",
        userFacingSummary:
          "Collaboration boundary path converts a loose opportunity into testable terms.",
      },
    };
  }

  if (domain === "family") {
    return {
      baseline: {
        userAction:
          "Continue the current family pattern and observe the next concrete request, support signal, or expectation.",
        expectedRealityReaction: `${anchor} may reveal how obligation, support, and timing pressure repeat in ordinary family interaction.`,
        pressureChange: `Family pressure stays tied to ${pressureList}, especially obligation, support availability, and time load.${uncertaintyNote}`,
        informationChange:
          "Information improves when expectations, support capacity, or scheduling limits become explicit.",
        opportunityChange:
          "Opportunity for a healthier arrangement stays conditional until family support or responsibility sharing becomes concrete.",
        userFacingSummary:
          "Family baseline watches whether the existing obligation pattern becomes clearer.",
      },
      cautious_self: {
        userAction:
          "Ask for one practical family clarification or propose one small reversible boundary.",
        expectedRealityReaction: `${anchor} should make support availability, expectation, or timing pressure clearer.`,
        pressureChange:
          "Obligation pressure may ease if the boundary is accepted, but may rise if expectations were more rigid than visible.",
        informationChange:
          "Information gap narrows around who can help, when, and under what condition.",
        opportunityChange:
          "Opportunity improves only if the family system creates a concrete support or scheduling option.",
        userFacingSummary:
          "Family cautious path tests support and expectation without severing connection.",
      },
      decisive_self: {
        userAction:
          "Choose the family arrangement that best protects known resources while preserving realistic connection.",
        expectedRealityReaction: `${anchor} may respond faster once the user states the arrangement, but unmet expectations can become visible.`,
        pressureChange:
          "Family pressure may rise because clear action exposes obligation, guilt, or support limits.",
        informationChange:
          "Information becomes more concrete after the arrangement is stated, while hidden expectations may be harder to absorb.",
        opportunityChange:
          "Opportunity can open if support roles become explicit enough to share load.",
        userFacingSummary:
          "Family decisive path favors a clear arrangement while keeping the evidence chain grounded.",
      },
      boundary_adjustment: {
        userAction:
          "Set a clearer family time box, support boundary, or shared-load alternative before obligation expands.",
        expectedRealityReaction: `${anchor} needs to respond under clearer limits for time, care, money, or responsibility sharing.`,
        pressureChange:
          "Obligation pressure may become more manageable when the user defines availability and alternative support routes.",
        informationChange:
          "Information gap may narrow because family members must respond to clearer limits rather than assumed availability.",
        opportunityChange:
          "Opportunity becomes more comparable when connection, support, and protected time are weighed together.",
        userFacingSummary:
          "Family boundary path turns obligation pressure into explicit support and time conditions.",
      },
    };
  }

  if (domain === "migration") {
    return {
      baseline: {
        userAction:
          "Keep gathering relocation signals and observe the next concrete city, visa, market, housing, or family timing update.",
        expectedRealityReaction: `${anchor} may clarify whether policy timing, local market fit, or family logistics are the main constraint.`,
        pressureChange: `Migration pressure stays tied to ${pressureList}, especially timing, institutional rules, market fit, and logistics.${uncertaintyNote}`,
        informationChange:
          "Information improves when a visa rule, city condition, job market signal, housing fact, or family constraint becomes explicit.",
        opportunityChange:
          "Opportunity stays conditional until relocation options can be compared on the same practical timeline.",
        userFacingSummary:
          "Migration baseline keeps relocation evidence visible without forcing an early conclusion.",
      },
      cautious_self: {
        userAction:
          "Ask for one missing relocation fact, such as policy timing, market requirement, housing cost, or family constraint.",
        expectedRealityReaction: `${anchor} should make the relocation bottleneck more visible without requiring an irreversible move.`,
        pressureChange:
          "Timing pressure may ease if the next requirement is explicit, but may rise if policy or logistics are tighter than expected.",
        informationChange:
          "Information gap narrows around city fit, visa timing, market access, or family coordination.",
        opportunityChange:
          "Opportunity quality improves only if the relocation path creates a concrete next step.",
        userFacingSummary:
          "Migration cautious path tests the relocation bottleneck before committing.",
      },
      decisive_self: {
        userAction:
          "Commit to the relocation option that best matches known policy, market, family, and timing constraints.",
        expectedRealityReaction: `${anchor} may move faster after a city or path is chosen, but unresolved visa, market, or family constraints become costlier.`,
        pressureChange:
          "Migration pressure may rise because commitment makes policy deadlines, local market fit, and logistics visible.",
        informationChange:
          "Information becomes concrete after choosing a path, while late policy or housing discoveries are harder to absorb.",
        opportunityChange:
          "Opportunity can open faster when a grounded city, employer, institution, or family support node is already available.",
        userFacingSummary:
          "Migration decisive path favors movement while staying limited by current relocation evidence.",
      },
      boundary_adjustment: {
        userAction:
          "Set a clearer relocation time box, required condition, or backup city/path before the situation drifts.",
        expectedRealityReaction: `${anchor} needs to respond under clearer conditions for visa timing, market proof, housing, or family logistics.`,
        pressureChange:
          "Resource and timing pressure may become more manageable when the user defines move/no-move conditions and a backup option.",
        informationChange:
          "Information gap may narrow because relocation nodes must be tested against explicit requirements.",
        opportunityChange:
          "Opportunity becomes more comparable when city, visa, market, and family options share one decision window.",
        userFacingSummary:
          "Migration boundary path turns relocation uncertainty into explicit timing and backup conditions.",
      },
    };
  }

  if (domain === "study") {
    return {
      baseline: {
        userAction:
          "Keep the current study path visible and observe the next concrete school, advisor, credential, or deadline signal.",
        expectedRealityReaction: `${anchor} may clarify requirements through deadlines, assessment criteria, advisor feedback, or credential constraints.`,
        pressureChange: `Study pressure stays tied to ${pressureList}, especially deadlines, standards, and qualification gaps.${uncertaintyNote}`,
        informationChange:
          "Information improves when requirements, feedback, course load, or application timing becomes explicit.",
        opportunityChange:
          "Opportunity stays conditional until the credential or program path has a concrete next step.",
        userFacingSummary:
          "Study baseline watches for institutional and credential evidence before overcommitting.",
      },
      cautious_self: {
        userAction:
          "Ask for one missing study signal, such as advisor feedback, deadline detail, credential requirement, or workload estimate.",
        expectedRealityReaction: `${anchor} should clarify whether the study path is blocked by standards, timing, or missing preparation.`,
        pressureChange:
          "Deadline pressure may ease if the requirement is explicit, but may rise if the credential gap is larger than visible.",
        informationChange:
          "Information gap narrows around application timing, advisor expectations, and qualification requirements.",
        opportunityChange:
          "Opportunity improves only if the school, advisor, or credential path creates a concrete next step.",
        userFacingSummary:
          "Study cautious path tests requirements before committing more time or money.",
      },
      decisive_self: {
        userAction:
          "Commit to the study option that best matches known deadlines, preparation level, and credential value.",
        expectedRealityReaction: `${anchor} may move faster after a study choice, but unclear requirements or workload become costlier.`,
        pressureChange:
          "Study pressure may rise because commitment makes deadline, credential, and preparation tradeoffs visible.",
        informationChange:
          "Information becomes concrete after choosing a path, while late advisor or requirement feedback is harder to absorb.",
        opportunityChange:
          "Opportunity can open faster when the grounded school, advisor, or credential node already offers a viable path.",
        userFacingSummary:
          "Study decisive path favors progress with confidence limited by current requirement evidence.",
      },
      boundary_adjustment: {
        userAction:
          "Set a clearer study time box, requirement threshold, or backup program/path before the plan drifts.",
        expectedRealityReaction: `${anchor} needs to respond under clearer conditions for deadline, credential value, workload, or advisor feedback.`,
        pressureChange:
          "Deadline and resource pressure may become more manageable when the user defines application conditions and a backup path.",
        informationChange:
          "Information gap may narrow because study requirements are tested against explicit thresholds.",
        opportunityChange:
          "Opportunity becomes more comparable when programs, credentials, and backup paths share one decision window.",
        userFacingSummary:
          "Study boundary path turns vague aspiration into testable deadlines and requirements.",
      },
    };
  }

  const baseSummary = domain === "self_direction"
    ? "Personal direction pressure stays centered on priorities, timing, and decision bandwidth."
    : genericPressureSummary;

  return {
    baseline: {
      userAction:
        "Continue with the current visible pattern and observe the next concrete signal.",
      expectedRealityReaction: `${anchor} is expected to reveal more practical constraints or response timing through ordinary interaction.`,
      pressureChange: `${baseSummary}${uncertaintyNote}`,
      informationChange:
        "Information improves only if the user receives a concrete response, deadline, offer, or boundary signal.",
      opportunityChange:
        "Opportunity stays conditional until a real node provides a clearer opening.",
      userFacingSummary:
        "Baseline path keeps the current situation moving while watching for observable signals.",
    },
    cautious_self: {
      userAction:
        "Ask for one missing piece of information or set one small reversible boundary.",
      expectedRealityReaction:
        "Grounded stakeholders or constraints should become clearer without requiring a high-risk commitment.",
      pressureChange:
        "Pressure may ease if ambiguity lowers, but may rise if the boundary exposes a real constraint.",
      informationChange: "Information gap should narrow around the most important unknown.",
      opportunityChange:
        "Opportunity quality improves only if the response creates a concrete next step.",
      userFacingSummary: "Cautious path tests reality with a small clarification move.",
    },
    decisive_self: {
      userAction:
        "Commit to the most realistic option that matches known resources and constraints.",
      expectedRealityReaction:
        "The grounded environment may respond faster, but hidden constraints become more costly if they were not clarified first.",
      pressureChange: "Resource and timing pressure may rise because action makes tradeoffs visible.",
      informationChange:
        "Information becomes more concrete after commitment, but late discoveries may be harder to absorb.",
      opportunityChange:
        "Opportunity can open faster when a real opportunity source or resource holder is already grounded.",
      userFacingSummary: "Decisive path favors momentum, with confidence limited by current evidence.",
    },
    boundary_adjustment: {
      userAction:
        "Set a clearer time box, boundary, or alternative option before the situation drifts further.",
      expectedRealityReaction: `${anchor} is expected to respond under clearer timing, boundary, or alternative-option conditions instead of relying on open-ended waiting.`,
      pressureChange:
        "Resource pressure may become more manageable when the user defines what is acceptable, by when, and what alternative stays available.",
      informationChange:
        "Information gap may narrow because grounded nodes need to react to clearer conditions rather than vague drift.",
      opportunityChange:
        "Opportunity becomes more comparable when the current path is weighed against a real alternative option.",
      userFacingSummary:
        "Boundary adjustment path turns uncertainty into a testable time box, condition, or alternative without forcing an outcome.",
    },
  };
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
  const externalNodeCount = realityNodes.filter((node) => node.nodeType !== "user").length;
  const domainInference = inferPrimaryGroundedDomain({
    seedContext,
    realityNodes,
    realityPressures,
  });
  const nodeRefs = refsForNodes(focusedNodes);
  const pressureRefs = realityPressures.flatMap((pressure) => pressure.evidenceRefs);
  const evidenceRefs = Array.from(new Set([...nodeRefs, ...pressureRefs])).slice(0, 8);
  const baseConfidence = clampConfidence(
    Math.min(
      72,
      destinyPersonModifier.confidence,
      domainInference.confidence,
      externalNodeCount > 0 ? 72 : 52,
      focusedNodes.reduce((sum, node) => sum + node.confidence, 0) /
        Math.max(1, focusedNodes.length),
    ),
  );
  const nodeIds = focusedNodes.map((node) => node.id);
  const primaryNode = groundedAnchor(focusedNodes, "the grounded situation");
  const pressureSummary = pressurePhrase(realityPressures);
  const lowInformation =
    externalNodeCount === 0 ||
    domainInference.domain === "other" ||
    domainInference.confidence < 50 ||
    evidenceRefs.length <= 1;
  const copy = domainPathCopy({
    domain: domainInference.domain,
    anchor: primaryNode,
    pressures: realityPressures,
    lowInformation,
    genericPressureSummary: pressureSummary,
  });

  const pathEvents: GroundedSimulationPathEvent[] = [
    {
      id: `gpe_${stableGroundedHash(`${seedContext.id}:baseline:1`)}`,
      branchId: "baseline",
      step: 1,
      realityNodeIds: nodeIds,
      userAction: copy.baseline.userAction,
      expectedRealityReaction: copy.baseline.expectedRealityReaction,
      destinyModifierEffect: destinyPersonModifier.timingSensitivity,
      pressureChange: copy.baseline.pressureChange,
      informationChange: copy.baseline.informationChange,
      opportunityChange: copy.baseline.opportunityChange,
      userFacingSummary: copy.baseline.userFacingSummary,
      evidenceRefs,
      confidence: baseConfidence,
    },
    {
      id: `gpe_${stableGroundedHash(`${seedContext.id}:cautious:2`)}`,
      branchId: "cautious_self",
      step: 2,
      realityNodeIds: nodeIds,
      userAction: copy.cautious_self.userAction,
      expectedRealityReaction: copy.cautious_self.expectedRealityReaction,
      destinyModifierEffect: destinyPersonModifier.boundaryStyle,
      pressureChange: copy.cautious_self.pressureChange,
      informationChange: copy.cautious_self.informationChange,
      opportunityChange: copy.cautious_self.opportunityChange,
      userFacingSummary: copy.cautious_self.userFacingSummary,
      evidenceRefs,
      confidence: clampConfidence(baseConfidence - 4),
    },
    {
      id: `gpe_${stableGroundedHash(`${seedContext.id}:decisive:3`)}`,
      branchId: "decisive_self",
      step: 3,
      realityNodeIds: nodeIds,
      userAction: copy.decisive_self.userAction,
      expectedRealityReaction: copy.decisive_self.expectedRealityReaction,
      destinyModifierEffect: `${destinyPersonModifier.decisionStyle} ${destinyPersonModifier.opportunityResponse}`,
      pressureChange: copy.decisive_self.pressureChange,
      informationChange: copy.decisive_self.informationChange,
      opportunityChange: copy.decisive_self.opportunityChange,
      userFacingSummary: copy.decisive_self.userFacingSummary,
      evidenceRefs,
      confidence: clampConfidence(baseConfidence - 8),
    },
    {
      id: `gpe_${stableGroundedHash(`${seedContext.id}:boundary_adjustment:4`)}`,
      branchId: "boundary_adjustment",
      step: 4,
      realityNodeIds: nodeIds,
      userAction: copy.boundary_adjustment.userAction,
      expectedRealityReaction: copy.boundary_adjustment.expectedRealityReaction,
      destinyModifierEffect: `${destinyPersonModifier.boundaryStyle} ${destinyPersonModifier.timingSensitivity}`,
      pressureChange: copy.boundary_adjustment.pressureChange,
      informationChange: copy.boundary_adjustment.informationChange,
      opportunityChange: copy.boundary_adjustment.opportunityChange,
      userFacingSummary: copy.boundary_adjustment.userFacingSummary,
      evidenceRefs: Array.from(new Set([...nodeRefs, ...evidenceRefs])).slice(0, 8),
      confidence: clampConfidence(baseConfidence - 10),
    },
  ];

  return {
    pathEvents,
    simulationSummary:
      "Grounded Social Simulation V1 generated local rule-based paths from real-world nodes and pressures, then applied destiny only as a user-level reaction and timing modifier.",
  };
}
