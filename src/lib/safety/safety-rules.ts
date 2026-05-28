import type { SafetyRule } from "./safety-types";

export const safetyRules = [
  {
    flag: "self_harm",
    level: "blocked",
    patterns: [
      /suicide|self[-\s]?harm|kill myself|end my life/i,
      /自杀|自残|轻生|不想活|结束生命|伤害自己/,
    ],
  },
  {
    flag: "violence",
    level: "blocked",
    patterns: [
      /kill|assault|attack|beat up|weapon|threaten/i,
      /杀人|打死|袭击|殴打|武器|威胁|暴力/,
    ],
  },
  {
    flag: "minor_safety",
    level: "blocked",
    patterns: [
      /minor|underage|child abuse|teen abuse|grooming/i,
      /未成年|儿童安全|虐待儿童|诱骗未成年|未成年人/,
    ],
  },
  {
    flag: "stalking",
    level: "downgraded",
    patterns: [
      /stalk|follow them|track their location|where they go/i,
      /跟踪|尾随|定位.*行踪|查.*行踪/,
    ],
  },
  {
    flag: "surveillance",
    level: "downgraded",
    patterns: [
      /spy|surveillance|hidden camera|record secretly|monitor their phone/i,
      /监控|偷拍|偷录|窃听|查手机|偷看手机|监听/,
    ],
  },
  {
    flag: "partner_monitoring",
    level: "downgraded",
    patterns: [
      /check (my )?(partner|boyfriend|girlfriend|spouse).*(phone|messages|location)/i,
      /查.*(伴侣|男友|女友|老公|老婆|配偶).*(手机|聊天|定位|位置)/,
    ],
  },
  {
    flag: "medical",
    level: "downgraded",
    patterns: [
      /diagnos|medication|treatment|disease|symptom|doctor/i,
      /诊断|吃药|药物|治疗|疾病|症状|医生|医院/,
    ],
  },
  {
    flag: "legal",
    level: "downgraded",
    patterns: [
      /lawsuit|sue|legal advice|contract dispute|custody|divorce court/i,
      /起诉|律师|法律建议|合同纠纷|抚养权|离婚诉讼|法院/,
    ],
  },
  {
    flag: "investment",
    level: "downgraded",
    patterns: [
      /\b(invest|investing|investment|stock|stocks|crypto|loan|debt)\b|buy.*shares|sell.*shares/i,
      /投资|股票|基金|币圈|加密货币|贷款|债务|买入|卖出/,
    ],
  },
  {
    flag: "therapy",
    level: "downgraded",
    patterns: [
      /therapy|therapist|mental health treatment|trauma treatment|clinical/i,
      /心理治疗|治疗方案|创伤治疗|临床|精神科|心理医生/,
    ],
  },
  {
    flag: "revenge",
    level: "downgraded",
    patterns: [
      /revenge|get back at|expose them|ruin their reputation|blackmail/i,
      /报复|整他|曝光.*隐私|毁掉.*名声|勒索|敲诈/,
    ],
  },
  {
    flag: "coercion",
    level: "downgraded",
    patterns: [
      /force them|make them obey|pressure them|manipulate them|control them/i,
      /强迫|逼迫|操控|控制.*对方|让.*服从|拿捏/,
    ],
  },
  {
    flag: "third_party_mind_reading",
    level: "downgraded",
    patterns: [
      /what (does|is).*(really think|hiding|true intention|secretly want)/i,
      /他.*真实想法|她.*真实想法|对方.*心里|内心真实|真正意图|是不是.*背叛/,
    ],
  },
  {
    flag: "deterministic_fate",
    level: "caution",
    patterns: [
      /will definitely|guaranteed|certain future|must happen|fate/i,
      /一定会|必然|命中注定|注定|绝对会|肯定会/,
    ],
  },
  {
    flag: "guaranteed_reconciliation",
    level: "caution",
    patterns: [
      /guarantee.*(get back together|reconcile)|win them back for sure/i,
      /保证.*复合|一定复合|必定挽回|挽回成功率.*100/,
    ],
  },
] satisfies SafetyRule[];

export const safeAllowedActions = [
  "save_seed_context",
  "extract_people",
  "generate_agents",
  "view_read_only_graph",
  "run_simulation",
  "render_report",
  "request_paid_unlock",
  "save_feedback",
];

export const downgradedAllowedActions = [
  "save_seed_context",
  "extract_people",
  "view_read_only_graph",
  "organize_relationship_structure",
  "show_low_risk_communication_options",
  "save_feedback",
  "contact_support",
];

export const blockedAllowedActions = [
  "save_seed_context",
  "show_safety_notice",
  "contact_support",
];

export const generationActions = [
  "run_simulation",
  "render_high_risk_claims",
  "request_paid_unlock",
  "create_strong_claims",
  "show_monitoring_steps",
  "show_revenge_steps",
  "show_professional_advice",
  "claim_third_party_private_thoughts",
];
