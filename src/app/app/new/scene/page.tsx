"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";

const tracks = [
  {
    id: "track-a",
    title: "Track A",
    subtitle: "Concrete crossroads",
    horizon: "30 or 90 days",
    body: "Use this for one decision with a clear near-term action boundary and a small cast of people.",
  },
  {
    id: "track-b",
    title: "Track B",
    subtitle: "Long-horizon climate",
    horizon: "1, 3, or 5 years",
    body: "Use this for one theme domain when you need coarse trend windows instead of precise daily outcomes.",
  },
];

const scenarios = [
  "Career decision",
  "Collaboration tension",
  "Family or partner boundary",
  "Personal direction",
];

export default function ScenePage() {
  const [track, setTrack] = useState(tracks[0].id);
  const [scenario, setScenario] = useState(scenarios[0]);

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="planned">New sandbox</StatusPill>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-[#11150f]">
            Choose the sandbox shape before intake.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            A run starts with a track, one scenario domain, and a time horizon. Intake comes next,
            then MiroFish extracts people, builds agents, freezes a read-only relationship graph,
            runs simulation ticks, and shows event-backed notes.
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
              </button>
            ))}
          </div>

          <div className="mt-7">
            <h2 className="text-sm font-semibold text-[#11150f]">
              One scenario domain
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {scenarios.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setScenario(item)}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                    scenario === item
                      ? "border-[#11150f] bg-[#11150f] text-white"
                      : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app/new/intake"
              className="inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              Continue to intake
            </Link>
            <TrialSampleButton className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]">
              Open sample sandbox
            </TrialSampleButton>
          </div>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            What this will create
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-white/68">
            <p>Agents for you, optional parallel selves, and the important people in the scene.</p>
            <p>A relationship graph that can be reviewed but not manually tuned.</p>
            <p>Simulation event evidence before any scenario note is shown.</p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
