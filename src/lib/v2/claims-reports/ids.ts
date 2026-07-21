import { createHash } from "node:crypto";

export function canonicalClaimsJsonV2(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalClaimsJsonV2).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalClaimsJsonV2(item)}`)
    .join(",")}}`;
}

export function claimsFingerprintV2(value: unknown): string {
  return createHash("sha256").update(canonicalClaimsJsonV2(value)).digest("hex").slice(0, 24);
}

export const claimIdV2 = (value: unknown) => `claim_v2_${claimsFingerprintV2(value)}` as const;
export const claimsReportIdV2 = (value: unknown) => `claims_report_v2_${claimsFingerprintV2(value)}` as const;
