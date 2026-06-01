import type { SeedContextDraft } from "@/types/seed-context";
import type {
  ExternalRealitySource,
  ManualRealitySource,
  ManualRealitySourceType,
  RealityIntakeDraft,
  RealityIntakeMode,
} from "@/types/reality-intake";

const nodeHintRules: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /manager|boss|leader|主管|老板|负责人|领导/i, hint: "authority person" },
  { pattern: /company|team|organization|公司|团队|组织/i, hint: "organization" },
  { pattern: /policy|rule|visa|regulation|政策|规则|签证|制度/i, hint: "policy or institution" },
  { pattern: /offer|opportunity|role|position|机会|岗位|职位|录用/i, hint: "opportunity source" },
  { pattern: /market|salary|budget|pricing|市场|薪资|预算|价格/i, hint: "market or resource holder" },
  { pattern: /contract|agreement|terms|协议|合同|条款/i, hint: "agreement constraint" },
];

const pressureHintRules: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /deadline|timeline|urgent|到期|截止|时间|紧急/i, hint: "timing pressure" },
  { pattern: /budget|salary|money|cost|预算|薪资|钱|成本/i, hint: "resource pressure" },
  { pattern: /approval|permission|authority|批准|权限|审批/i, hint: "approval pressure" },
  { pattern: /unclear|unknown|missing|不清楚|未知|缺少/i, hint: "information gap" },
  { pattern: /risk|constraint|limit|风险|约束|限制/i, hint: "constraint pressure" },
  { pattern: /competition|compete|candidate|竞争|候选/i, hint: "competition pressure" },
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function clampConfidence(value: number) {
  return Math.max(5, Math.min(95, Math.round(value)));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function hintsFor(
  content: string,
  rules: Array<{ pattern: RegExp; hint: string }>,
) {
  return unique(
    rules
      .filter((rule) => rule.pattern.test(content))
      .map((rule) => rule.hint),
  );
}

function relevanceFor(seedContext: SeedContextDraft, content: string) {
  const questionWords = new Set(
    [
      seedContext.questionText,
      seedContext.currentQuestionDescription,
      seedContext.situationSummary,
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fa5]+/)
      .filter((word) => word.length >= 2),
  );
  const overlap = content
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/)
    .filter((word) => questionWords.has(word)).length;

  if (overlap >= 6) return "Directly overlaps with the user's question context.";
  if (overlap >= 2) return "Partly overlaps with the user's question context.";
  return "User provided this material as relevant grounding for the current question.";
}

export function buildManualRealitySource({
  seedContext,
  title,
  sourceType,
  content,
  now,
  id,
}: {
  seedContext: SeedContextDraft;
  title: string;
  sourceType: ManualRealitySourceType;
  content: string;
  now: string;
  id?: string;
}): ManualRealitySource | null {
  const trimmedContent = content.trim();
  if (!trimmedContent) return null;

  const extractedNodeHints = hintsFor(trimmedContent, nodeHintRules);
  const extractedPressureHints = hintsFor(trimmedContent, pressureHintRules);
  const baseConfidence = Math.min(
    78,
    48 +
      Math.min(18, Math.floor(trimmedContent.length / 120) * 4) +
      extractedNodeHints.length * 4 +
      extractedPressureHints.length * 3,
  );

  return {
    id: id || createId(`mrs_${seedContext.id}`),
    title: title.trim() || "Untitled real-world material",
    sourceType,
    content: trimmedContent,
    userProvidedAt: now,
    relevanceToQuestion: relevanceFor(seedContext, trimmedContent),
    extractedNodeHints,
    extractedPressureHints,
    confidence: clampConfidence(baseConfidence),
  };
}

export function buildRealityIntakeDraft({
  seedContext,
  manualSources,
  externalSources = [],
  now = new Date().toISOString(),
}: {
  seedContext: SeedContextDraft;
  manualSources: ManualRealitySource[];
  externalSources?: ExternalRealitySource[];
  now?: string;
}): RealityIntakeDraft {
  const cleanManualSources = manualSources
    .filter((source) => source.content.trim())
    .slice(0, 5);
  const cleanExternalSources = externalSources.filter(
    (source) =>
      source.title.trim() ||
      source.url?.trim() ||
      source.summary?.trim() ||
      source.contentSummary?.trim(),
  );
  const mode: RealityIntakeMode = cleanExternalSources.length
    ? "external_reality"
    : cleanManualSources.length
      ? "manual_reality"
      : "local_assumption";
  const missingExternalInfo =
    mode === "local_assumption"
      ? [
          "No manually provided real-world material.",
          "No external reality source was retrieved.",
        ]
      : mode === "manual_reality"
        ? ["No external reality source was retrieved; grounding is limited to user-provided material."]
        : [];
  const sourceCount = cleanManualSources.length + cleanExternalSources.length;
  const intakeSummary =
    mode === "local_assumption"
      ? "Local assumption mode only: the draft uses user input and deterministic local rules, not retrieved external reality data."
      : `${sourceCount} real-world material source${sourceCount === 1 ? "" : "s"} attached for grounded simulation.`;
  const averageSourceConfidence =
    [...cleanManualSources, ...cleanExternalSources].reduce(
      (sum, source) => sum + source.confidence,
      0,
    ) / Math.max(1, sourceCount);

  return {
    id: `reality_intake_${seedContext.id}`,
    seedContextId: seedContext.id,
    mode,
    manualSources: cleanManualSources,
    externalSources: cleanExternalSources,
    missingExternalInfo,
    intakeSummary,
    confidence: clampConfidence(
      mode === "local_assumption" ? 42 : Math.min(76, averageSourceConfidence),
    ),
    createdAt: now,
  };
}
