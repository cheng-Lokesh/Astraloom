import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";
import { getSeedContextNarrative } from "@/lib/seed-context/context-text";

type RoleRule = {
  label: string;
  role: string;
  relationshipToUser: string;
  roleType: string;
  pattern: RegExp;
  missingFields: string[];
};

const roleRules: RoleRule[] = [
  {
    label: "Current manager",
    role: "Promotion and resource owner",
    relationshipToUser: "boss",
    roleType: "authority",
    pattern: /上级|老板|领导|经理|主管|晋升|汇报|current manager|my manager|manager|boss|lead/i,
    missingFields: ["Recent commitment", "Verifiable timing", "Resource control scope"],
  },
  {
    label: "Recruiter",
    role: "Opportunity source",
    relationshipToUser: "opportunity_source",
    roleType: "opportunity",
    pattern: /招聘|猎头|HR|offer|新公司|面试|hiring|recruiter|new role|new company/i,
    missingFields: ["Offer conditions", "Decision deadline", "Uncertain factors"],
  },
  {
    label: "Trusted colleague",
    role: "Team signal source",
    relationshipToUser: "colleague",
    roleType: "support",
    pattern: /同事|团队|协作|搭档|teammate|colleague|trusted colleague|team/i,
    missingFields: ["Stance", "Information gap", "Influence scope"],
  },
  {
    label: "Partner or family",
    role: "Life boundary stakeholder",
    relationshipToUser: "family_or_partner",
    roleType: "emotional",
    pattern: /伴侣|家人|妻子|丈夫|对象|父母|spouse|partner|family/i,
    missingFields: ["Acceptable boundary", "Practical pressure", "Support condition"],
  },
  {
    label: "Collaborator",
    role: "Shared-interest stakeholder",
    relationshipToUser: "partner",
    roleType: "resource",
    pattern: /合伙|合作|创业|客户|投资人|cofounder|collaborator|client|investor/i,
    missingFields: ["Benefit boundary", "Resource input", "Exit condition"],
  },
  {
    label: "Competitor",
    role: "Resource competition stakeholder",
    relationshipToUser: "competitor",
    roleType: "conflict",
    pattern: /竞争|竞品|竞争者|对手|competitor|rival/i,
    missingFields: ["Competing resource", "Recent action", "Information source"],
  },
  {
    label: "Advisor",
    role: "External calibration source",
    relationshipToUser: "advisor",
    pattern: /导师|贵人|前辈|顾问|mentor|advisor/i,
    roleType: "support",
    missingFields: ["Advice stance", "Trustworthy basis", "Available resource"],
  },
];

const weakFragments = new Set([
  "我",
  "自己",
  "对方",
  "别人",
  "someone",
  "somebody",
  "person",
  "people",
  "person",
  "i",
  "me",
  "myself",
  "the",
  "a",
  "an",
]);

const contextStopWords = new Set([
  "I",
  "My",
  "The",
  "A",
  "An",
  "This",
  "That",
  "Should",
  "Accept",
  "Stay",
  "Ask",
  "Do",
  "Keep",
  "Show",
]);

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function cleanCandidate(value: string) {
  return value
    .replace(/^[\s"'<{[(]+/, "")
    .replace(/[\s"'>}\]),.。！!？?；;:：]+$/, "")
    .replace(/^(my|the|a|an)\s+/i, "")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) =>
      word.length ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word,
    )
    .join(" ");
}

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) ?? "";
}

function evidenceSnippet(text: string, label: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 320) return trimmed;

  const index = trimmed.toLowerCase().indexOf(label.toLowerCase());
  if (index === -1) return `${trimmed.slice(0, 280).trim()}...`;

  const start = Math.max(0, index - 120);
  const end = Math.min(trimmed.length, index + label.length + 180);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < trimmed.length ? "..." : "";

  return `${prefix}${trimmed.slice(start, end).trim()}${suffix}`;
}

function seedFieldText(seedContext: SeedContextDraft) {
  return {
    situationSummary: seedContext.situationSummary,
    keyPeopleText: seedContext.keyPeopleText,
    recentEvents: firstText(seedContext.recentEvents, seedContext.recentEventsText),
    decisionOptions: firstText(
      seedContext.decisionOptions,
      seedContext.decisionOptionsText,
    ),
    worries: seedContext.worries ?? "",
  };
}

function evidenceRef(
  seedContextId: string,
  source: KeyPersonDraft["source"],
  label: string,
  evidenceText = "",
) {
  return `seed:${seedContextId}:${source}:${hashText(`${label}:${evidenceText}`)}`;
}

