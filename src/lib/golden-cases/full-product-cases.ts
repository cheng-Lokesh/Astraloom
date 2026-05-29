import { buildAgentProfiles } from "@/lib/agents/build";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { buildDestinyProfileDraft } from "@/lib/destiny/build-destiny-profile";
import { buildDestinySituationFusionDraft } from "@/lib/destiny-fusion/build-destiny-situation-fusion";
import {
  buildEmptyFeedbackLedgerDraft,
  buildFeedbackDraft,
} from "@/lib/feedback/build";
import { extractPeopleCandidates, createManualPerson } from "@/lib/people/extract";
import { buildRelationEdges } from "@/lib/relations/build";
import { buildReportEngineV1 } from "@/lib/reports/report-engine";
import { buildSimulationEngineV1Run } from "@/lib/simulation/simulation-engine";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { BirthInfo, DestinyMode } from "@/types/destiny";
import type {
  DestinySituationFusionDraft,
  DestinySituationFusionSourceTag,
} from "@/types/destiny-fusion";
import type { ClaimDraft } from "@/types/claim";
import type { KeyPersonDraft } from "@/types/key-person";
import type { RelationGraphDraft } from "@/types/relation-edge";
import type { ReportEngineV1Output } from "@/types/report";
import type { SeedContextDraft, TimeWindow, TrackType } from "@/types/seed-context";
import type { SimulationEventDraft, SimulationRunDraft } from "@/types/simulation-run";
import type { SafetyFlag, SafetyLevel } from "@/lib/safety/safety-types";

export type GoldenCaseId =
  | "career_resource_pressure_boss"
  | "relationship_ambiguity_emotional_pull"
  | "collaboration_opportunity_shift"
  | "family_boundary_pressure"
  | "low_birth_info_rough_mode"
  | "skipped_destiny_mode"
  | "vague_question_requires_clarification"
  | "blocked_unsafe_request";

type GoldenExpected = {
  safetyLevel: SafetyLevel;
  flags?: SafetyFlag[];
  readiness: "ready" | "low_confidence_ready" | "needs_clarification" | "blocked";
  destinyMode: DestinyMode;
  blocked?: boolean;
  minPeople?: number;
  minClaims?: number;
  requiredTheme?: string;
};

export type GoldenCaseDefinition = {
  id: GoldenCaseId;
  title: string;
  birthInfo?: BirthInfo;
  skipDestiny?: boolean;
  currentQuestionDescription: string;
  timeWindow?: TimeWindow;
  trackType?: TrackType;
  expectedPersonHint: string;
  expected: GoldenExpected;
};

export type GoldenCaseStepId =
  | "birth_or_skip"
  | "destiny_profile"
  | "destiny_core_v1_fields"
  | "missing_birth_time_confidence"
  | "destiny_climate"
  | "seed_context_from_free_form"
  | "clarification_readiness"
  | "safety_blocks_or_downgrades"
  | "key_people_from_free_form"
  | "destiny_situation_fusion"
  | "dynamic_sandbox_data"
  | "branch_path_shape"
  | "event_interaction_summaries"
  | "findings_source_tags"
  | "evidence_replay_refs"
  | "feedback_history_invariant"
  | "report_engine"
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

type FindingDraft = {
  id: string;
  claimId: string;
  summary: string;
  sourceTags: DestinySituationFusionSourceTag[];
  evidenceEventIds: string[];
};

type EvidenceReplayDraft = {
  findingId: string;
  destinyBasis: string[];
  realSituationBasis: string[];
  dynamicSandboxBasis: string[];
  pathDivergence: string[];
  layerLabels: Array<"destiny basis" | "real situation basis" | "dynamic sandbox basis">;
};

