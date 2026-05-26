"use client";

import { AppShell } from "@/components/app-shell";
import { LocalSandboxSnapshot } from "@/components/local-sandbox-snapshot";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";

const loop = [
  {
    title: "Seed Context",
    body: "Name one scenario, time window, recent events, options, and boundaries.",
    href: "/app/new/scene",
    label: "Create sandbox",
  },
  {
    title: "Key People",
    body: "Confirm, rename, merge, delete, or supplement the important people.",
    href: "/app/new/people",
    label: "Confirm people",
  },
  {
    title: "Agent Profiles",
    body: "Review the user core, parallel selves, and NPC agents with confidence.",
    href: "/app/new/agents",
    label: "Review agents",
  },
  {
    title: "Relation Graph",
    body: "Inspect read-only relation edges, evidence refs, and graph lock state.",
    href: "/app/new/graph",
    label: "Review graph",
  },
  {
    title: "Simulation Ticks",
    body: "Freeze the graph and run baseline, cautious_self, and decisive_self.",
    href: "/app/simulation/running",
    label: "Run simulation",
  },
  {
    title: "Event Logs",
    body: "Check what changed on agents and relation edges before claims appear.",
    href: "/app/simulation/running",
    label: "Inspect events",
  },
  {
    title: "Claims + Feedback",
    body: "Review evidence-backed claims, paid-depth boundaries, and calibration.",
    href: "/app/simulation/result",
    label: "Open result",
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
          <StatusPill tone="ready">Personal scenario sandbox</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-[#11150f]">
            Start one sandbox, then follow the evidence all the way to claims.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            MiroFish is for one relationship or decision scenario at a time.
            You define the situation, confirm the people, review agents and a
            read-only graph, run deterministic ticks, and inspect only the
            claims that have Event Log evidence.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/app/new/scene" className="px-5 py-3">
              Create sandbox
            </ButtonLink>
            <TrialSampleButton className="mf-button mf-button-secondary px-5 py-3">
              Open sample sandbox
            </TrialSampleButton>
          </div>
        </SurfaceCard>

        <aside className="space-y-4">
          <LocalSandboxSnapshot
            emptyAction={
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/app/new/scene" className="px-4 py-2">
                  Create sandbox
                </ButtonLink>
                <TrialSampleButton className="mf-button mf-button-secondary px-4 py-2">
                  Open sample
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
              <p>The sample flow demonstrates agents, graph, events, claims, and feedback.</p>
              <p>Safety checks can stop blocked scenarios before runnable data is saved.</p>
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-6">
        <div className="mf-section-header">
          <div>
            <h2 className="mf-section-title">Full-loop navigation</h2>
            <p className="mf-section-copy">
              Use these steps as route cognition: every surface should make the
              next artifact in the sandbox visible.
            </p>
          </div>
          <StatusPill tone="planned">Local MVP loop</StatusPill>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loop.map((step, index) => (
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
