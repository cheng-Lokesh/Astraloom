import { describe, expect, it } from "vitest";
import { parseFrozenSymbolicLens, projectFrozenSymbolicLens } from "./symbolic-lens";
import { attachedSymbolicFixture, emptySymbolicFixture, symbolicTestOwner } from "./symbolic-lens.test-fixtures";

describe("a formal Run's frozen optional symbolic source", () => {
  it("accepts a real date-only frame with exact source, consent and period provenance", () => {
    const value = attachedSymbolicFixture();
    expect(parseFrozenSymbolicLens(value, symbolicTestOwner, value.frozenAt)).toEqual(value);
    expect(value.frame.calculation.precision).toBe("date_only");
    expect(value.frame.calculation.inputUsed).toEqual(["birthDate"]);
  });
  it("reads the accepted frame after current period changes without consulting today's account", () => {
    const value = attachedSymbolicFixture();
    const projected = projectFrozenSymbolicLens(value);
    expect(projected.status).toBe("attached");
    expect(projected.frame?.referencePeriod).toEqual(value.frame.referencePeriod);
    expect(projected).not.toHaveProperty("provenance");
    expect(JSON.stringify(projected)).not.toContain(symbolicTestOwner);
    expect(JSON.stringify(projected)).not.toContain("1991-06-15");
  });
  it.each(["not_configured", "not_authorized", "stale", "withdrawn"])("preserves the explicit %s reason with no invented frame", status => {
    const value = emptySymbolicFixture(status);
    expect(parseFrozenSymbolicLens(value, symbolicTestOwner, value.frozenAt)).toEqual(value);
    expect(projectFrozenSymbolicLens(value)).toMatchObject({ status, frame: null });
  });
  it("keeps legacy static summaries readable but does not describe them as personal modeling", () => {
    const legacy = { mode: "bounded_fusion", summary: "Optional framing only." };
    expect(parseFrozenSymbolicLens(legacy, symbolicTestOwner, "2026-10-06T00:00:00.000Z")).toEqual(legacy);
    expect(projectFrozenSymbolicLens(legacy)).toMatchObject({ status: "not_recorded", frame: null });
    expect(projectFrozenSymbolicLens(undefined)).toMatchObject({ status: "not_recorded", frame: null });
  });
  it.each([
    (v: ReturnType<typeof attachedSymbolicFixture>) => { v.provenance.ownerId = "99999999-9999-4999-8999-999999999999"; },
    (v: ReturnType<typeof attachedSymbolicFixture>) => { v.provenance.sourceVersion = 2; },
    (v: ReturnType<typeof attachedSymbolicFixture>) => { v.provenance.consentRevision = 3; },
    (v: ReturnType<typeof attachedSymbolicFixture>) => { v.assessedPeriod.structureKey = "forged_structure"; },
    (v: ReturnType<typeof attachedSymbolicFixture>) => { v.frame.calculation.precision = "date_time_local"; },
  ])("rejects mismatched ownership, source, authorization, reference or precision", mutate => {
    const value = attachedSymbolicFixture(); mutate(value);
    expect(() => parseFrozenSymbolicLens(value, symbolicTestOwner, value.frozenAt)).toThrow();
  });
  it("rejects a retimed attachment or raw birth field instead of silently replacing the frozen source", () => {
    const value = attachedSymbolicFixture();
    expect(() => parseFrozenSymbolicLens(value, symbolicTestOwner, "2026-10-07T00:00:00.000Z")).toThrow();
    expect(() => parseFrozenSymbolicLens({ ...value, birthDate: "1991-06-15" }, symbolicTestOwner, value.frozenAt)).toThrow();
    expect(() => parseFrozenSymbolicLens({ ...emptySymbolicFixture(), frame: value.frame }, symbolicTestOwner, value.frozenAt)).toThrow();
  });
});
