import { describe, expect, it } from "vitest";
import { buildSymbolicFrame, birthSourceSchema, currentSymbolicPeriod, symbolicFrameSchema } from "./frame";

const birth = { birthDate: "1991-06-15", birthTime: null };
const now = "2026-10-06T00:00:00.000Z";

describe("formal symbolic frame", () => {
  it("builds five explainable dimensions without birth source or evidence ids", () => {
    const frame = buildSymbolicFrame(birth, 1, now);
    expect(frame.dimensions.map(item => item.key)).toEqual(["initial_tendency", "relationship_sensitivity", "rhythm", "symbolic_support_tension", "observation_window"]);
    expect(frame.dimensions.every(item => item.ruleId && item.sourceRefs.length > 0 && item.limitations.length > 0)).toBe(true);
    expect(frame.calculation.precision).toBe("date_only");
    expect(frame.calculation.inputUsed).toEqual(["birthDate"]);
    expect(frame.calculation.usesTrueSolarTime).toBe(false);
    expect(frame.calculation.usesSolarTermApproximation).toBe(true);
    expect(JSON.stringify(frame).includes(birth.birthDate)).toBe(false);
    expect(JSON.stringify(frame).includes("evidenceEventIds")).toBe(false);
    expect(symbolicFrameSchema.safeParse(frame).success).toBe(true);
  });
  it("uses a provided civil time without pretending timezone correction", () => {
    const frame = buildSymbolicFrame({ ...birth, birthTime: "14:35" }, 2, now);
    expect(frame.calculation.precision).toBe("date_time_local");
    expect(frame.calculation.inputUsed).toEqual(["birthDate", "birthTime"]);
    expect(frame.calculation.birthTimezoneCorrection).toBe(false);
    expect(frame.sourceVersion).toBe(2);
  });
  it("keeps rule results independent of source version and identity", () => {
    const first = buildSymbolicFrame(birth, 1, now);
    const later = buildSymbolicFrame(birth, 8, now);
    expect(first.dimensions).toEqual(later.dimensions);
  });
  it("anchors the current period in Shanghai with explicit coarse boundaries", () => {
    expect(currentSymbolicPeriod("2026-09-30T16:00:00.000Z").key).toBe("2026-10");
    const frame = buildSymbolicFrame(birth, 1, now);
    expect(frame.referencePeriod.timezone).toBe("Asia/Shanghai");
    expect(frame.referencePeriod.key).toBe("2026-10");
    expect(frame.referencePeriod.granularity).toBe("month");
    expect(frame.dimensions[4].summary).toContain("框架更新");
  });
  it("changes the current period calculation from actual month structure", () => {
    const first = buildSymbolicFrame(birth, 1, now);
    const next = buildSymbolicFrame(birth, 1, "2026-11-16T00:00:00.000Z");
    expect(first.calculation.periodMonthElement === next.calculation.periodMonthElement).toBe(false);
    expect(first.dimensions[3].value === next.dimensions[3].value).toBe(false);
  });
  it.each(["1991-02-29", "2000-02-30", "1991-13-01", "not-a-date", "0090-01-01"])("rejects an invalid civil date without inspecting it in output", value => {
    expect(birthSourceSchema.safeParse({ birthDate: value, birthTime: null }).success).toBe(false);
  });
  it.each(["24:00", "14:60", "14", ""])("rejects malformed provided time", value => {
    expect(birthSourceSchema.safeParse({ ...birth, birthTime: value }).success).toBe(false);
  });
  it("rejects unused inputs and unknown fields", () => {
    expect(birthSourceSchema.safeParse({ ...birth, timezone: "Asia/Shanghai" }).success).toBe(false);
    expect(birthSourceSchema.safeParse({ ...birth, birthPlace: "unused" }).success).toBe(false);
    expect(birthSourceSchema.safeParse({ ...birth, gender: "unused" }).success).toBe(false);
    expect(symbolicFrameSchema.safeParse({ ...buildSymbolicFrame(birth, 1, now), evidence_event_ids: ["symbolic"] }).success).toBe(false);
  });
  it("rejects future birth dates and invalid clocks", () => {
    expect(() => buildSymbolicFrame({ birthDate: "2027-01-01", birthTime: null }, 1, now)).toThrow("invalid_birth_source");
    expect(() => currentSymbolicPeriod("invalid")).toThrow("invalid_reference_time");
  });
});
