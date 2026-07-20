import {
  SEEDED_RNG_ALGORITHM_V2,
  SEEDED_RNG_VERSION_V2,
  type SeededRngAuditV2,
  type SeededRngV2,
} from "./types";

export function createSeededRngV2(seed: number): SeededRngV2 {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new RangeError("trajectorySeed must be a uint32 integer.");
  }
  let state = seed >>> 0;
  let drawIndex = 0;
  return {
    algorithm: SEEDED_RNG_ALGORITHM_V2,
    version: SEEDED_RNG_VERSION_V2,
    seed,
    get drawIndex() {
      return drawIndex;
    },
    nextUint32() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      drawIndex += 1;
      return (value ^ (value >>> 14)) >>> 0;
    },
  };
}

export function selectSeededIndexV2(
  rng: SeededRngV2,
  candidateCount: number,
): SeededRngAuditV2 {
  if (!Number.isInteger(candidateCount) || candidateCount <= 0) {
    throw new RangeError("candidateCount must be a positive integer.");
  }
  const drawIndex = rng.drawIndex;
  const rawValue = rng.nextUint32();
  return {
    algorithm: rng.algorithm,
    version: rng.version,
    seed: rng.seed,
    drawIndex,
    rawValue,
    selectedIndex: rawValue % candidateCount,
  };
}

