import { describe, expect, it } from "vitest";

import {
  buildSandboxOverview,
  readSandboxOverview,
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

  it("reads only the supplied owner chain and hides all raw identifiers in a complete account projection", async () => {
    const calls: Array<{ table: string; filters: Array<[string, unknown]> }> = [];
    const owner = "11111111-1111-4111-8111-111111111111";
    const seedId = "22222222-2222-4222-8222-222222222222";
    const snapshotId = "33333333-3333-4333-8333-333333333333";
    const graphId = "44444444-4444-4444-8444-444444444444";
    const runId = "55555555-5555-4555-8555-555555555555";
    const responseFor = (table: string, filters: Array<[string, unknown]>) => {
      if (table === "seed_contexts") return { data: { id: seedId, status: "submitted" }, error: null };
      if (table === "key_people") return { data: null, count: 2, error: null };
      if (table === "agent_profile_snapshots") return { data: { id: snapshotId }, error: null };
      if (table === "relation_graph_snapshots") return { data: { id: graphId, graph_locked: true }, error: null };
      if (table === "relation_edges") return { data: null, count: 3, error: null };
      if (table === "agent_profiles") return { data: null, count: 4, error: null };
      if (table === "feedback_logs") return { data: { id: "66666666-6666-4666-8666-666666666666" }, error: null };
      if (table === "simulations" && filters.some(([name, value]) => name === "status" && value === "completed")) return { data: { id: runId, status: "completed", completed_at: "2026-08-30T08:00:00.000Z" }, error: null };
      if (table === "simulations" && filters.some(([name]) => name === "in")) return { data: null, error: null };
      return { data: null, count: 1, error: null };
    };
    const client = {
      from(table: string) {
        const filters: Array<[string, unknown]> = [];
        const builder = {
          select: () => builder,
          eq: (name: string, value: unknown) => { filters.push([name, value]); return builder; },
          not: () => builder,
          in: (name: string, value: unknown) => { filters.push([name, value]); return builder; },
          order: () => builder,
          limit: () => builder,
          maybeSingle: async () => { calls.push({ table, filters }); return responseFor(table, filters); },
          then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => { calls.push({ table, filters }); return Promise.resolve(responseFor(table, filters)).then(resolve, reject); },
        };
        return builder;
      },
    };

    const overview = await readSandboxOverview(client as never, owner);

    expect(calls.every((call) => call.filters.some(([name, value]) => name === "user_id" && value === owner))).toBe(true);
    expect(overview.graph).toEqual({ exists: true, locked: true, edgeCount: 3 });
    expect(overview.latestCompletedRun).toEqual({ status: "completed", completedAt: "2026-08-30T08:00:00.000Z", href: `/app/simulation/result?run_id=${runId}` });
    expect(JSON.stringify(overview)).not.toContain(seedId);
    expect(JSON.stringify(overview)).not.toContain(graphId);
  });

  it("fails closed when a server row does not meet the Zod projection contract", async () => {
    const client = {
      from(table: string) {
        void table;
        const builder = { select: () => builder, eq: () => builder, not: () => builder, order: () => builder, limit: () => builder, maybeSingle: async () => ({ data: { id: "not-a-uuid", status: "submitted" }, error: null }) };
        return builder;
      },
    };

    await expect(readSandboxOverview(client as never, "11111111-1111-4111-8111-111111111111")).rejects.toBeInstanceOf(Error);
  });

  it("returns an honest empty account without querying downstream tables", async () => {
    const queried: string[] = [];
    const client = {
      from(table: string) {
        queried.push(table);
        const builder = {
          select: () => builder, eq: () => builder, not: () => builder, order: () => builder, limit: () => builder,
          maybeSingle: async () => ({ data: null, error: null }),
        };
        return builder;
      },
    };

    await expect(readSandboxOverview(client as never, "11111111-1111-4111-8111-111111111111")).resolves.toMatchObject({
      seed: { state: "not_started" }, people: { confirmedCount: 0 }, nextAction: { kind: "start_intake" },
    });
    expect(queried).toEqual(["seed_contexts"]);
  });

  it("handles a submitted but incomplete chain without inventing snapshots, graph or feedback", async () => {
    const seedId = "22222222-2222-4222-8222-222222222222";
    const client = {
      from(table: string) {
        const builder = {
          select: () => builder, eq: () => builder, not: () => builder, in: () => builder, order: () => builder, limit: () => builder,
          maybeSingle: async () => table === "seed_contexts" ? ({ data: { id: seedId, status: "submitted" }, error: null }) : ({ data: null, error: null }),
          then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve({ data: null, count: null, error: null }).then(resolve, reject),
        };
        return builder;
      },
    };

    await expect(readSandboxOverview(client as never, "11111111-1111-4111-8111-111111111111")).resolves.toMatchObject({
      seed: { state: "submitted" }, agents: { immutableCount: 0 }, graph: { exists: false, locked: false, edgeCount: 0 }, feedback: { exists: false }, nextAction: { kind: "review_people" },
    });
  });

  it("maps a server-confirmed running Run to its opaque recovery path", async () => {
    const seedId = "22222222-2222-4222-8222-222222222222";
    const runId = "55555555-5555-4555-8555-555555555555";
    const client = {
      from(table: string) {
        const filters: Array<[string, unknown]> = [];
        const builder = {
          select: () => builder, eq: (name: string, value: unknown) => { filters.push([name, value]); return builder; }, not: () => builder,
          in: (name: string, value: unknown) => { filters.push([name, value]); return builder; }, order: () => builder, limit: () => builder,
          maybeSingle: async () => response(),
          then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(response()).then(resolve, reject),
        };
        const response = () => {
          if (table === "seed_contexts") return { data: { id: seedId, status: "submitted" }, error: null };
          if (table === "agent_profile_snapshots") return { data: { id: "33333333-3333-4333-8333-333333333333" }, error: null };
          if (table === "relation_graph_snapshots") return { data: { id: "44444444-4444-4444-8444-444444444444", graph_locked: true }, error: null };
          if (table === "simulations") return { data: { id: runId, status: "running", completed_at: null }, error: null };
          return { data: null, count: 1, error: null };
        };
        return builder;
      },
    };

    await expect(readSandboxOverview(client as never, "11111111-1111-4111-8111-111111111111")).resolves.toMatchObject({
      running: { exists: true, href: `/app/simulation/running?run_id=${runId}` }, nextAction: { kind: "open_running" },
    });
  });
});
