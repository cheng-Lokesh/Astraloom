"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { RuntimeCapabilityBanner } from "@/components/runtime-capability-banner";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { Button, SurfaceCard } from "@/components/ui-foundation";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { buildDestinyProfileDraft } from "@/lib/destiny/build-destiny-profile";
import { getRepositories } from "@/lib/repositories/repository-provider";
import {
  buildManualRealitySource,
  buildRealityIntakeDraft,
} from "@/lib/reality-intake/build-manual-reality-intake";
import { runRealityIntakeFlow } from "@/lib/reality-intake/run-reality-intake-flow";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import type { BirthInfo, DestinyMode } from "@/types/destiny";
import type { ManualRealitySourceType } from "@/types/reality-intake";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";

const startCopy = {
  en: {
    title: "Start your destiny sandbox",
    intro: "Add a little birth context, then describe what you want to understand.",
    birthTitle: "Your birth information",
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
    skipDestiny: "Skip destiny and review the current situation structure",
    questionTitle: "What do you want to understand right now?",
    questionPlaceholder:
      "Describe what you are facing, the choice you are weighing, the relationship pressure, career change, or trend you want to understand. You do not need a format.",
    realityTitle: "Add real-world materials (optional, but improves grounding)",
    realityIntro:
      "If you want a more source-aware structure preview, paste materials related to your situation, such as job descriptions, chat summaries, company information, policy notes, offer terms, agreement summaries, or market notes. Without them, Astraloom can only run a local assumption demo.",
    realityAdd: "Add material",
    realityRemove: "Remove",
    realityItemTitle: "Title",
    realityType: "Type",
    realityContent: "Content",
    realityTitlePlaceholder: "Example: Offer terms from Company A",
    realityContentPlaceholder:
      "Paste the material here. Astraloom will only use it locally as user-provided grounding.",
    windowTitle: "Time window",
    generate: "Generate destiny sandbox",
    sample: "Try complete sample",
    missingBirth: "Add a birth date, or choose to skip destiny.",
    missingQuestion: "Please describe what you want to understand first.",
    saveFailed: "Saving failed. Please try again.",
    preparationFailed: "Something went wrong while preparing your sandbox. Please try again.",
    windowLabels: {
      "30_days": "30 days",
      "90_days": "90 days",
      "1_year": "1 year",
      "3_years": "3 years",
      "5_years": "5 years",
    },
  },
  zh: {
    title: "开始你的命运沙盘",
    intro: "填一点出生信息，再写下你现在想看清的问题。",
    birthTitle: "你的出生信息",
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
    skipDestiny: "跳过命理，只做现实局势推演",
    questionTitle: "你现在想看清什么？",
    questionPlaceholder:
      "直接描述你现在遇到的事、正在纠结的选择、关系里的困扰、职业上的变化，或者你想看清的趋势。不用按格式写，系统会自动整理关键人物、关系压力和可能路径。",
    realityTitle: "补充现实材料（可选，但会显著提高推演可信度）",
    realityIntro:
      "如果你希望沙盘更接近现实推演，可以粘贴与当前问题有关的材料，例如岗位描述、聊天摘要、公司信息、政策说明、offer 条款、合作协议摘要或市场信息。没有这些材料时，系统只能做本地假设推演。",
    realityAdd: "添加材料",
    realityRemove: "删除",
    realityItemTitle: "标题",
    realityType: "类型",
    realityContent: "内容",
    realityTitlePlaceholder: "例如：A 公司 offer 条款",
    realityContentPlaceholder:
      "把材料粘贴在这里。Astraloom 只会把它作为你手动提供的现实依据在本地使用。",
    windowTitle: "想看多长时间",
    generate: "生成命运沙盘",
    sample: "查看完整示例",
    missingBirth: "请填写出生日期，或选择跳过命理。",
    missingQuestion: "请至少描述一下你现在想看清的问题。",
    saveFailed: "保存失败，请再试一次。",
    preparationFailed: "沙盘准备失败，请再试一次。",
    windowLabels: {
      "30_days": "30天",
      "90_days": "90天",
      "1_year": "1年",
      "3_years": "3年",
      "5_years": "5年",
    },
  },
} as const;

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

