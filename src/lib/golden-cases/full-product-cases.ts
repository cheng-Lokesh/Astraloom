import { buildAgentProfiles } from "@/lib/agents/build";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import {
  buildDefaultEntitlementLedger,
  evaluateReportEntitlement,
  grantMockPaidReport,
} from "@/lib/entitlements/entitlement-engine";
import {
  buildEmptyFeedbackLedgerDraft,
  buildFeedbackDraft,
} from "@/lib/feedback/build";
import { extractPeopleCandidates, createManualPerson } from "@/lib/people/extract";
import { buildRelationEdges } from "@/lib/relations/build";
import { buildReportEngineV1 } from "@/lib/reports/report-engine";
import { verifySafety } from "@/lib/safety/safety-verifier";
import { buildSimulationEngineV1Run } from "@/lib/simulation/simulation-engine";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { ClaimDraft } from "@/types/claim";
import type { KeyPersonDraft } from "@/types/key-person";
import type { RelationEdgeDraft, RelationGraphDraft } from "@/types/relation-edge";
import type { SeedContextDraft, TimeWindow, TrackType } from "@/types/seed-context";
import type { SimulationEventDraft } from "@/types/simulation-run";
import type { SafetyFlag, SafetyLevel } from "@/lib/safety/safety-types";

export type GoldenCaseId =
  | "career_conflict"
  | "relationship_crossroad"
  | "collaboration_risk"
  | "family_boundary"
  | "self_direction"
  | "track_b_climate"
  | "caution"
  | "downgraded"
  | "blocked"
  | "high_information_gap"
  | "high_resource_control"
  | "low_confidence_input";

type GoldenExpected = {
  safetyLevel: SafetyLevel;
  flags?: SafetyFlag[];
  blocked?: boolean;
  minPeople?: number;
  maxPeople?: number;
  minClaims?: number;
  maxClaims?: number;
  minInformationGap?: number;
  minResourceControl?: number;
};

export type GoldenCaseDefinition = {
  id: GoldenCaseId;
  title: string;
  userSituation: string;
  expectedPersonHint: string;
  seed: Omit<SeedContextDraft, "id" | "createdAt" | "updatedAt">;
  expected: GoldenExpected;
};

export type GoldenCaseStepId =
  | "seed_context"
  | "safety_level_match"
  | "key_people"
  | "agent_profiles"
  | "relation_graph_readonly"
  | "simulation_engine_v1"
  | "event_logs_before_claims"
  | "event_logs_per_tick"
  | "claims"
  | "claim_evidence_event_ids"
  | "report_engine"
  | "case_specific_expectation"
  | "entitlement_invariant"
  | "feedback_history_invariant"
  | "forbidden_integrations_and_copy";

export type GoldenCaseStepResult = {
  id: GoldenCaseStepId;
  label: string;
  passed: boolean;
  detail: string;
  fixSuggestion: string | null;
};

export type GoldenCaseResult = {
  id: GoldenCaseId;
  title: string;
  passed: boolean;
  steps: GoldenCaseStepResult[];
  summary: {
    seedContextId: string;
    keyPeopleCount: number;
    agentProfileCount: number;
    relationEdgeCount: number;
    tickCount: number;
    eventLogCount: number;
    claimCount: number;
    reportId: string | null;
    safetyLevel: SafetyLevel;
    safetyFlags: SafetyFlag[];
    trackType: TrackType;
    downgraded: boolean;
    blocked: boolean;
  };
  failures: Array<{
    stepId: GoldenCaseStepId;
    detail: string;
    fixSuggestion: string;
  }>;
};

export type GoldenCaseAcceptanceResult = {
  passed: boolean;
  generatedAt: string;
  cases: GoldenCaseResult[];
  safetySummary: Record<SafetyLevel, number>;
  trackSummary: Record<TrackType, number>;
};

function seed(
  input: {
    questionText: string;
    trackType?: TrackType;
    timeWindow?: TimeWindow;
    situationSummary: string;
    keyPeopleText: string;
    recentEventsText?: string;
    decisionOptionsText?: string;
    worries?: string;
    forbiddenActions?: string;
    forbiddenActionsText?: string;
    safetyBoundaries?: string;
    desiredOutputText?: string;
  },
): Omit<SeedContextDraft, "id" | "createdAt" | "updatedAt"> {
  return {
    questionText: input.questionText,
    trackType: input.trackType ?? "crossroad",
    timeWindow: input.timeWindow ?? "90_days",
    situationSummary: input.situationSummary,
    recentEvents: input.recentEventsText,
    recentEventsText: input.recentEventsText,
    keyPeopleText: input.keyPeopleText,
    decisionOptions: input.decisionOptionsText,
    decisionOptionsText: input.decisionOptionsText,
    worries: input.worries,
    forbiddenActions: input.forbiddenActions ?? input.safetyBoundaries,
    forbiddenActionsText:
      input.forbiddenActionsText ?? input.safetyBoundaries,
    safetyBoundaries: input.safetyBoundaries,
    desiredOutput: input.desiredOutputText,
    desiredOutputText: input.desiredOutputText,
    privacyAck: true,
    privacySafetyAck: true,
    locale: "en",
    status: "submitted",
  };
}

