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

function yesNo(value: boolean, locale: Locale) {
  if (locale === "zh") return value ? "Yes" : "No";
  return value ? "Yes" : "No";
}

export function RealityIntakeModeBanner({
  realityIntake,
  locale,
}: RealityIntakeModeBannerProps) {
  const intake = realityIntake ?? fallbackIntake("local_assumption");
  const llmStatus = intake.llmStatus;
  const llmExtraction = intake.llmExtraction;
  const searchStatus = intake.realitySearchStatus;
  const llmLabel = llmStatus?.succeeded
    ? "DeepSeek Reality Intake used"
    : llmStatus?.enabled
      ? "DeepSeek Reality Intake fallback"
      : "DeepSeek Reality Intake disabled";
  const searchLabel = searchStatus?.succeeded
    ? "External reality search used"
    : searchStatus?.attempted
      ? "External reality search fallback"
      : searchStatus?.enabled
        ? "External reality search enabled"
        : "External reality search disabled";

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

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-[#c4824a]/20 bg-white/70 p-3">
          <div className="text-xs font-semibold uppercase text-[#8a6234]">
            DeepSeek
          </div>
          <p className="mt-1 text-sm font-semibold text-[#11150f]">
            {llmLabel}
          </p>
          {llmStatus?.warning ? (
            <p className="mt-1 text-xs leading-5 text-[#6c5842]">
              {llmStatus.warning}
            </p>
          ) : null}
        </div>

        <div className="rounded-md border border-[#c4824a]/20 bg-white/70 p-3">
          <div className="text-xs font-semibold uppercase text-[#8a6234]">
            LLM extraction nodes
          </div>
          <p className="mt-1 text-sm font-semibold text-[#11150f]">
            {llmExtraction?.groundedRealityNodes.length ?? 0}
          </p>
          {llmExtraction?.groundedRealityNodes.length ? (
            <p className="mt-1 text-xs leading-5 text-[#6c5842]">
              {llmExtraction.groundedRealityNodes
                .slice(0, 3)
                .map((node) => node.label)
                .join(", ")}
            </p>
          ) : null}
        </div>

        <div className="rounded-md border border-[#c4824a]/20 bg-white/70 p-3">
          <div className="text-xs font-semibold uppercase text-[#8a6234]">
            External search
          </div>
          <p className="mt-1 text-sm font-semibold text-[#11150f]">
            {searchLabel}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#6c5842]">
            Used: {yesNo(Boolean(searchStatus?.succeeded), locale)} / Sources:{" "}
            {intake.externalSources.length}
          </p>
          {searchStatus?.warning ? (
            <p className="mt-1 text-xs leading-5 text-[#6c5842]">
              {searchStatus.warning}
            </p>
          ) : null}
        </div>

        <div className="rounded-md border border-[#c4824a]/20 bg-white/70 p-3">
          <div className="text-xs font-semibold uppercase text-[#8a6234]">
            Still missing
          </div>
          <p className="mt-1 text-sm font-semibold text-[#11150f]">
            {llmExtraction?.externalInfoNeeded ? "External evidence needed" : "Not flagged"}
          </p>
          {llmExtraction?.searchQuestions.length ? (
            <p className="mt-1 text-xs leading-5 text-[#6c5842]">
              {llmExtraction.searchQuestions[0].question}
            </p>
          ) : null}
        </div>
      </div>

      {intake.externalSources.length ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {intake.externalSources.slice(0, 4).map((source) => (
            <div
              key={source.id}
              className="rounded-md border border-[#c4824a]/20 bg-white/70 p-3"
            >
              <div className="text-xs font-semibold uppercase text-[#8a6234]">
                {source.sourceType} / {source.confidence}%
              </div>
              <p className="mt-1 text-sm font-semibold text-[#11150f]">
                {source.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6c5842]">
                {source.summary}
              </p>
              {source.url ? (
                <p className="mt-1 break-all text-xs leading-5 text-[#6c5842]">
                  {source.url}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

