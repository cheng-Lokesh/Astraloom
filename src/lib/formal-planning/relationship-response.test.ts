import { describe, expect, it } from "vitest";
import { defaultPlanningRequestSchema } from "./contracts";
import { planningRequest, relationshipRequest } from "./test-fixtures";

describe("explicit relationship-response authorization", () => {
  it("accepts the opt-in version while retaining the original strict v1 request", () => {
    expect(defaultPlanningRequestSchema.safeParse(planningRequest(false)).success).toBe(true);
    expect(defaultPlanningRequestSchema.safeParse(relationshipRequest()).success).toBe(true);
  });
});