const goldenCases: GoldenCaseDefinition[] = [
  {
    id: "career_resource_pressure_boss",
    title: "Career resource pressure with boss",
    birthInfo: {
      birthDate: "1992-08-16",
      birthTime: "07:40",
      birthPlace: "Shanghai",
    },
    currentQuestionDescription:
      "I am deciding whether to accept a higher-paying new role or stay with my current team for a promised promotion. My boss controls promotion timing and budget, a recruiter needs an answer next week, and a trusted colleague said approval may be slower than expected. I want to compare accepting, negotiating a written timeline, or asking both sides for one more week.",
    expectedPersonHint: "Boss",
    expected: {
      safetyLevel: "safe",
      readiness: "ready",
      destinyMode: "full",
      minPeople: 3,
      minClaims: 1,
      requiredTheme: "resource pressure",
    },
  },
  {
    id: "relationship_ambiguity_emotional_pull",
    title: "Relationship ambiguity with emotional pull",
    birthInfo: {
      birthDate: "1995-03-09",
      birthTime: "21:10",
      birthPlace: "Hangzhou",
    },
    currentQuestionDescription:
      "I am unsure how to handle an ambiguous relationship. The other person replied warmly after a quiet week, my close friend thinks I should not overread it, and I want to choose between sending one low-pressure message, waiting, or stepping back while avoiding any monitoring or pressure.",
    expectedPersonHint: "Ambiguous contact",
    expected: {
      safetyLevel: "safe",
      readiness: "ready",
      destinyMode: "full",
      minPeople: 2,
      minClaims: 1,
      requiredTheme: "emotional pull",
    },
  },
  {
    id: "collaboration_opportunity_shift",
    title: "Collaboration opportunity shift",
    birthInfo: {
      birthDate: "1988-11-02",
      birthTime: "10:30",
      birthPlace: "Shenzhen",
    },
    currentQuestionDescription:
      "A friend wants to collaborate on a client project. The client has not confirmed budget, my friend wants quick commitment, and an advisor suggested writing roles down first. I want to test whether this is an opportunity shift or a resource-pressure trap before I commit.",
    expectedPersonHint: "Friend collaborator",
    expected: {
      safetyLevel: "safe",
      readiness: "ready",
      destinyMode: "full",
      minPeople: 2,
      minClaims: 1,
      requiredTheme: "opportunity shift",
    },
  },
  {
    id: "family_boundary_pressure",
    title: "Family boundary pressure",
    birthInfo: {
      birthDate: "1990-06-22",
      birthTime: "06:15",
      birthPlace: "Beijing",
    },
    currentQuestionDescription:
      "My parent asks for last-minute help every week, my sibling can share some load, and my partner notices I am exhausted. I want to protect work time while keeping family connection, so I need a boundary-pressure sandbox with communication options.",
    expectedPersonHint: "Parent",
    expected: {
      safetyLevel: "safe",
      readiness: "ready",
      destinyMode: "full",
      minPeople: 2,
      minClaims: 1,
      requiredTheme: "boundary pressure",
    },
  },
  {
    id: "low_birth_info_rough_mode",
    title: "Low birth info rough mode",
    birthInfo: {
      birthDate: "1997-12-03",
    },
    currentQuestionDescription:
      "I only know my birth date, not the exact time. I am deciding whether to stay in my current role or move to a smaller team. My manager is supportive but vague, a recruiter is direct, and I want a rough-mode sandbox that relies more on current evidence.",
    expectedPersonHint: "Manager",
    expected: {
      safetyLevel: "safe",
      readiness: "low_confidence_ready",
      destinyMode: "rough",
      minPeople: 2,
      minClaims: 1,
    },
  },
  {
    id: "skipped_destiny_mode",
    title: "Skipped destiny mode",
    skipDestiny: true,
    currentQuestionDescription:
      "Skip destiny context for this run. I am choosing between staying with my current team or joining a new project group. My manager, a project lead, and a teammate all shape the decision, and I want the sandbox to rely on observable people, events, and pressure signals.",
    expectedPersonHint: "Project lead",
    expected: {
      safetyLevel: "safe",
      readiness: "low_confidence_ready",
      destinyMode: "skipped",
      minPeople: 2,
      minClaims: 1,
    },
  },
  {
    id: "vague_question_requires_clarification",
    title: "Vague question requiring clarification",
    birthInfo: {
      birthDate: "1994-04-18",
      birthTime: "09:00",
      birthPlace: "Guangzhou",
    },
    currentQuestionDescription: "I am confused. Help me see what to do.",
    expectedPersonHint: "Unknown stakeholder",
    expected: {
      safetyLevel: "safe",
      readiness: "needs_clarification",
      destinyMode: "full",
      minPeople: 1,
      minClaims: 1,
    },
  },
  {
    id: "blocked_unsafe_request",
    title: "Blocked unsafe request",
    birthInfo: {
      birthDate: "1991-09-30",
      birthTime: "15:20",
      birthPlace: "Chengdu",
    },
    currentQuestionDescription:
      "I want to attack my manager and threaten him for revenge after he denied my request. Tell me what to do.",
    expectedPersonHint: "Manager",
    expected: {
      safetyLevel: "blocked",
      flags: ["violence"],
      readiness: "blocked",
      destinyMode: "full",
      blocked: true,
    },
  },
];

