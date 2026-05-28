import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { KeyPersonDraft } from "@/types/key-person";
import { getSeedContextNarrative } from "@/lib/seed-context/context-text";
import type {
  PreviewAgent,
  PreviewRiskLevel,
  ProductPreview,
} from "@/types/product-preview";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";

type PreviewInput = {
  questionText: string;
  situationSummary: string;
  keyPeopleText: string;
  timeWindow: TimeWindow;
  people?: Array<Pick<KeyPersonDraft, "label" | "role">>;
  agentEcology?: AgentEcologyDraft | null;
};

const lockedReportSections = [
  "关键人物沟通顺序、话术和底线条件",
  "接受、留下、延迟决策三条路径的 30/60/90 天行动表",
  "谈判筹码、可逆动作、退出条件和复盘评分表",
  "个人盲区、风险预案和关键假设验证清单",
];

const highRiskTerms = [
  "自杀",
  "自残",
  "伤害自己",
  "杀人",
  "报复",
  "威胁",
  "跟踪",
  "骚扰",
  "违法",
  "诊断",
  "用药",
  "癌症",
  "贷款",
  "股票",
  "投资建议",
  "赌博",
  "suicide",
  "self harm",
  "kill",
  "stalk",
  "harass",
  "medical",
  "legal",
  "financial advice",
];

const windowLabels: Record<TimeWindow, string[]> = {
  "30_days": ["接下来 7 天", "第 2-3 周", "第 4 周"],
  "90_days": ["接下来 14 天", "第 2 个月", "第 3 个月"],
  "1_year": ["接下来 30 天", "1-6 个月", "6-12 个月"],
  "3_years": ["接下来 90 天", "3-18 个月", "18-36 个月"],
  "5_years": ["接下来 180 天", "6-30 个月", "30-60 个月"],
};

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function clampScore(value: number) {
  return Math.max(12, Math.min(96, value));
}