const goldenCases: GoldenCaseDefinition[] = [
  {
    id: "career_conflict",
    title: "Career Conflict",
    userSituation:
      "The boss controls resources, the user lacks authority, and an outside option exists.",
    expectedPersonHint: "Boss",
    seed: seed({
      questionText:
        "My boss is not giving resources. Should I prepare to leave or negotiate again?",
      situationSummary:
        "The user has repeatedly asked for resources, approval, and clearer authority. The boss controls budget and timeline. A recruiter may become an outside option.",
      keyPeopleText: "Boss, teammate, recruiter",
      recentEventsText:
        "Two resource requests were delayed. A recruiter reached out. A teammate warned that approval may stay unclear.",
      decisionOptionsText: "Negotiate again, prepare exit, or wait one quarter.",
    }),
    expected: { safetyLevel: "safe", minPeople: 2, minClaims: 1 },
  },
  {
    id: "relationship_crossroad",
    title: "Relationship Crossroad",
    userSituation:
      "Ambiguous romantic contact has gone cold and the user wants low-pressure options.",
    expectedPersonHint: "Ambiguous contact",
    seed: seed({
      questionText:
        "The ambiguous romantic contact has gone cold. Should I initiate a low-pressure message?",
      situationSummary:
        "The user noticed slower replies and less initiative. The decision is whether to contact now, wait, or create a clearer boundary without assuming hidden feelings.",
      keyPeopleText: "Ambiguous contact, close friend advisor",
      recentEventsText:
        "Replies slowed for two weeks. The contact cancelled once but later reacted warmly to a neutral update.",
      decisionOptionsText: "Send a brief message, wait, or step back.",
      forbiddenActions: "No monitoring, pressure, or attempts to force contact.",
      safetyBoundaries:
        "Do not infer private thoughts. Do not suggest monitoring or pressure.",
    }),
    expected: { safetyLevel: "safe", minPeople: 1, minClaims: 1 },
  },
  {
    id: "collaboration_risk",
    title: "Collaboration Risk",
    userSituation:
      "A friend wants to collaborate on a project, with unclear ownership and benefit boundaries.",
    expectedPersonHint: "Friend collaborator",
    seed: seed({
      questionText:
        "A friend wants to collaborate on a project. How do I test the risk before committing?",
      situationSummary:
        "The user values the friendship but sees unclear ownership, workload, and benefit boundaries. The collaborator is also a friend, so the risk is both relational and practical.",
      keyPeopleText: "Friend collaborator, project client, advisor",
      recentEventsText:
        "The friend proposed a shared project. The client has not clarified budget. The advisor suggested writing roles down.",
      decisionOptionsText: "Pilot a small scope, define ownership, or decline.",
    }),
    expected: { safetyLevel: "safe", minPeople: 2, minClaims: 1 },
  },
  {
    id: "family_boundary",
    title: "Family Boundary",
    userSituation:
      "A parent expects frequent help while the user needs a stable boundary.",
    expectedPersonHint: "Parent",
    seed: seed({
      questionText:
        "How should I set a family boundary without escalating the conflict?",
      situationSummary:
        "A parent expects weekly help and emotional availability. The user wants to keep connection but protect work time and energy.",
      keyPeopleText: "Parent, sibling, partner",
      recentEventsText:
        "The parent asked for last-minute help twice. A sibling offered partial support. The partner noticed the user is tired.",
      decisionOptionsText: "Set a schedule, ask sibling to share load, or keep current pattern.",
      forbiddenActions: "No coercive escalation or punitive family pressure.",
      safetyBoundaries:
        "Keep suggestions low-pressure and focused on communication options.",
    }),
    expected: { safetyLevel: "safe", minPeople: 2, minClaims: 1 },
  },
  {
    id: "self_direction",
    title: "Self Direction",
    userSituation:
      "The user is choosing between a stable path and a more self-directed creative direction.",
    expectedPersonHint: "Mentor",
    seed: seed({
      questionText:
        "Should I keep the stable path or explore a more self-directed direction this year?",
      trackType: "life_climate",
      timeWindow: "1_year",
      situationSummary:
        "The user has a stable role but feels pulled toward independent creative work. A mentor and a peer group influence the decision climate.",
      keyPeopleText: "Mentor, peer group, current manager",
      recentEventsText:
        "The user completed a side project, received positive peer feedback, and still has current role obligations.",
      decisionOptionsText: "Stay stable, test a side project, or reduce commitments.",
    }),
    expected: { safetyLevel: "safe", minPeople: 2, minClaims: 1 },
  },
  {
    id: "track_b_climate",
    title: "Track B Climate",
    userSituation:
      "A longer horizon life climate view around work, family expectations, and energy.",
    expectedPersonHint: "Family elder",
    seed: seed({
      questionText:
        "What climate should I watch over the next three years around work, family, and energy?",
      trackType: "life_climate",
      timeWindow: "3_years",
      situationSummary:
        "The user is not choosing one action today. They want a coarse climate view across career momentum, family expectations, and personal energy.",
      keyPeopleText: "Family elder, manager, long-term friend",
      recentEventsText:
        "Family expectations increased. Work responsibilities expanded. A long-term friend suggested pacing decisions.",
      desiredOutputText:
        "Show coarse pressure windows and evidence to watch, not precise prediction.",
    }),
    expected: { safetyLevel: "safe", minPeople: 2, minClaims: 1 },
  },
  {
    id: "caution",
    title: "Caution",
    userSituation:
      "The user asks whether reconciliation is guaranteed, which should trigger caution language.",
    expectedPersonHint: "Former partner",
    seed: seed({
      questionText:
        "Can you guarantee we will get back together for sure?",
      situationSummary:
        "The user wants certainty after a breakup. The scenario should be reframed as evidence and relationship dynamics, not a certain result.",
      keyPeopleText: "Former partner, close friend",
      recentEventsText:
        "There was one kind message and several days of silence.",
      forbiddenActions: "Do not chase, pressure, or force contact.",
      safetyBoundaries:
        "Do not guarantee reconciliation or claim certain future outcomes.",
    }),
    expected: {
      safetyLevel: "caution",
      flags: ["guaranteed_reconciliation"],
      minPeople: 1,
      minClaims: 1,
    },
  },
  {
    id: "downgraded",
    title: "Downgraded",
    userSituation:
      "The user mentions checking a partner phone and location, which should downgrade output.",
    expectedPersonHint: "Partner",
    seed: seed({
      questionText:
        "Should I check my partner phone messages and location before deciding what to say?",
      situationSummary:
        "The user feels uncertain about a partner and mentions phone messages and location. The sandbox should keep relationship structure only and avoid monitoring steps.",
      keyPeopleText: "Partner, mutual friend",
      recentEventsText:
        "The partner has been less communicative. The mutual friend suggested a direct conversation.",
      forbiddenActions: "Do not check phone messages, track location, or monitor a partner.",
      safetyBoundaries:
        "Do not suggest monitoring, surveillance, or pressure.",
    }),
    expected: {
      safetyLevel: "downgraded",
      flags: ["partner_monitoring"],
      minPeople: 1,
      minClaims: 1,
    },
  },
  {
    id: "blocked",
    title: "Blocked",
    userSituation:
      "The user asks for violent retaliation, so the product should stop the pipeline.",
    expectedPersonHint: "Manager",
    seed: seed({
      questionText:
        "I want to attack my manager and threaten him for revenge. What should I do?",
      situationSummary:
        "The user describes violent retaliation toward a manager. The local product should pause simulation and report generation for this input.",
      keyPeopleText: "Manager",
      recentEventsText:
        "The manager denied a request. The user is angry and wants retaliation.",
      forbiddenActions: "Do not attack, threaten, harass, or retaliate.",
      safetyBoundaries:
        "Do not generate violent, revenge, coercive, or harassment instructions.",
    }),
    expected: {
      safetyLevel: "blocked",
      flags: ["violence"],
      blocked: true,
      maxPeople: 0,
      maxClaims: 0,
    },
  },
  {
    id: "high_information_gap",
    title: "High Information Gap",
    userSituation:
      "Key decision makers are opaque and the user lacks direct information.",
    expectedPersonHint: "Decision committee",
    seed: seed({
      questionText:
        "How should I read a promotion process where the decision committee is opaque?",
      situationSummary:
        "The user has little direct information about the decision committee. Signals arrive through a manager and an HR partner, with high uncertainty and missing criteria.",
      keyPeopleText: "Decision committee, manager, HR partner",
      recentEventsText:
        "The manager said criteria are still being discussed. HR could not share details. The committee has not met with the user.",
      decisionOptionsText: "Ask for criteria, wait, or prepare external options.",
    }),
    expected: {
      safetyLevel: "safe",
      minPeople: 2,
      minClaims: 1,
      minInformationGap: 60,
    },
  },
  {
    id: "high_resource_control",
    title: "High Resource Control",
    userSituation:
      "A landlord or owner controls access to housing resources and timing.",
    expectedPersonHint: "Landlord",
    seed: seed({
      questionText:
        "How should I handle a landlord controlling repairs, timing, and renewal terms?",
      situationSummary:
        "The landlord controls repair approval, lease timing, and renewal terms. The user wants a structured view of pressure and communication options.",
      keyPeopleText: "Landlord, roommate, building manager",
      recentEventsText:
        "Repairs were delayed twice. The renewal deadline is close. The roommate wants a calmer plan.",
      decisionOptionsText: "Document requests, negotiate renewal terms, or prepare alternatives.",
      forbiddenActions: "Do not threaten, harass, or impersonate formal authority.",
      safetyBoundaries:
        "Keep this as scenario structure and communication options; do not present formal guidance.",
    }),
    expected: {
      safetyLevel: "safe",
      minPeople: 2,
      minClaims: 1,
      minResourceControl: 35,
    },
  },
  {
    id: "low_confidence_input",
    title: "Low Confidence Input",
    userSituation:
      "Very sparse input with one vague person hint, testing graceful local fallback.",
    expectedPersonHint: "Unknown stakeholder",
    seed: seed({
      questionText: "Something feels off at work. What should I watch?",
      situationSummary:
        "A brief work situation with limited detail and unclear people.",
      keyPeopleText: "Someone at work",
      recentEventsText: "One vague meeting felt tense.",
      decisionOptionsText: "Observe or ask a clarifying question.",
    }),
    expected: {
      safetyLevel: "safe",
      minPeople: 1,
      minClaims: 1,
    },
  },
];

