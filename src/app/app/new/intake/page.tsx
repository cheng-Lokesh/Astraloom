"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
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
  forbiddenActions:
    "Do not burn bridges with the current team. Do not accept vague promises as confirmed evidence. Do not disclose confidential team information.",
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
    initialDraft?.recentEventsText ?? "",
  );
  const [people, setPeople] = useState(initialDraft?.keyPeopleText ?? "");
  const [decisionOptions, setDecisionOptions] = useState(
    initialDraft?.decisionOptionsText ?? "",
  );
  const [forbiddenActions, setForbiddenActions] = useState(
    initialDraft?.forbiddenActionsText ?? "",
  );
  const [desiredOutput, setDesiredOutput] = useState(
    initialDraft?.desiredOutputText ?? "",
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

  function save(status: SeedContextDraft["status"] = "submitted") {
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
    const draft = {
      id: initialDraft?.id ?? repos.seedContexts.createId(),
      questionText: question.trim(),
      trackType:
        timeWindow === "30_days" || timeWindow === "90_days"
          ? "crossroad"
          : "life_climate",
      timeWindow,
      situationSummary: situationSummary.trim(),
      recentEventsText: recentEvents.trim(),
      keyPeopleText: people.trim(),
      decisionOptionsText: decisionOptions.trim(),
      forbiddenActionsText: forbiddenActions.trim(),
      desiredOutputText: desiredOutput.trim(),
      privacyAck: privacySafetyAck,
      privacySafetyAck,
      locale: "en",
      status,
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
      "Scenario saved. The next page can use the richer context to extract better key people.",
    );
    return true;
  }

  function useSample() {
    setSituationSummary(sample.situationSummary);
    setQuestion(sample.question);
    setRecentEvents(sample.recentEvents);
    setPeople(sample.people);
    setDecisionOptions(sample.decisionOptions);
    setForbiddenActions(sample.forbiddenActions);
    setDesiredOutput(sample.desiredOutput);
    setTimeWindow("90_days");
    setPrivacySafetyAck(true);
    setMessage("Sample loaded. Save it or continue to people confirmation.");
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-lg border border-black/8 bg-white p-7 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="planned">Structured situation intake</StatusPill>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
            Give the sandbox enough real-world evidence to build useful agents.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            Tell the case in natural language, then add the signals that matter: recent events,
            people, options, boundaries, and what you want the simulation to compare.
          </p>

          <div className="mt-7 space-y-5">
            <TextAreaField
              label="Situation summary"
              value={situationSummary}
              onChange={setSituationSummary}
              rows={4}
              placeholder="In a few sentences, describe the scene, why it matters, and what relationship dynamics are involved."
            />
            <TextAreaField
              label="Main question"
              value={question}
              onChange={setQuestion}
              rows={3}
              placeholder="Example: Should I accept the new role now, or stay and ask for a clearer promotion timeline?"
            />
            <TextAreaField
              label="Recent key events"
              value={recentEvents}
              onChange={setRecentEvents}
              rows={4}
              placeholder="List observed events, promises, conflicts, deadlines, changed behavior, missing information, or new opportunities."
            />
            <TextAreaField
              label="Key people hints"
              value={people}
              onChange={setPeople}
              rows={3}
              placeholder="Name people or roles, plus why each person matters in the scenario."
            />
            <div className="grid gap-5 md:grid-cols-2">
              <TextAreaField
                label="Decision options"
                value={decisionOptions}
                onChange={setDecisionOptions}
                rows={4}
                placeholder="List the realistic options the simulation should compare."
              />
              <TextAreaField
                label="Forbidden actions"
                value={forbiddenActions}
                onChange={setForbiddenActions}
                rows={4}
                placeholder="List actions that should stay out of scope, such as bridges you will not burn or boundaries you will keep."
              />
            </div>
            <TextAreaField
              label="Desired output"
              value={desiredOutput}
              onChange={setDesiredOutput}
              rows={3}
              placeholder="Example: Show pressure points, evidence to watch, and communication options for the next 90 days."
            />

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
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => save()}
              className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              Save scenario
            </button>
            <button
              type="button"
              onClick={useSample}
              className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
            >
              Use sample text
            </button>
            <Link
              href="/app/new/people"
              onClick={(event) => {
                if (!save()) event.preventDefault();
              }}
              className="rounded-md border border-[#568262]/30 bg-[#eef5ee] px-5 py-3 text-sm font-semibold text-[#2f5d3d] transition hover:border-[#568262]"
            >
              Confirm people
            </Link>
          </div>

          {message ? (
            <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
          ) : null}
          {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
            <div className="mt-5">
              <SafetyDowngradeNotice
                decision={safetyDecision}
                title="Safety check before simulation"
              />
            </div>
          ) : null}
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            Why these fields matter
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-white/66">
            <p>Events give the simulation evidence anchors instead of unsupported claims.</p>
            <p>People hints improve agent candidates and reduce missing relationship roles.</p>
            <p>Options and forbidden actions keep the sandbox focused on realistic branches.</p>
            <p>Desired output tells the result page what evidence and strategy depth to emphasize.</p>
          </div>
          <TrialSampleButton className="mt-5 inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]">
            Open sample sandbox
          </TrialSampleButton>
        </aside>
      </section>
    </AppShell>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#11150f]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-4 py-3 text-sm leading-7 text-[#11150f] outline-none focus:border-[#568262]"
      />
    </label>
  );
}
