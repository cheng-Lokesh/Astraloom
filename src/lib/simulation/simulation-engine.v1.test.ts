import { describe, expect, it } from "vitest";

import { buildV1CoreChain, withoutTemporalFields } from "@/test/v1-fixtures";

const branchIds = [
  "baseline",
  "cautious_self",
  "decisive_self",
  "boundary_adjustment",
];

describe("Simulation Engine V1 baseline", () => {
  it("keeps the fixed four branches and six shared ticks for 90 days", () => {
    const { simulationRun } = buildV1CoreChain();

    expect(simulationRun.version).toBe("local-deterministic-v0");
    expect(
      simulationRun.events.every((event) => event.source === "simulation_engine_v1"),
    ).toBe(true);
    expect(simulationRun.tickCount).toBe(6);
    expect(simulationRun.ticks).toHaveLength(6);
    expect(simulationRun.branches?.map((branch) => branch.id)).toEqual(branchIds);
    expect(simulationRun.events).toHaveLength(24);
    expect(simulationRun.ticks.every((tick) => tick.eventLogIds?.length === 4)).toBe(
      true,
    );
  });

  it("keeps three shared ticks for the supported 30-day V1 window", () => {
    const { simulationRun } = buildV1CoreChain({ timeWindow: "30_days" });

    expect(simulationRun.tickCount).toBe(3);
    expect(simulationRun.ticks).toHaveLength(3);
    expect(simulationRun.events).toHaveLength(12);
    expect(simulationRun.branches?.map((branch) => branch.id)).toEqual(branchIds);
  });

  it("preserves deterministic V1 structure for identical input", () => {
    const first = withoutTemporalFields(buildV1CoreChain());
    const second = withoutTemporalFields(buildV1CoreChain());

    expect(second).toEqual(first);
  });
});
