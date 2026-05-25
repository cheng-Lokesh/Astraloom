"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";

const loopSteps = [
  {
    title: "1. Describe one scenario",
    body: "Choose Track A for a concrete crossroads or Track B for a longer-horizon climate view.",
  },
  {
    title: "2. Build the sandbox",
    body: "Key people become agents, and their relationships become a read-only graph.",
  },
  {
    title: "3. Run a simulation",
    body: "The local engine writes event evidence before any claim can appear.",
  },
  {
    title: "4. Review evidence",
    body: "Outputs stay linked to agents, graph edges, event logs, and confidence.",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-lg border border-black/8 bg-white p-7 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="ready">Scenario sandbox</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-[#11150f]">
            Create a relationship sandbox before you make the next move.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            MiroFish turns one real-life situation into agents, a read-only relationship graph,
            simulation events, and evidence-backed scenario notes. It is not a chatbot, a report
            generator, or a prediction engine.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/app/new/scene"
              className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              Create a sandbox
            </Link>
            <TrialSampleButton className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]">
              Open sample sandbox
            </TrialSampleButton>
          </div>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            The full loop
          </h2>
          <div className="mt-5 space-y-4">
            {loopSteps.map((step) => (
              <div key={step.title}>
                <h3 className="text-sm font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-white/66">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Agents", "People are represented as bounded digital agents with source evidence and confidence."],
          ["Relationship graph", "Edges are generated from context and stay read-only through the run."],
          ["Event evidence", "Simulation notes must trace back to event logs instead of unsupported claims."],
        ].map(([title, body]) => (
          <article
            key={title}
            className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(17,21,15,0.05)]"
          >
            <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">{body}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
