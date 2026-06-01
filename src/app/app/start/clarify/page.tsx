"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import type { RealityIntakeApiResponse } from "@/lib/llm/llm-task-types";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { ExternalRealitySearchResult } from "@/lib/reality-intake/external-reality-search";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import type { ClarificationQuestion } from "@/types/clarification";
import type { DestinyProfileDraft } from "@/types/destiny";
import type { SeedContextDraft } from "@/types/seed-context";

type Locale = "en" | "zh";

const clarifyCopy = {
  zh: {
    noDraftTitle: "请先开始一个沙盘",
    backToStart: "返回开始页",
    title: "再补充一点，会让沙盘更清楚",
    intro: "下面的问题是可选的。你可以回答一两个最有帮助的问题，也可以直接生成沙盘。",
    readyTitle: "信息已经够用了",
    readyBody: "你可以继续生成动态沙盘。",
    safetyTitle: "安全提示",
    messageNeedAnswer: "请先回答一个问题，或者直接生成沙盘。",
    saveFailed: "保存失败，请再试一次。",
    prepareFailed: "沙盘准备失败，请再试一次。",
    continue: "补充后继续",
    skip: "直接生成沙盘",
    optionalHint: "可选补充",
    lowerConfidenceHint: "如果现在不补充，沙盘会用已有信息继续推演。",
    questions: {
      topic_unclear: {
        prompt: "你现在最想看清的核心问题是什么？",
        helper: "用一句话说明也可以。",
        placeholder: "例如：我该不该继续推进这段合作？",
      },
      key_people_missing: {
        prompt: "这件事里最关键的人是谁？",
        helper: "可以只写称呼或关系，不需要写真实姓名。",
        placeholder: "例如：我、直属负责人、合作方、伴侣",
      },
      recent_event_missing: {
        prompt: "最近发生了什么，让你开始想看清这件事？",
        helper: "写最近一个变化、冲突、信号或决定点就够了。",
        placeholder: "例如：上周对方突然改变了态度，我不确定该不该继续推进。",
      },
      decision_options_missing: {
        prompt: "你现在大概在几个选择之间摇摆？",
        helper: "简单写出选项即可，不需要分析。",
        placeholder: "例如：继续观察、主动沟通、先设边界",
      },
      destiny_birth_time_missing: {
        prompt: "出生时间不确定的话，你能补充一个大概范围吗？",
        helper: "不知道也没关系，可以直接生成沙盘。",
        placeholder: "例如：上午、下午、晚上，或者完全不确定",
      },
      destiny_skipped: {
        prompt: "如果跳过命理，你希望沙盘更关注哪一类现实线索？",
        helper: "可以写关系、职业、合作、家庭或其他现实局势。",
        placeholder: "例如：重点看职业变化和合作压力",
      },
      safety_sensitive: {
        prompt: "这件事有没有你不希望沙盘触碰的边界？",
        helper: "可以写不想讨论的方向，或不希望系统给出的建议类型。",
        placeholder: "例如：不要替我做决定，只帮我看清路径。",
      },
    },
  },
  en: {
    noDraftTitle: "Start a sandbox first",
    backToStart: "Back to start",
    title: "One small clarification can make the sandbox clearer",
    intro:
      "These questions are optional. Answer one or two useful details, or generate the sandbox now.",
    readyTitle: "This is enough to run",
    readyBody: "You can continue and generate the dynamic sandbox.",
    safetyTitle: "Safety note",
    messageNeedAnswer:
      "Answer one clarification, or generate the sandbox directly.",
    saveFailed: "Saving failed. Please try again.",
    prepareFailed: "Sandbox preparation failed. Please try again.",
    continue: "Continue after answering",
    skip: "Generate sandbox now",
    optionalHint: "Optional detail",
    lowerConfidenceHint:
      "If you skip this, the sandbox will continue with the information already provided.",
    questions: {
      topic_unclear: {
        prompt: "What is the core question you want to understand?",
        helper: "A single sentence is enough.",
        placeholder: "For example: should I keep pushing this collaboration?",
      },
      key_people_missing: {
        prompt: "Who matters most in this situation?",
        helper: "Use roles or relationships. Real names are not required.",
        placeholder: "For example: me, my manager, the partner, my spouse",
      },
      recent_event_missing: {
        prompt: "What happened recently that made this feel important?",
        helper: "Name one recent change, conflict, signal, or decision point.",
        placeholder:
          "For example: last week their attitude changed and I am unsure whether to keep pushing.",
      },
      decision_options_missing: {
        prompt: "Which options are you weighing right now?",
        helper: "A rough list is enough.",
        placeholder: "For example: observe, communicate directly, set a boundary",
      },
      destiny_birth_time_missing: {
        prompt: "If the birth time is uncertain, can you add a rough range?",
        helper: "It is fine if you do not know. You can generate the sandbox now.",
        placeholder: "For example: morning, afternoon, evening, or completely unsure",
      },
      destiny_skipped: {
        prompt: "If destiny is skipped, which real-world clues should matter most?",
        helper: "You can name relationships, career, collaboration, family, or another situation.",
        placeholder: "For example: focus on career change and collaboration pressure",
      },
      safety_sensitive: {
        prompt: "Is there any boundary you want the sandbox to respect?",
        helper:
          "Mention anything you do not want discussed, or advice you do not want.",
        placeholder:
          "For example: do not decide for me; just help me compare paths.",
      },
    },
  },
} as const;

