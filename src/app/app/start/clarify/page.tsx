"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { evaluateSandboxReadiness } from "@/lib/clarification/evaluate-sandbox-readiness";
import { buildDestinyClimateDraft } from "@/lib/destiny/build-destiny-climate";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { prepareLocalSandboxArtifacts } from "@/lib/sandbox/prepare-local-sandbox";
import type { ClarificationQuestion } from "@/types/clarification";
import type { DestinyProfileDraft } from "@/types/destiny";
import type { SeedContextDraft } from "@/types/seed-context";

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

export default function ClarifyPage() {
  const router = useRouter();
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
          <StatusPill tone="blocked">No draft</StatusPill>
          <h1 className="mt-5 text-3xl font-semibold text-[#11150f]">
            Start a sandbox first.
          </h1>
          <ButtonLink href="/app/start" className="mt-6 px-5 py-3">
            Back to start
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  const activeSeedContext = seedContext;
  const activeEvaluation = evaluation;
  const questions = activeEvaluation.questions.slice(0, 3);
  const hasAnyAnswer = questions.some((question) => answers[question.id]?.trim());

  function continueAfterAnswering() {
    if (activeEvaluation.readiness === "blocked") {
      setMessage(activeEvaluation.safetyDecision.userMessage);
      return;
    }

    if (!questions.length) {
      router.push("/app/simulation/running");
      return;
    }

    if (!hasAnyAnswer) {
      setMessage("Answer at least one clarification, or skip and run with lower confidence.");
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
      setMessage("Local save failed. Please try again.");
      return;
    }

    const sandboxResult = prepareLocalSandboxArtifacts(nextSeed);
    if (!sandboxResult.ok) {
      setMessage(`Local sandbox preparation failed: ${sandboxResult.errorCode}`);
      return;
    }

    setSeedContext(nextSeed);
    router.push("/app/simulation/running");
  }

  function skipAndRun() {
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
      setMessage("Local save failed. Please try again.");
      return;
    }

    const sandboxResult = prepareLocalSandboxArtifacts(nextSeed);
    if (!sandboxResult.ok) {
      setMessage(`Local sandbox preparation failed: ${sandboxResult.errorCode}`);
      return;
    }

    router.push("/app/simulation/running");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="planned">Short clarification</StatusPill>
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-[#11150f]">
            A few details would make this sandbox clearer.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Answer any useful question below, or skip and continue with lower
            confidence. This is not a long questionnaire.
          </p>
          <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-3 text-sm text-[#62695d]">
            Completeness {activeEvaluation.completenessScore}% -{" "}
            {activeEvaluation.lowConfidenceReason ?? "Ready to continue."}
          </div>
        </SurfaceCard>

        {activeEvaluation.safetyDecision.safetyLevel !== "safe" ? (
          <SafetyDowngradeNotice
            decision={activeEvaluation.safetyDecision}
            title="Safety check"
          />
        ) : null}

        {questions.length ? (
          <SurfaceCard className="space-y-4 p-6">
            {questions.map((question) => (
              <label
                key={question.id}
                className="block rounded-md border border-black/8 bg-white p-4"
              >
                <span className="block text-sm font-semibold text-[#11150f]">
                  {question.prompt}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#62695d]">
                  {question.helper}
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
                  placeholder={question.placeholder}
                  className="mf-input mt-3 w-full resize-none px-3 py-2 leading-6"
                />
              </label>
            ))}
          </SurfaceCard>
        ) : (
          <SurfaceCard className="p-6">
            <p className="text-sm leading-6 text-[#62695d]">
              This sandbox is ready enough to run. You can continue now.
            </p>
          </SurfaceCard>
        )}

        {message ? (
          <p className="rounded-md border border-[#d49b4a]/30 bg-[#fff8ed] px-4 py-3 text-sm text-[#7c5524]">
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={continueAfterAnswering}>
            Continue after answering
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={skipAndRun}
            disabled={!activeEvaluation.canSkip}
          >
            Skip and run with lower confidence
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
