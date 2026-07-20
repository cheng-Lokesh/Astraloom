import { describe, expect, it } from "vitest";

import { trajectoryRunSpecFixtureV2 } from "./test-fixtures";
import { parseTrajectoryRunSpecV2 } from "./validation";

function expectInvalid(value: unknown, errorCode = "invalid_run_spec") {
  expect(() => parseTrajectoryRunSpecV2(value)).not.toThrow();
  expect(parseTrajectoryRunSpecV2(value)).toMatchObject({ ok: false, errorCode });
}

describe("Trajectory Run Spec V2 validation", () => {
  it.each([{}, null, [], "bad"])("safely rejects malformed unknown input %#", (value) => {
    expectInvalid(value);
  });

  it.each([
    ["unknown field", { extra: true }],
    ["bad run id", { runSpecId: "run_bad" }],
    ["bad trajectory id", { trajectoryId: "run_bad" }],
    ["bad seed", { trajectorySeed: -1 }],
    ["fractional seed", { trajectorySeed: 1.5 }],
    ["overflow seed", { trajectorySeed: 0x1_0000_0000 }],
    ["bad revision", { expectedInitialWorldRevision: -1 }],
    ["bad engine version", { trajectoryEngineVersion: "latest" }],
    ["bad timestamp", { startAt: "2026-02-30T00:00:00Z" }],
    ["bad horizon", { horizonDays: 60 }],
    ["zero interval", { tickIntervalDays: 0 }],
    ["fractional interval", { tickIntervalDays: 1.5 }],
    ["zero ticks", { maxTicks: 0 }],
    ["too many ticks", { maxTicks: 101 }],
  ])("rejects %s", (_label, overrides) => {
    expectInvalid({ ...trajectoryRunSpecFixtureV2(), ...overrides });
  });

  it("rejects a damaged initial World", () => {
    const spec = trajectoryRunSpecFixtureV2();
    spec.initialWorld.resources[0]!.available = Number.NaN;
    expectInvalid(spec, "invalid_initial_world");
  });

  it("rejects cross-seed World ownership", () => {
    expectInvalid(
      { ...trajectoryRunSpecFixtureV2(), seedContextId: "seed_other" },
      "cross_seed_reference",
    );
  });

  it("rejects a stale expected initial revision", () => {
    expectInvalid(
      { ...trajectoryRunSpecFixtureV2(), expectedInitialWorldRevision: 1 },
      "stale_initial_world_revision",
    );
  });

  it("rejects startAt before the initial World timestamp with a stable error", () => {
    expectInvalid(
      { ...trajectoryRunSpecFixtureV2(), startAt: "2026-07-19T09:59:59.999Z" },
      "start_before_initial_world",
    );
  });

  it("allows startAt at the exact initial World timestamp", () => {
    const spec = trajectoryRunSpecFixtureV2();
    expect(spec.startAt).toBe(spec.initialWorld.updatedAt);
    expect(parseTrajectoryRunSpecV2(spec).ok).toBe(true);
  });

  it("allows startAt expressed as the same instant in another timezone", () => {
    expect(
      parseTrajectoryRunSpecV2({
        ...trajectoryRunSpecFixtureV2(),
        startAt: "2026-07-19T18:00:00.000+08:00",
      }).ok,
    ).toBe(true);
  });

  it("rejects unsupported fractional precision in World and startAt", () => {
    const spec = trajectoryRunSpecFixtureV2();
    spec.initialWorld.updatedAt = "2026-07-19T10:00:00.0009Z";
    spec.startAt = "2026-07-19T10:00:00.0001Z";
    expectInvalid(spec, "unsupported_timestamp_precision");
  });

  it("rejects unsupported fractional precision in the initial World alone", () => {
    const spec = trajectoryRunSpecFixtureV2();
    spec.initialWorld.updatedAt = "2026-07-19T10:00:00.0009Z";
    spec.startAt = "2026-07-19T10:00:01.000Z";
    expectInvalid(spec, "unsupported_timestamp_precision");
  });

  it("accepts losslessly normalizable trailing fractional zeros", () => {
    expect(
      parseTrajectoryRunSpecV2({
        ...trajectoryRunSpecFixtureV2(),
        startAt: "2026-07-19T10:00:00.123000Z",
      }).ok,
    ).toBe(true);
  });

  it("rejects a schedule whose final Tick leaves the four-digit year domain", () => {
    expectInvalid(
      {
        ...trajectoryRunSpecFixtureV2(),
        startAt: "9999-12-31T00:00:00.000Z",
        tickIntervalDays: 1,
        maxTicks: 2,
      },
      "schedule_exceeds_timestamp_domain",
    );
  });

  it("allows a schedule whose final Tick remains in year 9999", () => {
    expect(
      parseTrajectoryRunSpecV2({
        ...trajectoryRunSpecFixtureV2(),
        startAt: "9999-12-30T00:00:00.000Z",
        tickIntervalDays: 1,
        maxTicks: 2,
      }).ok,
    ).toBe(true);
  });

  it("rejects a schedule whose final Tick exceeds the horizon", () => {
    expectInvalid(
      { ...trajectoryRunSpecFixtureV2(), tickIntervalDays: 20, maxTicks: 3 },
      "schedule_exceeds_horizon",
    );
  });

  it("accepts both 30-day and 90-day Run Specs without changing input", () => {
    for (const horizonDays of [30, 90] as const) {
      const input = { ...trajectoryRunSpecFixtureV2(), horizonDays };
      const before = structuredClone(input);
      expect(parseTrajectoryRunSpecV2(input).ok).toBe(true);
      expect(input).toEqual(before);
    }
  });
});