function appendNote(base: string, label: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return base;

  return `${base.trim()}\n\nClarification - ${label}: ${trimmed}`.trim();
}

function applyAnswers(
  seedContext: SeedContextDraft,
  questions: ClarificationQuestion[],
  answers: Record<string, string>,
) {
  let next = { ...seedContext };
  let description =
    next.currentQuestionDescription || next.situationSummary || next.questionText;

  questions.forEach((question) => {
    const answer = answers[question.id]?.trim();
    if (!answer) return;

    description = appendNote(description, question.prompt, answer);

    if (question.missingInfoType === "topic_unclear") {
      next.questionText = answer;
    }
    if (question.missingInfoType === "key_people_missing") {
      next.keyPeopleText = appendNote(next.keyPeopleText, "people", answer);
    }
    if (question.missingInfoType === "recent_event_missing") {
      next.recentEvents = appendNote(next.recentEvents ?? "", "recent event", answer);
      next.recentEventsText = next.recentEvents;
    }
    if (question.missingInfoType === "decision_options_missing") {
      next.decisionOptions = appendNote(
        next.decisionOptions ?? "",
        "decision stage",
        answer,
      );
      next.decisionOptionsText = next.decisionOptions;
    }
    if (question.missingInfoType === "safety_sensitive") {
      next.safetyBoundaries = appendNote(
        next.safetyBoundaries ?? "",
        "safety boundary",
        answer,
      );
    }
  });

  next = {
    ...next,
    currentQuestionDescription: description,
    situationSummary: `${next.destinyBirthInfo ?? ""}\n\nCurrent question description: ${description}`.trim(),
    missingContextHints: [],
    contextQualityScore: Math.max(next.contextQualityScore ?? 0, 70),
    updatedAt: new Date().toISOString(),
  };

  return next;
}

function questionText(question: ClarificationQuestion, locale: Locale) {
  return (
    clarifyCopy[locale].questions[question.missingInfoType] ?? {
      prompt: question.prompt,
      helper: question.helper,
      placeholder: question.placeholder,
    }
  );
}

