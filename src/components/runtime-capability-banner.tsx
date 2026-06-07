"use client";

import { useLanguage } from "@/components/language-provider";
import { getRuntimeCapability } from "@/lib/runtime-capability/get-runtime-capability";
import { StatusBadge } from "@/components/ui-foundation";
import type { RealityIntakeDraft } from "@/types/reality-intake";
import type {
  RuntimeCapabilityMode,
  RuntimeCapabilityState,
} from "@/types/runtime-capability";

type RuntimeCapabilityBannerProps = {
  realityIntake?: RealityIntakeDraft | null;
  capability?: RuntimeCapabilityState;
};

type Locale = "en" | "zh";

const modeLabels: Record<RuntimeCapabilityMode, Record<Locale, string>> = {
  local_assumption: {
    en: "Local assumption",
    zh: "本地假设",
  },
  manual_reality: {
    en: "Manual reality",
    zh: "手动现实材料",
  },
  ai_reality_intake: {
    en: "AI reality intake",
    zh: "AI 现实抽取",
  },
  external_reality: {
    en: "External reality",
    zh: "外部现实来源",
  },
  full_grounded_reality: {
    en: "Full grounded reality",
    zh: "完整现实 grounding",
  },
};

const modeMessages: Record<RuntimeCapabilityMode, Record<Locale, string>> = {
  local_assumption: {
    zh: "当前不是现实推演，只是本地假设演示。",
    en: "Not a grounded simulation yet. Local assumption demo only.",
  },
  manual_reality: {
    zh: "当前使用你提供的现实材料，但没有联网验证。",
    en: "Using your manual materials, without external verification.",
  },
  ai_reality_intake: {
    zh: "AI 已参与现实抽取，但尚未获取外部现实来源。",
    en: "AI has extracted reality structure, but no external sources were retrieved.",
  },
  external_reality: {
    zh: "外部现实来源已参与，可以开始第一轮真实推演试用。",
    en: "External reality sources are active. Ready for first grounded trial.",
  },
  full_grounded_reality: {
    zh: "DeepSeek、现实材料和外部来源均已参与。",
    en: "DeepSeek, manual materials, and external sources are all active.",
  },
};

const modeBadgeVariant: Record<
  RuntimeCapabilityMode,
  React.ComponentProps<typeof StatusBadge>["variant"]
> = {
  local_assumption: "localAssumption",
  manual_reality: "warning",
  ai_reality_intake: "aiIntake",
  external_reality: "externalReality",
  full_grounded_reality: "fullGrounded",
};

export function RuntimeCapabilityBanner({
  realityIntake,
  capability,
}: RuntimeCapabilityBannerProps) {
  const { locale } = useLanguage();
  const state = capability ?? getRuntimeCapability({ realityIntake });
  const ready = state.canClaimGroundedSimulation;
  const mode = state.currentMode;

  return (
    <details
      className={`rounded-md border bg-white/74 shadow-[0_10px_32px_rgba(17,21,15,0.04)] ${
        ready
          ? "border-[#4f7f61]/18"
          : "border-[#c89043]/24 bg-[#fff7e8]/70"
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="truncate font-semibold text-[#11150f]">
            {compactStatusText(state, locale)}
          </div>
          <div className="mt-0.5 truncate text-xs text-[#7d8578]">
            {modeMessages[mode][locale]}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge variant={ready ? "sourceBacked" : modeBadgeVariant[mode]}>
            {ready
              ? locale === "zh"
                ? "有现实来源支撑"
                : "source-backed"
              : locale === "zh"
                ? "缺少现实来源支撑"
                : "not source-backed"}
          </StatusBadge>
          <span className="text-xs font-semibold text-[#7d8578]">
            {locale === "zh" ? "详情" : "Details"}
          </span>
        </div>
      </summary>

      <div className="border-t border-black/8 px-3 pb-3 pt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
              {locale === "zh"
                ? "当前能力边界"
                : "What this run can honestly claim"}
            </div>
            <h2 className="mt-1 text-sm font-semibold text-[#11150f]">
              {modeLabels[mode][locale]}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {modeMessages[mode][locale]}
            </p>
          </div>
          <StatusBadge variant={modeBadgeVariant[mode]}>
            {modeLabels[mode][locale]}
          </StatusBadge>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <CapabilityItem
            label={locale === "zh" ? "DeepSeek 现实信息摄取" : "DeepSeek Reality Intake"}
            enabled={state.llmEnabled}
            available={state.llmAvailable}
            locale={locale}
          />
          <CapabilityItem
            label={locale === "zh" ? "外部现实来源" : "External reality search"}
            enabled={state.realitySearchEnabled}
            available={state.realitySearchAvailable}
            locale={locale}
          />
          <CapabilityItem
            label={locale === "zh" ? "现实材料" : "Reality sources"}
            enabled={state.hasManualRealitySources}
            available={state.hasExternalRealitySources}
            enabledLabel={locale === "zh" ? "手动材料" : "manual"}
            availableLabel={locale === "zh" ? "外部来源" : "external"}
            locale={locale}
          />
        </div>

        {state.blockingIssues.length ? (
          <ul className="mt-3 space-y-1 text-xs leading-5 text-[#6c5842]">
            {state.blockingIssues.slice(0, 3).map((issue) => (
              <li key={issue}>- {issue}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}

function compactStatusText(state: RuntimeCapabilityState, locale: Locale) {
  const deepSeek = state.llmAvailable
    ? locale === "zh"
      ? "DeepSeek 已参与"
      : "DeepSeek active"
    : locale === "zh"
      ? "DeepSeek 未参与"
      : "DeepSeek inactive";
  const external = state.hasExternalRealitySources
    ? locale === "zh"
      ? "外部来源已参与"
      : "External sources active"
    : locale === "zh"
      ? "无外部来源"
      : "No external sources";
  const mode = modeLabels[state.currentMode][locale];

  if (locale === "zh") {
    return `当前模式：${mode} · ${deepSeek} · ${external}`;
  }

  return `Mode: ${mode} · ${deepSeek} · ${external}`;
}

function CapabilityItem({
  label,
  enabled,
  available,
  locale,
  enabledLabel,
  availableLabel,
}: {
  label: string;
  enabled: boolean;
  available: boolean;
  locale: Locale;
  enabledLabel?: string;
  availableLabel?: string;
}) {
  const enabledText = enabledLabel ?? (locale === "zh" ? "已开启" : "enabled");
  const availableText =
    availableLabel ?? (locale === "zh" ? "已参与" : "available");
  const yes = locale === "zh" ? "是" : "yes";
  const no = locale === "zh" ? "否" : "no";

  return (
    <div className="rounded-md border border-black/8 bg-white/70 p-3">
      <div className="text-xs font-semibold uppercase text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#62695d]">
        {enabledText}: {enabled ? yes : no} / {availableText}:{" "}
        {available ? yes : no}
      </p>
    </div>
  );
}
