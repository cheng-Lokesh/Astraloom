import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import type { BirthInfo, DestinyMode, DestinyProfileDraft } from "@/types/destiny";
import type {
  ClarificationQuestion,
  MissingInfoType,
  SandboxReadiness,
  SandboxReadinessEvaluation,
} from "@/types/clarification";
import type { SeedContextDraft } from "@/types/seed-context";

type EvaluateSandboxReadinessInput = {
  seedContext: SeedContextDraft;
  birthInfo?: BirthInfo | null;
  destinyMode?: DestinyMode;
  destinyProfile?: DestinyProfileDraft | null;
  maxQuestions?: number;
};

const vagueTopicPattern =
  /^(help|help me|what should i do|what do i do|i am confused|not sure|unsure|怎么办|怎么做|不知道|帮我看看)$/i;
const vagueShortPattern =
  /\b(help|confused|not sure|unsure|what to do)\b|怎么办|怎么做|不知道|帮我看看/i;
const personPattern =
  /\b(manager|boss|partner|family|mother|father|friend|colleague|coworker|client|recruiter|teacher|mentor|spouse|team|company|hr|investor|customer|landlord|roommate)\b|[\u4e00-\u9fff]{2,}(?:同事|老板|领导|伴侣|家人|朋友|客户|老师|父母|招聘|合伙|对象)/i;
const eventPattern =
  /\b(yesterday|today|recently|last|this week|this month|next week|deadline|said|asked|told|promised|offered|changed|happened|met|called|messaged|emailed|for \w+ (days|weeks|months|years))\b|最近|昨天|今天|上周|下周|截止|说|问|承诺|发生|变化|通知|见面|沟通/i;
const optionPattern =
  /\b(should|whether|decide|decision|choose|choice|between|option|accept|stay|leave|wait|ask|move|continue|stop|start|negotiate|compare|or)\b|是否|要不要|选择|纠结|还是|或者|离开|留下|接受|等待|沟通|谈判|比较/i;

function text(value: string | undefined) {
  return value?.trim() ?? "";
}