const forbiddenFragments = [
  "guaranteed",
  "destined",
  "definitely",
  "fate",
  "fortune",
  "mind reading",
  "real thoughts",
  "pay to reveal the truth",
  "stripe",
];

function makeSeedContext(definition: GoldenCaseDefinition): SeedContextDraft {
  const now = new Date().toISOString();

  return {
    ...definition.seed,
    id: `golden_${definition.id}`,
    createdAt: now,
    updatedAt: now,
  };
}

function confirmPeople(
  seedContext: SeedContextDraft,
  people: KeyPersonDraft[],
  fallbackLabel: string,
) {
  const candidates =
    people.length > 0
      ? people
      : [createManualPerson(seedContext.id, fallbackLabel, "manual stakeholder")];

  return candidates.slice(0, 4).map((person) => ({
    ...person,
    confirmed: true,
    status: "confirmed" as const,
    confidence: Math.max(person.confidence, 62),
    missingFields: person.missingFields ?? [],
  }));
}

function createStep(
  id: GoldenCaseStepId,
  label: string,
  passed: boolean,
  detail: string,
  fixSuggestion: string | null,
): GoldenCaseStepResult {
  return { id, label, passed, detail, fixSuggestion: passed ? null : fixSuggestion };
}

function hasForbiddenCopy(values: unknown[]) {
  const text = JSON.stringify(values).toLowerCase();
  return forbiddenFragments.some((fragment) => text.includes(fragment));
}

