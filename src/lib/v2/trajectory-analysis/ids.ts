import { createHash } from "node:crypto";

function normalized(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, normalized(item)]));
  }
  return value;
}

export function canonicalJsonV2(value: unknown): string {
  return JSON.stringify(normalized(value));
}

export function stableAnalysisFingerprintV2(value: unknown): string {
  return createHash("sha256").update(canonicalJsonV2(value)).digest("hex").slice(0, 24);
}

export function childRunSpecIdV2(batchIdentity: unknown, seed: number) {
  return `trajectory_run_spec_v2_stage5_${stableAnalysisFingerprintV2(["child-run", batchIdentity, seed])}` as const;
}

export function childTrajectoryIdV2(batchIdentity: unknown, seed: number) {
  return `trajectory_v2_stage5_${stableAnalysisFingerprintV2(["child-trajectory", batchIdentity, seed])}` as const;
}

export function trajectoryClusterIdV2(featureSignature: string) {
  return `trajectory_cluster_v2_${stableAnalysisFingerprintV2(["exact-outcome-cluster", featureSignature])}` as const;
}
