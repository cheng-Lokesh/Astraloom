import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

const roleTerms = [
  "boss",
  "manager",
  "lead",
  "team lead",
  "director",
  "founder",
  "cofounder",
  "partner",
  "spouse",
  "wife",
  "husband",
  "investor",
  "client",
  "customer",
  "competitor",
  "mentor",
  "friend",
  "parent",
  "father",
  "mother",
  "colleague",
  "teammate",
  "上司",
  "老板",
  "领导",
  "团队负责人",
  "负责人",
  "合伙人",
  "伴侣",
  "妻子",
  "丈夫",
  "投资人",
  "客户",
  "竞争者",
  "竞争对手",
  "导师",
  "朋友",
  "父亲",
  "母亲",
  "同事",
];

const weakFragments = new Set([
  "i",
  "me",
  "my",
  "myself",
  "我",
  "自己",
  "对方",
  "别人",
  "someone",
  "somebody",
  "person",
  "people",
]);

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function cleanCandidate(value: string) {
  return value
    .replace(/^[\s"'“”‘’([{<]+/, "")
    .replace(/[\s"'“”‘’)\]}>,.。!?！？:：]+$/, "")
    .trim();
}

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAsciiTerm(value: string) {
  return /^[a-z\s]+$/i.test(value);
}

function createPerson(
  seedContextId: string,
  label: string,
  role: string,
  evidenceText: string,
  source: KeyPersonDraft["source"],
  now: string,
): KeyPersonDraft {
  const normalized = normalizeLabel(label);

  return {
    id: `kp_${hashText(`${seedContextId}:${normalized}`)}`,
    seedContextId,
    label,
    role,
    confirmed: false,
    status: "candidate",
    source,
    evidenceText,
    createdAt: now,
    updatedAt: now,
  };
}

function addUnique(
  candidates: Map<string, KeyPersonDraft>,
  person: KeyPersonDraft,
) {
  const key = normalizeLabel(person.label);
  if (!key || weakFragments.has(key) || candidates.has(key)) {
    return;
  }

  candidates.set(key, person);
}

function splitKeyPeopleText(value: string) {
  return value
    .split(/[\n;；、|/]+/)
    .map(cleanCandidate)
    .filter((item) => item.length >= 2 && item.length <= 60);
}

function findRoleMentions(value: string) {
  const normalizedText = value.toLowerCase();

  return roleTerms.filter((term) => {
    if (!isAsciiTerm(term)) {
      return normalizedText.includes(term.toLowerCase());
    }

    return new RegExp(`\\b${escapeRegExp(term.toLowerCase())}\\b`).test(
      normalizedText,
    );
  });
}

function findPossibleNames(value: string) {
  const englishNames = Array.from(
    value.matchAll(
      /\b(?:with|from|by|called|named|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    ),
  ).map((match) => match[1]);
  const chineseNamedPeople =
    value.match(/(?:叫|名叫|和|与|跟)([\u4e00-\u9fa5]{2,4})/g) ?? [];

  return [
    ...englishNames,
    ...chineseNamedPeople.map((item) =>
      item.replace(/^(叫|名叫|和|与|跟)/, ""),
    ),
  ];
}

export function extractPeopleCandidates(seedContext: SeedContextDraft) {
  const now = new Date().toISOString();
  const candidates = new Map<string, KeyPersonDraft>();

  splitKeyPeopleText(seedContext.keyPeopleText).forEach((label) => {
    addUnique(
      candidates,
      createPerson(
        seedContext.id,
        label,
        "unknown",
        seedContext.keyPeopleText,
        "key_people_text",
        now,
      ),
    );
  });

  const combinedContext = [
    seedContext.questionText,
    seedContext.situationSummary,
  ].join("\n");

  findRoleMentions(combinedContext).forEach((role) => {
    addUnique(
      candidates,
      createPerson(
        seedContext.id,
        role,
        role,
        combinedContext,
        "seed_context_text",
        now,
      ),
    );
  });

  findPossibleNames(combinedContext).forEach((label) => {
    addUnique(
      candidates,
      createPerson(
        seedContext.id,
        label,
        "unknown",
        combinedContext,
        "seed_context_text",
        now,
      ),
    );
  });

  return Array.from(candidates.values());
}

export function mergePeopleCandidates(
  savedPeople: KeyPersonDraft[],
  extractedPeople: KeyPersonDraft[],
) {
  const merged = new Map<string, KeyPersonDraft>();

  savedPeople.forEach((person) => {
    merged.set(normalizeLabel(person.label), person);
  });

  extractedPeople.forEach((person) => {
    const key = normalizeLabel(person.label);
    if (!merged.has(key)) {
      merged.set(key, person);
    }
  });

  return Array.from(merged.values());
}

export function createManualPerson(
  seedContextId: string,
  label: string,
  role: string,
) {
  const now = new Date().toISOString();

  const person = createPerson(
    seedContextId,
    cleanCandidate(label),
    cleanCandidate(role) || "unknown",
    "manual user entry",
    "manual",
    now,
  );

  return { ...person, confirmed: true, status: "confirmed" as const };
}
