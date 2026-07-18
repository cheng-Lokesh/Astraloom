import { buildAgentProfiles } from "@/lib/agents/build";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import { extractPeopleCandidates } from "@/lib/people/extract";
import { buildRelationEdges } from "@/lib/relations/build";
import { buildReportEngineV1 } from "@/lib/reports/report-engine";
import { normalizeSeedContextDraft } from "@/lib/seed-context/storage";
import { buildSimulationEngineV1Run } from "@/lib/simulation/simulation-engine";
import type { KeyPersonDraft } from "@/types/key-person";

const fixedNow = "2026-01-15T09:00:00.000Z";

export function buildV1Seed(overrides: Record<string, unknown> = {}) {
  return normalizeSeedContextDraft({
    id: "seed_v1_career_baseline",
    questionText: "Should I accept the new role or stay with my current team?",
    trackType: "crossroad",
    timeWindow: "90_days",
    destinyBirthInfo: "",
    currentQuestionDescription:
      "I am choosing between accepting a new role and staying with my current team for a possible promotion.",
    situationSummary:
      "My manager controls the promotion timeline, a recruiter needs an answer next week, and a colleague warned that the internal budget may be delayed.",
    recentEvents:
      "The recruiter sent a written offer and my manager asked for another week before confirming the promotion budget.",
    recentEventsText:
      "The recruiter sent a written offer and my manager asked for another week before confirming the promotion budget.",
    keyPeopleText: "My manager, the recruiter, and a trusted colleague.",
    decisionOptions:
      "Accept the offer, stay for the promotion, or negotiate one more week.",
    decisionOptionsText:
      "Accept the offer, stay for the promotion, or negotiate one more week.",
    worries: "The promotion promise may not be funded.",
    forbiddenActions: "Do not infer private thoughts or guarantee an outcome.",
    forbiddenActionsText:
      "Do not infer private thoughts or guarantee an outcome.",
    safetyBoundaries: "Use only observable information and cautious assumptions.",
    desiredOutput: "Compare the decision paths and their evidence-linked risks.",
    desiredOutputText:
      "Compare the decision paths and their evidence-linked risks.",
    privacyAck: true,
    privacySafetyAck: true,
    locale: "en",
    status: "submitted",
    createdAt: fixedNow,
    updatedAt: fixedNow,
    ...overrides,
  });
}

export function buildConfirmedPeople() {
  const seed = buildV1Seed();
  return extractPeopleCandidates(seed)
    .slice(0, 5)
    .map(
      (person): KeyPersonDraft => ({
        ...person,
        confirmed: true,
        status: "confirmed",
        confidence: Math.max(62, person.confidence),
        updatedAt: fixedNow,
      }),
    );
}

export function buildV1CoreChain(seedOverrides: Record<string, unknown> = {}) {
  const seedContext = buildV1Seed(seedOverrides);
  const people = buildConfirmedPeople();
  const agents = buildAgentProfiles(seedContext, people, true);
  const relationEdges = buildRelationEdges(seedContext.id, agents);
  const agentEcology = {
    seedContextId: seedContext.id,
    includeParallelSelves: true,
    agents,
    updatedAt: fixedNow,
  };
  const simulationRun = buildSimulationEngineV1Run({
    seedContext,
    agentEcology,
    relationEdges,
    status: "queued",
  });
  const claimLedger = buildClaimLedgerDraft(seedContext.id, simulationRun);
  const report = buildReportEngineV1({
    seedContext,
    simulationRun,
    claims: claimLedger.claims,
    agents,
    relationEdges,
  });

  return {
    seedContext,
    people,
    agents,
    relationEdges,
    agentEcology,
    simulationRun,
    claimLedger,
    report,
  };
}

export function withoutTemporalFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutTemporalFields);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          ![
            "createdAt",
            "updatedAt",
            "generatedAt",
            "lockedAt",
          ].includes(key),
      )
      .map(([key, nested]) => [key, withoutTemporalFields(nested)]),
  );
}