function currentDescription(seedContext: SeedContextDraft) {
  return (
    text(seedContext.currentQuestionDescription) ||
    text(seedContext.situationSummary) ||
    text(seedContext.questionText)
  );
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function scoreThemeClarity(description: string, seedContext: SeedContextDraft) {
  const normalized = description.trim();
  if (vagueTopicPattern.test(normalized)) return 0.1;
  if (normalized.length < 80 && vagueShortPattern.test(normalized)) return 0.1;
  if (description.length >= 90 || text(seedContext.questionText).length >= 24) return 1;
  if (description.length >= 45) return 0.65;
  if (description.length >= 20) return 0.35;
  return 0;
}

function scorePersonClarity(description: string, seedContext: SeedContextDraft) {
  if (text(seedContext.keyPeopleText) || personPattern.test(description)) return 1;
  if (/\b(I|me|my|we|our)\b/i.test(description) && description.length >= 80) return 0.45;
  return 0;
}

function scoreEventClarity(description: string, seedContext: SeedContextDraft) {
  if (text(seedContext.recentEvents) || text(seedContext.recentEventsText)) return 1;
  if (eventPattern.test(description)) return 1;
  if (description.length >= 140) return 0.5;
  return 0;
}

function scoreDilemmaClarity(description: string, seedContext: SeedContextDraft) {
  if (text(seedContext.decisionOptions) || text(seedContext.decisionOptionsText)) return 1;
  if (optionPattern.test(description)) return 1;
  if (description.includes("?") || description.includes("？")) return 0.7;
  return 0;
}

function destinyScore(
  mode: DestinyMode,
  birthInfo?: BirthInfo | null,
  profile?: DestinyProfileDraft | null,
) {
  if (profile) return profile.confidence.score / 100;
  if (mode === "full") return 0.82;
  if (mode === "rough") return birthInfo?.birthDate ? 0.58 : 0.35;
  return 0;
}

function resolveMode(input: EvaluateSandboxReadinessInput): DestinyMode {
  if (input.destinyMode) return input.destinyMode;
  if (input.destinyProfile) return input.destinyProfile.mode;
  if (input.birthInfo?.birthDate && input.birthInfo.birthTime && input.birthInfo.birthPlace) return "full";
  if (input.birthInfo?.birthDate) return "rough";
  return "skipped";
}

function missingInfoTypes({
  description,
  seedContext,
  mode,
  birthInfo,
  safetyDecision,
}: {
  description: string;
  seedContext: SeedContextDraft;
  mode: DestinyMode;
  birthInfo?: BirthInfo | null;
  safetyDecision: SafetyDecision;
}) {
  const missing: MissingInfoType[] = [];

  if (scoreThemeClarity(description, seedContext) < 0.55) missing.push("topic_unclear");
  if (scorePersonClarity(description, seedContext) < 0.55) missing.push("key_people_missing");
  if (scoreEventClarity(description, seedContext) < 0.55) missing.push("recent_event_missing");
  if (scoreDilemmaClarity(description, seedContext) < 0.55) missing.push("decision_options_missing");
  if (mode === "rough" && birthInfo?.birthDate && !birthInfo.birthTime) missing.push("destiny_birth_time_missing");
  if (mode === "skipped") missing.push("destiny_skipped");
  if (safetyDecision.safetyLevel !== "safe") missing.push("safety_sensitive");

  return unique(missing);
}

function questionFor(type: MissingInfoType): ClarificationQuestion | null {
  if (type === "topic_unclear") {
    return {
      id: "clarify_topic",
      missingInfoType: type,
      prompt: "What is the main situation you want the sandbox to focus on?",
      helper: "One sentence is enough. Keep it concrete.",
      placeholder: "Example: I am deciding whether to change jobs after a delayed promotion promise.",
    };
  }

  if (type === "key_people_missing") {
    return {
      id: "clarify_people",
      missingInfoType: type,
      prompt: "Who are the key people or roles involved?",
      helper: "Names are optional. Roles are enough.",
      placeholder: "Example: my manager, a recruiter, one trusted colleague, my partner.",
    };
  }

  if (type === "decision_options_missing") {
    return {
      id: "clarify_options",
      missingInfoType: type,
      prompt: "What choice or stage are you in right now?",
      helper: "You do not need to list every option perfectly.",
      options: [
        "I am deciding whether to move or stay.",
        "I am choosing between two paths.",
        "I mainly need to observe before acting.",
      ],
      placeholder: "Example: I am choosing between accepting the offer and waiting for a clearer timeline.",
    };
  }

  if (type === "recent_event_missing") {
    return {
      id: "clarify_event",
      missingInfoType: type,
      prompt: "What recent signal or event made this question active now?",
      helper: "A short timing anchor helps the sandbox avoid vague output.",
      placeholder: "Example: the recruiter asked for an answer next week.",
    };
  }

  if (type === "safety_sensitive") {
    return {
      id: "clarify_safety",
      missingInfoType: type,
      prompt: "What safety boundary should Astraloom respect in this run?",
      helper: "Keep this about low-risk structure review, not surveillance, coercion, or professional advice.",
      placeholder: "Example: keep suggestions to low-pressure communication only.",
    };
  }

  return null;
}

function buildQuestions(missing: MissingInfoType[], maxQuestions: number) {
  const priority: MissingInfoType[] = [
    "safety_sensitive",
    "topic_unclear",
    "key_people_missing",
    "decision_options_missing",
    "recent_event_missing",
  ];

  return priority
    .filter((type) => missing.includes(type))
    .map(questionFor)
    .filter((question): question is ClarificationQuestion => Boolean(question))
    .slice(0, maxQuestions);
}

function readinessFor(
  completenessScore: number,
  missing: MissingInfoType[],
  safetyDecision: SafetyDecision,
): SandboxReadiness {
  if (safetyDecision.safetyLevel === "blocked") return "blocked";

  const blockingMissing = missing.filter(
    (type) => type !== "destiny_birth_time_missing" && type !== "destiny_skipped",
  );

  if (missing.length === 1 && missing[0] === "destiny_birth_time_missing") return "low_confidence_ready";
  if (blockingMissing.includes("topic_unclear")) return "needs_clarification";
  if (completenessScore < 52 && blockingMissing.length > 0) return "needs_clarification";
  if (blockingMissing.length >= 2) return "needs_clarification";
  if (completenessScore < 76 || missing.length > 0) return "low_confidence_ready";

  return "ready";
}

function lowConfidenceReason(readiness: SandboxReadiness, missing: MissingInfoType[]) {
  if (readiness === "ready" || readiness === "blocked") return null;
  if (missing.includes("destiny_birth_time_missing")) {
    return "Birth time is missing, so the destiny layer stays directional.";
  }
  if (missing.includes("destiny_skipped")) {
    return "Destiny context was skipped, so the run relies on current-situation evidence.";
  }
  if (missing.includes("topic_unclear")) {
    return "The current question is still broad, so a short clarification can improve the sandbox.";
  }
  return "Some reality details are sparse, so the sandbox can continue with lower confidence.";
}

export function evaluateSandboxReadiness(
  input: EvaluateSandboxReadinessInput,
): SandboxReadinessEvaluation {
  const description = currentDescription(input.seedContext);
  const mode = resolveMode(input);
  const safetyDecision = verifySafety({ seedContext: input.seedContext });
  const themeClarity = scoreThemeClarity(description, input.seedContext);
  const personClarity = scorePersonClarity(description, input.seedContext);
  const eventClarity = scoreEventClarity(description, input.seedContext);
  const dilemmaClarity = scoreDilemmaClarity(description, input.seedContext);
  const realityScore =
    themeClarity * 0.4 +
    personClarity * 0.25 +
    eventClarity * 0.2 +
    dilemmaClarity * 0.15;
  const destinyWeight = mode === "skipped" ? 0 : 0.25;
  const realityWeight = 1 - destinyWeight;
  const completenessScore = clampScore(
    100 *
      (destinyScore(mode, input.birthInfo, input.destinyProfile) * destinyWeight +
        realityScore * realityWeight),
  );
  const missing = missingInfoTypes({
    description,
    seedContext: input.seedContext,
    mode,
    birthInfo: input.birthInfo ?? input.destinyProfile?.birthInfo,
    safetyDecision,
  });
  const readiness = readinessFor(completenessScore, missing, safetyDecision);
  const questions =
    readiness === "needs_clarification"
      ? buildQuestions(missing, input.maxQuestions ?? 3)
      : [];

  return {
    readiness,
    completenessScore,
    missingInfoTypes: missing,
    questions,
    canSkip: readiness !== "blocked",
    lowConfidenceReason: lowConfidenceReason(readiness, missing),
    safetyDecision,
  };
}
