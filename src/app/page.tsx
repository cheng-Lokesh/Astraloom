"use client";

import { AppShell } from "@/components/app-shell";
import { LocalSandboxSnapshot } from "@/components/local-sandbox-snapshot";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";

const loopSteps = [
  ["Seed Context", "Describe one real situation, one question, one time window."],
  ["Key People", "Confirm who matters before any agent or graph exists."],
  ["Agent Profiles", "Turn people into bounded simulation models with sources."],
  ["Relation Graph", "Inspect read-only edges, confidence, and evidence refs."],
  ["Simulation Ticks", "Freeze the graph and run deterministic branch steps."],
  ["Event Logs", "Record what changed, when, why, and on which edge."],
  ["Claims + Feedback", "Review evidence-backed claims and calibrate the next run."],
];

const boundaries = [
  "Not a chatbot-first interface.",
  "Not fortune-telling or fate language.",
  "Not therapy or professional advice.",
  "Not mind reading about other people.",
  "Not a CRM or editable relationship database.",
  "Not an RPG with mid-run story choices.",
];

const proofPoints = [
  [
    "Agents",
    "People become bounded digital agents with visible source evidence and confidence.",
  ],
  [
    "Read-only graph",
    "Relationships become inspectable edges; users never tune trust or conflict weights directly.",
  ],
  [
    "Event evidence",
    "A claim can appear only after the simulation has Event Log support.",
  ],
];

const trackCards = [
  [
    "Track A",
    "Concrete crossroads",
    "30 or 90 days for a focused decision, communication choice, boundary, or timing question.",
  ],
  [
    "Track B",
    "Long-horizon climate",
    "1, 3, or 5 years for one theme domain with coarse trend windows and preparation signals.",
  ],
];

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="ready">Personal scenario sandbox</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-[#11150f]">
            Turn one real-life situation into agents, a graph, events, and
            evidence-backed options.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            MiroFish helps you load a relationship or decision scenario into a
            small simulation sandbox. You confirm the cast, review the
            read-only relationship graph, run local ticks, and inspect claims
            only when they trace back to Event Logs.
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
              Product boundary
            </h2>
            <div className="mt-4 grid gap-2">
              {boundaries.map((item) => (
                <p
                  key={item}
                  className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm leading-6 text-white/70"
                >
                  {item}
                </p>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-6 mf-card p-5">
        <div className="mf-section-header">
          <div>
            <h2 className="mf-section-title">The full sandbox loop</h2>
            <p className="mf-section-copy">
              Every important output should be traceable from your context to
              people, agents, graph edges, events, claims, and calibration.
            </p>
          </div>
          <StatusPill tone="planned">7 steps</StatusPill>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {loopSteps.map(([title, body], index) => (
            <article
              key={title}
              className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
            >
              <span className="text-xs font-semibold text-[#568262]">
                {index + 1}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-[#62695d]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {trackCards.map(([track, title, body]) => (
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

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {proofPoints.map(([title, body]) => (
          <article key={title} className="mf-card p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">{body}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