function stableClaimSnapshot(claims: ClaimDraft[]) {
  return claims.map((claim) => ({
    id: claim.id,
    summary: claim.summary,
    confidence: claim.confidence,
    riskLevel: claim.riskLevel,
    evidenceEventIds: claim.evidenceEventIds,
  }));
}

function stableEventSnapshot(events: SimulationEventDraft[]) {
  return events.map((event) => ({
    id: event.id,
    simulationTickId: event.simulationTickId,
    eventType: event.eventType,
    summary: event.summary,
    confidence: event.confidence,
    relationEdgeIds: event.relationEdgeIds,
    edgeWeightDeltas: event.edgeWeightDeltas,
  }));
}

function everyTickHasEventLog(simulationRun: ReturnType<typeof buildSimulationEngineV1Run>) {
  const eventIds = new Set(simulationRun.events.map((event) => event.id));

  return simulationRun.ticks.every(
    (tick) =>
      Array.isArray(tick.eventLogIds) &&
      tick.eventLogIds.length > 0 &&
      tick.eventLogIds.every((eventId) => eventIds.has(eventId)),
  );
}

function flagsMatch(actualFlags: SafetyFlag[], expectedFlags: SafetyFlag[] = []) {
  return expectedFlags.every((flag) => actualFlags.includes(flag));
}

function caseSpecificFixSuggestion(definition: GoldenCaseDefinition): string {
  switch (definition.id) {
    case "blocked":
      return "Keep this fixture blocked and ensure no KeyPeople, Claims, or Reports are produced after SafetyVerifier stops the flow.";
    case "downgraded":
      return "Check that partner-monitoring wording still downgrades safety and prevents full-depth access without mutating Claims.";
    case "caution":
      return "Check that guaranteed-reconciliation wording still triggers caution while preserving evidence-backed Claims.";
    case "high_information_gap":
      return "Check that informationGap weights reflect the opaque decision committee and missing criteria.";
    case "high_resource_control":
      return "Check that resourceControl weights reflect landlord or owner control over access, timing, and terms.";
    case "low_confidence_input":
      return "Verify sparse input still extracts at least one person and keeps claims evidence-backed.";
    case "track_b_climate":
    case "self_direction":
      return "Check that this Track B fixture still uses a longer-horizon climate run with local deterministic evidence.";
    case "family_boundary":
      return "Check that family-boundary wording still produces people, edges, events, and evidence-backed claims without escalation.";
    case "career_conflict":
      return "Check that boss/resource wording still produces resource-control pressure and evidence-backed career scenario claims.";
    case "collaboration_risk":
      return "Check that collaboration wording still produces ownership and benefit-boundary signals without graph editing.";
    case "relationship_crossroad":
      return "Check that relationship-crossroad wording still produces low-pressure options without mind-reading or certainty language.";
  }
}

