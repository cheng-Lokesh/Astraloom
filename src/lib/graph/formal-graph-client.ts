import { z } from "zod";

const seedSchema = z.object({ id: z.string().uuid(), version: z.union([z.string(), z.number()]), submittedAt: z.string().datetime({ offset: true }), frozenAt: z.string().datetime({ offset: true }) }).strict();
const seedListSchema = z.object({ seedContexts: z.array(seedSchema) }).strict();
const agentSafetySchema = z.enum(["safe", "caution", "downgraded"]);
const snapshotSchema = z.object({ id: z.string().uuid(), version: z.literal("phase3-agent-snapshot-v1"), safety_level: agentSafetySchema, error_code: z.union([z.literal("safety_downgraded"), z.null()]) }).strict().superRefine((value, context) => {
  if (value.error_code !== (value.safety_level === "downgraded" ? "safety_downgraded" : null)) context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid safety result" });
});
const evidenceSchema = z.union([z.literal("seed:submitted"), z.literal("key_person:confirmed"), z.literal("user_supplement"), z.string().regex(/^agent:[a-z_]+$/), z.string().regex(/^seed_context:[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}:[0-9a-f]{16,64}$/i)]);
const agentSchema = z.object({ id: z.string().uuid(), snapshot_id: z.string().uuid(), key_person_id: z.string().uuid().nullable(), version: z.literal("phase3-agent-snapshot-v1"), agent_type: z.enum(["user_core", "user_variant", "npc"]), display_name: z.string().trim().min(1).max(160), relationship_to_user: z.string().trim().min(1).max(160), source: z.enum(["conservative_snapshot", "confirmed_person_snapshot"]), confidence: z.number().int().min(0).max(100), evidence_refs: z.array(evidenceSchema).min(1).max(32), safety_level: agentSafetySchema }).strict();
const agentsResponseSchema = z.object({ ok: z.literal(true), error_code: z.null(), trace_id: z.string(), snapshot: snapshotSchema.nullable(), agents: z.array(agentSchema) }).strict();
const weightSchema = z.number().int().min(0).max(100);
const weightsSchema = z.object({ trust: weightSchema, hostility: weightSchema, dependency: weightSchema, attraction: weightSchema, competition: weightSchema, information_gap: weightSchema, resource_control: weightSchema, emotional_debt: weightSchema }).strict();
const graphSchema = z.object({ id: z.string().uuid(), agent_snapshot_id: z.string().uuid(), version: z.literal("phase3-graph-snapshot-v1"), graph_locked: z.boolean(), locked_at: z.string().datetime({ offset: true }).nullable(), safety_level: z.enum(["safe", "caution"]), error_code: z.null() }).strict().superRefine((value, context) => {
  if (value.graph_locked !== (value.locked_at !== null)) context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid lock result" });
});
const edgeSchema = z.object({ id: z.string().uuid(), graph_snapshot_id: z.string().uuid(), agent_snapshot_id: z.string().uuid(), from_agent_id: z.string().uuid(), to_agent_id: z.string().uuid(), version: z.literal("phase3-graph-snapshot-v1"), relationship_type: z.enum(["professional", "personal", "family", "support", "competitive"]), weights: weightsSchema, confidence: z.number().int().min(0).max(100), evidence_refs: z.array(evidenceSchema).min(1).max(32), safety_level: z.enum(["safe", "caution"]) }).strict();
const readGraphResponseSchema = z.object({ ok: z.literal(true), error_code: z.null(), trace_id: z.string(), graph: graphSchema.nullable(), edges: z.array(edgeSchema) }).strict();
const generatedGraphResponseSchema = z.object({ ok: z.literal(true), error_code: z.null(), idempotent: z.boolean(), graph: graphSchema, edges: z.array(edgeSchema) }).strict();
const lockedGraphResponseSchema = z.object({ ok: z.literal(true), error_code: z.null(), trace_id: z.string(), idempotent: z.boolean(), graph: graphSchema }).strict();
const failureResponseSchema = z.object({ ok: z.literal(false), error_code: z.string(), trace_id: z.string() }).strict();

export type FormalGraphFetch = (input: string, init: RequestInit) => Promise<Response>;
export type FormalGraph = z.infer<typeof graphSchema>;
export type FormalGraphEdge = z.infer<typeof edgeSchema>;
export type FormalGraphAgent = z.infer<typeof agentSchema>;
export type FormalGraphState = { phase: "loading" | "ready" | "unauthenticated" | "no_seed" | "no_agents" | "downgraded" | "blocked" | "failure"; seed: z.infer<typeof seedSchema> | null; snapshot: z.infer<typeof snapshotSchema> | null; agents: FormalGraphAgent[]; graph: FormalGraph | null; edges: FormalGraphEdge[]; notice: string | null; pendingGeneration: boolean; pendingLock: boolean };

