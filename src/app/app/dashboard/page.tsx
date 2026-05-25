"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";

const loop = [
  {
    title: "Scene",
    body: "Pick Track A or Track B, set the horizon, and name the decision boundary.",
    href: "/app/new/scene",
    label: "Choose track",
  },
  {
    title: "People",
    body: "Turn the named people into confirmable candidates before agents are created.",
    href: "/app/new/people",
    label: "Confirm people",
  },
  {
    title: "Agents and graph",
    body: "Review bounded agents and a read-only relationship graph with evidence refs.",
    href: "/app/new/agents",
    label: "Review agents",
  },
  {
    title: "Simulation",
    body: "Freeze the graph, run event ticks, and review claims tied to event evidence.",
    href: "/app/simulation/running",
    label: "Run simulation",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="rounded-lg border border-black/8 bg-white p-7 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="ready">First-run dashboard</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-[#11150f]">
            Start with one relationship or decision scenario.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            MiroFish is a personal scenario sandbox. You define the situation, confirm the
            people, review the agents and relationship graph, then run a simulation that can only
            produce notes backed by event evidence.
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
            Current local preview
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-white/66">
            <p>No production backend writes are needed for this first-run loop.</p>
            <p>The sample flow stays local and demonstrates agents, graph, events, and claims.</p>
            <p>Safety checks still stop blocked scenarios before runnable simulation data is saved.</p>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loop.map((step, index) => (
          <article
            key={step.href}
            className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(17,21,15,0.05)]"
          >
            <span className="text-xs font-semibold uppercase text-[#568262]">
              Step {index + 1}
            </span>
            <h2 className="mt-3 text-base font-semibold text-[#11150f]">
              {step.title}
            </h2>
            <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#62695d]">
              {step.body}
            </p>
            <Link
              href={step.href}
              className="mt-4 inline-flex rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              {step.label}
            </Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
