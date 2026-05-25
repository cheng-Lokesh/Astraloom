import type {
  AgentProfileDraft,
  AgentProfileJson,
  AgentStance,
  AgentType,
} from "@/types/agent-profile";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function scoreFromText(value: string, salt: string, min = 28, max = 82) {
  const seed = Number.parseInt(hashText(`${value}:${salt}`).slice(0, 6), 36);
  return min + (seed % (max - min + 1));
}

function createAgentProfile(
  seedContextId: string,
  sourceKeyPersonId: string | null,
  agentType: AgentType,
  label: string,
  role: string,
  relationshipToUser: string,
  confidence: number,
  evidenceRefs: string[],
  profileJson: AgentProfileJson,
  now: string,
): AgentProfileDraft {
  return {
    id: `agent_${hashText(
      `${seedContextId}:${sourceKeyPersonId ?? agentType}:${label}`,
    )}`,
    seedContextId,
    sourceKeyPersonId,
    agentType,
    label,
    role,
    relationshipToUser,
    confidence,
    evidenceRefs,
    version: "local-deterministic-v0",
    traceId: `local-agent:${seedContextId}:${hashText(label)}`,
    profileJson,
    promptVersion: "unreleased",
    modelVersion: "unreleased",
    createdAt: now,
    updatedAt: now,
  };
}

function selfProfile(seedContext: SeedContextDraft, stance: AgentStance): AgentProfileJson {
  const stanceLabels: Record<AgentStance, string> = {
    baseline: "当前叙事",
    cautious_parallel: "谨慎平行自我",
    decisive_parallel: "行动平行自我",
    confirmed_npc: "确认 NPC",
  };
  const speed = stance === "cautious_parallel" ? 34 : stance === "decisive_parallel" ? 76 : 54;
  const fieldSources = {
    stance: "default",
    role: "default",
    origin: "default",
    relationshipToUser: "default",
    motivation: "default",
    resources: "default",
    behaviorPolicy: "default",
    state: "default",
    traits: "default",
    constraints: "default",
    missingFields: "default",
  } as const;

  return {
    stance,
    role: "self",
    origin: "seed_context",
    relationshipToUser: "self",
    source: {
      confidence: stance === "baseline" ? 86 : 72,
      sourceType: "default",
      evidenceRefs: [`seed:${seedContext.id}:self:${stance}`],
    },
    fieldSources,
    motivation: {
      primaryGoal:
        seedContext.trackType === "crossroad"
          ? "在当前路口降低后悔成本，并保留可逆选择。"
          : "识别长期主题中的关系气候和准备窗口。",
      fear: "误判关键人物反应，或在证据不足时过早承诺。",
      avoidancePattern:
        stance === "cautious_parallel"
          ? "延后冲突，等待更多信号。"
          : stance === "decisive_parallel"
            ? "更快试探机会，但可能压缩关系缓冲。"
            : "在信息不足时反复权衡。",
    },
    resources: {
      authority: scoreFromText(seedContext.questionText, `${stance}:authority`, 35, 65),
      information: scoreFromText(seedContext.situationSummary, `${stance}:info`, 38, 78),
      socialCapital: scoreFromText(seedContext.keyPeopleText, `${stance}:social`, 30, 70),
      emotionalLeverage: scoreFromText(seedContext.questionText, `${stance}:emotion`, 32, 76),
    },
    behaviorPolicy: {
      actionSpeed: speed,
      initiative: stance === "decisive_parallel" ? 78 : 52,
      cooperationBias: stance === "decisive_parallel" ? 52 : 68,
      communicationStyle: stance === "decisive_parallel" ? "sharp" : "formal",
    },
    state: {
      stress: scoreFromText(seedContext.questionText, `${stance}:stress`, 42, 76),
      trustInUser: 100,
      hostilityToUser: 0,
      currentIntention:
        stance === "baseline"
          ? "等待关系图谱冻结后进入模拟。"
          : "作为平行策略参与稳定性对照。",
    },
    traits: [stanceLabels[stance], "本地确定性草稿", "证据链输入"],
    constraints: [
      "不代表确定人格判断。",
      "不调用 LLM，不生成最终报告结论。",
    ],
    missingFields: [],
  };
}

