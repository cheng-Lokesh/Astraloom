import { describe, expect, it } from "vitest";

import { buildV1Seed } from "@/test/v1-fixtures";

describe("Seed Context V1 baseline", () => {
  it("normalizes a submitted 90-day career decision seed", () => {
    const seed = buildV1Seed();

    expect(seed.id).toBe("seed_v1_career_baseline");
    expect(seed.trackType).toBe("crossroad");
    expect(seed.timeWindow).toBe("90_days");
    expect(seed.status).toBe("submitted");
    expect(seed.privacyAck).toBe(true);
    expect(seed.situationSummary.length).toBeGreaterThan(80);
  });
});
