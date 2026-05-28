"use client";

import { AppShell } from "@/components/app-shell";
import { LocalSandboxSnapshot } from "@/components/local-sandbox-snapshot";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";

const mainFlow = [
  {
    title: "Start",
    body: "Enter birth context and one current question.",
    href: "/app/start",
    label: "Start my destiny sandbox",
  },
  {
    title: "Clarify",
    body: "Answer up to three short questions only when the sandbox needs essential context.",
    href: "/app/start/clarify",
    label: "Open clarification",
  },
  {
    title: "Run",
    body: "Watch the destiny climate, real situation, and path simulation become events.",
    href: "/app/simulation/running",
    label: "Run sandbox",
  },
  {
    title: "Result",
    body: "Review integrated findings, evidence replay, and calibration prompts.",
    href: "/app/simulation/result",
    label: "Open result",
  },
];

const advancedPages = [
  {
    title: "Advanced structure review",
    body: "Inspect extracted people and roles when you want to audit the situation model.",
    href: "/app/new/people",
    label: "People details",
  },
  {
    title: "Situation model details",
    body: "Review user core, parallel selves, and NPC agent drafts with source confidence.",
    href: "/app/new/agents",
    label: "Agent details",
  },
  {
    title: "Situation map details",
    body: "Inspect the read-only relation map and evidence refs behind the sandbox.",
    href: "/app/new/graph",
    label: "Map details",
  },
];

const tracks = [
  [
    "Track A",
    "Concrete crossroads",
    "Use for a 30 or 90 day decision where the next move, timing, and relationship pressure are close.",
  ],
  [
    "Track B",
    "Long-horizon climate",
    "Use for a 1, 3, or 5 year theme view where signals unfold slowly and exact daily outcomes would be misleading.",
  ],
];

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="mf-page-grid">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="ready">Destiny-situation sandbox</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-[#11150f]">
            Astraloom combines destiny climate, real-world situation, and dynamic path simulation.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            Start with basic birth context and one current question. The main
            path stays simple: start, clarify only if needed, watch the sandbox
            run, then inspect findings and evidence replay.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/app/start" className="px-5 py-3">
              Start my destiny sandbox
            </ButtonLink>
            <TrialSampleButton
              target="/app/simulation/result"
              className="mf-button mf-button-secondary px-5 py-3"
            >
              Try complete sample
            </TrialSampleButton>
          </div>
        </SurfaceCard>

        <aside className="space-y-4">
          <LocalSandboxSnapshot
            emptyAction={
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/app/start" className="px-4 py-2">
                  Start my destiny sandbox
                </ButtonLink>
                <TrialSampleButton
                  target="/app/simulation/result"
                  className="mf-button mf-button-secondary px-4 py-2"
                >
                  Try complete sample
                </TrialSampleButton>
              </div>
            }
          />
          <section className="mf-panel-dark p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              Current local preview
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/66">
              <p>No production backend writes are needed for this first-run loop.</p>
              <p>Advanced pages remain available for structure review, situation models, map details, events, findings, and feedback.</p>
              <p>Safety checks can stop blocked scenarios before runnable data is saved.</p>
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-6">
        <div className="mf-section-header">
          <div>
            <h2 className="mf-section-title">Simple main flow</h2>
            <p className="mf-section-copy">
              This is the user-facing path. People, agent, and graph pages are
              available for inspection, but they are not required dashboard steps.
            </p>
          </div>
          <StatusPill tone="planned">Main path</StatusPill>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {mainFlow.map((step, index) => (
            <article key={`${step.title}-${index}`} className="mf-card p-5">
              <span className="text-xs font-semibold uppercase text-[#568262]">
                Step {index + 1}
              </span>
              <h2 className="mt-3 text-base font-semibold text-[#11150f]">
                {step.title}
              </h2>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#62695d]">
                {step.body}
              </p>
              <ButtonLink href={step.href} className="mt-4 px-4 py-2">
                {step.label}
              </ButtonLink>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mf-section-header">
          <div>
            <h2 className="mf-section-title">Advanced detail pages</h2>
            <p className="mf-section-copy">
              Use these only when you want to inspect or audit the structure
              behind a run.
            </p>
          </div>
          <StatusPill tone="planned">Optional</StatusPill>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {advancedPages.map((page) => (
            <article key={page.href} className="mf-card p-5">
              <span className="text-xs font-semibold uppercase text-[#568262]">
                Advanced
              </span>
              <h2 className="mt-3 text-base font-semibold text-[#11150f]">
                {page.title}
              </h2>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#62695d]">
                {page.body}
              </p>
              <ButtonLink href={page.href} variant="secondary" className="mt-4 px-4 py-2">
                {page.label}
              </ButtonLink>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {tracks.map(([track, title, body]) => (
          <article key={track} className="mf-card p-5">
            <span className="text-xs font-semibold uppercase text-[#568262]">
              {track}
            </span>
            <h2 className="mt-2 text-base font-semibold text-[#11150f]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">{body}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
