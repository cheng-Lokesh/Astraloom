"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { Button, SurfaceCard } from "@/components/ui-foundation";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { buildDestinyProfileDraft } from "@/lib/destiny/build-destiny-profile";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import type { BirthInfo, DestinyMode } from "@/types/destiny";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";

const sampleBirthInfo = {
  birthDate: "1992-08-16",
  birthTime: "07:40",
  birthPlace: "Shanghai",
  gender: "not_specified",
};

const sampleDescription =
  "I have been torn for two months about whether to accept a higher-paying new role or stay with my current team for a promised promotion. My current manager controls promotion timing, the recruiter is asking for an answer next week, and a trusted colleague hinted that budget approval may be slower than expected. I want Astraloom to map the pressure between timing, trust, opportunity, and reputation without treating anyone's private motives as certain.";

const startCopy = {
  en: {
    status: "Destiny-situation start",
    title: "Enter your birth context and current question.",
    intro:
      "Astraloom maps destiny climate, real people, and possible paths into a dynamic sandbox. Birth context is used as symbolic climate, not as deterministic fate.",
    safetyTitle: "Safety check before sandbox generation",
    birthTitle: "Birth context",
    birthBody:
      "Add what you know. Unknown time is fine, and you can skip the destiny layer for this run.",
    skipDestiny: "Skip destiny",
    destinySkipped: "Destiny skipped",
    unknownTime: "Unknown exact time",
    birthDate: "Birth date",
    birthTime: "Birth time",
    birthPlace: "Birth place",
    birthPlacePlaceholder: "City or place, optional",
    gender: "Gender",
    genderSkip: "Skip",
    female: "female",
    male: "male",
    currentQuestion: "Current question",
    currentQuestionBody:
      "Use one natural description. Include people, recent events, options, worries, or boundaries only if they naturally matter.",
    questionPlaceholder:
      "Example: I have been torn for two months about changing jobs. My manager promised a promotion but gave no date, a recruiter wants an answer next week, and I want to understand the pressure between timing, trust, and opportunity.",
    sandboxWindow: "Sandbox window",
    generate: "Generate destiny sandbox",
    sample: "Try a complete destiny sandbox sample",
    fillSample: "Fill sample fields",
    savedTitle: "What gets saved locally",
    profile: "Destiny Profile",
    climate: "Destiny Climate: built from the selected window and question.",
    seed: "Seed Context: derived from the single free-form description.",
    productBoundary: "Product boundary",
    productBoundaryBody:
      "This flow does not create a fortune report, professional advice, payment, production write, or service-role operation.",
    sampleLoaded: "Complete sample loaded. Generate it when you are ready.",
    missingBirth: "Add a birth date, or choose Skip destiny for this run.",
    missingQuestion:
      "Add one current question or situation description before generating.",
    saveFailed: "Local save failed. Please try again.",
    preparationFailed: "Local sandbox preparation failed",
    windowLabels: {
      "30_days": "30 days",
      "90_days": "90 days",
      "1_year": "1 year",
      "3_years": "3 years",
      "5_years": "5 years",
    },
  },
  zh: {
    status: "命理-处境开始",
    title: "输入出生背景和当前问题。",
    intro:
      "Astraloom 会把命理气候、现实人物和可能路径放进动态沙盘。出生背景只作为象征性气候使用，不作为确定命运。",
    safetyTitle: "生成沙盘前的安全检查",
    birthTitle: "出生背景",
    birthBody: "填写你知道的信息。不知道准确时间也可以，也可以跳过命理层。",
    skipDestiny: "跳过命理",
    destinySkipped: "已跳过命理",
    unknownTime: "不知道准确时间",
    birthDate: "出生日期",
    birthTime: "出生时间",
    birthPlace: "出生地点",
    birthPlacePlaceholder: "城市或地点，可选",
    gender: "性别",
    genderSkip: "跳过",
    female: "女性",
    male: "男性",
    currentQuestion: "当前问题",
    currentQuestionBody:
      "用一段自然描述即可。只有当人物、近期事件、选项、担忧或边界确实相关时再写进去。",
    questionPlaceholder:
      "例如：我这两个月一直在纠结要不要换工作。现在的上级承诺晋升但没有日期，招聘方希望下周答复，我想理解时机、信任和机会之间的压力。",
    sandboxWindow: "沙盘窗口",
    generate: "生成命理沙盘",
    sample: "试用完整命理沙盘示例",
    fillSample: "填入示例字段",
    savedTitle: "本地会保存什么",
    profile: "命理画像",
    climate: "命理气候：根据所选窗口和问题生成。",
    seed: "种子上下文：来自这一段自由描述。",
    productBoundary: "产品边界",
    productBoundaryBody:
      "这个流程不会生成算命报告、专业建议、支付、生产写入或 service-role 操作。",
    sampleLoaded: "完整示例已填入，准备好后可以生成。",
    missingBirth: "请填写出生日期，或为本次运行选择跳过命理。",
    missingQuestion: "生成前请填写一个当前问题或处境描述。",
    saveFailed: "本地保存失败，请重试。",
    preparationFailed: "本地沙盘准备失败",
    windowLabels: {
      "30_days": "30 天",
      "90_days": "90 天",
      "1_year": "1 年",
      "3_years": "3 年",
      "5_years": "5 年",
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

function modeLabel(mode: DestinyMode, locale: "en" | "zh") {
  if (locale === "en") return `${mode} mode`;
  if (mode === "full") return "完整模式";
  if (mode === "rough") return "粗略模式";
  return "已跳过";
}

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
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(
    null,
  );
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
  const previewProfile = useMemo(
    () => buildDestinyProfileDraft({ birthInfo, seedContextId: "preview_seed" }),
    [birthInfo],
  );
  const canSubmit =
    description.trim().length >= 20 && (skipDestiny || birthDate.trim().length > 0);

  function fillSample() {
    setBirthDate(sampleBirthInfo.birthDate);
    setBirthTime(sampleBirthInfo.birthTime);
    setBirthPlace(sampleBirthInfo.birthPlace);
    setGender(sampleBirthInfo.gender);
    setUnknownBirthTime(false);
    setSkipDestiny(false);
    setTimeWindow("90_days");
    setDescription(sampleDescription);
    setMessage(t.sampleLoaded);
  }

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
    setSafetyDecision(readiness.safetyDecision);

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
      setMessage(`${t.preparationFailed}: ${sandboxResult.errorCode}`);
      return;
    }

    router.push("/app/simulation/running");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="ready">{t.status}</StatusPill>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
            {t.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            {t.intro}
          </p>
        </SurfaceCard>

        {message ? (
          <p className="rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
            {message}
          </p>
        ) : null}
        {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title={t.safetyTitle}
          />
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <SurfaceCard className="p-6">
            <div className="space-y-7">
              <section>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#11150f]">
                      {t.birthTitle}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62695d]">
                      {t.birthBody}
                    </p>
                  </div>
                  <span className="rounded-md border border-black/8 bg-[#f7f8f4] px-3 py-2 text-xs font-semibold uppercase text-[#62695d]">
                    {modeLabel(previewProfile.mode, locale)}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={skipDestiny ? "primary" : "secondary"}
                    onClick={() => setSkipDestiny((value) => !value)}
                  >
                    {skipDestiny ? t.destinySkipped : t.skipDestiny}
                  </Button>
                  <Button
                    type="button"
                    variant={unknownBirthTime ? "primary" : "secondary"}
                    onClick={() => {
                      setUnknownBirthTime((value) => !value);
                      setBirthTime("");
                    }}
                    disabled={skipDestiny}
                  >
                    {t.unknownTime}
                  </Button>
                </div>

                {!skipDestiny ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label={t.birthDate}>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(event) => setBirthDate(event.target.value)}
                        className="mf-input w-full px-3 py-2"
                      />
                    </Field>
                    <Field label={t.birthTime}>
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(event) => setBirthTime(event.target.value)}
                        disabled={unknownBirthTime}
                        className="mf-input w-full px-3 py-2 disabled:opacity-50"
                      />
                    </Field>
                    <Field label={t.birthPlace}>
                      <input
                        value={birthPlace}
                        onChange={(event) => setBirthPlace(event.target.value)}
                        placeholder={t.birthPlacePlaceholder}
                        className="mf-input w-full px-3 py-2"
                      />
                    </Field>
                    <Field label={t.gender}>
                      <div className="flex flex-wrap gap-2">
                        {["not_specified", "female", "male"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setGender(value)}
                            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                              gender === value
                                ? "border-[#11150f] bg-[#11150f] text-white"
                                : "border-black/10 bg-white text-[#52594d]"
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
                ) : null}
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#11150f]">
                  {t.currentQuestion}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62695d]">
                  {t.currentQuestionBody}
                </p>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={9}
                  placeholder={t.questionPlaceholder}
                  className="mf-input mt-4 w-full resize-none px-4 py-3 leading-7"
                />
              </section>

              <section>
                <h2 className="text-sm font-semibold text-[#11150f]">
                  {t.sandboxWindow}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["30_days", "90_days", "1_year", "3_years", "5_years"] as TimeWindow[]).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTimeWindow(value)}
                        className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                          timeWindow === value
                            ? "border-[#11150f] bg-[#11150f] text-white"
                            : "border-black/10 bg-white text-[#52594d]"
                        }`}
                      >
                        {t.windowLabels[value]}
                      </button>
                    ),
                  )}
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={submit} disabled={!canSubmit || saving}>
                  {t.generate}
                </Button>
                <TrialSampleButton
                  target="/app/simulation/result"
                  className="mf-button mf-button-secondary px-5 py-3"
                >
                  {t.sample}
                </TrialSampleButton>
                <Button type="button" variant="secondary" onClick={fillSample}>
                  {t.fillSample}
                </Button>
              </div>
            </div>
          </SurfaceCard>

          <aside className="h-fit space-y-4">
            <section className="mf-panel-dark p-6">
              <h2 className="text-sm font-semibold text-[#b7e6c6]">
                {t.savedTitle}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/66">
                <p>
                  {t.profile}: {modeLabel(previewProfile.mode, locale)}.
                </p>
                <p>{t.climate}</p>
                <p>{t.seed}</p>
              </div>
            </section>
            <section className="mf-card p-5">
              <h2 className="text-sm font-semibold text-[#11150f]">
                {t.productBoundary}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#62695d]">
                {t.productBoundaryBody}
              </p>
            </section>
          </aside>
        </section>
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