function confidenceForSource(
  source: KeyPersonDraft["source"],
  label: string,
  evidenceText: string,
) {
  if (source === "manual") return 95;
  const exactMentionBonus = evidenceText.toLowerCase().includes(label.toLowerCase())
    ? 8
    : 0;
  const detailBonus = Math.min(10, Math.floor(evidenceText.length / 80));
  const sourceBase = source === "key_people_text" ? 78 : 58;

  return Math.min(
    source === "key_people_text" ? 92 : 82,
    sourceBase + exactMentionBonus + detailBonus + Math.min(label.length, 10),
  );
}

function roleRuleForRole(role: string) {
  return roleRules.find((rule) => rule.role === role);
}

function inferRule(value: string) {
  return roleRules.find((rule) => rule.pattern.test(value));
}

function missingFieldsForRole(role: string) {
  return roleRuleForRole(role)?.missingFields ?? [
    "关系类型",
    "最近互动",
    "可验证证据",
  ];
}

function relationshipForRole(role: string) {
  return roleRuleForRole(role)?.relationshipToUser ?? "unknown";
}

function roleTypeForRole(role: string) {
  return roleRuleForRole(role)?.roleType ?? "unknown";
}

function relationshipForLabel(label: string, role: string) {
  return inferRule(label)?.relationshipToUser ?? relationshipForRole(role);
}

function roleTypeForLabel(label: string, role: string) {
  return inferRule(label)?.roleType ?? roleTypeForRole(role);
}

function createPerson(
  seedContextId: string,
  label: string,
  role: string,
  evidenceText: string,
  source: KeyPersonDraft["source"],
  now: string,
): KeyPersonDraft {
  const cleanedLabel = cleanCandidate(label);
  const normalized = normalizeLabel(cleanedLabel);
  const snippet = evidenceSnippet(evidenceText, cleanedLabel);
  const confidence = confidenceForSource(source, cleanedLabel, snippet);
  const status = confidence < 70 ? "needs_confirmation" : "candidate";
  const resolvedRole = role || inferRule(cleanedLabel)?.role || "Unconfirmed stakeholder";
  const relationshipToUser = relationshipForLabel(cleanedLabel, resolvedRole);
  const roleType = roleTypeForLabel(cleanedLabel, resolvedRole);

  return {
    id: `kp_${hashText(`${seedContextId}:${normalized}`)}`,
    seedContextId,
    label: cleanedLabel,
    displayName: cleanedLabel,
    role: resolvedRole,
    relationshipToUser,
    roleType,
    confidence,
    knownEvidence: snippet,
    missingFields: missingFieldsForRole(resolvedRole),
    evidenceRefs: [evidenceRef(seedContextId, source, cleanedLabel, snippet)],
    userNote: "",
    confirmed: false,
    status,
    source,
    evidenceText: snippet,
    createdAt: now,
    updatedAt: now,
  };
}

function addUnique(
  candidates: Map<string, KeyPersonDraft>,
  person: KeyPersonDraft,
) {
  const key = normalizeLabel(person.label);
  if (!key || key.length < 2 || weakFragments.has(key) || candidates.has(key)) {
    return;
  }
  candidates.set(key, person);
}

function explicitPeopleEntries(value: string) {
  return value
    .split(/[\n,，;；、/]+/)
    .map((item) => {
      const trimmed = item.trim();
      const [rawLabel] = trimmed.split(/[:：-]/);

      return {
        label: cleanCandidate(rawLabel),
        evidence: trimmed,
      };
    })
    .filter((item) => item.label.length >= 2 && item.label.length <= 48);
}

function contextRoleCandidates(fields: ReturnType<typeof seedFieldText>) {
  const candidates: Array<{ label: string; evidence: string; rule: RoleRule }> = [];
  const contextFields = [
    fields.situationSummary,
    fields.recentEvents,
    fields.decisionOptions,
    fields.worries,
  ];

  contextFields.forEach((field) => {
    if (!field.trim()) return;

    roleRules.forEach((rule) => {
      const match = field.match(rule.pattern);
      if (!match) return;
      const matchedLabel = cleanCandidate(match[0]);
      const label =
        matchedLabel.length >= 3 && matchedLabel.length <= 40
          ? titleCase(matchedLabel)
          : rule.label;

      candidates.push({
        label,
        evidence: evidenceSnippet(field, matchedLabel || rule.label),
        rule,
      });
    });
  });

  return candidates;
}

function capitalizedCandidates(fields: ReturnType<typeof seedFieldText>) {
  const text = [
    fields.situationSummary,
    fields.recentEvents,
    fields.decisionOptions,
    fields.worries,
  ].join("\n");
  const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) ?? [];

  return matches
    .filter((match) => {
      const cleaned = cleanCandidate(match);
      return (
        cleaned.length >= 3 &&
        cleaned.length <= 36 &&
        !contextStopWords.has(cleaned.split(/\s+/)[0]) &&
        !weakFragments.has(normalizeLabel(cleaned))
      );
    })
    .slice(0, 6)
    .map((label) => ({
      label: cleanCandidate(label),
      evidence: evidenceSnippet(text, label),
    }));
}