function npcProfile(person: KeyPersonDraft): AgentProfileJson {
  const authority = scoreFromText(person.role, `${person.id}:authority`);
  const information = scoreFromText(person.knownEvidence, `${person.id}:info`);
  const emotionalLeverage = scoreFromText(
    person.relationshipToUser,
    `${person.id}:emotion`,
  );
  const confirmedSource =
    person.status === "confirmed" ? "user_confirmed" : "chat_inferred";
  const fieldSources = {
    stance: "default",
    role: confirmedSource,
    origin: confirmedSource,
    relationshipToUser: confirmedSource,
    motivation: "default",
    resources: "default",
    behaviorPolicy: "default",
    state: "default",
    traits: confirmedSource,
    constraints: "default",
    missingFields: confirmedSource,
  } as const;

  return {
    stance: "confirmed_npc",
    role: person.role || "待确认角色",
    origin:
      person.source === "manual"
        ? "用户手动补充"
        : person.source === "key_people_text"
          ? "用户明确列出"
          : "从上下文识别",
    relationshipToUser: person.relationshipToUser,
    source: {
      confidence: person.confidence,
      sourceType: confirmedSource,
      evidenceRefs: person.evidenceRefs,
    },
    fieldSources,
    motivation: {
      primaryGoal: `${person.role || "该节点"}在本局面中的资源、压力或信号保持可解释。`,
      fear: "被误读为确定动机，因此必须保留置信度和证据引用。",
      avoidancePattern: person.missingFields.length
        ? "缺失字段未确认前只进入保守推演。"
        : "等待关系图谱冻结后参与互动。",
    },
    resources: {
      authority,
      information,
      socialCapital: scoreFromText(person.label, `${person.id}:social`),
      emotionalLeverage,
    },
    behaviorPolicy: {
      actionSpeed: scoreFromText(person.role, `${person.id}:speed`, 24, 74),
      initiative: scoreFromText(person.knownEvidence, `${person.id}:initiative`, 22, 76),
      cooperationBias: scoreFromText(person.relationshipToUser, `${person.id}:coop`, 30, 78),
      communicationStyle: "unknown",
    },
    state: {
      stress: scoreFromText(person.knownEvidence, `${person.id}:stress`, 30, 82),
      trustInUser: scoreFromText(person.label, `${person.id}:trust`, 24, 68),
      hostilityToUser: scoreFromText(person.role, `${person.id}:hostility`, 8, 42),
      currentIntention: person.userNote
        ? `用户补充：${person.userNote}`
        : "等待关系图谱生成时校准立场。",
    },
    traits: [
      "已进入本次决策沙盘",
      person.status === "confirmed" ? "用户确认存在" : "待确认节点",
      `置信度 ${person.confidence}%`,
    ],
    constraints: [
      "不推断第三方真实内心、忠诚或隐藏意图。",
      "关系边权由系统生成，只读展示。",
    ],
    missingFields: person.missingFields,
  };
}

export function getConfirmedPeople(people: KeyPersonDraft[]) {
  return people.filter(
    (person) => person.confirmed && person.status === "confirmed",
  );
}

export function buildAgentProfiles(
  seedContext: SeedContextDraft,
  confirmedPeople: KeyPersonDraft[],
  includeParallelSelves: boolean,
) {
  const now = new Date().toISOString();
  const agents: AgentProfileDraft[] = [
    createAgentProfile(
      seedContext.id,
      null,
      "self",
      "当前的我",
      "主分身",
      "self",
      86,
      [`seed:${seedContext.id}:self:baseline`],
      selfProfile(seedContext, "baseline"),
      now,
    ),
  ];

  if (includeParallelSelves) {
    agents.push(
      createAgentProfile(
        seedContext.id,
        null,
        "parallel_self",
        "谨慎的我",
        "平行分身",
        "self",
        72,
        [`seed:${seedContext.id}:self:cautious_parallel`],
        selfProfile(seedContext, "cautious_parallel"),
        now,
      ),
      createAgentProfile(
        seedContext.id,
        null,
        "parallel_self",
        "行动的我",
        "平行分身",
        "self",
        72,
        [`seed:${seedContext.id}:self:decisive_parallel`],
        selfProfile(seedContext, "decisive_parallel"),
        now,
      ),
    );
  }

  confirmedPeople.forEach((person) => {
    agents.push(
      createAgentProfile(
        seedContext.id,
        person.id,
        "npc",
        person.label,
        person.role,
        person.relationshipToUser,
        person.confidence,
        person.evidenceRefs,
        npcProfile(person),
        now,
      ),
    );
  });

  return agents;
}
