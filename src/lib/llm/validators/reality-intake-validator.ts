import type { RealityIntakeTaskOutput } from "@/lib/llm/llm-task-types";
import type {
  ExternalRealityExpectedSourceType,
  RealityIntakePrimaryDomain,
} from "@/types/reality-intake";
import type { SeedContextDraft } from "@/types/seed-context";
import type { ManualRealitySource } from "@/types/reality-intake";

type EvidencePool = {
  userText: string;
  manualText: string;
};

type ValidationResult =
  | {
      ok: true;
      data: RealityIntakeTaskOutput;
      warnings: string[];
    }
  | {
      ok: false;
      errors: string[];
      warnings: string[];
    };

const allowedDomains: RealityIntakePrimaryDomain[] = [
  "career",
  "relationship",
  "collaboration",
  "family",
  "migration",
  "study",
  "finance",
  "self_direction",
  "other",
];

const allowedNodeTypes = new Set([
  "user",
  "person",
  "organization",
  "institution",
  "market",
  "policy",
  "opportunity_source",
  "resource_holder",
  "information_source",
  "constraint",
  "environment",
]);

const allowedPressureTypes = new Set([
  "resource_control",
  "information_gap",
  "timing_pressure",
  "market_pressure",
  "institutional_constraint",
  "emotional_pressure",
  "opportunity_pull",
  "competition",
  "support",
]);

