"use client";

import { StatusPill } from "@/components/status-pill";
import { getRuntimeCapability } from "@/lib/runtime-capability/get-runtime-capability";
import type { RealityIntakeDraft } from "@/types/reality-intake";
import type { RuntimeCapabilityState } from "@/types/runtime-capability";

type RuntimeCapabilityBannerProps = {
  realityIntake?: RealityIntakeDraft | null;
  capability?: RuntimeCapabilityState;
};

const modeLabels: Record<RuntimeCapabilityState["currentMode"], string> = {
  local_assumption: "Local assumption demo",
  manual_reality: "Manual reality only",
  ai_reality_intake: "AI reality intake",
  external_reality: "External reality",
  full_grounded_reality: "Full source-backed reality",
};

export function RuntimeCapabilityBanner({
  realityIntake,
  capability,
}: RuntimeCapabilityBannerProps) {
  const state = capability ?? getRuntimeCapability({ realityIntake });
  const ready = state.canClaimGroundedSimulation;

  return (
    <section
      className={`rounded-lg border p-4 ${
        ready
          ? "border-[#568262]/25 bg-[#eef5ee]"
          : "border-[#c4824a]/25 bg-[#fff8ef]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
            Runtime capability
          </div>
          <h2 className="mt-1 text-sm font-semibold text-[#11150f]">
            {modeLabels[state.currentMode]}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            {state.userFacingWarning}
          </p>
        </div>
        <StatusPill tone={ready ? "ready" : "planned"}>
          {ready ? "source-backed" : "not source-backed"}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <CapabilityItem
          label="DeepSeek Reality Intake"
          enabled={state.llmEnabled}
          available={state.llmAvailable}
        />
        <CapabilityItem
          label="External reality search"
          enabled={state.realitySearchEnabled}
          available={state.realitySearchAvailable}
        />
        <CapabilityItem
          label="Reality sources"
          enabled={state.hasManualRealitySources}
          available={state.hasExternalRealitySources}
          enabledLabel="manual"
          availableLabel="external"
        />
      </div>

      {state.blockingIssues.length ? (
        <ul className="mt-3 space-y-1 text-xs leading-5 text-[#6c5842]">
          {state.blockingIssues.slice(0, 3).map((issue) => (
            <li key={issue}>- {issue}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CapabilityItem({
  label,
  enabled,
  available,
  enabledLabel = "enabled",
  availableLabel = "available",
}: {
  label: string;
  enabled: boolean;
  available: boolean;
  enabledLabel?: string;
  availableLabel?: string;
}) {
  return (
    <div className="rounded-md border border-black/8 bg-white/70 p-3">
      <div className="text-xs font-semibold uppercase text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#62695d]">
        {enabledLabel}: {enabled ? "yes" : "no"} / {availableLabel}:{" "}
        {available ? "yes" : "no"}
      </p>
    </div>
  );
}
