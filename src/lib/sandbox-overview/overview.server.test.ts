import { describe, expect, it } from "vitest";

import {
  buildSandboxOverview,
  readSandboxOverview,
  sandboxOverviewSchema,
  type SandboxOverview,
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
    [source({ latestCompletedRun: { completedAt: "2026-08-30T08:00:00.000Z", href: "/app/simulation/result?run_id=opaque", status: "completed" }, hasFeedback: true }), "start_next_run"],
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

  it("does not query relation edges when a Graph has no current Agent snapshot", async () => {
    const queried: string[] = [];
    const client = {
      from(table: string) {
        queried.push(table);
        const builder = {
          select: () => builder, eq: () => builder, not: () => builder, in: () => builder, order: () => builder, limit: () => builder,
          maybeSingle: async () => {
            if (table === "seed_contexts") return { data: { id: "22222222-2222-4222-8222-222222222222", status: "submitted" }, error: null };
            if (table === "relation_graph_snapshots") return { data: { id: "44444444-4444-4444-8444-444444444444", graph_locked: true }, error: null };
            return { data: null, error: null };
          },
          then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve({ data: null, count: table === "key_people" ? 2 : 0, error: null }).then(resolve, reject),
        };
        return builder;
      },
    };

    await expect(readSandboxOverview(client as never, "11111111-1111-4111-8111-111111111111")).resolves.toMatchObject({
      agents: { immutableCount: 0 }, graph: { exists: true, locked: true, edgeCount: 0 }, relations: { total: 0, items: [] }, nextAction: { kind: "build_agents" },
    });
    expect(queried).not.toContain("relation_edges");
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

  it("keeps an older completed Seed out of a newer submitted Seed with no Graph", async () => {
    const overview = await readSandboxOverview(crossChainClient({
      people: 0,
      snapshot: null,
      graph: null,
      currentRunning: null,
      oldRunning: null,
      currentCompleted: null,
      oldCompleted: completedRun,
      currentFeedback: null,
      oldFeedback: true,
      historyCount: 1,
    }) as never, ownerId);

    expect(overview).toMatchObject({
      latestCompletedRun: null,
      feedback: { exists: false },
      history: { count: 1 },
      nextAction: { kind: "review_people" },
    });
  });

  it("starts the current locked Graph instead of opening an older Seed's running Run", async () => {
    const overview = await readSandboxOverview(crossChainClient({
      currentRunning: null,
      oldRunning: runningRun,
      currentCompleted: null,
      oldCompleted: null,
      currentFeedback: null,
      oldFeedback: false,
    }) as never, ownerId);

    expect(overview).toMatchObject({
      running: { exists: false },
      latestCompletedRun: null,
      nextAction: { kind: "start_run" },
    });
  });

  it("does not let a Run from an older Graph of the current Seed drive the next action", async () => {
    const overview = await readSandboxOverview(crossChainClient({
      currentRunning: null,
      oldRunning: runningRun,
      currentCompleted: null,
      oldCompleted: null,
      currentFeedback: null,
      oldFeedback: false,
    }) as never, ownerId);

    expect(overview.nextAction.kind).toBe("start_run");
    expect(overview.running.exists).toBe(false);
  });

  it("prefers a current-chain running Run, then its latest completed Run", async () => {
    const running = await readSandboxOverview(crossChainClient({
      currentRunning: runningRun,
      oldRunning: null,
      currentCompleted: completedRun,
      oldCompleted: null,
      currentFeedback: true,
      oldFeedback: false,
    }) as never, ownerId);
    const completed = await readSandboxOverview(crossChainClient({
      currentRunning: null,
      oldRunning: null,
      currentCompleted: completedRun,
      oldCompleted: null,
      currentFeedback: true,
      oldFeedback: false,
    }) as never, ownerId);

    expect(running.nextAction.kind).toBe("open_running");
    expect(completed).toMatchObject({
      latestCompletedRun: { status: "completed" },
      feedback: { exists: true },
      nextAction: { kind: "start_next_run" },
    });
  });

  it("projects at most five safe current-snapshot people and relations with ordinal-only endpoints", async () => {
    const overview = await readSandboxOverview(summaryClient() as never, ownerId);

    expect(overview.people).toMatchObject({ confirmedCount: 2, total: 6 });
    expect(overview.people.items.slice(0, 2)).toEqual([
      { key: "person-1", label: "You", relationship: "self", kind: "user_core" },
      { key: "person-2", label: "Project lead", relationship: "manager", kind: "npc" },
    ]);
    expect(overview.people.items).toHaveLength(5);
    expect(overview.relations).toEqual({
      total: 2,
      items: [
        { key: "relation-1", fromPersonKey: "person-1", toPersonKey: "person-2", label: "professional" },
      ],
    });
    const serialized = JSON.stringify(overview);
    expect(serialized).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(serialized).not.toContain("old-seed-person");
    expect(serialized).not.toContain("private-evidence-ref");
    expect(serialized).not.toContain("raw scenario must stay server-side");
  });

  it("fails closed when a current-Graph relation endpoint is absent from the current immutable Agent snapshot", async () => {
    await expect(readSandboxOverview(summaryClient({ dangling: true }) as never, ownerId)).rejects.toThrow();
  });

  it("keeps the seven pre-run and run-state actions unique, then advances feedback to a calibrated next Run", () => {
    const cases: Array<[SandboxOverviewSource, SandboxOverview["nextAction"]["kind"]]> = [
      [source({ seed: null }), "start_intake"],
      [source({ confirmedPeopleCount: 0 }), "review_people"],
      [source({ immutableAgentsCount: 0 }), "build_agents"],
      [source({ graph: { exists: false, locked: false, edgeCount: 0 } }), "review_graph"],
      [source(), "start_run"],
      [source({ runningRun: { href: "/app/simulation/running?run_id=opaque" } }), "open_running"],
      [source({ latestCompletedRun: { completedAt: "2026-08-30T08:00:00.000Z", href: "/app/simulation/result?run_id=opaque", status: "completed" } }), "open_latest_result"],
    ];

    expect(cases.map(([input]) => buildSandboxOverview(input).nextAction.kind)).toEqual(cases.map(([, kind]) => kind));
    expect(new Set(cases.map(([, kind]) => kind)).size).toBe(7);
    expect(buildSandboxOverview(source({ latestCompletedRun: { completedAt: "2026-08-30T08:00:00.000Z", href: "/app/simulation/result?run_id=opaque", status: "completed" }, hasFeedback: true })).nextAction).toEqual({ kind: "start_next_run", href: "/app/new/graph" });
  });

  it("recognizes feedback only for the latest completed Run on the current chain", async () => {
    const overview = await readSandboxOverview(crossChainClient({
      currentRunning: null,
      oldRunning: null,
      currentCompleted: completedRun,
      oldCompleted: null,
      currentFeedback: false,
      oldFeedback: true,
    }) as never, ownerId);

    expect(overview.feedback).toEqual({ exists: false });
    expect(overview.history).toEqual({ count: 2 });
  });

});

const ownerId = "11111111-1111-4111-8111-111111111111";
const currentSeedId = "22222222-2222-4222-8222-222222222222";
const currentSnapshotId = "33333333-3333-4333-8333-333333333333";
const currentGraphId = "44444444-4444-4444-8444-444444444444";
const completedRun = { id: "55555555-5555-4555-8555-555555555555", status: "completed", completed_at: "2026-08-30T08:00:00.000Z" };
const runningRun = { id: "66666666-6666-4666-8666-666666666666", status: "running", completed_at: null };

type CrossChainOptions = {
  people?: number;
  snapshot?: { id: string } | null;
  graph?: { id: string; graph_locked: boolean } | null;
  currentRunning: typeof runningRun | null;
  oldRunning: typeof runningRun | null;
  currentCompleted: typeof completedRun | null;
  oldCompleted: typeof completedRun | null;
  currentFeedback: boolean | null;
  oldFeedback: boolean;
  historyCount?: number;
};

function crossChainClient(options: CrossChainOptions) {
  const complete = {
    people: 2,
    snapshot: { id: currentSnapshotId },
    graph: { id: currentGraphId, graph_locked: true },
    ...options,
  };
  const has = (filters: Array<[string, unknown]>, name: string, value: unknown) => filters.some(([key, actual]) => key === name && actual === value);
  const isCurrentChain = (filters: Array<[string, unknown]>) => has(filters, "seed_context_id", currentSeedId) && has(filters, "graph_snapshot_id", currentGraphId);
  const response = (table: string, filters: Array<[string, unknown]>) => {
    if (table === "seed_contexts") return { data: { id: currentSeedId, status: "submitted" }, error: null };
    if (table === "key_people") return { data: null, count: complete.people, error: null };
    if (table === "agent_profile_snapshots") return { data: complete.snapshot, error: null };
    if (table === "relation_graph_snapshots") return { data: complete.graph, error: null };
    if (table === "relation_edges") return { data: null, count: complete.graph ? 3 : 0, error: null };
    if (table === "agent_profiles") return { data: null, count: complete.snapshot ? 4 : 0, error: null };
    if (table === "simulations" && has(filters, "status", "completed")) return { data: isCurrentChain(filters) ? complete.currentCompleted : complete.oldCompleted, error: null };
    if (table === "simulations" && filters.some(([name, value]) => name === "status" && Array.isArray(value))) return { data: isCurrentChain(filters) ? complete.currentRunning : complete.oldRunning, error: null };
    if (table === "simulations") return { data: null, count: complete.historyCount ?? 2, error: null };
    if (table === "feedback_logs") {
      const isCurrentFeedback = has(filters, "seed_context_id", currentSeedId) && has(filters, "simulation_id", completedRun.id);
      return { data: isCurrentFeedback ? (complete.currentFeedback ? { id: "77777777-7777-4777-8777-777777777777" } : null) : complete.oldFeedback ? { id: "88888888-8888-4888-8888-888888888888" } : null, error: null };
    }
    return { data: null, error: null };
  };
  return {
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      const builder = {
        select: () => builder,
        eq: (name: string, value: unknown) => { filters.push([name, value]); return builder; },
        not: () => builder,
        in: (name: string, value: unknown) => { filters.push([name, value]); return builder; },
        order: () => builder,
        limit: () => builder,
        maybeSingle: async () => response(table, filters),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(response(table, filters)).then(resolve, reject),
      };
      return builder;
    },
  };
}

