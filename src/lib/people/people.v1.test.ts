import { describe, expect, it } from "vitest";

import { extractPeopleCandidates } from "./extract";
import { buildConfirmedPeople, buildV1Seed } from "@/test/v1-fixtures";

describe("People V1 baseline", () => {
  it("extracts people from the seed and preserves explicit confirmation", () => {
    const candidates = extractPeopleCandidates(buildV1Seed());
    const confirmed = buildConfirmedPeople();

    expect(candidates.length).toBeGreaterThan(0);
    expect(confirmed.length).toBeGreaterThan(0);
    expect(confirmed.every((person) => person.confirmed)).toBe(true);
    expect(confirmed.every((person) => person.status === "confirmed")).toBe(true);
    expect(confirmed.every((person) => person.evidenceRefs.length > 0)).toBe(true);
  });
});
