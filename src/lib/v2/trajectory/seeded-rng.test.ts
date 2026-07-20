import { describe, expect, it } from "vitest";

import { createSeededRngV2, selectSeededIndexV2 } from "./seeded-rng";

describe("Seeded RNG V2", () => {
  it("locks the mulberry32-v1 uint32 sequence", () => {
    const rng = createSeededRngV2(123456789);
    expect(Array.from({ length: 5 }, () => rng.nextUint32())).toEqual([
      1107202814, 4169434471, 3372958138, 885470128, 1301683845,
    ]);
  });

  it("repeats the same sequence for the same seed", () => {
    const first = createSeededRngV2(42);
    const second = createSeededRngV2(42);
    expect(Array.from({ length: 8 }, () => first.nextUint32())).toEqual(
      Array.from({ length: 8 }, () => second.nextUint32()),
    );
  });

  it("produces a different fixed fixture for a different seed", () => {
    const first = createSeededRngV2(1);
    const second = createSeededRngV2(2);
    expect(Array.from({ length: 4 }, () => first.nextUint32())).not.toEqual(
      Array.from({ length: 4 }, () => second.nextUint32()),
    );
  });

  it("returns auditable draw and selected indexes", () => {
    const rng = createSeededRngV2(7);
    const selection = selectSeededIndexV2(rng, 3);
    expect(selection).toEqual({
      algorithm: "mulberry32",
      version: "1",
      seed: 7,
      drawIndex: 0,
      rawValue: expect.any(Number),
      selectedIndex: selection.rawValue % 3,
    });
    expect(selectSeededIndexV2(rng, 3).drawIndex).toBe(1);
  });
});