export default function ClarifyPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = clarifyCopy[locale];
  const [repos] = useState(() => getRepositories());
  const [seedContext, setSeedContext] = useState<SeedContextDraft | null>(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [profile] = useState<DestinyProfileDraft | null>(() => {
    if (!seedContext) return null;
    const result = repos.destinyProfiles.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const evaluation = useMemo(
    () =>
      seedContext
        ? evaluateSandboxReadiness({
            seedContext,
            birthInfo: profile?.birthInfo,
            destinyProfile: profile,
            maxQuestions: 3,
          })
        : null,
    [profile, seedContext],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  if (!seedContext || !evaluation) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-2xl p-7">
          <h1 className="mt-5 text-3xl font-semibold text-[#11150f]">
            {t.noDraftTitle}
          </h1>
          <ButtonLink href="/app/start" className="mt-6 px-5 py-3">
            {t.backToStart}
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  const activeSeedContext = seedContext;
  const activeEvaluation = evaluation;
  const questions = activeEvaluation.questions.slice(0, 3);
  const hasAnyAnswer = questions.some((question) => answers[question.id]?.trim());

  async function refreshRealityIntake(nextSeed: SeedContextDraft) {
    const savedIntakeResult = repos.realityIntakes.load(nextSeed.id);
    const savedIntake = savedIntakeResult.ok ? savedIntakeResult.data : null;
    try {
      const response = await fetch("/api/reality-intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seedContext: nextSeed,
          destinyProfile: profile,
          manualRealitySources: savedIntake?.manualSources ?? [],
          locale,
        }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as RealityIntakeApiResponse;
      if (payload.ok && payload.realityIntake) {
        let realityIntake = payload.realityIntake;
        if (realityIntake.llmExtraction?.searchQuestions.length) {
          const searchResponse = await fetch("/api/reality-search", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              searchQuestions: realityIntake.llmExtraction.searchQuestions,
              locale,
              primaryDomain: realityIntake.llmExtraction.primaryDomain,
            }),
          });
          if (searchResponse.ok) {
            const searchPayload =
              (await searchResponse.json()) as ExternalRealitySearchResult;
            realityIntake = {
              ...realityIntake,
              mode: searchPayload.sources.length
                ? "external_reality"
                : realityIntake.mode,
              externalSources: searchPayload.sources,
              missingExternalInfo: Array.from(
                new Set([
                  ...realityIntake.missingExternalInfo,
                  ...searchPayload.warnings,
                ]),
              ),
              realitySearchStatus: {
                enabled: searchPayload.provider !== "noop",
                attempted: true,
                succeeded: searchPayload.searchUsed,
                fallback: !searchPayload.searchUsed,
                provider: searchPayload.provider,
                warning: searchPayload.warnings[0],
              },
            };
          }
        }
        repos.realityIntakes.save(realityIntake);
      }
    } catch {
      if (!savedIntake) return;
      repos.realityIntakes.save({
        ...savedIntake,
        missingExternalInfo: Array.from(
          new Set([
            ...savedIntake.missingExternalInfo,
            "DeepSeek Reality Intake failed; this run uses local fallback only.",
          ]),
        ),
        llmStatus: {
          enabled: true,
          attempted: true,
          succeeded: false,
          fallback: true,
          provider: "deepseek",
          warning:
            "DeepSeek Reality Intake failed; this run uses local fallback only.",
        },
      });
    }
  }

  async function continueAfterAnswering() {
    if (activeEvaluation.readiness === "blocked") {
      setMessage(activeEvaluation.safetyDecision.userMessage);
      return;
    }

    if (!questions.length) {
      router.push("/app/simulation/running");
      return;
    }

    if (!hasAnyAnswer) {
      setMessage(t.messageNeedAnswer);
      return;
    }

    const nextSeed = applyAnswers(activeSeedContext, questions, answers);
    const seedResult = repos.seedContexts.save(nextSeed);

    if (profile) {
      repos.destinyClimates.save(
        buildDestinyClimateDraft({
          profile,
          referenceDate: new Date().toISOString(),
          timeWindow: nextSeed.timeWindow,
          topic: nextSeed.currentQuestionDescription ?? nextSeed.situationSummary,
        }),
      );
    }

    if (!seedResult.ok) {
      setMessage(t.saveFailed);
      return;
    }

    await refreshRealityIntake(nextSeed);
    const sandboxResult = prepareLocalSandboxArtifacts(nextSeed);
    if (!sandboxResult.ok) {
      setMessage(t.prepareFailed);
      return;
    }

    setSeedContext(nextSeed);
    router.push("/app/simulation/running");
  }

  async function skipAndRun() {
    if (activeEvaluation.readiness === "blocked") {
      setMessage(activeEvaluation.safetyDecision.userMessage);
      return;
    }

    const nextSeed = {
      ...activeSeedContext,
      contextQualityScore: activeEvaluation.completenessScore,
      missingContextHints: [
        activeEvaluation.lowConfidenceReason ??
          "Skipped clarification; continue with lower confidence.",
      ],
      updatedAt: new Date().toISOString(),
    };
    const seedResult = repos.seedContexts.save(nextSeed);
    if (!seedResult.ok) {
      setMessage(t.saveFailed);
      return;
    }

    await refreshRealityIntake(nextSeed);
    const sandboxResult = prepareLocalSandboxArtifacts(nextSeed);
    if (!sandboxResult.ok) {
      setMessage(t.prepareFailed);
      return;
    }

    router.push("/app/simulation/running");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <SurfaceCard emphasis="strong" className="p-7">
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-[#11150f]">
            {t.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            {t.intro}
          </p>
          <p className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-3 text-sm text-[#62695d]">
            {t.lowerConfidenceHint}
          </p>
        </SurfaceCard>

        {activeEvaluation.safetyDecision.safetyLevel !== "safe" ? (
          <SafetyDowngradeNotice
            decision={activeEvaluation.safetyDecision}
            title={t.safetyTitle}
          />
        ) : null}

        {questions.length ? (
          <SurfaceCard className="space-y-4 p-6">
            {questions.map((question) => {
              const text = questionText(question, locale);
              return (
                <label
                  key={question.id}
                  className="block rounded-md border border-black/8 bg-white p-4"
                >
                  <span className="text-xs font-semibold text-[#7d8578]">
                    {t.optionalHint}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-[#11150f]">
                    {text.prompt}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#62695d]">
                    {text.helper}
                  </span>
                  {question.options ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: option,
                            }))
                          }
                          className="rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-xs font-semibold text-[#52594d]"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <textarea
                    value={answers[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder={text.placeholder}
                    className="mf-input mt-3 w-full resize-none px-3 py-2 leading-6"
                  />
                </label>
              );
            })}
          </SurfaceCard>
        ) : (
          <SurfaceCard className="p-6">
            <h2 className="text-lg font-semibold text-[#11150f]">
              {t.readyTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">{t.readyBody}</p>
          </SurfaceCard>
        )}

        {message ? (
          <p className="rounded-md border border-[#d49b4a]/30 bg-[#fff8ed] px-4 py-3 text-sm text-[#7c5524]">
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={continueAfterAnswering}>
            {t.continue}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={skipAndRun}
            disabled={!activeEvaluation.canSkip}
          >
            {t.skip}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
