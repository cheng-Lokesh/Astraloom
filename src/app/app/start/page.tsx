"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { RuntimeCapabilityBanner } from "@/components/runtime-capability-banner";
import { TrialSampleButton } from "@/components/trial-sample-button";
import {
  Button,
  CapabilityCard,
  CheckboxRow,
  DestinyWeightingBadge,
  DestinyWeightingCard,
  ErrorText,
  FieldLabel,
  HelperText,
  MaterialInputCard,
  RealityCard,
  Select,
  StatusBadge,
  SurfaceCard,
  Textarea,
  TextInput,
  WarningPanel,
} from "@/components/ui-foundation";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { buildDestinyProfileDraft } from "@/lib/destiny/build-destiny-profile";
import { buildManualRealitySource, buildRealityIntakeDraft } from "@/lib/reality-intake/build-manual-reality-intake";
import { runRealityIntakeFlow } from "@/lib/reality-intake/run-reality-intake-flow";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { getRuntimeCapability } from "@/lib/runtime-capability/get-runtime-capability";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import type { BirthInfo, DestinyMode } from "@/types/destiny";
import type { ManualRealitySourceType } from "@/types/reality-intake";
import type { RuntimeCapabilityMode, RuntimeCapabilityState } from "@/types/runtime-capability";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";

type Locale = "en" | "zh";