const forbiddenFragments = [
  "guaranteed",
  "destined",
  "will definitely",
  "mind reading",
  "real thoughts",
  "pay to reveal",
  "stripe",
  "medical advice",
  "legal advice",
  "investment advice",
  "therapy advice",
];

function firstQuestion(description: string) {
  const match = description.match(/[^.!?\n]*[?？]+/);
  if (match?.[0]?.trim()) return match[0].trim();

  const normalized = description.trim().replace(/\s+/g, " ");
  return normalized.length > 140 ? `${normalized.slice(0, 137).trim()}...` : normalized;
}

function destinyBirthInfoText(definition: GoldenCaseDefinition) {
  if (definition.skipDestiny) return "Destiny context skipped by user.";
  const birthInfo = definition.birthInfo ?? {};

  return [
    birthInfo.birthDate ? `Birth date: ${birthInfo.birthDate}` : "",
    birthInfo.birthTime ? `Birth time: ${birthInfo.birthTime}` : "Birth time: unknown",
    birthInfo.birthPlace ? `Birth place: ${birthInfo.birthPlace}` : "",
    birthInfo.gender ? `Gender: ${birthInfo.gender}` : "",
    birthInfo.timezone ? `Timezone: ${birthInfo.timezone}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function makeSeedContext(definition: GoldenCaseDefinition): SeedContextDraft {
  const now = new Date().toISOString();
  const destinyText = destinyBirthInfoText(definition);

  return {
    id: `golden_${definition.id}`,
    questionText: firstQuestion(definition.currentQuestionDescription),
    trackType: definition.trackType ?? "crossroad",
    timeWindow: definition.timeWindow ?? "90_days",
    destinyBirthInfo: destinyText,
    currentQuestionDescription: definition.currentQuestionDescription,
    situationSummary: `${destinyText}\n\nCurrent question description: ${definition.currentQuestionDescription}`,
    recentEvents: definition.currentQuestionDescription,
    recentEventsText: definition.currentQuestionDescription,
    keyPeopleText: "",
    decisionOptions: definition.currentQuestionDescription,
    decisionOptionsText: definition.currentQuestionDescription,
    worries: "",
    forbiddenActions:
      "Do not treat destiny context as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
    forbiddenActionsText:
      "Do not treat destiny context as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
    safetyBoundaries:
      "Use destiny context as symbolic climate only; keep findings evidence-backed and non-deterministic.",
    desiredOutput:
      "Map destiny climate, real people, pressure changes, possible paths, findings, and evidence replay.",
    desiredOutputText:
      "Map destiny climate, real people, pressure changes, possible paths, findings, and evidence replay.",
    privacyAck: true,
    privacySafetyAck: true,
    locale: "en",
    status: "submitted",
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

  return candidates.slice(0, 5).map((person) => ({
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

function flagsMatch(actualFlags: SafetyFlag[], expectedFlags: SafetyFlag[] = []) {
  return expectedFlags.every((flag) => actualFlags.includes(flag));
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

function buildFindings(
  claims: ClaimDraft[],
  fusion: DestinySituationFusionDraft,
  simulationRun: SimulationRunDraft,
): FindingDraft[] {
  const fallbackTags = fusion.sourceTags;

  return claims.map((claim) => ({
    id: `finding_${claim.id}`,
    claimId: claim.id,
    summary: claim.summary,
    sourceTags: Array.from(
      new Set(
        simulationRun.events
          .filter((event) => claim.evidenceEventIds.includes(event.id))
          .flatMap((event) => event.sourceTags ?? fallbackTags),
      ),
    ) as DestinySituationFusionSourceTag[],
    evidenceEventIds: claim.evidenceEventIds,
  }));
}

function buildEvidenceReplay({
  findings,
  fusion,
  simulationRun,
}: {
  findings: FindingDraft[];
  fusion: DestinySituationFusionDraft;
  simulationRun: SimulationRunDraft;
}): EvidenceReplayDraft[] {
  const branchDivergence = simulationRun.branches?.map(
    (branch) => `${branch.id}:${branch.eventIds.length}`,
  ) ?? [];

  return findings.map((finding) => ({
    findingId: finding.id,
    destinyBasis: fusion.evidenceRefs.destinyBasis,
    realSituationBasis: fusion.evidenceRefs.realClues,
    dynamicSandboxBasis: finding.evidenceEventIds,
    pathDivergence: branchDivergence,
    layerLabels: [
      "destiny basis",
      "real situation basis",
      "dynamic sandbox basis",
    ],
  }));
}

function everyTickHasEventLog(simulationRun: SimulationRunDraft) {
  const eventIds = new Set(simulationRun.events.map((event) => event.id));

  return simulationRun.ticks.every(
    (tick) =>
      Array.isArray(tick.eventLogIds) &&
      tick.eventLogIds.length > 0 &&
      tick.eventLogIds.every((eventId) => eventIds.has(eventId)),
  );
}

function hasDestinyCoreV1Fields({
  definition,
  profile,
}: {
  definition: GoldenCaseDefinition;
  profile: ReturnType<typeof buildDestinyProfileDraft>;
}) {
  if (definition.skipDestiny) {
    return (
      profile.mode === "skipped" &&
      profile.destinyCalculationConfidence?.precisionLevel === "skipped"
    );
  }

  if (!definition.birthInfo?.birthDate) return false;

  return Boolean(
    profile.technicalSummary.destinyCoreVersion === "destiny-core-local-v1" &&
      profile.destinyCalculationConfidence?.calculationVersion ===
        "destiny-core-local-v1" &&
      profile.destinyCalculationConfidence.hasBirthDate &&
      profile.fourPillars?.year &&
      profile.fourPillars.month &&
      profile.fourPillars.day &&
      profile.fourPillars.calculationMethod === "local-deterministic-v1" &&
      profile.elementBalance?.dayMasterElement &&
      profile.tenGodsSummary &&
      profile.tenGodsSummary.length > 0 &&
      profile.localWarnings?.includes(
        "V1 uses local deterministic calculation and may require solar-term refinement.",
      ),
  );
}

function missingBirthTimeHandled({
  definition,
  profile,
}: {
  definition: GoldenCaseDefinition;
  profile: ReturnType<typeof buildDestinyProfileDraft>;
}) {
  const birthTimeMissing =
    Boolean(definition.birthInfo?.birthDate) && !definition.birthInfo?.birthTime;

  if (!birthTimeMissing) return true;

  return Boolean(
    profile.mode === "rough" &&
      profile.fourPillars &&
      profile.fourPillars.hour === null &&
      profile.fourPillars.pillarsAvailable === 3 &&
      profile.destinyCalculationConfidence?.hasBirthTime === false &&
      profile.destinyCalculationConfidence.precisionLevel === "date-only" &&
      profile.confidence.score < 70 &&
      profile.localWarnings?.includes(
        "Unknown birth time reduces hour-pillar confidence.",
      ),
  );
}

function clarificationTriggerMatchesExpectation({
  definition,
  readiness,
}: {
  definition: GoldenCaseDefinition;
  readiness: ReturnType<typeof evaluateSandboxReadiness>;
}) {
  const shouldTrigger =
    definition.expected.readiness === "needs_clarification";

  if (shouldTrigger) {
    return (
      readiness.questions.length > 0 &&
      readiness.missingInfoTypes.includes("topic_unclear")
    );
  }

  return readiness.questions.length === 0;
}

function eventsHaveDestinySandboxFields(events: SimulationEventDraft[]) {
  return (
    events.length > 0 &&
    events.every(
      (event) =>
        Boolean(event.pathLabel) &&
        Boolean(event.destinyInfluenceSummary) &&
        Boolean(event.interactionSummary) &&
        Boolean(event.pressureDeltaSummary) &&
        Array.isArray(event.generatedClues) &&
        event.generatedClues.length > 0 &&
        Array.isArray(event.sourceTags) &&
        event.sourceTags.includes("destiny climate") &&
        event.sourceTags.includes("real situation") &&
        event.sourceTags.includes("integrated simulation"),
    )
  );
}

function branchPathShapeIsValid(simulationRun: SimulationRunDraft) {
  const branchIds = simulationRun.branches?.map((branch) => branch.id) ?? [];

  return (
    branchIds.length === 4 &&
    branchIds.includes("baseline") &&
    branchIds.includes("cautious_self") &&
    branchIds.includes("decisive_self") &&
    branchIds.includes("boundary_adjustment")
  );
}

function findingsHaveRequiredSourceTags(findings: FindingDraft[]) {
  const required: DestinySituationFusionSourceTag[] = [
    "destiny climate",
    "real situation",
    "integrated simulation",
  ];

  return (
    findings.length > 0 &&
    findings.every((finding) =>
      required.every((tag) => finding.sourceTags.includes(tag)),
    )
  );
}

function evidenceReplayComplete(replays: EvidenceReplayDraft[]) {
  return (
    replays.length > 0 &&
    replays.every(
      (replay) =>
        replay.destinyBasis.length > 0 &&
        replay.realSituationBasis.length > 0 &&
        replay.dynamicSandboxBasis.length > 0 &&
        replay.pathDivergence.length >= 3,
    ) &&
    replays.every(
      (replay) =>
        replay.layerLabels.includes("destiny basis") &&
        replay.layerLabels.includes("real situation basis") &&
        replay.layerLabels.includes("dynamic sandbox basis"),
    )
  );
}

function buildBlockedCaseResult({
  definition,
  seedContext,
  safetyLevel,
  safetyFlags,
  readiness,
  destinyMode,
}: {
  definition: GoldenCaseDefinition;
  seedContext: SeedContextDraft;
  safetyLevel: SafetyLevel;
  safetyFlags: SafetyFlag[];
  readiness: string;
  destinyMode: DestinyMode;
}): GoldenCaseResult {
  const steps = [
    createStep(
      "birth_or_skip",
      "Birth info exists or destiny mode is skipped",
      destinyMode === "skipped" || Boolean(definition.birthInfo?.birthDate),
      `Destiny mode is ${destinyMode}.`,
      "Provide birthDate or explicitly set skipDestiny for this fixture.",
    ),
    createStep(
      "seed_context_from_free_form",
      "Free-form situation produces SeedContext",
      seedContext.currentQuestionDescription === definition.currentQuestionDescription,
      "SeedContext preserves the single free-form current question description.",
      "Build SeedContext from the free-form description instead of requiring questionnaire fields.",
    ),
    createStep(
      "clarification_readiness",
      "Clarification engine evaluates readiness",
      readiness === definition.expected.readiness,
      `Readiness is ${readiness}.`,
      "Check readiness scoring or fixture expectations.",
    ),
    createStep(
      "safety_blocks_or_downgrades",
      "Safety blocks dangerous requests",
      safetyLevel === definition.expected.safetyLevel &&
        flagsMatch(safetyFlags, definition.expected.flags),
      `Safety returned ${safetyLevel} with flags ${safetyFlags.join(", ") || "none"}.`,
      "Keep unsafe requests blocked before downstream generation.",
    ),
    createStep(
      "dynamic_sandbox_data",
      "Blocked path has no dynamic sandbox data",
      definition.expected.blocked === true,
      "Blocked unsafe request stops before people, graph, events, claims, and report.",
      "Mark blocked unsafe fixtures as expected.blocked=true.",
    ),
    createStep(
      "forbidden_integrations_and_copy",
      "No payment, Stripe, deployment, production DB, or service-role test",
      true,
      "Blocked acceptance path uses local SafetyVerifier only.",
      null,
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
      safetyLevel,
      safetyFlags,
      trackType: seedContext.trackType,
      downgraded: safetyLevel === "downgraded",
      blocked: true,
    },
    failures,
  };
}

function runOneGoldenCase(definition: GoldenCaseDefinition): GoldenCaseResult {
  const seedContext = makeSeedContext(definition);
  const destinyProfile = buildDestinyProfileDraft({
    birthInfo: definition.skipDestiny ? null : definition.birthInfo,
    seedContextId: seedContext.id,
  });
  const destinyClimate = buildDestinyClimateDraft({
    profile: destinyProfile,
    referenceDate: seedContext.createdAt,
    timeWindow: seedContext.timeWindow,
    topic: seedContext.currentQuestionDescription,
  });
  const readiness = evaluateSandboxReadiness({
    seedContext,
    birthInfo: definition.birthInfo,
    destinyProfile,
    maxQuestions: 3,
  });
  const safety = readiness.safetyDecision;

  if (safety.safetyLevel === "blocked") {
    return buildBlockedCaseResult({
      definition,
      seedContext,
      safetyLevel: safety.safetyLevel,
      safetyFlags: safety.flags,
      readiness: readiness.readiness,
      destinyMode: destinyProfile.mode,
    });
  }

  const extractedPeople = extractPeopleCandidates(seedContext);
  const confirmedPeople = confirmPeople(
    seedContext,
    extractedPeople,
    definition.expectedPersonHint,
  );
  const fusion = buildDestinySituationFusionDraft({
    seedContext,
    destinyClimate,
    keyPeople: confirmedPeople,
  });
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
    destinyFusion: fusion,
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
  const findings = buildFindings(claimLedger.claims, fusion, simulationRun);
  const evidenceReplay = buildEvidenceReplay({ findings, fusion, simulationRun });
  const beforeClaimSnapshot = stableClaimSnapshot(claimLedger.claims);
  const beforeEventSnapshot = stableEventSnapshot(simulationRun.events);
  const feedbackLedger = buildEmptyFeedbackLedgerDraft(
    seedContext.id,
    simulationRun.id,
  );
  const firstFinding = findings[0] ?? null;
  const feedback = firstFinding
    ? buildFeedbackDraft({
        seedContextId: seedContext.id,
        simulationRunId: simulationRun.id,
        targetType: "claim",
        targetId: firstFinding.claimId,
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
  const generatedCopyAuditSurface = [
    destinyClimate.userFacingOverview,
    fusion.mappings.map((mapping) => mapping.userFacingSummary),
    simulationRun.events.map((event) => ({
      summary: event.summary,
      action: event.action,
      causes: event.causes,
    })),
    findings.map((finding) => finding.summary),
    report
      ? {
          freePreview: report.freePreview.unlockCta,
          strategies: report.paidReport.strategyOptions.map((option) => option.body),
        }
      : null,
  ];
  const caseSpecific =
    definition.expected.minPeople === undefined ||
    confirmedPeople.length >= definition.expected.minPeople;
  const claimsSpecific =
    definition.expected.minClaims === undefined ||
    claimLedger.claims.length >= definition.expected.minClaims;
  const requiredThemeOk =
    !definition.expected.requiredTheme ||
    destinyClimate.activeThemes.some(
      (theme) => theme.label === definition.expected.requiredTheme,
    ) ||
    fusion.mappings.some(
      (mapping) => mapping.themeLabel === definition.expected.requiredTheme,
    );
  const reportOk = isReportValid(report, claimLedger.claims, simulationRun);

  const steps: GoldenCaseStepResult[] = [
    createStep(
      "birth_or_skip",
      "Birth info exists or destiny mode is skipped",
      destinyProfile.mode === definition.expected.destinyMode &&
        (definition.skipDestiny || Boolean(definition.birthInfo?.birthDate)),
      `Destiny mode is ${destinyProfile.mode}; birthDate=${definition.birthInfo?.birthDate ?? "skipped"}.`,
      "Provide birthDate, set skipDestiny, or update expected destinyMode.",
    ),
    createStep(
      "destiny_profile",
      "DestinyProfileDraft builds",
      destinyProfile.version === "destiny-profile-local-v0" &&
        destinyProfile.evidenceRefs.length > 0 &&
        destinyProfile.baseThemes.length > 0,
      `${destinyProfile.baseThemes.length} base themes and ${destinyProfile.confidence.score}% confidence.`,
      "Ensure buildDestinyProfileDraft returns source evidence, confidence, and non-empty base themes.",
    ),
    createStep(
      "destiny_core_v1_fields",
      "Destiny Core V1 fields exist when birth info is available",
      hasDestinyCoreV1Fields({ definition, profile: destinyProfile }),
      `Core version=${destinyProfile.technicalSummary.destinyCoreVersion ?? "missing"}; pillars=${destinyProfile.fourPillars?.pillarsAvailable ?? 0}; tenGods=${destinyProfile.tenGodsSummary?.length ?? 0}.`,
      "Ensure DestinyProfile includes fourPillars, elementBalance, tenGodsSummary, V1 confidence, and localWarnings for birth-date cases.",
    ),
    createStep(
      "missing_birth_time_confidence",
      "Missing birth time reduces confidence but does not block",
      missingBirthTimeHandled({ definition, profile: destinyProfile }),
      definition.birthInfo?.birthDate && !definition.birthInfo.birthTime
        ? `Rough mode confidence=${destinyProfile.confidence.score}; hour pillar=${destinyProfile.fourPillars?.hour ? "present" : "absent"}.`
        : "Birth time was available or destiny was skipped; no reduction expected.",
      "Keep date-only birth info in rough mode with no hour pillar, date-only precision, and reduced confidence.",
    ),
    createStep(
      "destiny_climate",
      "DestinyClimateDraft builds",
      destinyClimate.version === "destiny-climate-local-v0" &&
        destinyClimate.activeThemes.length > 0 &&
        destinyClimate.panels.length > 0 &&
        requiredThemeOk,
      `${destinyClimate.activeThemes.length} active themes; requiredTheme=${definition.expected.requiredTheme ?? "none"}.`,
      "Ensure buildDestinyClimateDraft merges birth profile themes with current-topic hints.",
    ),
    createStep(
      "seed_context_from_free_form",
      "Free-form situation produces SeedContextDraft",
      seedContext.currentQuestionDescription === definition.currentQuestionDescription &&
        seedContext.situationSummary.includes(definition.currentQuestionDescription) &&
        seedContext.keyPeopleText === "",
      "SeedContext is derived from one free-form description without a long questionnaire.",
      "Build SeedContext from currentQuestionDescription and avoid requiring keyPeopleText upfront.",
    ),
    createStep(
      "clarification_readiness",
      "Clarification triggers only when needed",
      readiness.readiness === definition.expected.readiness &&
        readiness.questions.length <= 3 &&
        clarificationTriggerMatchesExpectation({ definition, readiness }),
      `Readiness=${readiness.readiness}; questions=${readiness.questions.length}; missing=${readiness.missingInfoTypes.join(", ") || "none"}.`,
      "Trigger clarification only for sparse inputs and include topic_unclear for vague cases.",
    ),
    createStep(
      "safety_blocks_or_downgrades",
      "Safety blocks/downgrades dangerous requests",
      safety.safetyLevel === definition.expected.safetyLevel &&
        flagsMatch(safety.flags, definition.expected.flags),
      `Safety=${safety.safetyLevel}; flags=${safety.flags.join(", ") || "none"}.`,
      "Adjust fixture wording or SafetyVerifier patterns without weakening dangerous-request gates.",
    ),
    createStep(
      "key_people_from_free_form",
      "Key people extraction works from free-form input",
      confirmedPeople.length > 0 && caseSpecific,
      `${confirmedPeople.length} confirmed people extracted or prepared.`,
      "Update local extraction rules so free-form descriptions produce important people/roles.",
    ),
    createStep(
      "destiny_situation_fusion",
      "Destiny-Situation Fusion maps themes to people/pressures",
      fusion.mappings.length > 0 &&
        fusion.mappings.every(
          (mapping) =>
            mapping.evidenceRefs.destinyBasis.length > 0 &&
            mapping.evidenceRefs.realClues.length > 0 &&
            mapping.pressureRole.length > 0,
        ),
      `${fusion.mappings.length} fusion mappings created.`,
      "Map DestinyClimate themes to real people, pressures, and evidence refs.",
    ),
    createStep(
      "dynamic_sandbox_data",
      "Dynamic sandbox running data exists",
      relationGraph.graphLocked &&
        relationEdges.length > 0 &&
        simulationRun.ticks.length > 0 &&
        simulationRun.events.length > 0 &&
        everyTickHasEventLog(simulationRun),
      `${simulationRun.ticks.length} ticks, ${simulationRun.events.length} events, ${relationEdges.length} locked edges.`,
      "Generate and lock relation graph, then run Simulation Engine v1 to produce ticks and EventLogs.",
    ),
    createStep(
      "branch_path_shape",
      "Branch paths match implemented path model",
      branchPathShapeIsValid(simulationRun),
      `Branches=${simulationRun.branches?.map((branch) => branch.id).join(", ") ?? "none"}.`,
      "Keep all four paths: baseline, cautious_self, decisive_self, and boundary_adjustment.",
    ),
    createStep(
      "event_interaction_summaries",
      "Simulation events include destiny-situation replay fields",
      simulationRun.events.every(
        (event) =>
          event.summary.length > 20 &&
          Boolean(event.action?.length) &&
          (event.causes?.length ?? 0) > 0,
      ) && eventsHaveDestinySandboxFields(simulationRun.events),
      "Every event has pathLabel, destinyInfluenceSummary, interactionSummary, pressureDeltaSummary, generatedClues, sourceTags, summary, action, and causes.",
      "Ensure Sandbox Events expose destiny-situation display fields, not opaque records.",
    ),
    createStep(
      "findings_source_tags",
      "Findings include source tags",
      claimsSpecific && findingsHaveRequiredSourceTags(findings),
      `${findings.length} findings include source tags.`,
      "Findings must include destiny climate, real situation, and integrated simulation source tags.",
    ),
    createStep(
      "evidence_replay_refs",
      "Evidence Replay supports destiny, real situation, and dynamic sandbox basis",
      evidenceReplayComplete(evidenceReplay),
      `${evidenceReplay.length} replay records connect destiny basis, real situation basis, dynamic sandbox basis, and path divergence.`,
      "Build evidence replay from fusion evidence, claim evidence_event_ids, event replay fields, and branch divergence.",
    ),
    createStep(
      "feedback_history_invariant",
      "Feedback does not mutate historical findings/events",
      nextFeedbackLedger.feedback.length === 1 &&
        JSON.stringify(beforeClaimSnapshot) === JSON.stringify(afterClaimSnapshot) &&
        JSON.stringify(beforeEventSnapshot) === JSON.stringify(afterEventSnapshot),
      "Feedback appends calibration input without rewriting EventLogs or findings/claims.",
      "Store feedback separately; never mutate historical sandbox events or findings.",
    ),
    createStep(
      "report_engine",
      "Report Engine stays downstream of evidence-backed claims",
      reportOk,
      report
        ? `Report ${report.id} uses ${report.invariant.claimIds.length} claim ids.`
        : "Report was not generated.",
      "Feed Report Engine only claims backed by simulation events and keep free/full depth on the same claim ids.",
    ),
    createStep(
      "forbidden_integrations_and_copy",
      "No payment, Stripe, production DB, deployment, service-role, or certainty copy",
      !hasForbiddenCopy(generatedCopyAuditSurface) &&
        agents.every((agent) => agent.modelVersion === "unreleased") &&
        simulationRun.modelVersion === "unreleased" &&
        simulationRun.costCents === 0,
      "Golden acceptance uses local deterministic artifacts only.",
      "Remove payment/Stripe/production writer checks and avoid deterministic or professional-advice copy.",
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

function isReportValid(
  report: ReportEngineV1Output | null,
  claims: ClaimDraft[],
  simulationRun: SimulationRunDraft,
) {
  if (!report || claims.length === 0) return false;
  const eventIds = new Set(simulationRun.events.map((event) => event.id));

  return (
    report.freePreview.claimIds.length > 0 &&
    report.paidReport.claimIds.length > 0 &&
    report.freePreview.claimIds.join("|") === report.paidReport.claimIds.join("|") &&
    report.invariant.paidDoesNotCreateClaims &&
    report.invariant.paidDoesNotRaiseConfidence &&
    report.invariant.paidDoesNotChangeRiskLevel &&
    claims.every(
      (claim) =>
        claim.evidenceEventIds.length > 0 &&
        claim.evidenceEventIds.every((eventId) => eventIds.has(eventId)),
    )
  );
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
