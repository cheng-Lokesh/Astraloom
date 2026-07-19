import type { RealityIntakeDraft } from "@/types/reality-intake";
import type { SeedContextDraft } from "@/types/seed-context";

import { createStableRealityBoundaryIdFactoryV2 } from "./ids";
import type {
  AssumptionInputV2,
  EvidenceItemInputV2,
  RealityBoundaryRuntimeV2,
} from "./types";

export const fixedNowV2 = "2026-07-19T09:00:00.000Z";

export function createFixedRuntimeV2(): RealityBoundaryRuntimeV2 {
  return {
    clock: () => fixedNowV2,
    idFactory: createStableRealityBoundaryIdFactoryV2(),
  };
}

export function evidenceInputV2(
  overrides: Partial<EvidenceItemInputV2> = {},
): EvidenceItemInputV2 {
  return {
    statement: "The written offer expires on Friday.",
    claimKey: "offer.expiry",
    sourceKind: "user_statement",
    sourceTier: "unrated",
    verificationStatus: "unverified",
    provenance: [
      {
        sourceRef: "seed:situationSummary",
        locator: "situationSummary:0",
        capturedAt: fixedNowV2,
      },
    ],
    limitations: ["User-provided statement; not independently verified."],
    ...overrides,
  };
}

export function assumptionInputV2(
  overrides: Partial<AssumptionInputV2> = {},
): AssumptionInputV2 {
  return {
    statement: "The manager may delay the promotion decision.",
    subjectType: "third_party",
    category: "third_party_intent",
    epistemicStatus: "inferred",
    impactLevel: "high",
    supportingRealEvidenceIds: [],
    contradictingRealEvidenceIds: [],
    limitations: ["The manager's private intent is unknown."],
    confirmationRequirement: "required",
    confirmationStatus: "pending",
    ...overrides,
  };
}

export function seedContextV1(): SeedContextDraft {
  return {
    id: "seed_stage_2_adapter",
    questionText: "Should I accept the new role?",
    trackType: "crossroad",
    timeWindow: "90_days",
    destinyBirthInfo: "1990-01-01 08:00 Shanghai",
    currentQuestionDescription: "I am comparing a new role with staying.",
    situationSummary:
      "The recruiter sent a written offer. My manager has not confirmed the promotion budget.",
    recentEvents: "The recruiter asked for an answer by Friday.",
    recentEventsText: "The recruiter asked for an answer by Friday.",
    keyPeopleText: "My manager, a recruiter, and a trusted colleague.",
    decisionOptions: "Accept, stay, or negotiate more time.",
    decisionOptionsText: "Accept, stay, or negotiate more time.",
    worries: "The promotion budget may not exist.",
    desiredOutput: "Tell me which path wins.",
    desiredOutputText: "Tell me which path wins.",
    missingContextHints: ["The promotion approval date is unknown."],
    forbiddenActions: "Do not infer private thoughts.",
    safetyBoundaries: "Keep unknowns explicit.",
    privacyAck: true,
    privacySafetyAck: true,
    locale: "en",
    status: "submitted",
    createdAt: fixedNowV2,
    updatedAt: fixedNowV2,
  };
}

export function realityIntakeV1(): RealityIntakeDraft {
  return {
    id: "reality_intake_stage_2_adapter",
    seedContextId: "seed_stage_2_adapter",
    mode: "external_reality",
    manualSources: [
      {
        id: "manual_offer",
        title: "Offer notes",
        sourceType: "offer_terms",
        content: "The offer lists a Friday response deadline.",
        userProvidedAt: fixedNowV2,
        relevanceToQuestion: "Directly relevant.",
        extractedNodeHints: ["opportunity source"],
        extractedPressureHints: ["timing pressure"],
        confidence: 78,
      },
    ],
    externalSources: [
      {
        id: "external_company_page",
        questionId: "search_company",
        title: "Company careers page",
        url: "https://example.com/careers",
        sourceType: "company",
        retrievedAt: fixedNowV2,
        summary: "The company describes the role as hybrid.",
        relevantNodes: ["New employer"],
        relevantPressures: ["Commute expectations"],
        limitations: ["Search summary was not independently verified."],
        confidence: 80,
      },
    ],
    missingExternalInfo: ["The current employer's approved budget is unknown."],
    intakeSummary: "Manual and external material attached.",
    confidence: 76,
    llmStatus: {
      enabled: true,
      attempted: true,
      succeeded: true,
      fallback: false,
      provider: "deepseek",
    },
    llmExtraction: {
      sourceType: "llm_extraction",
      provider: "deepseek",
      model: "test-model",
      promptVersion: "reality-intake-v1",
      primaryDomain: "career",
      groundedRealityNodes: [
        {
          label: "Manager",
          nodeType: "person",
          sourceText: "My manager has not confirmed the budget.",
          roleInSituation: "May control the internal promotion decision.",
          resourcesControlled: ["Promotion approval"],
          informationHeld: ["Budget status"],
          opportunitiesProvided: [],
          constraintsCreated: ["Decision delay"],
          confidence: 68,
          evidenceRefs: ["seed:situationSummary"],
        },
      ],
      groundedRealityPressures: [
        {
          sourceLabel: "Manager",
          targetLabel: "User",
          pressureType: "information_gap",
          explanation: "The approval timing remains uncertain.",
          confidence: 64,
          evidenceRefs: ["seed:situationSummary"],
        },
      ],
      externalInfoNeeded: true,
      searchQuestions: [
        {
          id: "search_budget",
          question: "Has the promotion budget been approved?",
          reason: "The decision depends on approval.",
          expectedSourceType: "company",
          priority: 90,
          confidence: 60,
        },
      ],
      clarificationQuestions: [],
      missingInfo: [
        {
          missingField: "promotion approval date",
          whyItMatters: "It changes the timing comparison.",
        },
      ],
      safetyNotes: {
        deterministic_fate_risk: false,
        medical_legal_financial_risk: false,
        self_harm_or_crisis_risk: false,
        privacy_risk: false,
      },
      warnings: [],
      createdAt: fixedNowV2,
    },
    createdAt: fixedNowV2,
  };
}
