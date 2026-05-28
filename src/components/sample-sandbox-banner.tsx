"use client";

import { ButtonLink } from "@/components/ui-foundation";

export function SampleSandboxBanner({
  showReplay = false,
}: {
  showReplay?: boolean;
}) {
  return (
    <section className="mb-5 rounded-lg border border-[#d49b4a]/35 bg-[#fff8ed] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#7c5524]">
            You are viewing a sample destiny sandbox.
          </p>
          <p className="mt-1 text-xs leading-5 text-[#7c5524]/80">
            This local sample shows the full evidence loop without external API
            calls, payment, or production storage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showReplay ? (
            <ButtonLink
              href="/app/simulation/running"
              variant="secondary"
              className="px-4 py-2"
            >
              Replay sandbox
            </ButtonLink>
          ) : null}
          <ButtonLink href="/app/start" className="px-4 py-2">
            Start my own sandbox
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
