"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { buildSafetyReviewDraft, markSafetyBlocked } from "@/lib/safety/build";
import type { SafetyReviewDraft } from "@/types/safety-review";

function toneForStatus(status: string) {
  if (status === "ready") return "ready";
  if (status === "blocked") return "blocked";
  return "planned";
}

export default function SafetyPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [simulationRun] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.simulations.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [review, setReview] = useState<SafetyReviewDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    const runResult = seed ? repos.simulations.load(seed.id) : null;
    const run = runResult?.ok ? runResult.data : null;
    if (!seed || !run) return null;
    const result = repos.safetyReviews.load(seed.id);
    return (result.ok ? result.data : null) ?? buildSafetyReviewDraft(seed, run);
  });
  const [message, setMessage] = useState("");

  if (!seedContext || !simulationRun || !review) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Run required</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Generate Event Log before safety review.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Safety downgrade reads the local run, Event Log, and seed context.
            It cannot be bypassed by paid unlock.
          </p>
          <Link
            href="/app/simulation/running"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Open Event Log
          </Link>
        </section>
      </AppShell>
    );
  }

  function persist(nextReview: SafetyReviewDraft, nextMessage: string) {
    const result = repos.safetyReviews.save(nextReview);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setReview(nextReview);
    setMessage(nextMessage);
  }

  function save() {
    if (!review) return;
    persist(review, "Safety review saved.");
  }

  function rebuild() {
    if (!seedContext || !simulationRun) return;
    persist(
      buildSafetyReviewDraft(seedContext, simulationRun),
      "Safety review rebuilt from current local run.",
    );
  }

  function block() {
    if (!review) return;
    persist(markSafetyBlocked(review), "Safety gate manually blocked.");
  }

  function reset() {
    if (!seedContext || !simulationRun) return;
    repos.safetyReviews.clearDraft(seedContext.id);
    setReview(buildSafetyReviewDraft(seedContext, simulationRun));
    setMessage("Safety review reset.");
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone={review.reportReady ? "ready" : "blocked"}>
            Safety gate
          </StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Safety gate keeps the sandbox inside usable boundaries.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Safety review can pass, add caution, adjust output, or pause a run.
            Full-depth access cannot remove this gate or make claims stronger.
          </p>
        </div>
        <StatusPill tone={review.reportReady ? "ready" : "blocked"}>
          {review.safetyLevel}
        </StatusPill>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
              >
                Save review
              </button>
              <button
                type="button"
                onClick={rebuild}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                Rebuild checks
              </button>
              <button
                type="button"
                onClick={block}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                Place review hold
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                Reset
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
            ) : null}
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              Safety states
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              These states change what the product can show. They do not create
              professional advice, and they do not change historical evidence.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SafetyStateCard
                label="Safe"
                tone="border-[#568262]/25 bg-[#eef5ee] text-[#2f5d3d]"
                body="The scenario can continue through agents, graph, simulation, event logs, and evidence-backed claims."
              />
              <SafetyStateCard
                label="Caution"
                tone="border-[#6f8faa]/35 bg-[#eef4f8] text-[#2f5064]"
                body="The flow continues with careful wording, confidence language, and no certainty about outcomes or private thoughts."
              />
              <SafetyStateCard
                label="Downgraded"
                tone="border-[#c4824a]/35 bg-[#fdf5ed] text-[#7c5524]"
                body="The sandbox keeps structure and low-risk communication options, while strong claims and depth expansion stay unavailable."
              />
              <SafetyStateCard
                label="Blocked"
                tone="border-[#8c6bb1]/35 bg-[#f4effa] text-[#4b3568]"
                body="The run is paused for this input. The user can revise setup or request a safety review through support."
              />
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              Risk checks
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {review.riskChecks.map((risk) => (
                <article
                  key={risk.id}
                  className="rounded-lg border border-black/8 bg-[#f7f8f4] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#11150f]">
                      {risk.id}
                    </h3>
                    <StatusPill tone={toneForStatus(risk.status)}>
                      {risk.status}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#62695d]">
                    {risk.detail}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    {risk.action} / {risk.severity}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              Gates
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {review.gates.map((gate) => (
                <article
                  key={gate.id}
                  className="rounded-md border border-black/8 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#11150f]">
                      {gate.id}
                    </h3>
                    <StatusPill tone={toneForStatus(gate.status)}>
                      {gate.status}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#62695d]">
                    {gate.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            Safety decision
          </h2>
          <p className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm leading-7 text-white/70">
            {review.reportBlockedReason}
          </p>
          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-white/62">
            If this review feels too restrictive, request a safety review. This
            does not bypass the gate; it only records context for support.
          </div>
          <div className="mt-5 space-y-3">
            <Link
              href="/app/simulation/result"
              className="inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
            >
              Open Result Sandbox
            </Link>
            <Link
              href="/app/support"
              className="inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Request safety review
            </Link>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function SafetyStateCard({
  label,
  tone,
  body,
}: {
  label: string;
  tone: string;
  body: string;
}) {
  return (
    <article className={`rounded-md border p-4 ${tone}`}>
      <h3 className="text-sm font-semibold">{label}</h3>
      <p className="mt-2 text-sm leading-6 opacity-80">{body}</p>
    </article>
  );
}