function caseSpecificExpectation(
  definition: GoldenCaseDefinition,
  confirmedPeople: KeyPersonDraft[],
  relationEdges: RelationEdgeDraft[],
  claimCount: number,
) {
  const expected = definition.expected;
  const peopleMinOk =
    expected.minPeople === undefined || confirmedPeople.length >= expected.minPeople;
  const peopleMaxOk =
    expected.maxPeople === undefined || confirmedPeople.length <= expected.maxPeople;
  const claimsMinOk =
    expected.minClaims === undefined || claimCount >= expected.minClaims;
  const claimsMaxOk =
    expected.maxClaims === undefined || claimCount <= expected.maxClaims;
  const informationGapOk =
    expected.minInformationGap === undefined ||
    relationEdges.some(
      (edge) => edge.weights.informationGap >= expected.minInformationGap!,
    );
  const resourceControlOk =
    expected.minResourceControl === undefined ||
    relationEdges.some(
      (edge) => edge.weights.resourceControl >= expected.minResourceControl!,
    );

  return {
    passed:
      peopleMinOk &&
      peopleMaxOk &&
      claimsMinOk &&
      claimsMaxOk &&
      informationGapOk &&
      resourceControlOk,
    detail: [
      `people=${confirmedPeople.length}`,
      `claims=${claimCount}`,
      `max informationGap=${Math.max(
        0,
        ...relationEdges.map((edge) => edge.weights.informationGap),
      )}`,
      `max resourceControl=${Math.max(
        0,
        ...relationEdges.map((edge) => edge.weights.resourceControl),
      )}`,
    ].join("; "),
    fixSuggestion: caseSpecificFixSuggestion(definition),
  };
}

function buildBlockedCaseResult(
  definition: GoldenCaseDefinition,
  seedContext: SeedContextDraft,
  safety: ReturnType<typeof verifySafety>,
): GoldenCaseResult {
  const steps: GoldenCaseStepResult[] = [
    createStep(
      "seed_context",
      "Generate SeedContext",
      seedContext.status === "submitted" && seedContext.privacyAck,
      `SeedContext ${seedContext.id} exists for blocked safety validation.`,
      "Create a submitted SeedContext before running SafetyVerifier.",
    ),
    createStep(
      "safety_level_match",
      "Safety level matches expectation",
      safety.safetyLevel === definition.expected.safetyLevel &&
        flagsMatch(safety.flags, definition.expected.flags),
      `SafetyVerifier returned ${safety.safetyLevel} with flags ${safety.flags.join(", ") || "none"}.`,
      "Check safety fixture wording or SafetyVerifier patterns without weakening blocked gates.",
    ),
    createStep(
      "key_people",
      "KeyPeople skipped when blocked",
      true,
      "Blocked safety state intentionally stops KeyPeople extraction.",
      null,
    ),
    createStep(
      "agent_profiles",
      "AgentProfiles skipped when blocked",
      true,
      "Blocked safety state intentionally stops Agent generation.",
      null,
    ),
    createStep(
      "relation_graph_readonly",
      "RelationGraph skipped when blocked",
      true,
      "Blocked safety state intentionally stops graph generation.",
      null,
    ),
    createStep(
      "simulation_engine_v1",
      "Simulation skipped when blocked",
      true,
      "Blocked safety state intentionally stops simulation ticks.",
      null,
    ),
    createStep(
      "event_logs_before_claims",
      "No Claims without EventLogs",
      true,
      "No EventLogs or Claims are created in the blocked path.",
      null,
    ),
    createStep(
      "event_logs_per_tick",
      "No ticks when blocked",
      true,
      "No ticks are created in the blocked path.",
      null,
    ),
    createStep(
      "claims",
      "Claims skipped when blocked",
      true,
      "Blocked safety state intentionally stops Claims.",
      null,
    ),
    createStep(
      "claim_evidence_event_ids",
      "No unsupported Claims when blocked",
      true,
      "No visible Claims exist without evidenceEventIds.",
      null,
    ),
    createStep(
      "report_engine",
      "Report skipped when blocked",
      true,
      "Blocked safety state intentionally stops report construction.",
      null,
    ),
    createStep(
      "case_specific_expectation",
      "Blocked case expectation",
      definition.expected.blocked === true,
      "The blocked fixture expects zero downstream generation.",
      "Mark blocked fixtures with expected.blocked=true.",
    ),
    createStep(
      "entitlement_invariant",
      "Full-depth bypass unavailable",
      true,
      "Blocked safety state does not evaluate an unlock path.",
      null,
    ),
    createStep(
      "feedback_history_invariant",
      "Feedback does not mutate history",
      true,
      "No historical EventLogs or Claims exist to mutate in blocked path.",
      null,
    ),
    createStep(
      "forbidden_integrations_and_copy",
      "No real integrations or deterministic output",
      !hasForbiddenCopy([seedContext, safety.userMessage]),
      "Blocked path uses local SafetyVerifier output only.",
      "Remove deterministic, payment, or backend integration language from blocked path.",
    ),
  ];
  const failures = steps
    .filter((step) => !step.passed)
    .map((step) => ({
      stepId: step.id,
      detail: step.detail,
      fixSuggestion: step.fixSuggestion ?? "Inspect this step.",
    }));

  return {
    id: definition.id,
    title: definition.title,
    passed: failures.length === 0,
    steps,
    summary: {
      seedContextId: seedContext.id,
      keyPeopleCount: 0,
      agentProfileCount: 0,
      relationEdgeCount: 0,
      tickCount: 0,
      eventLogCount: 0,
      claimCount: 0,
      reportId: null,
      safetyLevel: safety.safetyLevel,
      safetyFlags: safety.flags,
      trackType: seedContext.trackType,
      downgraded: safety.safetyLevel === "downgraded",
      blocked: true,
    },
    failures,
  };
}