const startCopy = {
  en: {
    title: "Check it once, then start",
    intro:
      "You can start with just this paragraph. Add materials only if you already have them.",
    eyebrow: "Almost ready",
    trustPill: "Only uses materials you confirm",
    capabilityTitle: "Current capability",
    deepSeek: "DeepSeek Reality Intake",
    externalSearch: "External Reality Search",
    estimatedMode: "Estimated mode",
    available: "available",
    unavailable: "unavailable",
    participated: "participated",
    notParticipated: "not yet",
    unavailableGrounding:
      "This run will clearly label whether it uses local assumptions, manual materials, AI intake, or external sources.",
    questionTitle: "What you want to understand",
    questionPlaceholder:
      "For example: I am thinking about leaving my current role. My manager has become vague, but outside opportunities are still unstable. I want to know what to observe and how to act over the next three months.",
    questionHelper:
      "Write naturally. People, recent events, choices, worries, limits, and timing can all go into the same paragraph.",
    shortContext:
      "If the situation is too short to ground, Astraloom will ask only the minimum clarification it needs.",
    timeWindow: "Time window",
    realityTitle: "Optional materials",
    realityIntro:
      "Screenshots, chat summaries, offer terms, company notes, or market notes can improve grounding, but they are not required to start.",
    material: "Material",
    materialAdd: "Add optional material",
    materialRemove: "Remove",
    materialLimit: "Up to 5 materials. Empty materials are ignored.",
    materialTitle: "Title",
    materialType: "Type",
    materialContent: "Content",
    materialTitlePlaceholder: "Example: Offer terms from Company A",
    materialContentPlaceholder:
      "Paste the concrete material here. Astraloom will use it as user-provided reality grounding.",
    destinyTitle: "Optional timing lens",
    destinyIntro:
      "Birth or destiny context is secondary. It only adjusts timing sensitivity and your likely pressure response; it does not create facts.",
    birthDate: "Birth date",
    birthTime: "Birth time",
    optional: "optional",
    birthPlace: "Birth place",
    birthPlacePlaceholder: "City or place",
    gender: "Gender",
    genderSkip: "Prefer not to say",
    female: "Female",
    male: "Male",
    unknownTime: "I do not know the exact time",
    skipDestiny: "Start without timing lens",
    generateTitle: "Start when ready",
    generate: "Start analysis",
    sample: "View complete sample",
    localModeNote: "The run will label assumptions instead of presenting them as facts.",
    groundedModeNote: "Ready for a source-aware first pass while preserving uncertainty.",
    missingBirth: "Add a birth date, or choose to start without the timing lens.",
    missingQuestion: "Please describe what you want to understand first.",
    saveFailed: "Saving failed. Please try again.",
    preparationFailed: "Something went wrong while preparing the analysis. Please try again.",
    loadingTitle: "Preparing your analysis",
    fallbackTitle: "Fallbacks used in this run",
    fallbackDeepSeek:
      "DeepSeek Reality Intake did not complete. The run is falling back to local or manual structure.",
    fallbackSearch:
      "External reality search did not return source-backed material. The result must not be read as fully grounded.",
    chipCareer: "Career choice",
    chipRelation: "Relationship",
    chipPartner: "Cooperation",
    chipFamily: "Family pressure",
    chipUnsorted: "I just want to describe it",
    optionalMaterialCta: "Add screenshot / chat summary",
    optionalBirthCta: "Birth info can wait",
    afterTitle: "What happens after you submit",
    afterReality: "Read the real situation",
    afterRealityBody: "Identify people, pressure, choices, limits, and facts that already happened.",
    afterUnknowns: "Mark uncertainty",
    afterUnknownsBody: "Missing facts are not filled by destiny or AI as conclusions.",
    afterPaths: "Build observable paths",
    afterPathsBody: "Each path includes next signals to watch, not a certain prediction.",
    scopeTitle: "Analysis range",
    scopeBody:
      "Suitable for relationship, career, cooperation, and other real choices. High-risk, medical, legal, or financial cases are downgraded to conservative support.",
    minimumTitle: "Only necessary follow-up",
    minimumBody:
      "If one paragraph is clear enough, the analysis starts directly. If essentials are missing, Astraloom asks one to three questions.",
    destinyNotFactTitle: "Destiny is not a fact source",
    destinyNotFactBody:
      "It can adjust stress response, boundary style, and timing sensitivity. Real-world facts still come from your materials.",
    flowInput: "Input situation",
    flowPeople: "Confirm key people",
    flowPaths: "Generate paths",
    flowObserve: "Observe next step",
    windowLabels: {
      "30_days": "30 days",
      "90_days": "90 days",
      "1_year": "1 year",
      "3_years": "3 years",
      "5_years": "5 years",
    },
    loadingSteps: {
      saving_input: "Saving input",
      deepseek_reality_intake: "Calling DeepSeek Reality Intake",
      external_reality_search: "Searching external reality information",
      build_reality_model: "Building grounded situation model",
      apply_destiny_weighting: "Applying timing lens",
      generate_path_sandbox: "Preparing path analysis",
    },
  },
  zh: {
    title: "确认一下，就可以开始",
    intro:
      "只用这一段话也可以开始。有截图、聊天摘要或条款时再补充，没有也不影响先跑一版。",
    eyebrow: "快准备好了",
    trustPill: "仅使用你确认的材料",
    capabilityTitle: "当前能力状态",
    deepSeek: "DeepSeek 现实信息摄取",
    externalSearch: "外部现实搜索",
    estimatedMode: "预计模式",
    available: "可用",
    unavailable: "不可用",
    participated: "已参与",
    notParticipated: "暂未参与",
    unavailableGrounding:
      "本次会清楚标明使用的是本地假设、手动材料、AI 摄取，还是外部来源。",
    questionTitle: "你想看清的事",
    questionPlaceholder:
      "例如：我最近在考虑要不要离开现在的工作。主管态度变得模糊，但外部机会还不稳定，我想知道接下来三个月应该观察什么、怎么行动。",
    questionHelper:
      "自然写就可以。人物、最近事件、选择、担心、限制和时间压力，都可以放在同一段里。",
    shortContext:
      "如果这段话不足以建立现实处境，Astraloom 只会追问必要信息。",
    timeWindow: "时间窗口",
    realityTitle: "可选材料",
    realityIntro:
      "截图、聊天摘要、offer 条款、公司信息或市场笔记可以提高依据质量，但不是开始分析的前置条件。",
    material: "材料",
    materialAdd: "添加可选材料",
    materialRemove: "删除",
    materialLimit: "最多 5 条材料。空材料不会保存。",
    materialTitle: "标题",
    materialType: "类型",
    materialContent: "内容",
    materialTitlePlaceholder: "例如：A 公司 offer 条款",
    materialContentPlaceholder:
      "把具体材料贴在这里。Astraloom 会把它作为你手动提供的现实依据使用。",
    destinyTitle: "可选时间镜头",
    destinyIntro:
      "出生或命理信息是次要层。它只调整时机敏感度和你的压力反应，不会创造现实事实。",
    birthDate: "出生日期",
    birthTime: "出生时间",
    optional: "可选",
    birthPlace: "出生地点",
    birthPlacePlaceholder: "城市或地点",
    gender: "性别",
    genderSkip: "不填写",
    female: "女",
    male: "男",
    unknownTime: "不知道准确时间",
    skipDestiny: "不使用时间镜头，直接开始",
    generateTitle: "准备开始",
    generate: "开始分析",
    sample: "查看完整示例",
    localModeNote: "本次会标记假设，不会把假设包装成事实。",
    groundedModeNote: "可进行带来源意识的第一轮分析，并保留不确定性。",
    missingBirth: "请填写出生日期，或选择不使用时间镜头。",
    missingQuestion: "请先描述你现在想看清的问题。",
    saveFailed: "保存失败，请再试一次。",
    preparationFailed: "分析准备失败，请再试一次。",
    loadingTitle: "正在准备分析",
    fallbackTitle: "本次使用的降级",
    fallbackDeepSeek:
      "DeepSeek 现实信息摄取未完成，本次会降级为本地或手动材料结构。",
    fallbackSearch:
      "外部现实搜索没有返回有来源支撑的材料，结果不能被包装成完整现实推演。",
    chipCareer: "职业选择",
    chipRelation: "关系推进",
    chipPartner: "合作/合伙",
    chipFamily: "家庭压力",
    chipUnsorted: "我只想先描述，不想分类",
    optionalMaterialCta: "补充截图/聊天摘要",
    optionalBirthCta: "出生信息可稍后补",
    afterTitle: "提交后会发生什么",
    afterReality: "读懂你的现实处境",
    afterRealityBody: "识别人物、压力、选择、限制和已经发生的事实。",
    afterUnknowns: "把不确定处标出来",
    afterUnknownsBody: "缺失事实不会被命理或 AI 自动补成结论。",
    afterPaths: "生成几条可观察路径",
    afterPathsBody: "每条路径都附带下一步观察信号，而不是确定预言。",
    scopeTitle: "本次分析范围",
    scopeBody:
      "适合关系、职业、合作等现实选择。高风险、医疗、法律或财务决策会降级为保守支持和求助建议。",
    minimumTitle: "系统只会追问必要信息",
    minimumBody:
      "如果一段话足够清楚，会直接进入分析；如果缺少关键边界，最多追问 1-3 个问题。",
    destinyNotFactTitle: "命理不是事实来源",
    destinyNotFactBody:
      "它只调整压力反应、边界风格和时机敏感度；现实事实仍以你的材料为准。",
    flowInput: "输入处境",
    flowPeople: "确认关键人物",
    flowPaths: "生成路径",
    flowObserve: "观察下一步",
    windowLabels: {
      "30_days": "30 天",
      "90_days": "90 天",
      "1_year": "1 年",
      "3_years": "3 年",
      "5_years": "5 年",
    },
    loadingSteps: {
      saving_input: "保存输入",
      deepseek_reality_intake: "调用 DeepSeek 现实信息摄取",
      external_reality_search: "搜索外部现实信息",
      build_reality_model: "构建现实处境模型",
      apply_destiny_weighting: "应用时间镜头",
      generate_path_sandbox: "准备路径分析",
    },
  },
} as const;
const modeLabels: Record<RuntimeCapabilityMode, Record<Locale, string>> = {
  local_assumption: { en: "Local assumption", zh: "本地假设" },
  manual_reality: { en: "Manual materials", zh: "手动材料" },
  ai_reality_intake: { en: "AI reality intake", zh: "AI 现实抽取" },
  external_reality: { en: "External reality", zh: "外部现实推演" },
  full_grounded_reality: { en: "Full grounded reality", zh: "完整现实来源支撑" },
};

