import { describe, expect, it } from "vitest";
import { isCurrentCalibrationContext } from "./run-starter";

describe("safe calibration context admission", () => {
  it("admits only a current request generation and matching profile without UUID DTO fields", () => {
    const context = { status: "available" as const, profileRevision: 3, corrections: [] };
    expect(isCurrentCalibrationContext(context, 3, 2, 2)).toBe(true);
    expect(isCurrentCalibrationContext(context, 3, 1, 2)).toBe(false);
    expect(isCurrentCalibrationContext(context, 4, 2, 2)).toBe(false);
    expect(isCurrentCalibrationContext({ ...context, status: "current_graph_required" }, 3, 2, 2)).toBe(false);
  });
});
