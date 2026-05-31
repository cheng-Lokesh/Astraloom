import type { RealityIntakeMode } from "@/types/reality-intake";

export type RealityIntakeLocale = "en" | "zh";

export const realityIntakeModeCopy: Record<
  RealityIntakeMode,
  Record<RealityIntakeLocale, string>
> = {
  local_assumption: {
    zh: "当前为本地假设推演：系统只使用你的输入和本地规则，没有联网获取外部现实信息。",
    en: "Local assumption mode: Astraloom is using only your input and local rules. No external reality data was retrieved.",
  },
  manual_reality: {
    zh: "当前为手动现实材料推演：系统使用了你提供的现实材料作为依据。",
    en: "Manual reality mode: Astraloom is using the real-world materials you provided as grounding.",
  },
  external_reality: {
    zh: "当前为外部现实信息推演：系统使用了外部现实信息来源。",
    en: "External reality mode: Astraloom is using external reality sources.",
  },
};

export function realityIntakeModeLabel(
  mode: RealityIntakeMode,
  locale: RealityIntakeLocale,
) {
  if (mode === "manual_reality") {
    return locale === "zh" ? "手动现实材料推演" : "Manual Reality Mode";
  }

  if (mode === "external_reality") {
    return locale === "zh" ? "外部现实信息推演" : "External Reality Mode";
  }

  return locale === "zh" ? "本地假设推演" : "Local Assumption Mode";
}

export function realityIntakeModeDescription(
  mode: RealityIntakeMode,
  locale: RealityIntakeLocale,
) {
  return realityIntakeModeCopy[mode][locale];
}