const modeBadgeVariant: Record<
  RuntimeCapabilityMode,
  React.ComponentProps<typeof StatusBadge>["variant"]
> = {
  local_assumption: "localAssumption",
  manual_reality: "warning",
  ai_reality_intake: "aiIntake",
  external_reality: "externalReality",
  full_grounded_reality: "fullGrounded",
};

const manualRealitySourceTypes: ManualRealitySourceType[] = [
  "user_note",
  "chat_summary",
  "job_description",
  "company_info",
  "policy_info",
  "news_summary",
  "offer_terms",
  "agreement_summary",
  "market_note",
  "other",
];

const manualRealitySourceLabels: Record<ManualRealitySourceType, Record<Locale, string>> = {
  user_note: { en: "User note", zh: "个人备注" },
  chat_summary: { en: "Chat summary", zh: "聊天摘要" },
  job_description: { en: "Job description", zh: "岗位 JD" },
  company_info: { en: "Company info", zh: "公司信息" },
  policy_info: { en: "Policy note", zh: "政策说明" },
  news_summary: { en: "News summary", zh: "新闻摘要" },
  offer_terms: { en: "Offer terms", zh: "Offer 条款" },
  agreement_summary: { en: "Agreement summary", zh: "协议摘要" },
  market_note: { en: "Market note", zh: "市场信息" },
  other: { en: "Other", zh: "其他" },
};

type ManualRealityInput = {
  id: string;
  title: string;
  sourceType: ManualRealitySourceType;
  content: string;
};

type LoadingStepId =
  | "saving_input"
  | "deepseek_reality_intake"
  | "external_reality_search"
  | "build_reality_model"
  | "apply_destiny_weighting"
  | "generate_path_sandbox";

const loadingStepOrder: LoadingStepId[] = [
  "saving_input",
  "deepseek_reality_intake",
  "external_reality_search",
  "build_reality_model",
  "apply_destiny_weighting",
  "generate_path_sandbox",
];

const timeWindowOptions: TimeWindow[] = [
  "30_days",
  "90_days",
  "1_year",
  "3_years",
  "5_years",
];

function emptyManualRealityInput(index = 1): ManualRealityInput {
  return {
    id: `manual_input_${index}`,
    title: "",
    sourceType: "user_note",
    content: "",
  };
}

function firstQuestion(description: string) {
  const match = description.match(/[^.!?\n]*\?+/);
  if (match?.[0]?.trim()) return match[0].trim();

  const normalized = description.trim().replace(/\s+/g, " ");
  if (normalized.length <= 140) return normalized;

  return `${normalized.slice(0, 137).trim()}...`;
}

