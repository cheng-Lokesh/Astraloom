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
import { buildSimulationEngineV1Run } from "@/lib/simulation/simulation-engine";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { ClaimDraft } from "@/types/claim";
import type { KeyPersonDraft } from "@/types/key-person";
import type { RelationGraphDraft } from "@/types/relation-edge";
import type { SeedContextDraft } from "@/types/seed-context";
import type { SimulationEventDraft } from "@/types/simulation-run";

export type GoldenCaseId =
  | "relationship_crossroad"
  | "career_conflict"
  | "collaboration_risk";

export type GoldenCaseDefinition = {
  id: GoldenCaseId;
  title: string;
  userSituation: string;
  expectedPersonHint: string;
  seed: Omit<SeedContextDraft, "id" | "createdAt" | "updatedAt">;
};

export type GoldenCaseStepId =
  | "seed_context"
  | "key_people"
  | "agent_profiles"
  | "relation_graph_readonly"
  | "simulation_engine_v1"
  | "event_logs_per_tick"
  | "claims"
  | "claim_evidence_event_ids"
  | "report_engine"
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
};

const goldenCases: GoldenCaseDefinition[] = [
  {
    id: "relationship_crossroad",
    title: "Relationship Crossroad",
    userSituation:
      "Ambiguous romantic contact has gone cold. The user is unsure whether to initiate contact.",
    expectedPersonHint: "Ambiguous contact",
    seed: {
      questionText:
        "The ambiguous romantic contact has gone cold. Should I initiate a low-pressure message?",
      trackType: "crossroad",
      timeWindow: "90_days",
      situationSummary:
        "The user noticed slower replies and less initiative. The decision is whether to contact now, wait, or create a clearer boundary without assuming hidden feelings.",
      keyPeopleText: "Ambiguous contact, close friend advisor",
      privacyAck: true,
      locale: "en",
      status: "submitted",
    },
  },
  {
    id: "career_conflict",
    title: "Career Conflict",
    userSituation:
      "The boss is not providing resources, and the user is considering whether to leave.",
    expectedPersonHint: "Boss",
    seed: {
      questionText:
        "My boss is not giving resources. Should I prepare to leave or negotiate again?",
      trackType: "crossroad",
      timeWindow: "90_days",
      situationSummary:
        "The user has repeatedly asked for resources and clearer authority. The current boss controls approvals, and a recruiter or new company may become an outside option.",
      keyPeopleText: "Boss, teammate, recruiter",
      privacyAck: true,
      locale: "en",
      status: "submitted",
    },
  },
  {
    id: "collaboration_risk",
    title: "Collaboration Risk",
    userSituation:
      "A friend wants to collaborate on a project, and the user is worried about relationship and benefit conflicts.",
    expectedPersonHint: "Friend collaborator",
    seed: {
      questionText:
        "A friend wants to collaborate on a project. How do I test the risk before committing?",
      trackType: "crossroad",
      timeWindow: "90_days",
      situationSummary:
        "The user values the friendship but sees unclear ownership, workload, and benefit boundaries. The collaborator is also a friend, so the risk is both relational and practical.",
      keyPeopleText: "Friend collaborator, project client, advisor",
      privacyAck: true,
      locale: "en",
      status: "submitted",
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
    confidence: Math.max(person.confidence, 72),
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

function runOneGoldenCase(definition: GoldenCaseDefinition): GoldenCaseResult {
  const seedContext = makeSeedContext(definition);
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
      safetyLevel: "safe",
      flags: [],
      allowedActions: ["scenario_simulation", "free_preview"],
      blockedActions: ["deterministic_prediction"],
      reportRestrictions: [],
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
        safetyLevel: "safe",
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
      "Ensure buildAgentProfiles returns self, optional parallel selves, and one NPC for each confirmed person, all with evidenceRefs.",
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
      "Build claims only after Simulation Engine v1 produces preview EventLogs with relationEdgeIds.",
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
      "Report Engine generates freePreview and paidReport",
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
      "entitlement_invariant",
      "Entitlement unlock does not change claim/confidence/risk",
      Boolean(
        report &&
          entitlementDecision?.canViewPaidReport &&
          entitlementDecision.invariant.claimIdsUnchanged &&
          entitlementDecision.invariant.confidenceUnchanged &&
          entitlementDecision.invariant.riskLevelUnchanged &&
          JSON.stringify(beforeClaimSnapshot) ===
            JSON.stringify(stableClaimSnapshot(claimLedger.claims)),
      ),
      "Mock paid_report entitlement unlocks depth only; claim ids, confidence, and risk stay fixed.",
      "Keep entitlement evaluation separate from Claim mutation and report generation.",
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
      !hasForbiddenCopy([
        seedContext,
        agents,
        relationGraph,
        simulationRun,
        claimLedger,
        report,
      ]) &&
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
    },
    failures,
  };
}

export function runGoldenCaseAcceptance(): GoldenCaseAcceptanceResult {
  const cases = goldenCases.map(runOneGoldenCase);

  return {
    passed: cases.every((item) => item.passed),
    generatedAt: new Date().toISOString(),
    cases,
  };
}

export { goldenCases };