const expectedSourceTypes = new Set([
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

const bannedPhrases = [
  "必然",
  "注定",
  "一定会",
  "克你",
  "这个人一定存在",
  "系统知道你真实遇到过谁",
];

function textPool(seedContext: SeedContextDraft, manualSources: ManualRealitySource[]) {
  return {
    userText: [
      seedContext.questionText,
      seedContext.currentQuestionDescription,
      seedContext.situationSummary,
      seedContext.recentEvents,
      seedContext.recentEventsText,
      seedContext.keyPeopleText,
      seedContext.decisionOptions,
      seedContext.decisionOptionsText,
      seedContext.worries,
      seedContext.forbiddenActions,
      seedContext.forbiddenActionsText,
      seedContext.desiredOutput,
      seedContext.desiredOutputText,
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase(),
    manualText: manualSources
      .map((source) => `${source.title}\n${source.content}`)
      .join("\n")
      .toLowerCase(),
  };
}

function hasBannedText(value: unknown) {
  const serialized = JSON.stringify(value);
  return bannedPhrases.some((phrase) => serialized.includes(phrase));
}

function stableQuestionId(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
}

function clamp(value: unknown, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return Math.min(40, max);
  return Math.max(5, Math.min(max, Math.round(numberValue)));
}

function expectedSourceType(value: unknown): ExternalRealityExpectedSourceType {
  if (typeof value !== "string") return "other";
  if (expectedSourceTypes.has(value)) {
    return value as ExternalRealityExpectedSourceType;
  }
  if (/job|career|salary|market/i.test(value)) return "job_market";
  if (/policy|visa|regulation/i.test(value)) return "policy";
  if (/company|employer|organization/i.test(value)) return "company";
  if (/school|education|university|study/i.test(value)) return "education";
  if (/migration|immigration|relocation/i.test(value)) return "migration";
  if (/finance|financial|money|investment/i.test(value)) return "finance";
  if (/relationship|family|social/i.test(value)) return "relationship_context";
  return "other";
}

function includesMeaningful(pool: string, sourceText: string) {
  const text = sourceText.trim().toLowerCase();
  if (!text) return false;
  if (text.length <= 12) return pool.includes(text);
  return pool.includes(text) || text.split(/\s+/).some((part) => part.length > 10 && pool.includes(part));
}

function evidenceCap(pool: EvidencePool, sourceText: string) {
  if (includesMeaningful(pool.userText, sourceText)) return 85;
  if (includesMeaningful(pool.manualText, sourceText)) return 80;
  if (sourceText.trim()) return 65;
  return 40;
}

function evidenceRef(pool: EvidencePool, sourceText: string, index: number) {
  if (includesMeaningful(pool.userText, sourceText)) return `seed:user_input:llm_node_${index}`;
  if (includesMeaningful(pool.manualText, sourceText)) return `manual-reality:llm_node_${index}`;
  if (sourceText.trim()) return `llm-inference:needs-review:${index}`;
  return `missing-evidence:llm_node_${index}`;
}

function parseJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

export function validateRealityIntakeJson({
  raw,
  seedContext,
  manualSources,
}: {
  raw: string;
  seedContext: SeedContextDraft;
  manualSources: ManualRealitySource[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsed: unknown;

  try {
    parsed = parseJson(raw);
  } catch {
    return {
      ok: false,
      errors: ["JSON parse failed."],
      warnings,
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      errors: ["Reality Intake output must be a JSON object."],
      warnings,
    };
  }

  if (hasBannedText(parsed)) {
    errors.push("Output contains forbidden deterministic or mind-reading wording.");
  }

  const record = parsed as Record<string, unknown>;
  const primaryDomain = allowedDomains.includes(record.primaryDomain as RealityIntakePrimaryDomain)
    ? (record.primaryDomain as RealityIntakePrimaryDomain)
    : "other";
  const pool = textPool(seedContext, manualSources);
  const externalInfoNeeded = record.externalInfoNeeded === true;
  const rawNodes = Array.isArray(record.groundedRealityNodes)
    ? record.groundedRealityNodes
    : [];

  const groundedRealityNodes = rawNodes.slice(0, 12).map((value, index) => {
    const node = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const sourceText = typeof node.sourceText === "string" ? node.sourceText.trim() : "";
    const cap = evidenceCap(pool, sourceText);
    const nodeType = typeof node.nodeType === "string" && allowedNodeTypes.has(node.nodeType)
      ? node.nodeType
      : "information_source";

    if (nodeType === "person" && !sourceText.trim()) {
      errors.push("groundedRealityNodes cannot contain a person without sourceText.");
    }
    if (cap === 40 && !externalInfoNeeded) {
      errors.push("groundedRealityNodes must trace to user input, manual material, or external search need.");
    }

    return {
      label: typeof node.label === "string" ? node.label.slice(0, 80) : `Reality node ${index + 1}`,
      nodeType,
      sourceText,
      roleInSituation:
        typeof node.roleInSituation === "string"
          ? node.roleInSituation.slice(0, 240)
          : "Grounded reality signal requiring review.",
      resourcesControlled: asStringArray(node.resourcesControlled),
      informationHeld: asStringArray(node.informationHeld),
      opportunitiesProvided: asStringArray(node.opportunitiesProvided),
      constraintsCreated: asStringArray(node.constraintsCreated),
      confidence: clamp(node.confidence, cap),
      evidenceRefs: [evidenceRef(pool, sourceText, index)],
    };
  });

  const labelSet = new Set(groundedRealityNodes.map((node) => node.label));
  const rawPressures = Array.isArray(record.groundedRealityPressures)
    ? record.groundedRealityPressures
    : [];
  const groundedRealityPressures = rawPressures.slice(0, 16).map((value, index) => {
    const pressure = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const sourceLabel = typeof pressure.sourceLabel === "string" ? pressure.sourceLabel : "";
    const targetLabel = typeof pressure.targetLabel === "string" ? pressure.targetLabel : "User";
    const relatedNode = groundedRealityNodes.find((node) => node.label === sourceLabel);

    if (sourceLabel && !labelSet.has(sourceLabel)) {
      warnings.push(`Pressure source "${sourceLabel}" did not match a grounded node label.`);
    }

    return {
      sourceLabel,
      targetLabel,
      pressureType:
        typeof pressure.pressureType === "string" &&
        allowedPressureTypes.has(pressure.pressureType)
          ? pressure.pressureType
          : "information_gap",
      explanation:
        typeof pressure.explanation === "string"
          ? pressure.explanation.slice(0, 260)
          : "Pressure requires review because the model did not provide a grounded explanation.",
      confidence: clamp(pressure.confidence, relatedNode?.confidence ?? 65),
      evidenceRefs: relatedNode?.evidenceRefs ?? [`llm-pressure:needs-review:${index}`],
    };
  });

  const searchQuestions = (Array.isArray(record.searchQuestions)
    ? record.searchQuestions
    : []
  )
    .slice(0, 6)
    .map((value) => {
      const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
      const question = typeof item.question === "string" ? item.question.slice(0, 180) : "";
      return {
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id.slice(0, 80)
            : `search_question_${stableQuestionId(question)}`,
        question,
        reason: typeof item.reason === "string" ? item.reason.slice(0, 180) : "",
        expectedSourceType: expectedSourceType(item.expectedSourceType),
        priority: clamp(item.priority, 100),
        confidence: clamp(item.confidence, 65),
      };
    })
    .filter((item) => item.question);

  const missingInfo = (Array.isArray(record.missingInfo) ? record.missingInfo : [])
    .slice(0, 8)
    .map((value) => {
      const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
      return {
        missingField: typeof item.missingField === "string" ? item.missingField.slice(0, 120) : "",
        whyItMatters: typeof item.whyItMatters === "string" ? item.whyItMatters.slice(0, 180) : "",
      };
    })
    .filter((item) => item.missingField);

  if ((searchQuestions.length > 0 || missingInfo.length > 0) && !externalInfoNeeded) {
    errors.push("externalInfoNeeded must be true when external reality information is insufficient.");
  }

  const clarificationQuestions = (Array.isArray(record.clarificationQuestions)
    ? record.clarificationQuestions
    : []
  )
    .slice(0, 3)
    .map((value) => {
      const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
      return {
        question: typeof item.question === "string" ? item.question.slice(0, 180) : "",
        reason: typeof item.reason === "string" ? item.reason.slice(0, 180) : "",
        required: item.required === true,
      };
    })
    .filter((item) => item.question);

  const safety = record.safetyNotes && typeof record.safetyNotes === "object"
    ? record.safetyNotes as Record<string, unknown>
    : {};

  if (errors.length) return { ok: false, errors, warnings };

  return {
    ok: true,
    warnings,
    data: {
      primaryDomain,
      groundedRealityNodes,
      groundedRealityPressures,
      externalInfoNeeded,
      searchQuestions,
      clarificationQuestions,
      missingInfo,
      safetyNotes: {
        deterministic_fate_risk: safety.deterministic_fate_risk === true,
        medical_legal_financial_risk: safety.medical_legal_financial_risk === true,
        self_harm_or_crisis_risk: safety.self_harm_or_crisis_risk === true,
        privacy_risk: safety.privacy_risk === true,
      },
    },
  };
}
