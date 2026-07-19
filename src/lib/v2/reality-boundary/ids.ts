import type {
  RealityBoundaryIdFactoryV2,
  RealityBoundaryIdKindV2,
} from "./types";

const prefixes: Record<RealityBoundaryIdKindV2, string> = {
  evidence_ledger: "real_evidence_ledger_v2_",
  evidence: "real_evidence_v2_",
  evidence_conflict: "real_evidence_conflict_v2_",
  assumption_ledger: "assumption_ledger_v2_",
  assumption: "assumption_v2_",
};

function stableHash(value: string) {
  let first = 2166136261;
  let second = 2246822519;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 3266489917);
  }

  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

export function createStableRealityBoundaryIdFactoryV2(
  namespace = "astraloom-v2",
): RealityBoundaryIdFactoryV2 {
  return (kind, fingerprint) =>
    `${prefixes[kind]}${stableHash(`${namespace}:${kind}:${fingerprint}`)}`;
}

export function isRealEvidenceIdV2(value: string) {
  return /^real_evidence_v2_[a-z0-9]+$/i.test(value);
}

export function isAssumptionIdV2(value: string) {
  return /^assumption_v2_[a-z0-9]+$/i.test(value);
}