export async function runFormalGraphUiAction(work: () => Promise<boolean | void>, sync: () => void) { const task = work(); sync(); const result = await task; sync(); return result === true; }

const recoveryFailure = "We couldn't recover your saved Graph ledger. Please try again.";
const generationFailure = "We couldn't generate a Graph snapshot. Your saved ledger has not changed.";
const lockFailure = "We couldn't lock this Graph snapshot. Your saved ledger has not changed.";
function newestSeed(seeds: z.infer<typeof seedSchema>[]) { return [...seeds].sort((left, right) => right.submittedAt.localeCompare(left.submittedAt) || right.id.localeCompare(left.id))[0] ?? null; }
function validAgents(snapshot: z.infer<typeof snapshotSchema> | null, agents: FormalGraphAgent[]) {
  if (!snapshot) return agents.length === 0;
  if (!agents.length || agents.some((agent) => agent.snapshot_id !== snapshot.id || agent.safety_level !== snapshot.safety_level)) return false;
  const cores = agents.filter((agent) => agent.agent_type === "user_core");
  const npcs = agents.filter((agent) => agent.agent_type === "npc");
  return cores.length === 1 && new Set(npcs.map((agent) => agent.key_person_id)).size === npcs.length && agents.every((agent) => (agent.agent_type === "npc") === (agent.key_person_id !== null)) && (snapshot.safety_level !== "downgraded" || (agents.length === 1 && cores.length === 1));
}
function validGraph(graph: FormalGraph | null, edges: FormalGraphEdge[], snapshot: z.infer<typeof snapshotSchema> | null, agents: FormalGraphAgent[]) {
  if (!graph) return edges.length === 0;
  if (!snapshot || !edges.length || graph.agent_snapshot_id !== snapshot.id || graph.safety_level !== snapshot.safety_level || edges.some((edge) => edge.graph_snapshot_id !== graph.id || edge.agent_snapshot_id !== graph.agent_snapshot_id || edge.safety_level !== graph.safety_level || edge.from_agent_id === edge.to_agent_id || !agents.some((agent) => agent.id === edge.from_agent_id) || !agents.some((agent) => agent.id === edge.to_agent_id))) return false;
  const pairs = new Set<string>();
  return !edges.some((edge) => { const pair = [edge.from_agent_id, edge.to_agent_id].sort().join(":"); if (pairs.has(pair)) return true; pairs.add(pair); return false; });
}
async function jsonBody(response: Response): Promise<unknown> { return response.json().catch(() => null); }

/** Formal, fail-closed browser controller for the read-only Phase 3 Graph ledger. */
export class FormalGraphController {
  private readonly fetcher: FormalGraphFetch;
  private readonly newId: () => string;
  private inFlight = false;
  state: FormalGraphState = { phase: "loading", seed: null, snapshot: null, agents: [], graph: null, edges: [], notice: null, pendingGeneration: false, pendingLock: false };
  constructor({ fetcher, newId }: { fetcher: FormalGraphFetch; newId: () => string }) { this.fetcher = fetcher; this.newId = newId; }
  get canGenerate() { return this.state.phase === "ready" && !this.inFlight && !this.state.graph?.graph_locked && this.state.agents.some((agent) => agent.agent_type === "npc"); }
  get canLock() { return this.state.phase === "ready" && !this.inFlight && Boolean(this.state.graph && !this.state.graph.graph_locked && this.state.edges.length); }

