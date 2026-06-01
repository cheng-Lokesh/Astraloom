import type {
  ExternalRealityExpectedSourceType,
  ExternalRealitySource,
} from "@/types/reality-intake";

type ValidationResult =
  | { ok: true; sources: ExternalRealitySource[]; warnings: string[] }
  | { ok: false; sources: ExternalRealitySource[]; warnings: string[]; errors: string[] };

const bannedConclusionPhrases = [
  "final conclusion",
  "final finding",
  "therefore you should",
  "guaranteed",
  "destined",
  "must happen",
  "必然",
  "注定",
  "一定会",
];

const sourceTypes = new Set<ExternalRealityExpectedSourceType>([
  "job_market",
  "policy",
  "company",
  "news",
  "city",
  "industry",
  "education",
  "migration",
  "finance",
  "relationship_context",
  "other",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
}

function clampConfidence(value: unknown, hasUrl: boolean) {
  const numeric = typeof value === "number" ? value : Number(value);
  const fallback = hasUrl ? 55 : 45;
  const cap = hasUrl ? 80 : 60;
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(5, Math.min(cap, Math.round(numeric)));
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function hasBannedConclusion(source: ExternalRealitySource) {
  const content = `${source.title}\n${source.summary}\n${source.relevantNodes.join("\n")}\n${source.relevantPressures.join("\n")}`.toLowerCase();
  return bannedConclusionPhrases.some((phrase) => content.includes(phrase.toLowerCase()));
}

function sourceType(value: unknown): ExternalRealityExpectedSourceType {
  return sourceTypes.has(value as ExternalRealityExpectedSourceType)
    ? (value as ExternalRealityExpectedSourceType)
    : "other";
}

export function validateExternalRealitySources({
  rawSources,
  questionId,
  fallbackSourceType,
  retrievedAt,
}: {
  rawSources: unknown[];
  questionId: string;
  fallbackSourceType: ExternalRealityExpectedSourceType;
  retrievedAt: string;
}): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const sources = rawSources.slice(0, 5).flatMap((raw, index) => {
    if (!isRecord(raw)) {
      warnings.push(`Search result ${index + 1} was ignored because it was not an object.`);
      return [];
    }

    const title = asString(raw.title);
    const url = asString(raw.url);
    const summary = asString(raw.summary) || asString(raw.contentSummary) || asString(raw.snippet);
    if (!title && !url && !summary) {
      errors.push("External source must include title, url, or summary.");
      return [];
    }

    const source: ExternalRealitySource = {
      id:
        asString(raw.id) ||
        `ers_${questionId}_${stableHash(`${title}:${url}:${summary}:${index}`)}`,
      questionId,
      title: title || url || `External source ${index + 1}`,
      url,
      sourceType: sourceType(raw.sourceType) || fallbackSourceType,
      retrievedAt: asString(raw.retrievedAt) || retrievedAt,
      summary,
      contentSummary: summary,
      relevantNodes: asStringArray(raw.relevantNodes),
      relevantPressures: asStringArray(raw.relevantPressures),
      limitations: asStringArray(raw.limitations),
      confidence: clampConfidence(raw.confidence, Boolean(url)),
    };

    if (!source.retrievedAt) {
      errors.push("External source summary must be marked with retrievedAt.");
    }
    if (hasBannedConclusion(source)) {
      errors.push("External source must not contain final conclusions or deterministic predictions.");
    }
    if (!source.url) {
      source.limitations = Array.from(
        new Set([
          ...source.limitations,
          "No source URL was returned; confidence is capped at 60.",
        ]),
      );
    }

    return [source];
  });

  return errors.length
    ? { ok: false, sources, warnings, errors }
    : { ok: true, sources, warnings };
}