function destinyBirthInfoText(birthInfo: BirthInfo, mode: DestinyMode) {
  if (mode === "skipped") return "Destiny context skipped by user.";

  return [
    birthInfo.birthDate ? `Birth date: ${birthInfo.birthDate}` : "",
    birthInfo.birthTime ? `Birth time: ${birthInfo.birthTime}` : "Birth time: unknown",
    birthInfo.birthPlace ? `Birth place: ${birthInfo.birthPlace}` : "",
    birthInfo.gender ? `Gender: ${birthInfo.gender}` : "",
    birthInfo.timezone ? `Timezone: ${birthInfo.timezone}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function seedFromStartInput({
  id,
  birthInfo,
  mode,
  description,
  timeWindow,
  createdAt,
  locale,
}: {
  id: string;
  birthInfo: BirthInfo;
  mode: DestinyMode;
  description: string;
  timeWindow: TimeWindow;
  createdAt: string;
  locale: Locale;
}): SeedContextDraft {
  const now = new Date().toISOString();
  const questionText = firstQuestion(description);
  const destinyText = destinyBirthInfoText(birthInfo, mode);

  return {
    id,
    questionText,
    trackType:
      timeWindow === "30_days" || timeWindow === "90_days"
        ? "crossroad"
        : "life_climate",
    timeWindow,
    destinyBirthInfo: destinyText,
    currentQuestionDescription: description.trim(),
    situationSummary: `${destinyText}\n\nCurrent question description: ${description.trim()}`,
    recentEvents: description.trim(),
    recentEventsText: description.trim(),
    keyPeopleText: "",
    decisionOptions: description.trim(),
    decisionOptionsText: description.trim(),
    worries: "",
    forbiddenActions:
      "Do not treat destiny context as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
    forbiddenActionsText:
      "Do not treat destiny context as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
    safetyBoundaries:
      "Use destiny context as symbolic climate only; keep findings evidence-backed and non-deterministic.",
    desiredOutput:
      "Map destiny climate, real people, pressure changes, possible paths, findings, and evidence replay.",
    desiredOutputText:
      "Map destiny climate, real people, pressure changes, possible paths, findings, and evidence replay.",
    contextQualityScore:
      mode === "full" && description.trim().length >= 160
        ? 82
        : description.trim().length >= 80
          ? 68
          : 42,
    missingContextHints:
      mode === "full"
        ? []
        : [
            "Destiny context is directional. A later clarification page can ask one to three optional follow-ups.",
          ],
    privacyAck: true,
    privacySafetyAck: true,
    locale,
    status: "submitted",
    createdAt,
    updatedAt: now,
  };
}

function estimateMode(
  capability: RuntimeCapabilityState,
  hasManualInput: boolean,
): RuntimeCapabilityMode {
  if (
    capability.currentMode === "full_grounded_reality" ||
    capability.currentMode === "external_reality" ||
    capability.currentMode === "ai_reality_intake"
  ) {
    return capability.currentMode;
  }

  if (hasManualInput || capability.hasManualRealitySources) return "manual_reality";
  return "local_assumption";
}

function modeNote(mode: RuntimeCapabilityMode, locale: Locale) {
  if (mode === "external_reality" || mode === "full_grounded_reality") {
    return startCopy[locale].groundedModeNote;
  }
  return startCopy[locale].localModeNote;
}

function StartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const t = startCopy[locale];
  const [repos] = useState(() => getRepositories());
  const [initialSeed] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [initialRealityIntake] = useState(() => {
    if (!initialSeed) return null;
    const result = repos.realityIntakes.load(initialSeed.id);
    return result.ok ? result.data : null;
  });
  const initialPrompt = searchParams.get("prompt")?.trim() ?? "";
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState("not_specified");
  const [unknownBirthTime, setUnknownBirthTime] = useState(false);
  const [skipDestiny, setSkipDestiny] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    initialSeed?.timeWindow ?? "90_days",
  );
  const [description, setDescription] = useState(
    initialPrompt || initialSeed?.currentQuestionDescription || initialSeed?.situationSummary || "",
  );
  const [manualRealityInputs, setManualRealityInputs] = useState<ManualRealityInput[]>(() =>
    initialRealityIntake?.manualSources.length
      ? initialRealityIntake.manualSources.slice(0, 5).map((source, index) => ({
          id: source.id || `manual_input_${index + 1}`,
          title: source.title,
          sourceType: source.sourceType,
          content: source.content,
        }))
      : [emptyManualRealityInput()],
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStepId | null>(null);
  const [loadingFallbacks, setLoadingFallbacks] = useState<string[]>([]);

  const capability = useMemo(
    () => getRuntimeCapability({ realityIntake: initialRealityIntake }),
    [initialRealityIntake],
  );
  const hasManualInput = manualRealityInputs.some(
    (input) => input.content.trim().length > 0,
  );
  const expectedMode = estimateMode(capability, hasManualInput);

  const birthInfo = useMemo<BirthInfo>(
    () =>
      skipDestiny
        ? {}
        : {
            birthDate: birthDate.trim() || undefined,
            birthTime:
              unknownBirthTime || skipDestiny ? undefined : birthTime.trim() || undefined,
            birthPlace: birthPlace.trim() || undefined,
            gender: gender === "not_specified" ? undefined : gender,
          },
    [birthDate, birthPlace, birthTime, gender, skipDestiny, unknownBirthTime],
  );
  const canSubmit =
    description.trim().length >= 20 && (skipDestiny || birthDate.trim().length > 0);
  const showShortContextWarning =
    description.trim().length > 0 && description.trim().length < 80;

  function applyScenarioChip(chip: string) {
    const examples: Record<string, string> = {
      [t.chipCareer]:
        locale === "zh"
          ? "我最近在考虑是否离开现在的岗位。现在的工作稳定但成长有限，新机会更有空间但条件还没有完全确定。我想看清未来三个月应该观察哪些现实信号，以及怎样降低误判。"
          : "I am considering whether to leave my current role. The job is stable but growth is limited, while the new opportunity has more upside and more uncertainty. I want to see what signals to watch over the next three months and how to reduce misread risk.",
      [t.chipRelation]:
        locale === "zh"
          ? "我和一个重要的人最近沟通节奏变得不稳定，有时靠近、有时回避。我想看清这段关系的现实压力、边界和下一步适合观察的信号。"
          : "Communication with an important person has become unstable: sometimes close, sometimes avoidant. I want to understand the real pressure, boundaries, and next signals worth observing.",
      [t.chipPartner]:
        locale === "zh"
          ? "我正在评估一个合作机会。对方资源不错，但责任边界、投入节奏和退出条件还不清楚。我想知道继续推进前应该先确认什么。"
          : "I am evaluating a cooperation opportunity. The other side has useful resources, but responsibility boundaries, commitment pace, and exit terms are still unclear. I want to know what to confirm before moving forward.",
      [t.chipFamily]:
        locale === "zh"
          ? "家里最近对我的选择有明显压力。我想坚持自己的节奏，但也不想让关系恶化。我想看清哪些沟通方式风险更低。"
          : "My family is putting clear pressure on a choice I need to make. I want to keep my own pace without worsening the relationship, and understand which communication path is lower risk.",
      [t.chipUnsorted]:
        locale === "zh"
          ? "我现在只觉得某件事卡住了，还没有整理清楚。它牵涉到人、时间压力和一些不确定信息。我想先把局面拆清楚，再看下一步。"
          : "I only know that something feels stuck right now. It involves people, timing pressure, and uncertain information. I want to structure the situation first, then decide the next step.",
    };
    setDescription(examples[chip] ?? chip);
    setMessage("");
  }

  async function submit() {
    if (saving) return;

    if (!skipDestiny && !birthDate.trim()) {
      setMessage(t.missingBirth);
      return;
    }

    if (description.trim().length < 20) {
      setMessage(t.missingQuestion);
      return;
    }

    setSaving(true);
    setMessage("");
    setLoadingFallbacks([]);
    setLoadingStep("saving_input");

    const now = new Date().toISOString();
    const seedContextId = initialSeed?.id ?? repos.seedContexts.createId();
    const profile = buildDestinyProfileDraft({
      birthInfo,
      seedContextId,
      now,
    });
    const seedContext = seedFromStartInput({
      id: seedContextId,
      birthInfo,
      mode: profile.mode,
      description,
      timeWindow,
      createdAt: initialSeed?.createdAt ?? now,
      locale,
    });
    const manualSources = manualRealityInputs
      .slice(0, 5)
      .map((input, index) =>
        buildManualRealitySource({
          seedContext,
          title: input.title,
          sourceType: input.sourceType,
          content: input.content,
          now,
          id: `mrs_${seedContextId}_${index + 1}`,
        }),
      )
      .filter((source): source is NonNullable<typeof source> => Boolean(source));
    const localRealityIntake = buildRealityIntakeDraft({
      seedContext,
      manualSources,
      externalSources: initialRealityIntake?.externalSources ?? [],
      now,
    });
    const climate = buildDestinyClimateDraft({
      profile,
      referenceDate: now,
      timeWindow,
      topic: description,
    });
    const readiness = evaluateSandboxReadiness({
      seedContext,
      birthInfo,
      destinyProfile: profile,
      maxQuestions: 3,
    });

    if (readiness.readiness === "blocked") {
      setSaving(false);
      setLoadingStep(null);
      setMessage(readiness.safetyDecision.userMessage);
      return;
    }

    const seedResult = repos.seedContexts.save(seedContext);
    const profileResult = repos.destinyProfiles.save(profile);
    const climateResult = repos.destinyClimates.save(climate);
    const localRealityIntakeResult = repos.realityIntakes.save(localRealityIntake);

    if (
      !seedResult.ok ||
      !profileResult.ok ||
      !climateResult.ok ||
      !localRealityIntakeResult.ok
    ) {
      setSaving(false);
      setLoadingStep(null);
      setMessage(t.saveFailed);
      return;
    }

    setLoadingStep("deepseek_reality_intake");
    const realityIntake = await runRealityIntakeFlow({
      seedContext,
      destinyProfile: profile,
      destinyClimate: climate,
      manualRealitySources: manualSources,
      existingExternalSources: initialRealityIntake?.externalSources ?? [],
      locale,
      now,
    });

    const fallbacks: string[] = [];
    if (realityIntake.llmStatus?.fallback || realityIntake.llmStatus?.succeeded === false) {
      fallbacks.push(realityIntake.llmStatus.warning ?? t.fallbackDeepSeek);
    }

    setLoadingStep("external_reality_search");
    if (
      realityIntake.realitySearchStatus?.fallback ||
      realityIntake.realitySearchStatus?.succeeded === false
    ) {
      fallbacks.push(realityIntake.realitySearchStatus.warning ?? t.fallbackSearch);
    }
    setLoadingFallbacks(fallbacks);

    const realityIntakeResult = repos.realityIntakes.save(realityIntake);
    if (!realityIntakeResult.ok) {
      setSaving(false);
      setLoadingStep(null);
      setMessage(t.saveFailed);
      return;
    }

    if (readiness.readiness === "needs_clarification") {
      router.push("/app/start/clarify");
      return;
    }

    setLoadingStep("build_reality_model");
    setLoadingStep("apply_destiny_weighting");
    setLoadingStep("generate_path_sandbox");
    const sandboxResult = prepareLocalSandboxArtifacts(seedContext);
    if (!sandboxResult.ok) {
      setSaving(false);
      setLoadingStep(null);
      setMessage(t.preparationFailed);
      return;
    }

    router.push("/app/simulation/running");
  }

  function updateManualRealityInput(id: string, patch: Partial<ManualRealityInput>) {
    setManualRealityInputs((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addManualRealityInput() {
    setManualRealityInputs((items) =>
      items.length >= 5 ? items : [...items, emptyManualRealityInput(items.length + 1)],
    );
  }

  function removeManualRealityInput(id: string) {
    setManualRealityInputs((items) =>
      items.length <= 1
        ? [emptyManualRealityInput()]
        : items.filter((item) => item.id !== id),
    );
  }

  return (
    <AppShell>
      <div className="start-cinematic-page mx-auto max-w-7xl space-y-6">
        <header className="start-cinematic-hero max-w-4xl">
          <StatusBadge variant="sourceBacked">
            {t.eyebrow}
          </StatusBadge>
          <h1 className="mt-4 max-w-4xl whitespace-pre-line text-4xl font-semibold leading-tight text-[#11150f] sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#4f584f]">
            {t.intro}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            {message ? (
              <WarningPanel className="p-4">
                <p className="text-sm font-semibold text-[#7c5524]">{message}</p>
              </WarningPanel>
            ) : null}

            <RealityCard className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#11150f]">
                    {t.questionTitle}
                  </h2>
                  <HelperText className="mt-2">{t.questionHelper}</HelperText>
                </div>
                <StatusBadge variant="sourceBacked">{t.trustPill}</StatusBadge>
              </div>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={7}
                placeholder={t.questionPlaceholder}
                className="mt-5 px-4 py-4 text-lg leading-8"
                error={description.trim().length > 0 && description.trim().length < 20}
              />
              {showShortContextWarning ? (
                <ErrorText className="mt-3">{t.shortContext}</ErrorText>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {[t.chipCareer, t.chipRelation, t.chipPartner, t.chipFamily, t.chipUnsorted].map(
                  (chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => applyScenarioChip(chip)}
                      className="rounded-full border border-black/10 bg-white/55 px-3 py-2 text-sm text-[#4f584f] transition hover:border-[#568262]/45 hover:bg-[#eef5ee]"
                    >
                      {chip}
                    </button>
                  ),
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  <div className="min-w-[180px]">
                    <FieldLabel htmlFor="time-window">{t.timeWindow}</FieldLabel>
                    <Select
                      id="time-window"
                      value={timeWindow}
                      onChange={(event) => setTimeWindow(event.target.value as TimeWindow)}
                      className="mt-2 px-3 py-2"
                    >
                      {timeWindowOptions.map((value) => (
                        <option key={value} value={value}>
                          {t.windowLabels[value]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <CheckboxRow
                      checked={skipDestiny}
                      label={t.optionalBirthCta}
                      onChange={() => setSkipDestiny((value) => !value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit || saving}
                  loading={saving}
                  loadingLabel={t.loadingTitle}
                  className="justify-center px-6 py-3"
                >
                  {t.generate}
                </Button>
              </div>
            </RealityCard>

            <div className="grid gap-4 md:grid-cols-2">
              <SurfaceCard className="p-4">
                <h2 className="text-base font-semibold text-[#11150f]">
                  {t.minimumTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {t.minimumBody}
                </p>
              </SurfaceCard>
              <DestinyWeightingCard className="p-4">
                <h2 className="text-base font-semibold text-[#11150f]">
                  {t.destinyNotFactTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {t.destinyNotFactBody}
                </p>
              </DestinyWeightingCard>
            </div>
          </div>

          <aside className="space-y-5">
            <SurfaceCard className="p-5">
              <h2 className="text-xl font-semibold text-[#11150f]">
                {t.afterTitle}
              </h2>
              <div className="mt-4 space-y-4">
                {[
                  [t.afterReality, t.afterRealityBody],
                  [t.afterUnknowns, t.afterUnknownsBody],
                  [t.afterPaths, t.afterPathsBody],
                ].map(([title, body], index) => (
                  <div
                    key={title}
                    className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-t border-black/10 pt-4 first:border-t-0 first:pt-0"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-[#e6f0e8] text-sm font-semibold text-[#2f5d3d]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#11150f]">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#62695d]">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5" variant="path">
              <h2 className="text-xl font-semibold text-[#11150f]">
                {t.scopeTitle}
              </h2>
              <p className="mt-3 border-l-4 border-[#d49b4a] pl-4 text-sm leading-6 text-[#62695d]">
                {t.scopeBody}
              </p>
            </SurfaceCard>

            <CapabilityCard className="p-4">
              <h2 className="text-base font-semibold text-[#11150f]">
                {t.capabilityTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#62695d]">
                {capability.canClaimGroundedSimulation
                  ? modeNote(expectedMode, locale)
                  : t.unavailableGrounding}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge variant={capability.llmAvailable ? "aiIntake" : "localAssumption"}>
                  {t.deepSeek}: {capability.llmAvailable ? t.participated : t.notParticipated}
                </StatusBadge>
                <StatusBadge
                  variant={capability.realitySearchAvailable ? "externalReality" : "warning"}
                >
                  {t.externalSearch}:{" "}
                  {capability.realitySearchAvailable ? t.available : t.unavailable}
                </StatusBadge>
                <StatusBadge variant={modeBadgeVariant[expectedMode]}>
                  {t.estimatedMode}: {modeLabels[expectedMode][locale]}
                </StatusBadge>
              </div>
              <div className="mt-4">
                <RuntimeCapabilityBanner capability={capability} />
              </div>
            </CapabilityCard>
          </aside>
        </div>

        <SurfaceCard className="p-5 sm:p-6" variant="reality">
          <details>
            <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <span>
                <span className="block text-2xl font-semibold text-[#11150f]">
                  {t.realityTitle}
                </span>
                <span className="mt-2 block max-w-3xl text-sm leading-6 text-[#62695d]">
                  {t.realityIntro}
                </span>
              </span>
              <StatusBadge variant="sourceBacked">
                {locale === "zh" ? "可选补充" : "Optional"}
              </StatusBadge>
            </summary>

          <div className="mt-5 space-y-4">
            {manualRealityInputs.map((item, index) => (
              <MaterialInputCard key={item.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    {t.material} {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeManualRealityInput(item.id)}
                    className="px-3 py-1.5 text-xs"
                  >
                    {t.materialRemove}
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <FieldLabel htmlFor={`${item.id}-title`}>
                      {t.materialTitle}
                    </FieldLabel>
                    <TextInput
                      id={`${item.id}-title`}
                      value={item.title}
                      onChange={(event) =>
                        updateManualRealityInput(item.id, {
                          title: event.target.value,
                        })
                      }
                      placeholder={t.materialTitlePlaceholder}
                      className="mt-2 px-3 py-2"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`${item.id}-type`}>
                      {t.materialType}
                    </FieldLabel>
                    <Select
                      id={`${item.id}-type`}
                      value={item.sourceType}
                      onChange={(event) =>
                        updateManualRealityInput(item.id, {
                          sourceType: event.target.value as ManualRealitySourceType,
                        })
                      }
                      className="mt-2 px-3 py-2"
                    >
                      {manualRealitySourceTypes.map((sourceType) => (
                        <option key={sourceType} value={sourceType}>
                          {manualRealitySourceLabels[sourceType][locale]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <FieldLabel htmlFor={`${item.id}-content`}>
                    {t.materialContent}
                  </FieldLabel>
                  <Textarea
                    id={`${item.id}-content`}
                    value={item.content}
                    onChange={(event) =>
                      updateManualRealityInput(item.id, {
                        content: event.target.value,
                      })
                    }
                    rows={6}
                    placeholder={t.materialContentPlaceholder}
                    className="mt-2 px-3 py-2"
                  />
                </div>
              </MaterialInputCard>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={addManualRealityInput}
              disabled={manualRealityInputs.length >= 5}
            >
              {t.materialAdd}
            </Button>
            <HelperText>{t.materialLimit}</HelperText>
          </div>
          </details>
        </SurfaceCard>

        <DestinyWeightingCard className="p-5 sm:p-6">
          <details>
            <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-semibold text-[#11150f]">
                    {t.destinyTitle}
                  </span>
                  <DestinyWeightingBadge>
                    {locale === "zh" ? "次要层" : "secondary layer"}
                  </DestinyWeightingBadge>
                </span>
                <span className="mt-2 block max-w-3xl text-sm leading-6 text-[#62695d]">
                  {t.destinyIntro}
                </span>
              </span>
            </summary>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="birth-date">{t.birthDate}</FieldLabel>
              <TextInput
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                disabled={skipDestiny}
                className="mt-2 px-3 py-2 disabled:opacity-50"
              />
            </div>
            <div>
              <FieldLabel htmlFor="birth-time">
                {t.birthTime} ({t.optional})
              </FieldLabel>
              <TextInput
                id="birth-time"
                type="time"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
                disabled={unknownBirthTime || skipDestiny}
                className="mt-2 px-3 py-2 disabled:opacity-50"
              />
            </div>
            <div>
              <FieldLabel htmlFor="birth-place">
                {t.birthPlace} ({t.optional})
              </FieldLabel>
              <TextInput
                id="birth-place"
                value={birthPlace}
                onChange={(event) => setBirthPlace(event.target.value)}
                placeholder={t.birthPlacePlaceholder}
                disabled={skipDestiny}
                className="mt-2 px-3 py-2 disabled:opacity-50"
              />
            </div>
            <div>
              <FieldLabel htmlFor="gender">{t.gender} ({t.optional})</FieldLabel>
              <Select
                id="gender"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                disabled={skipDestiny}
                className="mt-2 px-3 py-2 disabled:opacity-50"
              >
                <option value="not_specified">{t.genderSkip}</option>
                <option value="female">{t.female}</option>
                <option value="male">{t.male}</option>
              </Select>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <CheckboxRow
              checked={unknownBirthTime}
              disabled={skipDestiny}
              label={t.unknownTime}
              onChange={() => {
                setUnknownBirthTime((value) => !value);
                setBirthTime("");
              }}
            />
            <CheckboxRow
              checked={skipDestiny}
              label={t.skipDestiny}
              onChange={() => setSkipDestiny((value) => !value)}
            />
          </div>
          </details>
        </DestinyWeightingCard>

        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#11150f]">
                {t.generateTitle}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge variant={modeBadgeVariant[expectedMode]}>
                  {modeLabels[expectedMode][locale]}
                </StatusBadge>
                <span className="text-sm leading-6 text-[#62695d]">
                  {modeNote(expectedMode, locale)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={submit}
                disabled={!canSubmit || saving}
                loading={saving}
                loadingLabel={t.loadingTitle}
                className="justify-center px-5 py-3"
              >
                {t.generate}
              </Button>
              <TrialSampleButton
                target="/app/simulation/result"
                className="mf-button mf-button-secondary justify-center px-5 py-3"
              >
                {t.sample}
              </TrialSampleButton>
            </div>
          </div>

          {saving ? (
            <div className="mt-6 rounded-md border border-[#568262]/18 bg-[#eef5ee]/65 p-4">
              <h3 className="text-sm font-semibold text-[#11150f]">
                {t.loadingTitle}
              </h3>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {loadingStepOrder.map((step) => (
                  <LoadingStep
                    key={step}
                    label={t.loadingSteps[step]}
                    active={loadingStep === step}
                    complete={
                      loadingStep
                        ? loadingStepOrder.indexOf(step) <
                          loadingStepOrder.indexOf(loadingStep)
                        : false
                    }
                  />
                ))}
              </div>
              {loadingFallbacks.length ? (
                <div className="mt-4 rounded-md border border-[#d49b4a]/25 bg-[#fff8ed] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c5524]">
                    {t.fallbackTitle}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-[#6c5842]">
                    {loadingFallbacks.map((fallback) => (
                      <li key={fallback}>- {fallback}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </SurfaceCard>
      </div>
    </AppShell>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <StartPageContent />
    </Suspense>
  );
}

function LoadingStep({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs font-semibold ${
        active
          ? "border-[#568262]/35 bg-white text-[#2f5d3d]"
          : complete
            ? "border-[#568262]/18 bg-white/70 text-[#62695d]"
            : "border-black/8 bg-white/45 text-[#7d8578]"
      }`}
    >
      <span
        className={`mr-2 inline-block h-2 w-2 rounded-full ${
          active ? "bg-[#568262] mf-progress-pulse" : complete ? "bg-[#568262]" : "bg-[#cfd5cb]"
        }`}
        aria-hidden
      />
      {label}
    </div>
  );
}
