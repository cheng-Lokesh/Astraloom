"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";

const tracks = [
  {
    id: "track-a",
    title: "Track A",
    subtitle: "Concrete crossroads",
    horizon: "30 or 90 days",
    bestFor: "A decision with a near-term action boundary.",
    body: "Use this when you need to compare what may happen if you wait, communicate, proceed, or set a boundary.",
    output: "Branch ticks, Event Logs, risk windows, opportunity windows, and practical strategy options.",
  },
  {
    id: "track-b",
    title: "Track B",
    subtitle: "Long-horizon climate",
    horizon: "1, 3, or 5 years",
    bestFor: "One theme domain where timing is broad and signals develop slowly.",
    body: "Use this when you need coarse trend windows instead of precise daily outcomes or deterministic life prediction.",
    output: "Coarser relationship climate signals, preparation windows, evidence gaps, and calibration prompts.",
  },
];

const scenarios = [
  {
    id: "career",
    title: "Career decision",
    copy: "Promotion timing, manager support, offer windows, resource control, or reputation tradeoffs.",
  },
  {
    id: "collaboration",
    title: "Collaboration tension",
    copy: "A project, friend, partner, or teammate where trust, credit, and boundaries may shift.",
  },
  {
    id: "family",
    title: "Family or partner boundary",
    copy: "A relationship pressure point where communication, dependency, and emotional debt matter.",
  },
  {
    id: "personal",
    title: "Personal direction",
    copy: "A focused life-direction question with important people and observable constraints.",
  },
];

const miniLoop = [
  "Seed Context",
  "Key People",
  "Agent Profiles",
  "Relation Graph",
  "Simulation Ticks",
  "Event Logs",
  "Claims + Feedback",
];

export default function ScenePage() {
  const [track, setTrack] = useState(tracks[0].id);
  const [scenario, setScenario] = useState("");
  const selectedTrack = useMemo(
    () => tracks.find((item) => item.id === track) ?? tracks[0],
    [track],
  );
  const selectedScenario = scenarios.find((item) => item.id === scenario);

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="planned">New simulation setup</StatusPill>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-[#11150f]">
            Put one situation into a sandbox before intake.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            Choose the shape of the run first: one track, one scenario domain,
            and one time horizon. The next page collects evidence; later pages
            turn that evidence into people, agents, a read-only graph, events,
            and evidence-backed claims.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {tracks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTrack(item.id)}
                className={`rounded-lg border p-5 text-left transition ${
                  track === item.id
                    ? "border-[#568262]/50 bg-[#eef5ee]"
                    : "border-black/8 bg-[#f7f8f4] hover:border-[#568262]/30"
                }`}
              >
                <span className="text-xs font-semibold uppercase text-[#568262]">
                  {item.horizon}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-[#11150f]">
                  {item.title}: {item.subtitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {item.body}
                </p>
                <p className="mt-3 rounded-md border border-black/8 bg-white/70 px-3 py-2 text-xs leading-5 text-[#3f483d]">
                  <span className="font-semibold">Best for: </span>
                  {item.bestFor}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#11150f]">
                  Choose one scenario domain
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#62695d]">
                  Keep the run focused. MiroFish works best when one sandbox has
                  one core relationship or decision question.
                </p>
              </div>
              <StatusPill tone={selectedScenario ? "ready" : "blocked"}>
                {selectedScenario ? "Selected" : "Required"}
              </StatusPill>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {scenarios.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScenario(item.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    scenario === item.id
                      ? "border-[#11150f] bg-[#11150f] text-white"
                      : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"
                  }`}
                >
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span
                    className={`mt-2 block text-xs leading-5 ${
                      scenario === item.id ? "text-white/68" : "text-[#62695d]"
                    }`}
                  >
                    {item.copy}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {selectedScenario ? (
              <ButtonLink href="/app/new/intake" className="px-5 py-3">
                Create sandbox
              </ButtonLink>
            ) : (
              <Button disabled className="px-5 py-3">
                Create sandbox
              </Button>
            )}
            <TrialSampleButton className="mf-button mf-button-secondary px-5 py-3">
              Open sample sandbox
            </TrialSampleButton>
          </div>
        </SurfaceCard>

        <aside className="space-y-4">
          <section className="mf-panel-dark p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              {selectedTrack.title}: {selectedTrack.subtitle}
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/68">
              <p>{selectedTrack.bestFor}</p>
              <p>{selectedTrack.output}</p>
              <p>
                This is a scenario sandbox: no chat thread, no fate claim, no
                professional advice, no editable CRM graph, and no mid-run
                story choices.
              </p>
            </div>
          </section>

          <section className="mf-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#11150f]">
                What this will create
              </h2>
              <StatusPill tone="planned">Full loop</StatusPill>
            </div>
            <div className="mt-4 grid gap-2">
              {miniLoop.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-black/8 bg-[#f7f8f4] px-3 py-2"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-white text-xs font-semibold text-[#568262]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-[#3f483d]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}
