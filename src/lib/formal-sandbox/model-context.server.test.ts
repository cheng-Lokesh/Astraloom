import { describe, expect, it } from "vitest";
import { digitalLifeInput, ids } from "@/lib/digital-life/test-fixtures";
import { readFormalDigitalLifeContext } from "./model-context.server";

function client(change: Record<string, unknown> = {}) {
  const input = digitalLifeInput();
  const rows: Record<string, unknown> = {
    relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot, graph_locked: true },
    agent_profiles: input.agents.map(agent => ({ id: agent.id, user_id: ids.owner, seed_context_id: ids.seed, snapshot_id: ids.snapshot, display_name: agent.displayName, agent_type: agent.sourceRole, evidence_refs: agent.evidenceRefs })),
    relation_edges: input.edges.map(edge => ({ id: edge.id, user_id: ids.owner, graph_snapshot_id: ids.graph, agent_snapshot_id: ids.snapshot, from_agent_id: edge.fromAgentId, to_agent_id: edge.toAgentId, relationship_type: edge.relationshipType, evidence_refs: edge.evidenceRefs })),
    reality_profiles: null,
    seed_contexts: { id: ids.seed, user_id: ids.owner, status: "submitted", submitted_at: "2026-10-06T00:00:00.000Z", frozen_at: "2026-10-06T00:00:00.000Z" },
    ...change,
  };
  const operations: string[] = [];
  return { operations, from(table: string) {
    const builder: Record<string, (...args: unknown[]) => unknown> = {};
    builder.select = () => builder;
    builder.eq = (column, value) => { operations.push(`${table}:${String(column)}:${String(value)}`); return builder; };
    builder.order = (column) => { operations.push(`${table}:order:${String(column)}`); return builder; };
    builder.limit = () => builder;
    builder.not = () => builder;
    builder.maybeSingle = async () => ({ data: rows[table], error: null });
    builder.then = (resolve, reject) => Promise.resolve({ data: rows[table], error: null }).then(resolve as never, reject as never);
    return builder;
  } };
}

describe("owner and Graph-bound digital-life rule context", () => {
  it("resolves the latest submitted frozen Seed and its latest Graph without a selector", async () => {
    const caller = client();
    const result = await readFormalDigitalLifeContext(caller as never, ids.owner);
    expect(result.ok).toBe(true);
    expect(caller.operations).toContain("seed_contexts:order:submitted_at");
    expect(caller.operations).toContain(`relation_graph_snapshots:seed_context_id:${ids.seed}`);
  });
  it("does not fall back to an older locked Graph when the current Graph is unlocked", async () => {
    const caller = client({ relation_graph_snapshots: { id: ids.graph, user_id: ids.owner, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot, graph_locked: false } });
    expect(await readFormalDigitalLifeContext(caller as never, ids.owner)).toEqual({ ok: false, errorCode: "current_graph_required" });
  });
  it("uses the exact locked Graph order and returns only safe ordinal display context", async () => {
    const caller = client();
    const result = await readFormalDigitalLifeContext(caller as never, ids.owner, ids.graph);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.context.agents.map(agent => [agent.key, agent.role])).toEqual([["person-1", "user_core"], ["person-2", "npc"], ["person-3", "user_variant"]]);
    expect(result.context.profileRevision).toBe(0);
    expect(result.context.resources).toEqual([]);
    expect(caller.operations).toContain(`reality_profiles:seed_context_id:${ids.seed}`);
    expect(caller.operations).toContain("agent_profiles:order:id");
    expect(caller.operations).toContain("relation_edges:order:id");
    const display = JSON.stringify({ agents: result.context.agents, relationships: result.context.relationships, resources: result.context.resources });
    expect(display).not.toMatch(/seed:self|seed:person|11111111-1111|55555555-5555/);
  });
  it("hides a foreign Graph and does not resolve its participants or Profile", async () => {
    const caller = client({ relation_graph_snapshots: { id: ids.graph, user_id: ids.npc, seed_context_id: ids.seed, agent_snapshot_id: ids.snapshot, graph_locked: true } });
    expect(await readFormalDigitalLifeContext(caller as never, ids.owner, ids.graph)).toEqual({ ok: false, errorCode: "graph_not_found" });
    expect(caller.operations.some(operation => operation.startsWith("agent_profiles:"))).toBe(false);
  });
  it("rejects snapshot members from another owner or Seed without a partial context", async () => {
    const caller = client({ agent_profiles: [{ id: ids.self, user_id: ids.npc, seed_context_id: ids.seed, snapshot_id: ids.snapshot, display_name: "Foreign", agent_type: "user_core", evidence_refs: ["seed:self"] }] });
    expect(await readFormalDigitalLifeContext(caller as never, ids.owner, ids.graph)).toEqual({ ok: false, errorCode: "incomplete_object_chain" });
  });
});