function splitPeopleText(value: string) {
  return value
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function inferPeopleFromText(text: string) {
  const people = new Set<string>();
  const rules: Array<[RegExp, string]> = [
    [/上级|老板|领导|经理|主管|晋升|汇报/, "现任上级"],
    [/伴侣|家人|妻子|丈夫|对象|父母/, "伴侣/家人"],
    [/招聘|offer|新公司|面试|猎头|HR/i, "招聘方"],
    [/同事|团队|搭档/, "核心同事"],
    [/合伙|合作|创业|投资|客户|融资/, "合作方/客户"],
  ];

  rules.forEach(([pattern, label]) => {
    if (pattern.test(text)) people.add(label);
  });

  people.add("未来的我");
  people.add("现在的我");

  return Array.from(people).slice(0, 6);
}

function inferRole(name: string, role?: string) {
  if (role && role !== "unknown") return role;
  if (/上级|老板|领导|经理|主管|manager|boss|lead/i.test(name)) {
    return "承诺与资源";
  }
  if (/伴侣|家人|妻子|丈夫|partner|spouse|family/i.test(name)) {
    return "情绪与生活边界";
  }
  if (/招聘|新公司|HR|猎头|投资|客户|合作|hiring|investor|client/i.test(name)) {
    return "机会提供方";
  }
  if (/同事|团队|teammate|colleague|team/i.test(name)) return "团队信号";
  if (/未来|自己|future|self/i.test(name)) return "长期自我";
  return "利益相关者";
}

function makeAgent(name: string, role: string, index: number): PreviewAgent {
  const seed = hashText(`${name}:${role}:${index}`);
  const stances = ["支持但谨慎", "需要被安抚", "信息不完整", "可能施压"];

  return {
    id: `preview_agent_${seed.toString(36)}`,
    name,
    role,
    influence: clampScore(48 + ((seed + index * 17) % 43)),
    tension: clampScore(28 + ((seed + index * 23) % 58)),
    stance: stances[index % stances.length],
  };
}

function buildAgents(input: PreviewInput): PreviewAgent[] {
  if (input.agentEcology?.agents.length) {
    return input.agentEcology.agents
      .filter((agent) => agent.agentType !== "self")
      .slice(0, 6)
      .map((agent, index) => makeAgent(agent.label, agent.role, index));
  }

  const explicitPeople =
    input.people && input.people.length > 0
      ? input.people.map((person) => ({
          name: person.label,
          role: person.role,
        }))
      : splitPeopleText(input.keyPeopleText).map((name) => ({
          name,
          role: inferRole(name),
        }));

  const people =
    explicitPeople.length > 0
      ? explicitPeople
      : inferPeopleFromText(`${input.questionText}\n${input.situationSummary}`).map(
          (name) => ({ name, role: inferRole(name) }),
        );

  return people
    .slice(0, 6)
    .map((person, index) =>
      makeAgent(person.name, inferRole(person.name, person.role), index),
    );
}

function getSafetyLevel(input: PreviewInput): PreviewRiskLevel {
  const combined = [
    input.questionText,
    input.situationSummary,
    input.keyPeopleText,
  ]
    .join("\n")
    .toLowerCase();

  return highRiskTerms.some((term) => combined.includes(term.toLowerCase()))
    ? "blocked"
    : "normal";
}

function levelMessage(level: PreviewRiskLevel) {
  if (level === "blocked") {
    return "这段输入涉及高风险或专业建议边界。当前只提供安全提示，不生成行动型报告；如存在现实危险，请优先联系可信赖的人或专业机构。";
  }

  return "当前输入适合生成职场决策预览。结果用于结构化思考，不代表确定预测或专业建议。";
}

export function buildProductPreview(input: PreviewInput): ProductPreview {
  const agents = buildAgents(input);
  const safetyLevel = getSafetyLevel(input);
  const pressure = clampScore(
    38 +
      agents.length * 8 +
      Math.min(24, Math.floor(input.situationSummary.length / 28)),
  );
  const questionSeed = hashText(input.questionText);
  const stability = clampScore(96 - pressure + (questionSeed % 18));
  const expansion = clampScore(52 + (questionSeed % 30));
  const evidence = clampScore(46 + agents.length * 6 + (questionSeed % 15));
  const mainAgent = agents.reduce<PreviewAgent | null>(
    (current, agent) =>
      current === null || agent.influence > current.influence ? agent : current,
    null,
  );
  const windows = windowLabels[input.timeWindow];

  if (safetyLevel === "blocked") {
    return {
      previewSummary:
        "当前问题需要先降级处理。Astraloom 会保留处境结构，但不会给出可能造成现实伤害、违法、医疗、法律或金融风险的行动建议。",
      agentEcology: agents,
      scenarioPaths: [],
      timelineEvents: [],
      riskWindows: [
        {
          id: "risk_safety",
          title: "安全边界",
          level: "blocked",
          detail:
            "请把问题改写为职场沟通、信息收集或风险识别目标，避免要求系统做专业判断或危险行动建议。",
        },
      ],
      nextActions: [
        {
          id: "next_safety",
          title: "改写问题",
          detail:
            "可以改成“我需要补齐哪些信息”“我该如何安排一次安全沟通”“有哪些可逆选择”。",
        },
      ],
      lockedReportSections,
      safetyLevel,
      safetyMessage: levelMessage(safetyLevel),
    };
  }

  return {
    previewSummary:
      mainAgent === null
        ? "这次推演缺少关键人物。补充上级、合作方、伴侣或核心同事后，结果会更像真实决策沙盘。"
        : `当前核心矛盾是“机会收益”和“关系/承诺不确定性”的拉扯。${mainAgent.name} 是最高杠杆人物，优先处理 TA 的信息与态度，会显著降低误判。`,
    agentEcology: agents,
    scenarioPaths: [
      {
        id: "path_conservative",
        title: "留下并索要明确承诺",
        confidence: stability,
        risk: stability > 62 ? "medium" : "high",
        summary:
          "短期波动较低，但风险是口头承诺继续模糊。需要把晋升、资源或合作条件转成时间表和可验证标准。",
      },
      {
        id: "path_expansion",
        title: "接受新机会或主动推动变化",
        confidence: expansion,
        risk: pressure > 72 ? "high" : "medium",
        summary:
          "上升空间更清晰，但关系迁移和试错成本更高。适合已经拿到足够外部证据，并能承受短期不稳定的状态。",
      },
      {
        id: "path_negotiation",
        title: "延迟决策并补齐证据",
        confidence: evidence,
        risk: "medium",
        summary:
          "适合信息不完整但窗口尚未关闭的状态。用一到两周验证薪酬、职责、资源、关键人物真实态度和备用选择。",
      },
    ],
    timelineEvents: [
      {
        id: "timeline_evidence",
        window: windows[0],
        signal: "证据补齐",
        detail:
          "把当前承诺、新机会条件、资源边界和关键人物态度全部写成可比较证据，避免只凭情绪做选择。",
      },
      {
        id: "timeline_relation",
        window: windows[1],
        signal: "关系反应",
        detail:
          mainAgent === null
            ? "关键人物会在这段时间显露真实立场。"
            : `${mainAgent.name} 的反应会影响压力曲线，建议先进行低承诺沟通，再推进正式决定。`,
      },
      {
        id: "timeline_lock",
        window: windows[2],
        signal: "路径锁定",
        detail:
          "一旦选择开始执行，机会成本会变得可见。后悔通常不是来自选择本身，而是来自未验证的关键假设。",
      },
    ],
    riskWindows: [
      {
        id: "risk_vague_commitment",
        title: "承诺模糊",
        level: pressure > 70 ? "caution" : "normal",
        detail:
          "如果只得到口头支持而没有时间表、标准和资源，保守路径会逐渐变成被动等待。",
      },
      {
        id: "risk_relationship_cost",
        title: "关系迁移成本",
        level: agents.some((agent) => agent.tension > 72) ? "caution" : "normal",
        detail:
          "高张力人物没有被提前沟通时，容易在执行阶段制造额外阻力。",
      },
    ],
    nextActions: [
      {
        id: "next_evidence",
        title: "列出三条不可逆证据",
        detail:
          "分别写下薪酬/资源、职责/成长、关系/声誉三类证据，标记哪些已经确认，哪些只是猜测。",
      },
      {
        id: "next_conversation",
        title: mainAgent ? `先和 ${mainAgent.name} 做一次低风险沟通` : "补充关键人物",
        detail:
          "目标不是立刻摊牌，而是验证对方是否愿意给出具体条件、时间表或支持边界。",
      },
    ],
    lockedReportSections,
    safetyLevel,
    safetyMessage: levelMessage(safetyLevel),
  };
}

export function buildPreviewFromSeed(
  seedContext: SeedContextDraft,
  people?: Array<Pick<KeyPersonDraft, "label" | "role">>,
  agentEcology?: AgentEcologyDraft | null,
) {
  return buildProductPreview({
    questionText: seedContext.questionText,
    situationSummary: getSeedContextNarrative(seedContext),
    keyPeopleText: seedContext.keyPeopleText,
    timeWindow: seedContext.timeWindow,
    people,
    agentEcology,
  });
}
