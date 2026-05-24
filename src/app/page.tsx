"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-lg border border-black/8 bg-white p-7 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="ready">MiroFish MVP</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-[-0.03em] text-[#11150f]">
            AI Life Simulator for relationship and decision sandboxes.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            MiroFish turns one real decision into Key People, Agent Profiles, a read-only Relation Graph, Simulation Ticks,
            Event Logs, and evidence-backed Claim drafts. It is not astrology, mind reading, therapy, or a generic chatbot.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <TrialSampleButton className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]">
              Try a complete sample
            </TrialSampleButton>
            <Link
              href="/app/dashboard"
              className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
            >
              Open sandbox
            </Link>
          </div>
        </main>

        <aside className="space-y-3">
          {[
            ["Agent first", "Every important person becomes an Agent Profile before simulation."],
            ["Graph first", "Relationship edges are read-only and generated from Agent evidence."],
            ["Evidence first", "Claims must reference evidence_event_ids from Event Logs."],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(17,21,15,0.05)]"
            >
              <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#62695d]">{body}</p>
            </article>
          ))}
        </aside>
      </section>
    </AppShell>
  );
}