export function extractPeopleCandidates(seedContext: SeedContextDraft) {
  const now = new Date().toISOString();
  const candidates = new Map<string, KeyPersonDraft>();
  const combinedContext = getSeedContextNarrative(seedContext);
  const fields = seedFieldText(seedContext);

  explicitPeopleEntries(fields.keyPeopleText).forEach(({ label, evidence }) => {
    const rule = inferRule(`${label} ${evidence}`);
    addUnique(
      candidates,
      createPerson(
        seedContext.id,
        label,
        rule?.role ?? "User-named stakeholder",
        [evidence, fields.situationSummary, fields.recentEvents]
          .filter(Boolean)
          .join("\n"),
        "key_people_text",
        now,
      ),
    );
  });

  contextRoleCandidates(fields).forEach(({ label, evidence, rule }) => {
    addUnique(
      candidates,
      createPerson(
        seedContext.id,
        label,
        rule.role,
        evidence,
        "seed_context_text",
        now,
      ),
    );
  });

  capitalizedCandidates(fields).forEach(({ label, evidence }) => {
    const rule = inferRule(`${label}\n${evidence}`);

    addUnique(
      candidates,
      createPerson(
        seedContext.id,
        label,
        rule?.role ?? "Context-mentioned stakeholder",
        evidence,
        "seed_context_text",
        now,
      ),
    );
  });

  roleRules.forEach((rule) => {
    if (rule.pattern.test(combinedContext) && candidates.size < 6) {
      addUnique(
        candidates,
        createPerson(
          seedContext.id,
          rule.label,
          rule.role,
          combinedContext,
          "seed_context_text",
          now,
        ),
      );
    }
  });

  if (candidates.size === 0) {
    ["Current self", "Future self"].forEach((label) => {
      addUnique(
        candidates,
        createPerson(
          seedContext.id,
          label,
          "Self perspective",
          combinedContext,
          "seed_context_text",
          now,
        ),
      );
    });
  }

  return Array.from(candidates.values()).slice(0, 8);
}

export function normalizePersonDraft(person: KeyPersonDraft): KeyPersonDraft {
  const label = person.label || person.displayName || "Unnamed stakeholder";
  const role = person.role || person.roleType || inferRule(label)?.role || "Unconfirmed stakeholder";
  const evidenceText = person.evidenceText || person.knownEvidence || "";
  const source = person.source ?? "seed_context_text";
  const relationshipToUser =
    person.relationshipToUser || relationshipForLabel(label, role);
  const roleType = person.roleType || roleTypeForLabel(label, role);

  return {
    ...person,
    label,
    displayName: person.displayName ?? label,
    role,
    relationshipToUser,
    roleType,
    confidence:
      person.confidence ?? confidenceForSource(source, label, evidenceText),
    knownEvidence: person.knownEvidence ?? evidenceText,
    missingFields: person.missingFields ?? missingFieldsForRole(role),
    evidenceRefs:
      person.evidenceRefs ?? [
        evidenceRef(person.seedContextId, source, label, evidenceText),
      ],
    userNote: person.userNote ?? "",
    source,
    evidenceText,
    status: person.status ?? "candidate",
    confirmed: person.confirmed ?? false,
  };
}

export function mergePeopleCandidates(
  savedPeople: KeyPersonDraft[],
  extractedPeople: KeyPersonDraft[],
) {
  const merged = new Map<string, KeyPersonDraft>();

  savedPeople.forEach((person) => {
    merged.set(normalizeLabel(person.label), normalizePersonDraft(person));
  });

  extractedPeople.forEach((person) => {
    const key = normalizeLabel(person.label);
    if (!merged.has(key)) merged.set(key, normalizePersonDraft(person));
  });

  return Array.from(merged.values());
}

export function createManualPerson(
  seedContextId: string,
  label: string,
  role: string,
) {
  const now = new Date().toISOString();
  const cleanRole = cleanCandidate(role) || "User-supplied stakeholder";
  const person = createPerson(
    seedContextId,
    label,
    cleanRole,
    "User manually added this person or role.",
    "manual",
    now,
  );

  return {
    ...person,
    confirmed: true,
    status: "confirmed" as const,
    relationshipToUser:
      relationshipForRole(person.role) === "unknown"
        ? "manual"
        : relationshipForRole(person.role),
    roleType: roleTypeForRole(person.role) === "unknown" ? "manual" : roleTypeForRole(person.role),
    confidence: 95,
    missingFields: [],
    userNote: "",
  };
}
