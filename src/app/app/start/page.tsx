"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { Button, SurfaceCard } from "@/components/ui-foundation";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { buildDestinyProfileDraft } from "@/lib/destiny/build-destiny-profile";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import type { BirthInfo, DestinyMode } from "@/types/destiny";
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
    skipDestiny: "Skip destiny and only simulate the real situation",
    questionTitle: "What do you want to understand right now?",
    questionPlaceholder:
      "Describe what you are facing, the choice you are weighing, the relationship pressure, career change, or trend you want to understand. You do not need a format.",
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

  function submit() {
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

    if (!seedResult.ok || !profileResult.ok || !climateResult.ok) {
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

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
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
