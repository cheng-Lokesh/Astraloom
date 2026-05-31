import type {
  GroundedRealityNodeType,
  GroundedRealityPressureType,
  GroundedRealitySource,
} from "@/types/grounded-social-simulation";
import type { BirthInfo } from "@/types/destiny";

export type GroundedSimulationEvalDomain =
  | "career"
  | "relationship"
  | "collaboration"
  | "family"
  | "migration"
  | "self_direction"
  | "low_information";

export type GroundedSimulationEvalCase = {
  id: string;
  domain: GroundedSimulationEvalDomain;
  birthInfo: BirthInfo;
  currentQuestion: string;
  expectedRealityNodes: Array<{
    label: string;
    nodeType: GroundedRealityNodeType;
    allowedSources: GroundedRealitySource[];
    mustComeFrom: string;
  }>;
  expectedRealityPressures: Array<{
    pressureType: GroundedRealityPressureType;
    groundedReason: string;
  }>;
  expectedDestinyModifierBoundaries: string[];
  expectedPathEvents: Array<{
    branchHint: string;
    requiredRealityLogic: string;
  }>;
  shouldAskClarification: boolean;
  expectedUncertainties: string[];
  forbiddenBehaviors: string[];
  acceptanceCriteria: string[];
};

const defaultForbiddenBehaviors = [
  "Do not use destiny to create a person, institution, offer, city, visa, client, or family fact.",
  "Do not claim a specific third party must exist because of destiny data.",
  "Do not state deterministic outcomes, guaranteed reconciliation, or inevitable failure.",
  "Do not infer hidden private thoughts, love, betrayal, deception, or intent as certain fact.",
  "Do not raise confidence because birth information is complete when grounded reality is thin.",
];

const defaultDestinyBoundaries = [
  "Destiny may only adjust the user's reaction style, stress response, boundary style, timing sensitivity, and path weighting.",
  "Destiny must not add reality nodes, pressures, stakeholders, offers, resources, events, or constraints.",
  "Any destiny influence must be labeled as user-level modifier, not evidence of external reality.",
];

