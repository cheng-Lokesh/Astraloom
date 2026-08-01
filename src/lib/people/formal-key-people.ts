import { extractPeopleCandidates } from "@/lib/people/extract";
import type { SeedContextDraft } from "@/types/seed-context";

export type SubmittedSeedRecord = {
  id: string;
  user_question: string;
  simulation_track: "crossroad";
  time_horizon: "30_days" | "90_days";
  raw_context: string;
  decision_options: unknown;
  forbidden_actions: unknown;
  desired_output: unknown;
  safety_flags: unknown;
};

export type FormalCandidate = {
  display_name: string;
  relationship_to_user: string;
  role_type: string;
  confidence: number;
  known_evidence: string[];
  missing_fields: string[];
  source: "key_people_text" | "seed_context_text";
};

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join(" ")
    : "";
}

function desiredOutputText(value: unknown) {
  return value && typeof value === "object" && "text" in value && typeof value.text === "string"
    ? value.text
    : "";
}

/** Builds the existing deterministic extractor input from a submitted DB record only. */
export function submittedSeedToDraft(seed: SubmittedSeedRecord): SeedContextDraft {
  const timestamp = "2026-01-01T00:00:00.000Z";

  return {
    id: seed.id,
    questionText: seed.user_question,
    trackType: "crossroad",
    timeWindow: seed.time_horizon,
    situationSummary: seed.raw_context,
    recentEvents: "",
    keyPeopleText: "",
    decisionOptions: textList(seed.decision_options),
    worries: textList(seed.safety_flags),
    forbiddenActions: textList(seed.forbidden_actions),
    safetyBoundaries: textList(seed.forbidden_actions),
    desiredOutput: desiredOutputText(seed.desired_output),
    privacyAck: true,
    privacySafetyAck: true,
    locale: "en",
    status: "submitted",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * The formal API deliberately never returns raw Seed prose.  Candidate evidence
 * remains a stable provenance label while the original submitted Seed stays in
 * the owner-scoped seed record.
 */
export function extractFormalCandidates(seed: SubmittedSeedRecord): FormalCandidate[] {
  return extractPeopleCandidates(submittedSeedToDraft(seed)).map((candidate) => ({
    display_name: candidate.label.trim(),
    relationship_to_user: candidate.relationshipToUser,
    role_type: candidate.roleType,
    confidence: Math.max(0, Math.min(100, Math.round(candidate.confidence))),
    known_evidence: ["Derived from the submitted Seed context."],
    missing_fields: candidate.missingFields.map((field) => field.trim()).filter(Boolean),
    source: candidate.source === "key_people_text" ? "key_people_text" : "seed_context_text",
  }));
}
