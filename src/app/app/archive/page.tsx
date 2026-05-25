"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";

export default function ArchivePage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
        <StatusPill tone="planned">Archive</StatusPill>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
          Simulation history will live here.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#62695d]">
          The current Local MVP keeps one browser-based working run. This route
          reserves the formal product archive path for saved simulations without
          connecting a database or changing local storage behavior.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/app/simulation/result"
            className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Open current result
          </Link>
          <Link
            href="/app/dashboard"
            className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f]"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
