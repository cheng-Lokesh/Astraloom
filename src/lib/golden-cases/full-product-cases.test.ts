import { describe, expect, it } from "vitest";

import { goldenCases, runGoldenCaseAcceptance } from "./full-product-cases";

describe("V1 Golden Case CLI acceptance", () => {
  it("runs exactly the eight implemented Golden Cases", () => {
    const result = runGoldenCaseAcceptance();

    expect(goldenCases).toHaveLength(8);
    expect(result.cases).toHaveLength(8);
    expect(result.cases.map((item) => item.id)).toEqual(
      goldenCases.map((item) => item.id),
    );
  });

  it("passes every implemented Golden Case invariant", () => {
    const result = runGoldenCaseAcceptance();
    const failures = result.cases.flatMap((item) =>
      item.failures.map((failure) => `${item.id}:${failure.stepId}`),
    );

    expect(failures).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it("keeps blocked Golden input free of downstream V1 artifacts", () => {
    const result = runGoldenCaseAcceptance();
    const blocked = result.cases.find((item) => item.id === "blocked_unsafe_request");

    expect(blocked?.summary).toMatchObject({
      blocked: true,
      safetyLevel: "blocked",
      keyPeopleCount: 0,
      agentProfileCount: 0,
      relationEdgeCount: 0,
      tickCount: 0,
      eventLogCount: 0,
      claimCount: 0,
      reportId: null,
    });
  });
});