  async recover() {
    const existing = ["ready", "blocked", "downgraded"].includes(this.state.phase) ? this.state : null;
    this.state = { ...this.state, phase: "loading", notice: null, pendingGeneration: false, pendingLock: false };
    try {
      const seedResponse = await this.fetcher("/api/seed-context", { method: "GET" });
      if (seedResponse.status === 401) return this.unauthenticated();
      const seeds = seedListSchema.safeParse(await jsonBody(seedResponse));
      if (!seedResponse.ok || !seeds.success) return this.restoreOrFail(existing, recoveryFailure);
      const seed = newestSeed(seeds.data.seedContexts);
      if (!seed) { this.state = { phase: "no_seed", seed: null, snapshot: null, agents: [], graph: null, edges: [], notice: null, pendingGeneration: false, pendingLock: false }; return; }
      const agentsResponse = await this.fetcher(`/api/agents?seed_id=${seed.id}`, { method: "GET" });
      if (agentsResponse.status === 401) return this.unauthenticated();
      const agents = agentsResponseSchema.safeParse(await jsonBody(agentsResponse));
      if (!agentsResponse.ok || !agents.success || !validAgents(agents.data.snapshot, agents.data.agents)) return this.restoreOrFail(existing, recoveryFailure);
      if (!agents.data.snapshot) { this.state = { phase: "no_agents", seed, snapshot: null, agents: [], graph: null, edges: [], notice: null, pendingGeneration: false, pendingLock: false }; return; }
      const graphResponse = await this.fetcher(`/api/graph?seed_id=${seed.id}`, { method: "GET" });
      if (graphResponse.status === 401) return this.unauthenticated();
      const graph = readGraphResponseSchema.safeParse(await jsonBody(graphResponse));
      if (!graphResponse.ok || !graph.success || !validGraph(graph.data.graph, graph.data.edges, agents.data.snapshot, agents.data.agents)) return this.restoreOrFail(existing, recoveryFailure);
      this.state = { phase: agents.data.snapshot.safety_level === "downgraded" ? "downgraded" : "ready", seed, snapshot: agents.data.snapshot, agents: agents.data.agents, graph: graph.data.graph, edges: graph.data.edges, notice: null, pendingGeneration: false, pendingLock: false };
    } catch { this.restoreOrFail(existing, recoveryFailure); }
  }
  async generate(): Promise<boolean> { return this.mutate("generate"); }
  async lock(): Promise<boolean> { return this.mutate("lock"); }
  private async mutate(action: "generate" | "lock"): Promise<boolean> {
    if (this.inFlight || !(action === "generate" ? this.canGenerate : this.canLock) || !this.state.seed) return false;
    const seedId = this.state.seed.id;
    this.inFlight = true;
    this.state = { ...this.state, notice: null, pendingGeneration: action === "generate", pendingLock: action === "lock" };
    try {
      const response = await this.fetcher(action === "generate" ? "/api/graph/generate" : "/api/graph/lock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selector: { seed_id: seedId }, idempotency_key: this.newId() }) });
      if (response.status === 401) { this.unauthenticated(); return false; }
      const payload = await jsonBody(response);
      if (action === "generate") {
        const generated = generatedGraphResponseSchema.safeParse(payload);
        if (response.ok && generated.success && validGraph(generated.data.graph, generated.data.edges, this.state.snapshot, this.state.agents)) { this.state = { ...this.state, phase: "ready", graph: generated.data.graph, edges: generated.data.edges, notice: null, pendingGeneration: false }; return true; }
      } else {
        const locked = lockedGraphResponseSchema.safeParse(payload);
        if (response.ok && locked.success && this.state.graph && validGraph(locked.data.graph, this.state.edges, this.state.snapshot, this.state.agents)) { this.state = { ...this.state, phase: "ready", graph: locked.data.graph, notice: null, pendingLock: false }; return true; }
      }
      const failure = failureResponseSchema.safeParse(payload);
      if (failure.success && response.status === 409 && failure.data.error_code === "safety_blocked") { this.state = { ...this.state, phase: "blocked", notice: "Graph generation was blocked by the saved safety boundary. No Graph snapshot was written.", pendingGeneration: false, pendingLock: false }; return false; }
      this.state = { ...this.state, notice: this.noticeFor(action, response.status, failure.success ? failure.data.error_code : null), pendingGeneration: false, pendingLock: false };
      return false;
    } catch { this.state = { ...this.state, notice: action === "generate" ? generationFailure : lockFailure, pendingGeneration: false, pendingLock: false }; return false; } finally { this.inFlight = false; }
  }
  private unauthenticated() { this.state = { phase: "unauthenticated", seed: null, snapshot: null, agents: [], graph: null, edges: [], notice: null, pendingGeneration: false, pendingLock: false }; }
  private noticeFor(action: "generate" | "lock", status: number, code: string | null) {
    if (status === 404 || code === "seed_not_found") return "This submitted scenario is no longer available. Return to intake to recover it.";
    if (status === 409 && code === "graph_locked") return "This Graph is already locked. Reload the saved Graph ledger.";
    if (status === 409 && code === "idempotency_key_content_conflict") return action === "generate" ? "This generation request conflicted with saved state. Reload the Graph ledger before trying again." : "This lock request conflicted with saved state. Reload the Graph ledger before trying again.";
    return action === "generate" ? generationFailure : lockFailure;
  }
  private restoreOrFail(existing: FormalGraphState | null, notice: string) { this.state = existing ? { ...existing, notice, pendingGeneration: false, pendingLock: false } : { phase: "failure", seed: null, snapshot: null, agents: [], graph: null, edges: [], notice, pendingGeneration: false, pendingLock: false }; }
}
