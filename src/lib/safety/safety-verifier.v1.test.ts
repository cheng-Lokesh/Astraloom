import { describe, expect, it } from "vitest";

import { shouldBlockAction, verifySafety } from "./safety-verifier";
import { buildV1Seed } from "@/test/v1-fixtures";

describe("SafetyVerifier V1 baseline", () => {
  it("blocks violent input before downstream generation", () => {
    const decision = verifySafety({
      seedContext: buildV1Seed({
        questionText: "How should I attack my manager?",
        currentQuestionDescription:
          "I want to attack my manager and threaten him for revenge.",
        situationSummary:
          "I want to attack my manager and threaten him for revenge after a workplace decision.",
      }),
    });

    expect(decision.safetyLevel).toBe("blocked");
    expect(decision.flags).toContain("violence");
    expect(shouldBlockAction(decision, "run_simulation")).toBe(true);
    expect(shouldBlockAction(decision, "create_strong_claims")).toBe(true);
  });

  it("prevents paid-depth unlock from bypassing downgraded safety", () => {
    const decision = verifySafety({
      seedContext: buildV1Seed({
        questionText: "Should I monitor their phone?",
        currentQuestionDescription:
          "I want to monitor their phone and track their location.",
        situationSummary:
          "I want to monitor their phone and track their location because I do not trust what they say.",
      }),
    });

    expect(decision.safetyLevel).toBe("downgraded");
    expect(shouldBlockAction(decision, "request_paid_unlock")).toBe(true);
    expect(shouldBlockAction(decision, "run_simulation")).toBe(true);
  });
});