const manualRealitySourceLabels: Record<
  ManualRealitySourceType,
  { en: string; zh: string }
> = {
  user_note: { en: "User note", zh: "个人备注" },
  chat_summary: { en: "Chat summary", zh: "聊天摘要" },
  job_description: { en: "Job description", zh: "岗位描述" },
  company_info: { en: "Company info", zh: "公司信息" },
  policy_info: { en: "Policy info", zh: "政策说明" },
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
  locale: "en" | "zh";
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

const timeWindowOptions: TimeWindow[] = [
  "30_days",
  "90_days",
  "1_year",
  "3_years",
  "5_years",
];

export default function StartPage() {
  const router = useRouter();
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
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState("not_specified");
  const [unknownBirthTime, setUnknownBirthTime] = useState(false);
  const [skipDestiny, setSkipDestiny] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    initialSeed?.timeWindow ?? "90_days",
  );
  const [description, setDescription] = useState(
    initialSeed?.currentQuestionDescription ?? initialSeed?.situationSummary ?? "",
  );
  const [manualRealityOpen, setManualRealityOpen] = useState(
    (initialRealityIntake?.manualSources.length ?? 0) > 0,
  );
  const [manualRealityInputs, setManualRealityInputs] = useState<
    ManualRealityInput[]
  >(() =>
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
      setMessage(t.saveFailed);
      return;
    }

    const realityIntake = await runRealityIntakeFlow({
      seedContext,
      destinyProfile: profile,
      destinyClimate: climate,
      manualRealitySources: manualSources,
      existingExternalSources: initialRealityIntake?.externalSources ?? [],
      locale,
      now,
    });
    const realityIntakeResult = repos.realityIntakes.save(realityIntake);
    if (!realityIntakeResult.ok) {
      setSaving(false);
      setMessage(t.saveFailed);
      return;
    }

    if (readiness.readiness === "needs_clarification") {
      router.push("/app/start/clarify");
      return;
    }

    const sandboxResult = prepareLocalSandboxArtifacts(seedContext);
    if (!sandboxResult.ok) {
      setSaving(false);
      setMessage(t.preparationFailed);
      return;
    }

    router.push("/app/simulation/running");
  }

  function updateManualRealityInput(
    id: string,
    patch: Partial<ManualRealityInput>,
  ) {
    setManualRealityInputs((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addManualRealityInput() {
    setManualRealityInputs((items) =>
      items.length >= 5
        ? items
        : [...items, emptyManualRealityInput(items.length + 1)],
    );
    setManualRealityOpen(true);
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
      <div className="mx-auto max-w-5xl space-y-5">
        <RuntimeCapabilityBanner realityIntake={initialRealityIntake} />

        <header className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight text-[#11150f]">
            {t.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-[#62695d]">{t.intro}</p>
        </header>

        {message ? (
          <p className="rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
            {message}
          </p>
        ) : null}

        <SurfaceCard className="p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[#11150f]">{t.birthTitle}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label={t.birthDate}>
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                disabled={skipDestiny}
                className="mf-input w-full px-3 py-2 disabled:opacity-50"
              />
            </Field>
            <Field label={`${t.birthTime} (${t.optional})`}>
              <input
                type="time"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
                disabled={unknownBirthTime || skipDestiny}
                className="mf-input w-full px-3 py-2 disabled:opacity-50"
              />
            </Field>
            <Field label={`${t.birthPlace} (${t.optional})`}>
              <input
                value={birthPlace}
                onChange={(event) => setBirthPlace(event.target.value)}
                placeholder={t.birthPlacePlaceholder}
                disabled={skipDestiny}
                className="mf-input w-full px-3 py-2 disabled:opacity-50"
              />
            </Field>
            <Field label={`${t.gender} (${t.optional})`}>
              <div className="flex flex-wrap gap-2">
                {["not_specified", "female", "male"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGender(value)}
                    disabled={skipDestiny}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      gender === value
                        ? "border-[#11150f] bg-[#11150f] text-white"
                        : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"
                    }`}
                  >
                    {value === "not_specified"
                      ? t.genderSkip
                      : value === "female"
                        ? t.female
                        : t.male}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Toggle
              checked={unknownBirthTime}
              disabled={skipDestiny}
              label={t.unknownTime}
              onChange={() => {
                setUnknownBirthTime((value) => !value);
                setBirthTime("");
              }}
            />
            <Toggle
              checked={skipDestiny}
              label={t.skipDestiny}
              onChange={() => setSkipDestiny((value) => !value)}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[#11150f]">
            {t.questionTitle}
          </h2>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder={t.questionPlaceholder}
            className="mf-input mt-5 w-full resize-none px-4 py-3 text-base leading-7"
          />

          <details
            open={manualRealityOpen}
            onToggle={(event) => setManualRealityOpen(event.currentTarget.open)}
            className="mt-5 rounded-md border border-black/10 bg-[#f7f8f4] p-4"
          >
            <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
              {t.realityTitle}
            </summary>
            <p className="mt-3 text-sm leading-6 text-[#62695d]">
              {t.realityIntro}
            </p>
            <div className="mt-4 space-y-4">
              {manualRealityInputs.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-md border border-black/8 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                      {locale === "zh" ? `材料 ${index + 1}` : `Material ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeManualRealityInput(item.id)}
                      className="rounded-md border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#52594d] hover:border-[#11150f]"
                    >
                      {t.realityRemove}
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                    <Field label={t.realityItemTitle}>
                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateManualRealityInput(item.id, {
                            title: event.target.value,
                          })
                        }
                        placeholder={t.realityTitlePlaceholder}
                        className="mf-input w-full px-3 py-2"
                      />
                    </Field>
                    <Field label={t.realityType}>
                      <select
                        value={item.sourceType}
                        onChange={(event) =>
                          updateManualRealityInput(item.id, {
                            sourceType: event.target
                              .value as ManualRealitySourceType,
                          })
                        }
                        className="mf-input w-full px-3 py-2"
                      >
                        {manualRealitySourceTypes.map((sourceType) => (
                          <option key={sourceType} value={sourceType}>
                            {manualRealitySourceLabels[sourceType][locale]}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label={t.realityContent}>
                    <textarea
                      value={item.content}
                      onChange={(event) =>
                        updateManualRealityInput(item.id, {
                          content: event.target.value,
                        })
                      }
                      rows={4}
                      placeholder={t.realityContentPlaceholder}
                      className="mf-input mt-2 w-full resize-none px-3 py-2 text-sm leading-6"
                    />
                  </Field>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addManualRealityInput}
              disabled={manualRealityInputs.length >= 5}
              className="mt-4 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#3f483d] transition hover:border-[#11150f] disabled:opacity-50"
            >
              {t.realityAdd}
            </button>
          </details>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[#11150f]">{t.windowTitle}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {timeWindowOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeWindow(value)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    timeWindow === value
                      ? "border-[#11150f] bg-[#11150f] text-white"
                      : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"
                  }`}
                >
                  {t.windowLabels[value]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit || saving}
              className="px-5 py-3"
            >
              {t.generate}
            </Button>
            <TrialSampleButton
              target="/app/simulation/result"
              className="mf-button mf-button-secondary px-5 py-3"
            >
              {t.sample}
            </TrialSampleButton>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-3 text-sm font-semibold text-[#3f483d] ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 accent-[#11150f]"
      />
      <span>{label}</span>
    </label>
  );
}