function summaryClient(options: { dangling?: boolean } = {}) {
  const people = [
    { id: "10000000-0000-4000-8000-000000000001", seed_context_id: currentSeedId, snapshot_id: currentSnapshotId, agent_type: "user_core", display_name: "You", relationship_to_user: "self" },
    { id: "10000000-0000-4000-8000-000000000002", seed_context_id: currentSeedId, snapshot_id: currentSnapshotId, agent_type: "npc", display_name: "Project lead", relationship_to_user: "manager" },
    { id: "10000000-0000-4000-8000-000000000003", seed_context_id: currentSeedId, snapshot_id: currentSnapshotId, agent_type: "user_variant", display_name: "Careful self", relationship_to_user: "self variant" },
    { id: "10000000-0000-4000-8000-000000000004", seed_context_id: currentSeedId, snapshot_id: currentSnapshotId, agent_type: "user_variant", display_name: "Decisive self", relationship_to_user: "self variant" },
    { id: "10000000-0000-4000-8000-000000000005", seed_context_id: currentSeedId, snapshot_id: currentSnapshotId, agent_type: "npc", display_name: "Collaborator", relationship_to_user: "peer" },
    { id: "10000000-0000-4000-8000-000000000006", seed_context_id: currentSeedId, snapshot_id: currentSnapshotId, agent_type: "npc", display_name: "Advisor", relationship_to_user: "advisor" },
  ];
  const edges = [
    { id: "20000000-0000-4000-8000-000000000001", seed_context_id: currentSeedId, graph_snapshot_id: currentGraphId, agent_snapshot_id: currentSnapshotId, from_agent_id: people[0]!.id, to_agent_id: people[1]!.id, relationship_type: "professional" },
    { id: "20000000-0000-4000-8000-000000000002", seed_context_id: currentSeedId, graph_snapshot_id: currentGraphId, agent_snapshot_id: currentSnapshotId, from_agent_id: people[0]!.id, to_agent_id: options.dangling ? "30000000-0000-4000-8000-000000000001" : people[5]!.id, relationship_type: "support" },
  ];
  const has = (filters: Array<[string, unknown]>, name: string, value: unknown) => filters.some(([key, actual]) => key === name && actual === value);
  return {
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      let head = false;
      const response = () => {
        if (table === "seed_contexts") return { data: { id: currentSeedId, status: "submitted" }, error: null };
        if (table === "key_people") return { data: null, count: 2, error: null };
        if (table === "agent_profile_snapshots") return { data: { id: currentSnapshotId }, error: null };
        if (table === "relation_graph_snapshots") return { data: { id: currentGraphId, agent_snapshot_id: currentSnapshotId, graph_locked: true }, error: null };
        if (table === "agent_profiles") return has(filters, "seed_context_id", currentSeedId) && has(filters, "snapshot_id", currentSnapshotId) ? { data: head ? null : people, count: people.length, error: null } : { data: [{ display_name: "old-seed-person", evidence_refs: ["private-evidence-ref"], raw_scenario: "raw scenario must stay server-side" }], count: 1, error: null };
        if (table === "relation_edges") return has(filters, "seed_context_id", currentSeedId) && has(filters, "graph_snapshot_id", currentGraphId) ? { data: head ? null : edges, count: edges.length, error: null } : { data: [], count: 0, error: null };
        if (table === "simulations") return { data: null, count: 0, error: null };
        if (table === "feedback_logs") return { data: null, error: null };
        return { data: null, error: null };
      };
      const builder = {
        select: (_columns?: string, settings?: { head?: boolean }) => { head = settings?.head ?? false; return builder; },
        eq: (name: string, value: unknown) => { filters.push([name, value]); return builder; },
        not: () => builder,
        in: (name: string, value: unknown) => { filters.push([name, value]); return builder; },
        order: () => builder,
        limit: () => builder,
        maybeSingle: async () => response(),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(response()).then(resolve, reject),
      };
      return builder;
    },
  };
}