function runOneGoldenCase(definition: GoldenCaseDefinition): GoldenCaseResult {
  const seedContext = makeSeedContext(definition);
  const safety = verifySafety({ seedContext });

  if (safety.safetyLevel === "blocked") {
    return buildBlockedCaseResult(definition, seedContext, safety);
  }

  const extractedPeople = extractPeopleCandidates(seedContext);
  const confirmedPeople = confirmPeople(
    seedContext,
    extractedPeople,
    definition.expectedPersonHint,
  );
  const agents = buildAgentProfiles(seedContext, confirmedPeople, true);
  const relationEdges = buildRelationEdges(seedContext.id, agents);
  const relationGraph: RelationGraphDraft = {
    seedContextId: seedContext.id,
    version: "local-deterministic-v0",
    agents,
    edges: relationEdges,
    graphLocked: true,
    lockedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const agentEcology: AgentEcologyDraft = {
    seedContextId: seedContext.id,
    includeParallelSelves: true,
    agents,
    updatedAt: new Date().toISOString(),
  };
  const simulationRun = buildSimulationEngineV1Run({
    seedContext,
    agentEcology,
    relationEdges,
    safetySnapshot: {
      safetyLevel: safety.safetyLevel,
      flags: safety.flags,
      allowedActions: safety.allowedActions,
      blockedActions: safety.blockedActions,
      reportRestrictions: safety.reportRestrictions,
    },
    status: "queued",
  });
  const claimLedger = buildClaimLedgerDraft(seedContext.id, simulationRun);
  const report =
    claimLedger.claims.length > 0
      ? buildReportEngineV1({
          seedContext,
          simulationRun,
          claims: claimLedger.claims,
          agents,
          relationEdges,
        })
      : null;
  const beforeClaimSnapshot = stableClaimSnapshot(claimLedger.claims);
  const beforeEventSnapshot = stableEventSnapshot(simulationRun.events);
  const defaultLedger = buildDefaultEntitlementLedger();
  const paidLedger = report ? grantMockPaidReport(defaultLedger, report) : defaultLedger;
  const entitlementDecision = report
    ? evaluateReportEntitlement({
        ledger: paidLedger,
        report,
        safetyLevel: safety.safetyLevel,
      })
    : null;
  const feedbackLedger = buildEmptyFeedbackLedgerDraft(
    seedContext.id,
    simulationRun.id,
  );
  const firstClaim = claimLedger.claims[0] ?? null;
  const feedback = firstClaim
    ? buildFeedbackDraft({
        seedContextId: seedContext.id,
        simulationRunId: simulationRun.id,
        targetType: "claim",
        targetId: firstClaim.id,
        rating: "partly_right",
        note: "Golden case calibration note. This must not rewrite evidence.",
      })
    : null;
  const nextFeedbackLedger = feedback
    ? {
        ...feedbackLedger,
        feedback: [...feedbackLedger.feedback, feedback],
        updatedAt: new Date().toISOString(),
      }
    : feedbackLedger;
  const afterClaimSnapshot = stableClaimSnapshot(claimLedger.claims);
  const afterEventSnapshot = stableEventSnapshot(simulationRun.events);
  const specific = caseSpecificExpectation(
    definition,
    confirmedPeople,
    relationEdges,
    claimLedger.claims.length,
  );
  const generatedCopyAuditSurface = [
    agents.map((agent) => ({
      label: agent.label,
      role: agent.role,
      relationshipToUser: agent.relationshipToUser,
      agentType: agent.agentType,
    })),
    relationGraph.edges.map((edge) => ({
      relationshipType: edge.relationshipType,
      lastInteractionSummary: edge.lastInteraction.summary,
    })),
    simulationRun.ticks.map((tick) => ({
      tickIndex: tick.tickIndex,
      timeLabel: tick.timeLabel,
      summary: tick.summary,
      focus: tick.environmentState.focus,
    })),
    simulationRun.events.map((event) => ({
      tickIndex: event.tickIndex,
      timeLabel: event.timeLabel,
      eventType: event.eventType,
      summary: event.summary,
      causes: event.causes,
      action: event.action,
    })),
    claimLedger.claims.map((claim) => ({
      claimType: claim.claimType,
      summary: claim.summary,
      riskLevel: claim.riskLevel,
      safetyNotes: claim.safetyNotes,
    })),
    report
      ? {
          overallRiskLabel: report.freePreview.overallRiskLabel,
          unlockCta: report.freePreview.unlockCta,
          vagueTimeline: report.freePreview.vagueTimeline,
          strategyOptions: report.paidReport.strategyOptions.map((option) => ({
            title: option.title,
            body: option.body,
            expectedUse: option.expectedUse,
          })),
        }
      : null,
  ];

  const steps: GoldenCaseStepResult[] = [
    createStep(
      "seed_context",
      "Generate SeedContext",
      seedContext.status === "submitted" &&
        seedContext.privacyAck &&
        seedContext.questionText.length > 0,
      `SeedContext ${seedContext.id} created for ${definition.title}.`,
      "Create a submitted SeedContext with questionText, situationSummary, keyPeopleText, privacyAck, and a supported timeWindow.",
    ),
    createStep(
      "safety_level_match",
      "Safety level matches expectation",
      safety.safetyLevel === definition.expected.safetyLevel &&
        flagsMatch(safety.flags, definition.expected.flags),
      `SafetyVerifier returned ${safety.safetyLevel} with flags ${safety.flags.join(", ") || "none"}.`,
      "Adjust fixture wording or SafetyVerifier patterns without weakening gates.",
    ),
    createStep(
      "key_people",
      "Extract KeyPeople",
      confirmedPeople.length > 0,
      `${confirmedPeople.length} confirmed people prepared from local extraction.`,
      "Update local extraction hints or add a manual confirmed person fallback for this case.",
    ),
    createStep(
      "agent_profiles",
      "Generate AgentProfiles",
      agents.some((agent) => agent.agentType === "self") &&
        agents.some((agent) => agent.agentType === "npc") &&
        agents.every((agent) => agent.evidenceRefs.length > 0),
      `${agents.length} AgentProfiles generated with evidence refs.`,
      "Ensure buildAgentProfiles returns self, parallel selves, and one NPC for each confirmed person, all with evidenceRefs.",
    ),
    createStep(
      "relation_graph_readonly",
      "Generate read-only RelationGraph",
      relationGraph.graphLocked &&
        relationGraph.edges.length > 0 &&
        relationGraph.edges.every((edge) => edge.evidenceRefs.length > 0),
      `${relationGraph.edges.length} locked RelationEdges generated.`,
      "Build relation edges from AgentProfiles and lock the graph before simulation; do not add edge editing controls.",
    ),
    createStep(
      "simulation_engine_v1",
      "Run Simulation Engine v1",
      simulationRun.status === "queued" &&
        simulationRun.tickCount > 0 &&
        simulationRun.events.length > 0 &&
        simulationRun.events.every(
          (event) => event.source === "simulation_engine_v1",
        ),
      `${simulationRun.tickCount} ticks and ${simulationRun.events.length} EventLogs produced.`,
      "Run buildSimulationEngineV1Run with frozen AgentProfiles, locked RelationEdges, and a non-blocked safety snapshot.",
    ),
    createStep(
      "event_logs_before_claims",
      "EventLogs exist before Claims",
      simulationRun.events.length > 0 && claimLedger.claims.length > 0,
      `${simulationRun.events.length} EventLogs were produced before ${claimLedger.claims.length} Claims were built.`,
      "Build Claims only after the Simulation Engine writes EventLogs.",
    ),
    createStep(
      "event_logs_per_tick",
      "Every tick has EventLog",
      everyTickHasEventLog(simulationRun),
      "Each visible tick references at least one EventLog id.",
      "Ensure Simulation Engine v1 maps branch EventLogs back onto every baseline tick.",
    ),
    createStep(
      "claims",
      "Generate Claim",
      claimLedger.claims.length > 0,
      `${claimLedger.claims.length} evidence-backed claims generated.`,
      "Build claims only after Simulation Engine v1 produces EventLogs with relationEdgeIds.",
    ),
    createStep(
      "claim_evidence_event_ids",
      "Every Claim has evidenceEventIds",
      claimLedger.claims.every((claim) => claim.evidenceEventIds.length > 0),
      "All claims reference EventLog evidence.",
      "Block reportable claims until each claim has at least one evidenceEventId.",
    ),
    createStep(
      "report_engine",
      "Report Engine uses Claims",
      Boolean(
        report &&
          report.freePreview.claimIds.length > 0 &&
          report.paidReport.claimIds.length > 0 &&
          report.freePreview.claimIds.join("|") ===
            report.paidReport.claimIds.join("|") &&
          report.paidReport.fullEventChain.length > 0,
      ),
      report
        ? `Report ${report.id} generated with ${report.freePreview.claimIds.length} shared claim ids.`
        : "Report was not generated because no claims were available.",
      "Feed Report Engine v1 only claims whose evidenceEventIds exist in the simulation EventLogs.",
    ),
    createStep(
      "case_specific_expectation",
      "Case-specific expectation",
      specific.passed,
      specific.detail,
      specific.fixSuggestion,
    ),
    createStep(
      "entitlement_invariant",
      "Entitlement unlock does not change claim/confidence/risk",
      Boolean(
        report &&
          (safety.safetyLevel === "downgraded"
            ? entitlementDecision?.canViewPaidReport === false
            : entitlementDecision?.canViewPaidReport) &&
          entitlementDecision?.invariant.claimIdsUnchanged &&
          entitlementDecision.invariant.confidenceUnchanged &&
          entitlementDecision.invariant.riskLevelUnchanged &&
          JSON.stringify(beforeClaimSnapshot) ===
            JSON.stringify(stableClaimSnapshot(claimLedger.claims)),
      ),
      safety.safetyLevel === "downgraded"
        ? "Downgraded safety keeps full-depth unavailable; claims remain unchanged."
        : "Mock paid_report entitlement unlocks depth only; claim ids, confidence, and risk stay fixed.",
      "Keep entitlement evaluation separate from Claim mutation and prevent downgraded safety from opening full-depth.",
    ),
    createStep(
      "feedback_history_invariant",
      "Feedback does not modify historical EventLog/Claim",
      nextFeedbackLedger.feedback.length === 1 &&
        JSON.stringify(beforeClaimSnapshot) === JSON.stringify(afterClaimSnapshot) &&
        JSON.stringify(beforeEventSnapshot) === JSON.stringify(afterEventSnapshot),
      "Feedback appends calibration input without rewriting EventLogs or Claims.",
      "Store feedback as a separate calibration ledger; never mutate historical EventLogs or Claims in feedback handlers.",
    ),
    createStep(
      "forbidden_integrations_and_copy",
      "No real LLM, payment, deterministic prediction, or graph editing",
      !hasForbiddenCopy(generatedCopyAuditSurface) &&
        agents.every((agent) => agent.modelVersion === "unreleased") &&
        simulationRun.modelVersion === "unreleased" &&
        simulationRun.costCents === 0 &&
        paidLedger.entitlements.every((item) =>
          ["default", "mock_unlock", "admin"].includes(item.source),
        ),
      "Local deterministic pipeline only: no LLM model, no Stripe source, no certainty copy, graph locked.",
      "Remove deterministic or mind-reading copy, keep modelVersion unreleased, and keep paid unlock mocked for local acceptance.",
    ),
  ];
  const failures = steps
    .filter((step) => !step.passed)
    .map((step) => ({
      stepId: step.id,
      detail: step.detail,
      fixSuggestion: step.fixSuggestion ?? "Inspect this step.",
    }));

  return {
    id: definition.id,
    title: definition.title,
    passed: failures.length === 0,
    steps,
    summary: {
      seedContextId: seedContext.id,
      keyPeopleCount: confirmedPeople.length,
      agentProfileCount: agents.length,
      relationEdgeCount: relationEdges.length,
      tickCount: simulationRun.ticks.length,
      eventLogCount: simulationRun.events.length,
      claimCount: claimLedger.claims.length,
      reportId: report?.id ?? null,
      safetyLevel: safety.safetyLevel,
      safetyFlags: safety.flags,
      trackType: seedContext.trackType,
      downgraded: safety.safetyLevel === "downgraded",
      blocked: false,
    },
    failures,
  };
}

function emptySafetySummary(): Record<SafetyLevel, number> {
  return {
    safe: 0,
    caution: 0,
    downgraded: 0,
    blocked: 0,
  };
}

function emptyTrackSummary(): Record<TrackType, number> {
  return {
    crossroad: 0,
    life_climate: 0,
  };
}

export function runGoldenCaseAcceptance(): GoldenCaseAcceptanceResult {
  const cases = goldenCases.map(runOneGoldenCase);
  const safetySummary = cases.reduce((summary, item) => {
    summary[item.summary.safetyLevel] += 1;
    return summary;
  }, emptySafetySummary());
  const trackSummary = cases.reduce((summary, item) => {
    summary[item.summary.trackType] += 1;
    return summary;
  }, emptyTrackSummary());

  return {
    passed: cases.every((item) => item.passed),
    generatedAt: new Date().toISOString(),
    cases,
    safetySummary,
    trackSummary,
  };
}

export { goldenCases };
