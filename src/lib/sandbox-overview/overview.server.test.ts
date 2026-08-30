import { describe, expect, it } from "vitest";

import {
  buildSandboxOverview,
  sandboxOverviewSchema,
  type SandboxOverviewSource,
} from "./overview.server";

const source = (overrides: Partial<SandboxOverviewSource> = {}): SandboxOverviewSource => ({
  authenticated: true,
  seed: { submitted: true },
  confirmedPeopleCount: 2,
  immutableAgentsCount: 4,
  graph: { exists: true, locked: true, edgeCount: 3 },
  runningRun: null,
  latestCompletedRun: null,
  historyCount: 0,
  hasFeedback: false,
  ...overrides,
});

describe("My Sandbox overview projection", () => {
  it.each([
    [source({ authenticated: false }), "sign_in"],
    [source({ seed: null }), "start_intake"],
    [source({ confirmedPeopleCount: 0 }), "review_people"],
    [source({ immutableAgentsCount: 0 }), "build_agents"],
    [source({ graph: { exists: false, locked: false, edgeCount: 0 } }), "review_graph"],
    [source({ graph: { exists: true, locked: false, edgeCount: 3 } }), "review_graph"],
    [source({ runningRun: { href: "/app/simulation/running?run_id=opaque" } }), "open_running"],
    [source({ latestCompletedRun: { completedAt: "2026-08-30T08:00:00.000Z", href: "/app/simulation/result?run_id=opaque", status: "completed" } }), "open_latest_result"],
    [source(), "start_run"],
  ])("computes the one truthful next action: %s", (input, expected) => {
    expect(buildSandboxOverview(input).nextAction.kind).toBe(expected);
  });

  it("marks lifecycle domains absent from M1 as not modeled instead of inferring a value", () => {
    const overview = buildSandboxOverview(source());

    expect(overview.lifeClimate).toEqual({ state: "not_modeled" });
    expect(overview.resources).toEqual({ state: "not_modeled" });
    expect(overview.constraints).toEqual({ state: "not_modeled" });
    expect(overview.nextChange).toEqual({ state: "not_modeled" });
    expect(overview.reality).toEqual({ state: "not_modeled" });
  });

  it("returns only counts, status and opaque navigation paths", () => {
    const overview = buildSandboxOverview(source({
      runningRun: { href: "/app/simulation/running?run_id=opaque" },
      latestCompletedRun: { completedAt: "2026-08-30T08:00:00.000Z", href: "/app/simulation/result?run_id=opaque", status: "completed" },
      historyCount: 3,
      hasFeedback: true,
    }));

    expect(overview).toMatchObject({
      authenticated: true,
      people: { confirmedCount: 2 },
      agents: { immutableCount: 4 },
      graph: { exists: true, locked: true, edgeCount: 3 },
      history: { count: 3 },
      feedback: { exists: true },
    });
    expect(JSON.stringify(overview)).not.toMatch(/[0-9a-f]{8}-[0-9a-f-]{27}/i);
    expect(sandboxOverviewSchema.safeParse({ ...overview, people: { confirmedCount: -1 } }).success).toBe(false);
  });
});
