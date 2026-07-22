import { createHash } from "node:crypto";

export function canonicalStage7JsonV2(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStage7JsonV2).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalStage7JsonV2(item)}`)
    .join(",")}}`;
}

export function stage7FingerprintV2(value: unknown): string {
  return createHash("sha256").update(canonicalStage7JsonV2(value)).digest("hex").slice(0, 24);
}

export const outcomeIdV2 = (value: unknown) => `outcome_v2_${stage7FingerprintV2(value)}` as const;
export const forecastLockIdV2 = (value: unknown) => `forecast_lock_v2_${stage7FingerprintV2(value)}` as const;
export const backtestIdV2 = (value: unknown) => `backtest_v2_${stage7FingerprintV2(value)}` as const;
export const calibrationIdV2 = (value: unknown) => `calibration_v2_${stage7FingerprintV2(value)}` as const;
export const persistenceVersionIdV2 = (value: unknown) =>
  `outcome_calibration_version_v2_${stage7FingerprintV2(value)}` as const;
