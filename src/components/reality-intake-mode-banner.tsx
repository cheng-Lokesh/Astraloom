"use client";

import { StatusPill } from "@/components/status-pill";
import {
  realityIntakeModeDescription,
  realityIntakeModeLabel,
} from "@/lib/reality-intake/reality-intake-language";
import type { RealityIntakeDraft, RealityIntakeMode } from "@/types/reality-intake";

type Locale = "en" | "zh";

type RealityIntakeModeBannerProps = {
  realityIntake?: RealityIntakeDraft | null;
  locale: Locale;
};

function fallbackIntake(mode: RealityIntakeMode): RealityIntakeDraft {
  return {
    id: "reality_intake_missing",
    seedContextId: "missing",
    mode,
    manualSources: [],
    externalSources: [],
    missingExternalInfo: [
      "No saved RealityIntakeDraft was found for this local snapshot.",
    ],
    intakeSummary:
      "Local assumption mode only: no saved manual or external reality source is attached.",
    confidence: 42,
    createdAt: "",
  };
}

export function RealityIntakeModeBanner({
  realityIntake,
  locale,
}: RealityIntakeModeBannerProps) {
  const intake = realityIntake ?? fallbackIntake("local_assumption");

  return (
    <section className="rounded-lg border border-[#c4824a]/25 bg-[#fff8ef] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            {realityIntakeModeLabel(intake.mode, locale)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6c5842]">
            {realityIntakeModeDescription(intake.mode, locale)}
          </p>
        </div>
        <StatusPill tone={intake.mode === "local_assumption" ? "planned" : "ready"}>
          {intake.confidence}%
        </StatusPill>
      </div>
    </section>
  );
}
