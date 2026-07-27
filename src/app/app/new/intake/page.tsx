"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import {
  Button,
  ButtonLink,
  ConfidenceTag,
  EvidenceTag,
  SurfaceCard,
} from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import {
  buildMissingContextHints,
  calculateContextQualityScore,
} from "@/lib/seed-context/storage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";

const sample = {
  situationSummary:
    "I am deciding between a higher-paying new role and staying with my current team for a promised promotion. The decision affects my manager relationship, my reputation with the current team, and my ability to keep options open.",
  question:
    "Should I accept the new role now, or stay with my current team while asking for a clearer promotion timeline?",
  recentEvents:
    "My manager said promotion support is likely but did not give a date. The recruiter asked for an answer next week. A trusted colleague hinted that budget approval may be slower than expected.",
  people:
    "Current manager: controls promotion timing. Recruiter: controls offer deadline. Trusted colleague: has internal budget context. Partner: affected by schedule and income changes.",
  decisionOptions:
    "Accept the new role. Stay and negotiate a written promotion timeline. Ask both sides for one more week before deciding.",
  worries:
    "The promotion promise may stay vague. The new role may be less stable than it sounds. Pushing too hard could weaken trust with the current manager.",
  forbiddenActions:
    "Do not burn bridges with the current team. Do not accept vague promises as confirmed evidence. Do not disclose confidential team information.",
  safetyBoundaries:
    "Keep communication low-pressure and professional. Do not frame private motives as facts. Avoid legal, financial, or medical advice.",
  desiredOutput:
    "Show the main relationship pressure points, event evidence to watch, and low-risk communication options for the next 90 days.",
};

const timeWindows: Array<[TimeWindow, string, string]> = [
  ["30_days", "30 days", "Track A"],
  ["90_days", "90 days", "Track A"],
  ["1_year", "1 year", "Track B"],
  ["3_years", "3 years", "Track B"],
  ["5_years", "5 years", "Track B"],
];

const sectionLabels = [
  "Situation",
  "Question",
  "Events",
  "People",
  "Options",
  "Risks",
  "Boundaries",
  "Output",
];

function hasUsefulText(value: string, minimum = 1) {
  return value.trim().length >= minimum;
}

type SubmittedSeedContext = {
  id: string;
  version: string;
  submittedAt: string;
  frozenAt: string;
};

