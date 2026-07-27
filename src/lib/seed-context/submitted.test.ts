import { describe, expect, it } from "vitest";
import { buildV1Seed } from "@/test/v1-fixtures";
import { parseSubmittedSeedContext } from "./submitted";

describe("submitted SeedContext contract", () => {
  it("accepts only acknowledged Track A 30/90-day input", () => {
    expect(parseSubmittedSeedContext(buildV1Seed()).ok).toBe(true);
    expect(parseSubmittedSeedContext({ ...buildV1Seed(), timeWindow: "1_year" }).ok).toBe(false);
    expect(parseSubmittedSeedContext({ ...buildV1Seed(), privacySafetyAck: false }).ok).toBe(false);
  });
});