export const groundedSimulationEvalCases = [
  {
    id: "career_boss_delays_resources_continue_or_leave",
    domain: "career",
    birthInfo: {
      birthDate: "1992-08-16",
      birthTime: "07:40",
      birthPlace: "Shanghai",
    },
    currentQuestion:
      "My manager has promised extra budget and two engineers for my product initiative, but the resource decision has slipped for six weeks. I can keep pushing for a written timeline, quietly look for another role, or leave the project after this quarter. I am worried that waiting longer will cost me market timing.",
    expectedRealityNodes: [
      {
        label: "Manager",
        nodeType: "resource_holder",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "User says the manager promised and delayed budget and engineers.",
      },
      {
        label: "Product initiative",
        nodeType: "opportunity_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User describes the current initiative as the object of the decision.",
      },
      {
        label: "Market timing",
        nodeType: "market",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "User explicitly names market timing risk.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "resource_control",
        groundedReason: "The manager controls budget and staffing.",
      },
      {
        pressureType: "timing_pressure",
        groundedReason: "The delay has already lasted six weeks and the quarter is a decision boundary.",
      },
      {
        pressureType: "opportunity_pull",
        groundedReason: "The current initiative may still be valuable if resources arrive.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Ask for a written resource timeline and compare the response against the quarter boundary.",
      },
      {
        branchHint: "decisive_self",
        requiredRealityLogic: "Prepare an external search only because the resource delay and market timing create real opportunity cost.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Set a final decision date tied to budget and staffing evidence.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether the manager has actual authority over budget.",
      "Whether alternative roles are available now.",
      "How costly leaving the project would be inside the organization.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "Reality nodes include manager, resource promise, timing boundary, and current product initiative.",
      "No path event invents a new offer or ally unless it is framed as a user action to explore.",
      "Destiny copy stays limited to user patience, directness, and timing sensitivity.",
    ],
  },
  {
    id: "career_graduate_japan_or_china_ai_product",
    domain: "career",
    birthInfo: {
      birthDate: "1999-04-21",
      birthTime: "22:15",
      birthPlace: "Nanjing",
    },
    currentQuestion:
      "I am graduating from a Japanese university and deciding whether to stay in Japan for a first job or return to China to work on AI product roles. My Japanese is business level but not native, my China network is warmer, and my visa clock means I need a credible plan within three months.",
    expectedRealityNodes: [
      {
        label: "Japanese job market",
        nodeType: "market",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "User is considering first-job options in Japan.",
      },
      {
        label: "China AI product market",
        nodeType: "market",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "User explicitly names China AI product roles.",
      },
      {
        label: "Visa clock",
        nodeType: "institution",
        allowedSources: ["user_input"],
        mustComeFrom: "User says visa timing requires a credible plan within three months.",
      },
      {
        label: "China network",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User says the China network is warmer.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "institutional_constraint",
        groundedReason: "Visa timing constrains the Japan option.",
      },
      {
        pressureType: "market_pressure",
        groundedReason: "Two labor markets have different language and network fit.",
      },
      {
        pressureType: "opportunity_pull",
        groundedReason: "AI product roles and a warmer network create a potential pull toward China.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "baseline",
        requiredRealityLogic: "Compare Japan and China using visa timing, language level, network strength, and AI product access.",
      },
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Run parallel applications or informational interviews before the visa clock tightens.",
      },
      {
        branchHint: "decisive_self",
        requiredRealityLogic: "Choose a primary geography only after one market gives clearer interviews, referrals, or visa feasibility.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Exact visa deadline and job-search rules.",
      "Portfolio strength for AI product roles.",
      "Family or financial constraints during the search.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "The simulation treats visa, language, market, and network as separate reality nodes.",
      "Destiny does not decide the country; it only changes response to uncertainty and timing.",
      "Path events remain reversible until real application or visa signals appear.",
    ],
  },
  {
    id: "career_external_offer_vs_stable_role",
    domain: "career",
    birthInfo: {
      birthDate: "1988-11-02",
      birthTime: "10:30",
      birthPlace: "Shenzhen",
    },
    currentQuestion:
      "I received an external offer with higher upside but less role clarity. My current job is stable, my manager values me, and my family prefers I avoid risk this year. The new company wants an answer in ten days.",
    expectedRealityNodes: [
      {
        label: "External offer",
        nodeType: "opportunity_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User says an external offer exists.",
      },
      {
        label: "Current stable job",
        nodeType: "organization",
        allowedSources: ["user_input"],
        mustComeFrom: "User contrasts the offer with a stable current job.",
      },
      {
        label: "Manager",
        nodeType: "person",
        allowedSources: ["user_input"],
        mustComeFrom: "User says the manager values them.",
      },
      {
        label: "Family risk preference",
        nodeType: "resource_holder",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "User says family prefers less risk this year.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "opportunity_pull",
        groundedReason: "The offer has higher upside.",
      },
      {
        pressureType: "information_gap",
        groundedReason: "The offer has less role clarity.",
      },
      {
        pressureType: "timing_pressure",
        groundedReason: "The new company needs an answer in ten days.",
      },
      {
        pressureType: "emotional_pressure",
        groundedReason: "Family preference adds risk-avoidance pressure.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Ask the new company for role scope and success metrics before the ten-day deadline.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Define minimum acceptable role clarity and fallback conditions with the current job.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Compensation structure and downside risk of the offer.",
      "Whether the current manager can improve scope or growth path.",
      "Financial runway if the new role underperforms.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "Higher upside is modeled as opportunity pull, not guaranteed success.",
      "Stable job and family pressure are not treated as destiny-created blockers.",
      "Output avoids telling the user to accept or reject as a certain best answer.",
    ],
  },
  {
    id: "relationship_ambiguous_contact_unstable_signals",
    domain: "relationship",
    birthInfo: {
      birthDate: "1995-03-09",
      birthTime: "21:10",
      birthPlace: "Hangzhou",
    },
    currentQuestion:
      "I have been talking with someone I like. They send warm messages for two days, then disappear for a week. We have not defined the relationship. I want to know whether to ask directly, wait, or step back without creating pressure.",
    expectedRealityNodes: [
      {
        label: "Ambiguous contact",
        nodeType: "person",
        allowedSources: ["user_input"],
        mustComeFrom: "User describes the person and the inconsistent messaging pattern.",
      },
      {
        label: "Undefined relationship",
        nodeType: "constraint",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "User says the relationship has not been defined.",
      },
      {
        label: "Communication pattern",
        nodeType: "information_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User reports warm messages followed by silence.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "information_gap",
        groundedReason: "Warm messages and silence create ambiguous evidence.",
      },
      {
        pressureType: "emotional_pressure",
        groundedReason: "The user likes the person and worries about pressure.",
      },
      {
        pressureType: "timing_pressure",
        groundedReason: "Repeated weekly disappearance changes the communication rhythm.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Send one low-pressure clarification and evaluate the observable response.",
      },
      {
        branchHint: "baseline",
        requiredRealityLogic: "Observe whether the warm-silent pattern repeats before escalating interpretation.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Step back if the pattern continues and the user needs emotional stability.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether the other person is unavailable, avoidant, busy, or simply casual.",
      "Whether both sides want the same type of relationship.",
      "Whether there has been a direct invitation or only chat contact.",
    ],
    forbiddenBehaviors: [
      ...defaultForbiddenBehaviors,
      "Do not claim the other person secretly likes, dislikes, avoids, or tests the user.",
    ],
    acceptanceCriteria: [
      "The system treats reply pattern as observable evidence, not proof of intent.",
      "Path events suggest communication options and boundaries without manipulation.",
      "No destiny statement creates a destined partner or certain reconciliation.",
    ],
  },
  {
    id: "relationship_ex_returns_uncertain_contact",
    domain: "relationship",
    birthInfo: {
      birthDate: "1991-12-18",
      birthTime: "06:05",
      birthPlace: "Chengdu",
    },
    currentQuestion:
      "My ex contacted me after eight months and said they miss the old days. I do not know whether they want to repair things or are just lonely. The breakup involved repeated avoidance from both sides, and I want to decide whether to reply, meet once, or keep distance.",
    expectedRealityNodes: [
      {
        label: "Ex-partner",
        nodeType: "person",
        allowedSources: ["user_input"],
        mustComeFrom: "User says the ex contacted them after eight months.",
      },
      {
        label: "Breakup history",
        nodeType: "constraint",
        allowedSources: ["user_input"],
        mustComeFrom: "User describes repeated avoidance during the breakup.",
      },
      {
        label: "Current message",
        nodeType: "information_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User reports the message about missing the old days.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "emotional_pressure",
        groundedReason: "Ex contact reactivates past attachment and uncertainty.",
      },
      {
        pressureType: "information_gap",
        groundedReason: "The message does not state a repair intention.",
      },
      {
        pressureType: "timing_pressure",
        groundedReason: "Eight months of distance changes the cost of reopening contact.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Reply with one clear question about intention before meeting.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Set conditions for a single meeting or no meeting based on observable repair behavior.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether there was harm, coercion, or unsafe behavior in the prior relationship.",
      "Whether the ex has named accountability or only nostalgia.",
      "What boundary the user wants if contact restarts.",
    ],
    forbiddenBehaviors: [
      ...defaultForbiddenBehaviors,
      "Do not promise reunion, closure, or karmic return.",
      "Do not state the ex's true motive as known.",
    ],
    acceptanceCriteria: [
      "The ex is included only because the user named them.",
      "The system distinguishes nostalgia message from evidence of repair.",
      "Any suggested contact is framed as optional, bounded, and low certainty.",
    ],
  },
  {
    id: "collaboration_partner_promises_no_delivery",
    domain: "collaboration",
    birthInfo: {
      birthDate: "1987-07-14",
      birthTime: "14:20",
      birthPlace: "Guangzhou",
    },
    currentQuestion:
      "A potential partner keeps promising investor introductions, a landing page, and a pilot customer, but nothing has landed after two months. They ask me to reserve more time for the project. I am deciding whether to keep trusting them, narrow scope, or exit.",
    expectedRealityNodes: [
      {
        label: "Potential partner",
        nodeType: "person",
        allowedSources: ["user_input"],
        mustComeFrom: "User says the partner makes repeated promises.",
      },
      {
        label: "Investor introductions",
        nodeType: "opportunity_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User names investor introductions as a promised asset.",
      },
      {
        label: "Pilot customer",
        nodeType: "opportunity_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User names a pilot customer as promised but not landed.",
      },
      {
        label: "User time capacity",
        nodeType: "resource_holder",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "Partner asks the user to reserve more time.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "information_gap",
        groundedReason: "Promises lack delivered proof.",
      },
      {
        pressureType: "resource_control",
        groundedReason: "The partner asks for the user's scarce time before delivery.",
      },
      {
        pressureType: "opportunity_pull",
        groundedReason: "Investors and pilot customer could be valuable if real.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Ask for one dated deliverable before reserving more time.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Narrow scope until investor, landing page, or pilot evidence appears.",
      },
      {
        branchHint: "decisive_self",
        requiredRealityLogic: "Exit only if the two-month non-delivery pattern continues past a clear checkpoint.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether any intro or pilot has a named counterpart.",
      "Whether responsibilities were written down.",
      "Whether the project has independent validation apart from the partner.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "Promises are treated as low-confidence opportunity nodes until delivery evidence exists.",
      "Trust changes come from observed delivery pattern, not destiny compatibility.",
      "The simulation does not accuse the partner of deception without evidence.",
    ],
  },
  {
    id: "collaboration_big_client_vague_requirements",
    domain: "collaboration",
    birthInfo: {
      birthDate: "1990-02-06",
      birthTime: "08:45",
      birthPlace: "Suzhou",
    },
    currentQuestion:
      "A large client may fund a strategic AI workflow project, but their requirements keep changing and the internal sponsor has not confirmed budget. If it works, it could become my biggest case study. I need to decide whether to write a proposal, run a paid discovery, or wait.",
    expectedRealityNodes: [
      {
        label: "Large client",
        nodeType: "organization",
        allowedSources: ["user_input"],
        mustComeFrom: "User names a large client and a possible AI workflow project.",
      },
      {
        label: "Internal sponsor",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User says the internal sponsor has not confirmed budget.",
      },
      {
        label: "Changing requirements",
        nodeType: "constraint",
        allowedSources: ["user_input"],
        mustComeFrom: "User states requirements keep changing.",
      },
      {
        label: "Case study upside",
        nodeType: "opportunity_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User says the project could become their biggest case study.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "information_gap",
        groundedReason: "Requirements are vague and shifting.",
      },
      {
        pressureType: "resource_control",
        groundedReason: "Budget depends on the internal sponsor.",
      },
      {
        pressureType: "opportunity_pull",
        groundedReason: "The client could produce a major case study.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Offer a paid discovery phase to convert vague requirements into scope and budget evidence.",
      },
      {
        branchHint: "baseline",
        requiredRealityLogic: "Keep proposal effort limited until sponsor authority and requirements are clearer.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Define a proposal threshold: sponsor name, budget range, decision date, and discovery scope.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether the sponsor has decision authority.",
      "Whether the client accepts paid discovery.",
      "Whether requirements connect to a real business owner.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "The large opportunity stays conditional on budget and scope evidence.",
      "Path events reflect normal enterprise sales logic.",
      "No destiny copy implies the client is meant to arrive or guaranteed to convert.",
    ],
  },
  {
    id: "family_stability_expectation_vs_city_direction_change",
    domain: "family",
    birthInfo: {
      birthDate: "1993-09-27",
      birthTime: "19:35",
      birthPlace: "Wuhan",
    },
    currentQuestion:
      "My family expects me to stay in my current city, keep a stable public-sector style job, and buy an apartment soon. I want to move to Shanghai and shift toward product strategy, but I worry about disappointing them and losing practical support.",
    expectedRealityNodes: [
      {
        label: "Family stability expectation",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User says family expects stable job, same city, and apartment purchase.",
      },
      {
        label: "Current city",
        nodeType: "environment",
        allowedSources: ["user_input"],
        mustComeFrom: "User says family expects them to stay in the current city.",
      },
      {
        label: "Shanghai product strategy path",
        nodeType: "opportunity_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User wants to move to Shanghai and shift toward product strategy.",
      },
      {
        label: "Practical support",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User worries about losing practical family support.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "emotional_pressure",
        groundedReason: "User worries about disappointing family.",
      },
      {
        pressureType: "resource_control",
        groundedReason: "Family support may be tied to staying stable.",
      },
      {
        pressureType: "opportunity_pull",
        groundedReason: "Shanghai and product strategy represent the desired future path.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Test the move through portfolio, interviews, or a temporary plan before breaking family support assumptions.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Separate emotional approval from practical support and define what support is actually needed.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether family support is financial, housing, emotional, or social.",
      "Whether Shanghai has concrete job opportunities yet.",
      "Whether apartment timing is fixed or negotiable.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "Family pressure is modeled as expectation plus support, not as fate.",
      "The Shanghai path requires market or interview evidence before confidence rises.",
      "The output does not command rebellion or obedience.",
    ],
  },
  {
    id: "family_parent_support_mixed_with_control",
    domain: "family",
    birthInfo: {
      birthDate: "1989-05-11",
      birthTime: "12:25",
      birthPlace: "Xi'an",
    },
    currentQuestion:
      "My parents offered to help with a down payment and living costs while I rebuild my career, but they also want to decide where I live and which jobs are acceptable. I feel grateful and controlled at the same time. I need a path that keeps support without losing autonomy.",
    expectedRealityNodes: [
      {
        label: "Parents",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User says parents offered money and want influence.",
      },
      {
        label: "Down payment and living cost support",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User names concrete financial support.",
      },
      {
        label: "Residence and job control",
        nodeType: "constraint",
        allowedSources: ["user_input"],
        mustComeFrom: "User says parents want to decide location and acceptable jobs.",
      },
      {
        label: "Career rebuild",
        nodeType: "opportunity_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User is rebuilding their career.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "resource_control",
        groundedReason: "Financial support is tied to parental conditions.",
      },
      {
        pressureType: "emotional_pressure",
        groundedReason: "User feels grateful and controlled.",
      },
      {
        pressureType: "information_gap",
        groundedReason: "The acceptable boundary between support and control is not yet defined.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Clarify which support terms are gifts, loans, or conditional decisions.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Accept only support that has explicit autonomy boundaries.",
      },
      {
        branchHint: "decisive_self",
        requiredRealityLogic: "Choose independence if financial conditions make career rebuilding impossible.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether the money is a gift, loan, or conditional agreement.",
      "Which job/location constraints are non-negotiable.",
      "Whether the user has a lower-support independence option.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "Support and control are both represented instead of collapsed into one family node.",
      "Path events focus on terms, boundaries, and fallback options.",
      "Destiny does not label parents as inherently controlling or supportive.",
    ],
  },
  {
    id: "migration_city_visa_employment_constraints",
    domain: "migration",
    birthInfo: {
      birthDate: "1994-01-30",
      birthTime: "03:50",
      birthPlace: "Qingdao",
    },
    currentQuestion:
      "I am choosing between staying in Singapore, moving to Tokyo, or returning to China. Singapore has visa stability but limited growth, Tokyo has interesting AI roles but language uncertainty, and China has stronger network access but more competition. I need a twelve-month plan.",
    expectedRealityNodes: [
      {
        label: "Singapore visa stability",
        nodeType: "institution",
        allowedSources: ["user_input"],
        mustComeFrom: "User says Singapore has visa stability.",
      },
      {
        label: "Tokyo AI roles",
        nodeType: "market",
        allowedSources: ["user_input"],
        mustComeFrom: "User names Tokyo AI roles and language uncertainty.",
      },
      {
        label: "China network access",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User says China has stronger network access.",
      },
      {
        label: "China competition",
        nodeType: "market",
        allowedSources: ["user_input"],
        mustComeFrom: "User names more competition in China.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "institutional_constraint",
        groundedReason: "Visa stability affects the Singapore branch.",
      },
      {
        pressureType: "market_pressure",
        groundedReason: "Tokyo and China have different market tradeoffs.",
      },
      {
        pressureType: "competition",
        groundedReason: "User explicitly states China has more competition.",
      },
      {
        pressureType: "timing_pressure",
        groundedReason: "User needs a twelve-month plan.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "baseline",
        requiredRealityLogic: "Compare all three cities using visa, market, language, network, and competition signals.",
      },
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Test Tokyo language/job fit and China network conversion before leaving Singapore stability.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Set twelve-month checkpoints for visa security, interviews, and offer probability.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Exact Singapore visa duration and renewal rules.",
      "Japanese language level and role requirements.",
      "Whether China network access can create interviews or only advice.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "Cities are modeled as distinct reality nodes with different constraints.",
      "Path confidence depends on concrete visa and employment evidence.",
      "Destiny does not declare one city as guaranteed lucky or unlucky.",
    ],
  },
  {
    id: "self_direction_transition_without_external_feedback",
    domain: "self_direction",
    birthInfo: {
      birthDate: "1996-10-04",
      birthTime: "16:10",
      birthPlace: "Fuzhou",
    },
    currentQuestion:
      "I want to transition from operations into AI product or founder-like work, but I do not have clear external feedback yet. I have built small prototypes, talked to two friends, and saved six months of runway. I am unsure whether to quit, keep building nights, or look for adjacent roles.",
    expectedRealityNodes: [
      {
        label: "Small prototypes",
        nodeType: "information_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User says they built small prototypes.",
      },
      {
        label: "Two friends' feedback",
        nodeType: "information_source",
        allowedSources: ["user_input"],
        mustComeFrom: "User says they talked to two friends.",
      },
      {
        label: "Six months of runway",
        nodeType: "resource_holder",
        allowedSources: ["user_input"],
        mustComeFrom: "User states six months of saved runway.",
      },
      {
        label: "Adjacent AI product roles",
        nodeType: "opportunity_source",
        allowedSources: ["user_input", "inferred_from_user_context"],
        mustComeFrom: "User names adjacent roles as an option.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "information_gap",
        groundedReason: "External feedback is not yet clear.",
      },
      {
        pressureType: "resource_control",
        groundedReason: "Six months of runway creates a finite resource boundary.",
      },
      {
        pressureType: "opportunity_pull",
        groundedReason: "AI product or founder-like work is the desired transition.",
      },
    ],
    expectedDestinyModifierBoundaries: defaultDestinyBoundaries,
    expectedPathEvents: [
      {
        branchHint: "cautious_self",
        requiredRealityLogic: "Use nights/weekends or adjacent roles to gather external feedback before quitting.",
      },
      {
        branchHint: "decisive_self",
        requiredRealityLogic: "Quit only if prototypes gain stronger market evidence and runway is deliberately budgeted.",
      },
      {
        branchHint: "boundary_adjustment",
        requiredRealityLogic: "Define validation milestones before spending runway.",
      },
    ],
    shouldAskClarification: false,
    expectedUncertainties: [
      "Whether prototype users are target customers or only friends.",
      "Monthly burn rate and real runway.",
      "Quality of portfolio for adjacent AI product roles.",
    ],
    forbiddenBehaviors: defaultForbiddenBehaviors,
    acceptanceCriteria: [
      "External feedback remains an uncertainty, not an inferred positive signal.",
      "Runway is treated as a concrete constraint.",
      "Destiny may shape risk tolerance wording but not validate founder-market fit.",
    ],
  },
  {
    id: "low_information_user_only_says_lost",
    domain: "low_information",
    birthInfo: {
      birthDate: "1998-06-19",
      birthTime: "",
      birthPlace: "",
    },
    currentQuestion: "I feel lost and do not know what to do.",
    expectedRealityNodes: [
      {
        label: "User",
        nodeType: "user",
        allowedSources: ["user_input"],
        mustComeFrom: "Only the user and their stated confusion are grounded.",
      },
      {
        label: "Low-information constraint",
        nodeType: "constraint",
        allowedSources: ["inferred_from_user_context"],
        mustComeFrom: "The input lacks domain, people, options, recent events, and time horizon.",
      },
    ],
    expectedRealityPressures: [
      {
        pressureType: "information_gap",
        groundedReason: "No specific domain, stakeholder, choice, resource, or deadline is provided.",
      },
      {
        pressureType: "emotional_pressure",
        groundedReason: "User expresses feeling lost, but no clinical claim should be made.",
      },
    ],
    expectedDestinyModifierBoundaries: [
      ...defaultDestinyBoundaries,
      "Birth info is incomplete, so destiny modifier confidence must be low or rough mode only.",
    ],
    expectedPathEvents: [
      {
        branchHint: "clarification",
        requiredRealityLogic: "Ask for domain, recent event, main choice, time window, and one concrete external pressure before simulating.",
      },
      {
        branchHint: "low_confidence_probe",
        requiredRealityLogic: "If any output is shown, it must be framed as a low-confidence intake scaffold rather than a path prediction.",
      },
    ],
    shouldAskClarification: true,
    expectedUncertainties: [
      "Primary life domain is unknown.",
      "No key people or institutions are named.",
      "No decision options or time horizon are known.",
      "Birth time and birth place are missing.",
    ],
    forbiddenBehaviors: [
      ...defaultForbiddenBehaviors,
      "Do not invent a career, relationship, family, or migration scenario.",
      "Do not produce confident path events from this input.",
      "Do not diagnose the user's mental state.",
    ],
    acceptanceCriteria: [
      "The result asks clarification or marks confidence as low.",
      "No external reality node appears except a low-information constraint.",
      "The system avoids deterministic prediction and avoids destiny-created people.",
    ],
  },
] satisfies GroundedSimulationEvalCase[];

export const groundedSimulationEvalCoverage = {
  totalCases: groundedSimulationEvalCases.length,
  requiredDomains: [
    "career",
    "relationship",
    "collaboration",
    "family",
    "migration",
    "self_direction",
    "low_information",
  ] satisfies GroundedSimulationEvalDomain[],
  requiredEvaluationFocus: [
    "Reality nodes come from user input or grounded semantics, not destiny.",
    "Destiny modifies user reaction and timing only; it does not create facts.",
    "Path events follow real-world resource, information, timing, and opportunity logic.",
    "Low-information input triggers clarification or low confidence.",
    "Outputs avoid deterministic prediction.",
    "Outputs avoid claims that destiny proves a real person exists.",
  ],
};