export default function IntakePage() {
  const [repos] = useState(() => getRepositories());
  const [initialDraft] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [situationSummary, setSituationSummary] = useState(
    initialDraft?.situationSummary ?? "",
  );
  const [question, setQuestion] = useState(initialDraft?.questionText ?? "");
  const [recentEvents, setRecentEvents] = useState(
    initialDraft?.recentEvents ?? initialDraft?.recentEventsText ?? "",
  );
  const [people, setPeople] = useState(initialDraft?.keyPeopleText ?? "");
  const [decisionOptions, setDecisionOptions] = useState(
    initialDraft?.decisionOptions ?? initialDraft?.decisionOptionsText ?? "",
  );
  const [worries, setWorries] = useState(initialDraft?.worries ?? "");
  const [forbiddenActions, setForbiddenActions] = useState(
    initialDraft?.forbiddenActions ?? initialDraft?.forbiddenActionsText ?? "",
  );
  const [safetyBoundaries, setSafetyBoundaries] = useState(
    initialDraft?.safetyBoundaries ??
      initialDraft?.forbiddenActions ??
      initialDraft?.forbiddenActionsText ??
      "",
  );
  const [desiredOutput, setDesiredOutput] = useState(
    initialDraft?.desiredOutput ?? initialDraft?.desiredOutputText ?? "",
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    initialDraft?.timeWindow ?? "90_days",
  );
  const [privacySafetyAck, setPrivacySafetyAck] = useState(
    initialDraft?.privacySafetyAck ?? initialDraft?.privacyAck ?? false,
  );
  const [message, setMessage] = useState("");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(
    null,
  );
  const [submissionStep, setSubmissionStep] = useState<
    "idle" | "confirm" | "submitting" | "success" | "failure"
  >("idle");
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);
  const [submittedSeedContext, setSubmittedSeedContext] =
    useState<SubmittedSeedContext | null>(null);
  const [recoveredSeedContexts, setRecoveredSeedContexts] = useState<
    SubmittedSeedContext[]
  >([]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || cancelled) return;

      try {
        const response = await fetch("/api/seed-context", { method: "GET" });
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as {
          seedContexts?: SubmittedSeedContext[];
        };
        if (!cancelled) setRecoveredSeedContexts(payload.seedContexts ?? []);
      } catch {
        // Recovery is read-only and must never block local drafting.
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const previewDraft: SeedContextDraft = {
    id: initialDraft?.id ?? "preview_seed",
    questionText: question.trim(),
    trackType:
      timeWindow === "30_days" || timeWindow === "90_days"
        ? "crossroad"
        : "life_climate",
    timeWindow,
    situationSummary: situationSummary.trim(),
    recentEvents: recentEvents.trim(),
    recentEventsText: recentEvents.trim(),
    keyPeopleText: people.trim(),
    decisionOptions: decisionOptions.trim(),
    decisionOptionsText: decisionOptions.trim(),
    worries: worries.trim(),
    forbiddenActions: forbiddenActions.trim(),
    forbiddenActionsText: forbiddenActions.trim(),
    safetyBoundaries: safetyBoundaries.trim(),
    desiredOutput: desiredOutput.trim(),
    desiredOutputText: desiredOutput.trim(),
    privacyAck: privacySafetyAck,
    privacySafetyAck,
    locale: "en",
    status: "draft",
    createdAt: initialDraft?.createdAt ?? new Date(0).toISOString(),
    updatedAt: initialDraft?.updatedAt ?? new Date(0).toISOString(),
  };
  const contextQualityScore = calculateContextQualityScore(previewDraft);
  const missingContextHints = buildMissingContextHints(previewDraft);
  const sectionCompletion = [
    hasUsefulText(situationSummary, 80),
    hasUsefulText(question, 12),
    hasUsefulText(recentEvents),
    hasUsefulText(people),
    hasUsefulText(decisionOptions),
    hasUsefulText(worries),
    hasUsefulText(forbiddenActions) || hasUsefulText(safetyBoundaries),
    hasUsefulText(desiredOutput),
  ];
  const completedSectionCount = sectionCompletion.filter(Boolean).length;

  function saveLocalDraft() {
    if (situationSummary.trim().length < 20) {
      setMessage("Add a short situation summary so agents have a clear starting point.");
      return false;
    }

    if (question.trim().length < 8) {
      setMessage("Add one concrete scenario question for the simulation to orient around.");
      return false;
    }

    if (!privacySafetyAck) {
      setMessage("Acknowledge the privacy and safety boundary before saving this sandbox.");
      return false;
    }

    const now = new Date().toISOString();
    const draftId = initialDraft?.id ?? repos.seedContexts.createId();
    const draftForScore = {
      ...previewDraft,
      id: draftId,
      status: "draft",
      createdAt: initialDraft?.createdAt ?? now,
      updatedAt: now,
    } satisfies SeedContextDraft;
    const draft = {
      id: draftId,
      questionText: question.trim(),
      trackType:
        timeWindow === "30_days" || timeWindow === "90_days"
          ? "crossroad"
          : "life_climate",
      timeWindow,
      situationSummary: situationSummary.trim(),
      recentEvents: recentEvents.trim(),
      recentEventsText: recentEvents.trim(),
      keyPeopleText: people.trim(),
      decisionOptions: decisionOptions.trim(),
      decisionOptionsText: decisionOptions.trim(),
      worries: worries.trim(),
      forbiddenActions: forbiddenActions.trim(),
      forbiddenActionsText: forbiddenActions.trim(),
      safetyBoundaries: safetyBoundaries.trim(),
      desiredOutput: desiredOutput.trim(),
      desiredOutputText: desiredOutput.trim(),
      contextQualityScore: calculateContextQualityScore(draftForScore),
      missingContextHints: buildMissingContextHints(draftForScore),
      privacyAck: privacySafetyAck,
      privacySafetyAck,
      locale: "en",
      status: "draft",
      createdAt: initialDraft?.createdAt ?? now,
      updatedAt: now,
    } satisfies SeedContextDraft;
    const decision = verifySafety({ seedContext: draft });
    setSafetyDecision(decision);

    if (decision.safetyLevel === "blocked") {
      setMessage(decision.userMessage);
      return false;
    }

    const result = repos.seedContexts.save(draft);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return false;
    }

    if (decision.safetyLevel === "downgraded") {
      setMessage(decision.userMessage);
      return true;
    }

    setMessage(
      "Local draft saved on this device. It has not been uploaded or submitted.",
    );
    return true;
  }

  function startFormalSubmission() {
    if (!saveLocalDraft()) return;

    if (timeWindow !== "30_days" && timeWindow !== "90_days") {
      setMessage("Formal submission is currently limited to Track A (30 or 90 days).");
      return;
    }

    setSubmissionKey((current) => current ?? crypto.randomUUID());
    setSubmissionStep("confirm");
  }

  async function confirmFormalSubmission() {
    const saved = saveLocalDraft();
    if (!saved || !submissionKey) return;

    setSubmissionStep("submitting");
    try {
      const response = await fetch("/api/seed-context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft: previewDraft, submissionKey }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { seedContext?: SubmittedSeedContext; errorCode?: string }
        | null;

      if (!response.ok || !payload?.seedContext) {
        setSubmissionStep("failure");
        setMessage(
          payload?.errorCode === "idempotency_key_content_conflict"
            ? "This confirmation key already belongs to different content. Your local draft is still safe; start a new confirmation."
            : "Formal submission did not complete. Your local draft remains on this device.",
        );
        return;
      }

      setSubmittedSeedContext(payload.seedContext);
      setRecoveredSeedContexts((current) => [payload.seedContext!, ...current]);
      setSubmissionStep("success");
      setMessage("Formal Track A version submitted and frozen. Later edits remain local until you submit a new version.");
    } catch {
      setSubmissionStep("failure");
      setMessage("Formal submission did not complete. Your local draft remains on this device.");
    }
  }

  function useSample() {
    setSituationSummary(sample.situationSummary);
    setQuestion(sample.question);
    setRecentEvents(sample.recentEvents);
    setPeople(sample.people);
    setDecisionOptions(sample.decisionOptions);
    setWorries(sample.worries);
    setForbiddenActions(sample.forbiddenActions);
    setSafetyBoundaries(sample.safetyBoundaries);
    setDesiredOutput(sample.desiredOutput);
    setTimeWindow("90_days");
    setPrivacySafetyAck(true);
    setMessage("Sample loaded. Save it or continue to people confirmation.");
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard emphasis="strong" className="p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <StatusPill tone="planned">Seed context</StatusPill>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
                Give the sandbox enough real-world evidence to build useful agents.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
                Tell the case in natural language, then add the signals that matter:
                events, people, options, boundaries, and the comparison you want.
              </p>
            </div>
            <ConfidenceTag value={contextQualityScore} label="context" />
          </div>

          <div className="mt-7 space-y-8">
            <SectionGroup
              eyebrow="The situation"
              title="Name the scene and the question."
              description="This gives the sandbox a focused starting point instead of a loose pile of notes."
            >
              <TextAreaField
                label="Situation summary"
                description="Set the scene in your own words: what is happening, why it matters, and which relationship dynamics are involved."
                complete={sectionCompletion[0]}
                value={situationSummary}
                onChange={setSituationSummary}
                rows={4}
                placeholder="In a few sentences, describe the scene, why it matters, and what relationship dynamics are involved."
              />
              <TextAreaField
                label="Main question"
                description="Give the run one concrete question so Track A or Track B knows what to compare."
                complete={sectionCompletion[1]}
                value={question}
                onChange={setQuestion}
                rows={3}
                placeholder="Example: Should I accept the new role now, or stay and ask for a clearer promotion timeline?"
              />
            </SectionGroup>

            <SectionGroup
              eyebrow="Evidence"
              title="Anchor the case in recent signals and people."
              description="Events and people hints become the raw material for Key People extraction and agent drafts."
            >
              <TextAreaField
                label="Recent key events"
                description="Use observed signals: dates, deadlines, promises, conflicts, changed behavior, missing information, or new openings."
                complete={sectionCompletion[2]}
                value={recentEvents}
                onChange={setRecentEvents}
                rows={4}
                placeholder="List observed events, promises, conflicts, deadlines, changed behavior, missing information, or new opportunities."
              />
              <TextAreaField
                label="Key people hints"
                description="Name people, roles, or groups that may become agents on the next page."
                complete={sectionCompletion[3]}
                value={people}
                onChange={setPeople}
                rows={3}
                placeholder="Name people or roles, plus why each person matters in the scenario."
              />
            </SectionGroup>

            <SectionGroup
              eyebrow="Decision space"
              title="Define branches, risks, and limits."
              description="Options say what can happen; boundaries say what should stay out of the sandbox."
            >
              <div className="grid gap-5 md:grid-cols-2">
              <TextAreaField
                label="Decision options"
                description="List realistic branches the simulation should compare."
                complete={sectionCompletion[4]}
                value={decisionOptions}
                onChange={setDecisionOptions}
                rows={4}
                placeholder="List the realistic options the simulation should compare."
              />
              <TextAreaField
                label="Risks and concerns"
                description="Separate concerns from confirmed evidence so the simulation can flag risk windows carefully."
                complete={sectionCompletion[5]}
                value={worries}
                onChange={setWorries}
                rows={4}
                placeholder="List assumptions, unknowns, risks, or concerns that should stay uncertain unless backed by evidence."
              />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
              <TextAreaField
                label="Forbidden actions"
                description="Behavior-level limits: actions you will not take or options that should not be simulated."
                complete={hasUsefulText(forbiddenActions)}
                value={forbiddenActions}
                onChange={setForbiddenActions}
                rows={4}
                placeholder="List actions that should stay out of scope, such as bridges you will not burn or boundaries you will keep."
              />
              <TextAreaField
                label="Sandbox safety limits"
                description="Product-level limits: what the sandbox should not suggest or assume."
                complete={hasUsefulText(safetyBoundaries)}
                value={safetyBoundaries}
                onChange={setSafetyBoundaries}
                rows={4}
                placeholder="Example: Do not suggest legal or financial actions. Do not assume others' private motives. Keep communication suggestions low-pressure."
              />
              </div>
            </SectionGroup>

            <SectionGroup
              eyebrow="Output"
              title="Tell the result page what to emphasize."
              description="This helps the later report focus on useful evidence, graph pressure points, and branch comparison."
            >
              <TextAreaField
                label="Desired output"
                description="Tell the result page what kind of evidence and comparison would be useful."
                complete={sectionCompletion[7]}
                value={desiredOutput}
                onChange={setDesiredOutput}
                rows={3}
                placeholder="Example: Show pressure points, evidence to watch, and communication options for the next 90 days."
              />
            </SectionGroup>

            <SectionGroup
              eyebrow="Run contract"
              title="Choose the horizon and confirm the local safety boundary."
              description="The run stays local-first and evidence-linked. Safety downgrade still applies before simulation."
            >
              <div>
                <div className="text-sm font-semibold text-[#11150f]">
                  Time horizon
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {timeWindows.map(([value, label, trackLabel]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTimeWindow(value)}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                        timeWindow === value
                          ? "border-[#11150f] bg-[#11150f] text-white"
                          : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"
                      }`}
                    >
                      {label}
                      <span className="ml-2 text-xs opacity-70">{trackLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

            <label className="flex gap-3 rounded-md border border-black/8 bg-[#f7f8f4] p-4">
              <input
                type="checkbox"
                checked={privacySafetyAck}
                onChange={(event) => setPrivacySafetyAck(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#11150f]"
              />
              <span className="text-sm leading-6 text-[#52594d]">
                I understand this local sandbox uses my text as scenario evidence for agents,
                relationship graph, simulation events, and evidence-linked notes. I will avoid
                entering secrets that are not needed, and I understand this is not professional
                advice or a way to bypass safety boundaries.
              </span>
            </label>
            </SectionGroup>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={saveLocalDraft}
              className="px-5 py-3"
            >
              Save scenario
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={useSample}
              className="px-5 py-3"
            >
              Use sample text
            </Button>
            <ButtonLink
              href="/app/new/people"
              variant="accent"
              onClick={(event) => {
                if (!saveLocalDraft()) event.preventDefault();
              }}
              className="px-5 py-3"
            >
              Confirm people
            </ButtonLink>
            <Button
              type="button"
              variant="accent"
              onClick={startFormalSubmission}
              className="px-5 py-3"
            >
              Submit formal Track A version
            </Button>
          </div>

          {message ? (
            <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
          ) : null}
          {submissionStep === "confirm" ? (
            <div className="mt-5 rounded-md border border-[#b6c6ac] bg-[#f7faf4] p-5">
              <h2 className="text-sm font-semibold text-[#11150f]">Confirm formal submission</h2>
              <p className="mt-2 text-sm leading-6 text-[#52594d]">
                This uploads only the current Track A SeedContext and its consent record. The submitted version is frozen;
                later edits stay local until you explicitly submit another version. This does not start a simulation.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" onClick={confirmFormalSubmission} className="px-4 py-2">
                  Confirm and submit
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSubmissionStep("idle")} className="px-4 py-2">
                  Keep editing locally
                </Button>
              </div>
            </div>
          ) : null}
          {submissionStep === "submitting" ? (
            <p className="mt-5 text-sm font-semibold text-[#526650]">Submitting and freezing the formal version…</p>
          ) : null}
          {submissionStep === "success" && submittedSeedContext ? (
            <div className="mt-5 rounded-md border border-[#99c7a7] bg-[#eff8f0] p-5 text-sm text-[#294c34]">
              <p className="font-semibold">Formal version submitted and frozen.</p>
              <p className="mt-2">Version: {submittedSeedContext.version}</p>
              <p>Submitted: {new Date(submittedSeedContext.submittedAt).toLocaleString()}</p>
              <p className="mt-2">Your form remains a separate local draft. Submitting an edited case creates a new version; it never overwrites this one.</p>
            </div>
          ) : null}
          {submissionStep === "failure" ? (
            <p className="mt-5 text-sm font-semibold text-[#8a3d28]">The formal version was not submitted; your local draft was retained.</p>
          ) : null}
          {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
            <div className="mt-5">
              <SafetyDowngradeNotice
                decision={safetyDecision}
                title="Safety check before simulation"
              />
            </div>
          ) : null}
          {recoveredSeedContexts.length > 0 ? (
            <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4">
              <p className="text-sm font-semibold text-[#11150f]">Recovered formal submissions</p>
              <p className="mt-1 text-xs leading-5 text-[#62695d]">Read-only recovery after login. These records do not overwrite the local form.</p>
              <ul className="mt-3 space-y-1 text-xs text-[#52594d]">
                {recoveredSeedContexts.slice(0, 3).map((seedContext) => (
                  <li key={seedContext.id}>{seedContext.version} · {new Date(seedContext.submittedAt).toLocaleString()}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </SurfaceCard>

        <aside className="mf-panel-dark h-fit p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#b7e6c6]">
                Context completeness
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Enough structure helps the next page extract people and preserve the evidence chain.
              </p>
            </div>
            <span className="rounded border border-white/12 bg-white/8 px-2 py-1 text-xs font-semibold text-white/72">
              {completedSectionCount}/{sectionLabels.length}
            </span>
          </div>

          <div className="mt-5">
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#b7e6c6]"
                style={{ width: `${contextQualityScore}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/54">
                Context quality
              </span>
              <span className="text-sm font-semibold text-white">
                {contextQualityScore}%
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {sectionLabels.map((label, index) => (
              <div
                key={label}
                className={`rounded border px-3 py-2 text-xs font-semibold ${
                  sectionCompletion[index]
                    ? "border-[#b7e6c6]/30 bg-[#b7e6c6]/12 text-[#d9f4df]"
                    : "border-white/10 bg-white/[0.04] text-white/48"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-white/12 bg-white/8 p-4">
            <div className="flex items-center gap-2">
              <EvidenceTag className="border-white/10 bg-white/10 text-white/76">
                Next useful details
              </EvidenceTag>
            </div>
            {missingContextHints.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-white/62">
                {missingContextHints.slice(0, 3).map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-5 text-white/62">
                This draft has enough structure for the next local step.
              </p>
            )}
          </div>

          <div className="mt-5 space-y-3 rounded-md border border-white/12 bg-white/[0.04] p-4 text-xs leading-5 text-white/62">
            <p>
              Recent events anchor evidence. Key people hints become candidates.
              Options, risks, and boundaries keep the sandbox focused.
            </p>
            <p>
              The next page can extract people from this richer context after you save.
            </p>
          </div>
          <TrialSampleButton className="mf-button mf-button-on-dark mt-5 w-full px-4 py-3">
            Open sample sandbox
          </TrialSampleButton>
        </aside>
      </section>
    </AppShell>
  );
}

function SectionGroup({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-black/8 pb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-base font-semibold text-[#11150f]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62695d]">
          {description}
        </p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TextAreaField({
  label,
  description,
  complete,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  description: string;
  complete: boolean;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder: string;
}) {
  return (
    <label className="block rounded-md border border-black/8 bg-white p-4">
      <span className="flex flex-wrap items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold text-[#11150f]">
            {label}
          </span>
          <span className="mt-2 block text-xs leading-5 text-[#62695d]">
            {description}
          </span>
        </span>
        <span
          className={`mt-0.5 rounded px-2 py-1 text-xs font-semibold ${
            complete
              ? "bg-[#eef5ee] text-[#2f5d3d]"
              : "bg-[#f7f8f4] text-[#7d8578]"
          }`}
        >
          {complete ? "Ready" : "Add detail"}
        </span>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mf-input mt-3 w-full resize-none px-4 py-3 leading-7"
      />
    </label>
  );
}
