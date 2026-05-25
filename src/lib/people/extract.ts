import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";
import { getSeedContextNarrative } from "@/lib/seed-context/context-text";

type RoleRule = {
  label: string;
  role: string;
  relationshipToUser: string;
  pattern: RegExp;
  missingFields: string[];
};

const roleRules: RoleRule[] = [
  {
    label: "当前上级",
    role: "资源和承诺节点",
    relationshipToUser: "boss",
    pattern: /上级|老板|领导|经理|主管|晋升|汇报|manager|boss|lead/i,
    missingFields: ["最近一次承诺", "可验证时间", "资源控制范围"],
  },
  {
    label: "机会提供方",
    role: "外部机会节点",
    relationshipToUser: "opportunity_source",
    pattern: /招聘|猎头|HR|offer|新公司|面试|hiring|recruiter/i,
    missingFields: ["承诺条件", "截止时间", "不确定因素"],
  },
  {
    label: "核心同事",
    role: "团队信号节点",
    relationshipToUser: "colleague",
    pattern: /同事|团队|协作|搭档|teammate|colleague|team/i,
    missingFields: ["立场", "信息差", "影响范围"],
  },
  {
    label: "伴侣/家人",
    role: "生活边界节点",
    relationshipToUser: "family_or_partner",
    pattern: /伴侣|家人|妻子|丈夫|对象|父母|spouse|partner|family/i,
    missingFields: ["可接受边界", "现实压力", "支持条件"],
  },
  {
    label: "合伙人/合作方",
    role: "利益绑定节点",
    relationshipToUser: "partner",
    pattern: /合伙|合作|创业|客户|投资人|cofounder|client|investor/i,
    missingFields: ["利益边界", "资源投入", "退出条件"],
  },
  {
    label: "竞争方",
    role: "资源竞争节点",
    relationshipToUser: "competitor",
    pattern: /竞争|竞品|竞争者|对手|competitor/i,
    missingFields: ["竞争资源", "最近动作", "信息来源"],
  },
  {
    label: "导师/顾问",
    role: "外部校准节点",
    relationshipToUser: "advisor",
    pattern: /导师|贵人|前辈|顾问|mentor|advisor/i,
    missingFields: ["建议立场", "可信依据", "可调用资源"],
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
  "i",
  "me",
  "myself",
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
    .trim();
}

function evidenceRef(
  seedContextId: string,
  source: KeyPersonDraft["source"],
  label: string,
) {
  return `seed:${seedContextId}:${source}:${hashText(label)}`;
}

function confidenceForSource(
  source: KeyPersonDraft["source"],
  label: string,
  evidenceText: string,
) {
  if (source === "manual") return 95;
  if (source === "key_people_text") return 84;
  const exactMentionBonus = evidenceText.includes(label) ? 8 : 0;
  return Math.min(78, 58 + exactMentionBonus + Math.min(label.length * 2, 12));
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
  const confidence = confidenceForSource(source, cleanedLabel, evidenceText);
  const status = confidence < 70 ? "needs_confirmation" : "candidate";

  return {
    id: `kp_${hashText(`${seedContextId}:${normalized}`)}`,
    seedContextId,
    label: cleanedLabel,
    role: role || "待确认角色",
    relationshipToUser: relationshipForRole(role),
    roleType: role || "待确认角色",
    confidence,
    knownEvidence: evidenceText,
    missingFields: missingFieldsForRole(role),
    evidenceRefs: [evidenceRef(seedContextId, source, cleanedLabel)],
    userNote: "",
    confirmed: false,
    status,
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
  if (!key || key.length < 2 || weakFragments.has(key) || candidates.has(key)) {
    return;
  }
  candidates.set(key, person);
}

function splitKeyPeopleText(value: string) {
  return value
    .split(/[\n,，;；、/]+/)
    .map(cleanCandidate)
    .filter((item) => item.length >= 2 && item.length <= 40);
}

export function extractPeopleCandidates(seedContext: SeedContextDraft) {
  const now = new Date().toISOString();
  const candidates = new Map<string, KeyPersonDraft>();
  const combinedContext = getSeedContextNarrative(seedContext);

  splitKeyPeopleText(seedContext.keyPeopleText).forEach((label) => {
    const rule = inferRule(label);
    addUnique(
      candidates,
      createPerson(
        seedContext.id,
        label,
        rule?.role ?? "用户明确提及的人物",
        seedContext.keyPeopleText,
        "key_people_text",
        now,
      ),
    );
  });

  roleRules.forEach((rule) => {
    if (rule.pattern.test(combinedContext)) {
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
    ["当前的我", "未来的我"].forEach((label) => {
      addUnique(
        candidates,
        createPerson(
          seedContext.id,
          label,
          "自我分身",
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
  const role = person.role || person.roleType || "待确认角色";
  const evidenceText = person.evidenceText || person.knownEvidence || "";

  return {
    ...person,
    role,
    relationshipToUser: person.relationshipToUser ?? relationshipForRole(role),
    roleType: person.roleType ?? role,
    confidence:
      person.confidence ?? confidenceForSource(person.source, person.label, evidenceText),
    knownEvidence: person.knownEvidence ?? evidenceText,
    missingFields: person.missingFields ?? missingFieldsForRole(role),
    evidenceRefs:
      person.evidenceRefs ?? [
        evidenceRef(person.seedContextId, person.source, person.label),
      ],
    userNote: person.userNote ?? "",
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
  const cleanRole = cleanCandidate(role) || "用户补充节点";
  const person = createPerson(
    seedContextId,
    label,
    cleanRole,
    "用户手动补充",
    "manual",
    now,
  );

  return {
    ...person,
    confirmed: true,
    status: "confirmed" as const,
    relationshipToUser: relationshipForRole(person.role),
    roleType: person.role,
    confidence: 95,
    missingFields: [],
    userNote: "",
  };
}
