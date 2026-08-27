import { z } from "zod";

const seedSchema = z.object({
  id: z.string().uuid(),
  version: z.union([z.string(), z.number()]),
  submittedAt: z.string().datetime({ offset: true }),
  frozenAt: z.string().datetime({ offset: true }),
}).strict();

const seedListSchema = z.object({ seedContexts: z.array(seedSchema) }).strict();

const personSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1).max(120),
  relationship_to_user: z.string().max(80),
  role_type: z.string().max(80),
  confidence: z.number().min(0).max(100),
  known_evidence: z.array(z.string()),
  missing_fields: z.array(z.string()),
  status: z.enum(["candidate", "confirmed", "deleted", "merged", "needs_confirmation"]),
  merged_into_id: z.string().uuid().nullable(),
  evidence_refs: z.array(z.string()),
  version: z.union([z.string(), z.number()]),
}).strict();

const peopleResponseSchema = z.object({
  ok: z.literal(true),
  error_code: z.null(),
  trace_id: z.string(),
  people: z.array(personSchema),
}).strict();

const safetyLevelSchema = z.enum(["safe", "caution", "downgraded"]);
const snapshotSchema = z.object({
  id: z.string().uuid(),
  version: z.literal("phase3-agent-snapshot-v1"),
  safety_level: safetyLevelSchema,
  error_code: z.union([z.literal("safety_downgraded"), z.null()]),
}).strict().superRefine((snapshot, context) => {
  const expected = snapshot.safety_level === "downgraded" ? "safety_downgraded" : null;
  if (snapshot.error_code !== expected) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["error_code"], message: "Invalid safety result" });
  }
});

const evidenceRefSchema = z.union([
  z.literal("seed:submitted"),
  z.literal("key_person:confirmed"),
  z.literal("user_supplement"),
  z.string().regex(/^seed_context:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:[0-9a-f]{16,64}$/),
]);

const agentSchema = z.object({
  id: z.string().uuid(),
  snapshot_id: z.string().uuid(),
  key_person_id: z.string().uuid().nullable(),
  version: z.literal("phase3-agent-snapshot-v1"),
  agent_type: z.enum(["user_core", "user_variant", "npc"]),
  display_name: z.string().trim().min(1).max(160),
  relationship_to_user: z.string().trim().min(1).max(160),
  source: z.enum(["conservative_snapshot", "confirmed_person_snapshot"]),
  confidence: z.number().int().min(0).max(100),
  evidence_refs: z.array(evidenceRefSchema).min(1).max(32),
  safety_level: safetyLevelSchema,
}).strict();

const readAgentsResponseSchema = z.object({
  ok: z.literal(true),
  error_code: z.null(),
  trace_id: z.string(),
  snapshot: snapshotSchema.nullable(),
  agents: z.array(agentSchema),
}).strict();

const generatedAgentsResponseSchema = readAgentsResponseSchema.extend({
  source: z.literal("controlled_snapshot"),
  idempotent: z.boolean(),
  snapshot: snapshotSchema,
}).strict();

const failureResponseSchema = z.object({
  ok: z.literal(false),
  error_code: z.string(),
  trace_id: z.string(),
}).strict();

export type FormalAgentsFetch = (input: string, init: RequestInit) => Promise<Response>;
export type FormalSeed = z.infer<typeof seedSchema>;
export type FormalAgentPerson = z.infer<typeof personSchema>;
export type FormalAgentSnapshot = z.infer<typeof snapshotSchema>;
export type FormalAgent = z.infer<typeof agentSchema>;

export type FormalAgentsState = {
  phase: "loading" | "ready" | "unauthenticated" | "no_seed" | "blocked" | "failure";
  seed: FormalSeed | null;
  people: FormalAgentPerson[];
  snapshot: FormalAgentSnapshot | null;
  agents: FormalAgent[];
  notice: string | null;
  pendingGeneration: boolean;
};

export async function runFormalAgentsUiAction(
  work: () => Promise<boolean | void>,
  sync: () => void,
) {
  const task = work();
  sync();
  const result = await task;
  sync();
  return result === true;
}

type FormalAgentsControllerOptions = { fetcher: FormalAgentsFetch; newId: () => string };

const recoveryFailure = "We couldn't recover your saved Agent ledger. Please try again.";
const generationFailure = "We couldn't generate an Agent snapshot. Your saved ledger has not changed.";

function newestSeed(seeds: FormalSeed[]) {
  return [...seeds].sort((left, right) => right.submittedAt.localeCompare(left.submittedAt) || right.id.localeCompare(left.id))[0] ?? null;
}

function confirmedPeople(people: FormalAgentPerson[]) {
  return people.filter((person) => person.status === "confirmed");
}

function safeAgents(snapshot: FormalAgentSnapshot | null, agents: FormalAgent[]) {
  if (!snapshot) return agents.length === 0;
  if (!agents.length || agents.some((agent) => agent.snapshot_id !== snapshot.id || agent.safety_level !== snapshot.safety_level)) return false;
  const cores = agents.filter((agent) => agent.agent_type === "user_core");
  const variants = agents.filter((agent) => agent.agent_type === "user_variant");
  const npcs = agents.filter((agent) => agent.agent_type === "npc");
  if (cores.length !== 1 || variants.length > 2) return false;
  if (agents.some((agent) => (agent.agent_type === "npc") !== (agent.key_person_id !== null))) return false;
  if (new Set(npcs.map((agent) => agent.key_person_id)).size !== npcs.length) return false;
  return snapshot.safety_level !== "downgraded" || (agents.length === 1 && cores.length === 1);
}

async function jsonBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

/**
 * Browser controller for the Phase 3 immutable Agent ledger. It deliberately
 * has no localStorage or repository fallback: only formal API projections can
 * enter state, and every generation request receives one new UUID.
 */
export class FormalAgentsController {
  private readonly fetcher: FormalAgentsFetch;
  private readonly newId: () => string;
  private inFlight = false;

  state: FormalAgentsState = {
    phase: "loading", seed: null, people: [], snapshot: null, agents: [], notice: null, pendingGeneration: false,
  };

  constructor({ fetcher, newId }: FormalAgentsControllerOptions) {
    this.fetcher = fetcher;
    this.newId = newId;
  }

  get canGenerate() {
    return this.state.phase === "ready" && !this.inFlight && confirmedPeople(this.state.people).length > 0;
  }

  async recover() {
    const existing = this.state.phase === "ready" || this.state.phase === "blocked" ? this.state : null;
    this.state = { ...this.state, phase: "loading", notice: null, pendingGeneration: false };

    try {
      const seedResponse = await this.fetcher("/api/seed-context", { method: "GET" });
      if (seedResponse.status === 401) return this.unauthenticated();
      const seeds = seedListSchema.safeParse(await jsonBody(seedResponse));
      if (!seedResponse.ok || !seeds.success) return this.restoreOrFail(existing, recoveryFailure);
      const seed = newestSeed(seeds.data.seedContexts);
      if (!seed) {
        this.state = { phase: "no_seed", seed: null, people: [], snapshot: null, agents: [], notice: null, pendingGeneration: false };
        return;
      }

      const peopleResponse = await this.fetcher(`/api/key-people?seed_id=${seed.id}`, { method: "GET" });
      if (peopleResponse.status === 401) return this.unauthenticated();
      const people = peopleResponseSchema.safeParse(await jsonBody(peopleResponse));
      if (!peopleResponse.ok || !people.success) return this.restoreOrFail(existing, recoveryFailure);

      const agentsResponse = await this.fetcher(`/api/agents?seed_id=${seed.id}`, { method: "GET" });
      if (agentsResponse.status === 401) return this.unauthenticated();
      const agents = readAgentsResponseSchema.safeParse(await jsonBody(agentsResponse));
      if (!agentsResponse.ok || !agents.success || !safeAgents(agents.data.snapshot, agents.data.agents)) {
        return this.restoreOrFail(existing, recoveryFailure);
      }

      this.state = { phase: "ready", seed, people: people.data.people, snapshot: agents.data.snapshot, agents: agents.data.agents, notice: null, pendingGeneration: false };
    } catch {
      this.restoreOrFail(existing, recoveryFailure);
    }
  }

  async generate(includeParallelSelves: boolean): Promise<boolean> {
    if (this.inFlight || this.state.phase !== "ready" || !this.state.seed) return false;
    if (!confirmedPeople(this.state.people).length) {
      this.state = { ...this.state, notice: "Confirm at least one saved person before generating Agents." };
      return false;
    }

    const seedId = this.state.seed.id;
    this.inFlight = true;
    this.state = { ...this.state, notice: null, pendingGeneration: true };
    try {
      const response = await this.fetcher("/api/agents/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          selector: { seed_id: seedId },
          idempotency_key: this.newId(),
          include_parallel_selves: includeParallelSelves,
        }),
      });
      if (response.status === 401) {
        this.unauthenticated();
        return false;
      }
      const payload = await jsonBody(response);
      const generated = generatedAgentsResponseSchema.safeParse(payload);
      if (response.ok && generated.success && safeAgents(generated.data.snapshot, generated.data.agents)) {
        this.state = { ...this.state, phase: "ready", snapshot: generated.data.snapshot, agents: generated.data.agents, notice: null, pendingGeneration: false };
        return true;
      }
      const failure = failureResponseSchema.safeParse(payload);
      if (failure.success && response.status === 409 && failure.data.error_code === "safety_blocked") {
        this.state = { ...this.state, phase: "blocked", notice: "Generation was blocked by the saved safety boundary. No Agent snapshot was written.", pendingGeneration: false };
        return false;
      }
      this.state = { ...this.state, notice: this.generationNotice(response.status, failure.success ? failure.data.error_code : null), pendingGeneration: false };
      return false;
    } catch {
      this.state = { ...this.state, notice: generationFailure, pendingGeneration: false };
      return false;
    } finally {
      this.inFlight = false;
    }
  }

  private unauthenticated() {
    this.state = { phase: "unauthenticated", seed: null, people: [], snapshot: null, agents: [], notice: null, pendingGeneration: false };
  }

  private generationNotice(status: number, errorCode: string | null) {
    if (status === 404 || errorCode === "seed_not_found") return "This submitted scenario is no longer available. Return to intake to recover it.";
    if (status === 409 && errorCode === "idempotency_key_content_conflict") return "This generation request conflicted with saved state. Reload the Agent ledger before trying again.";
    return generationFailure;
  }

  private restoreOrFail(existing: FormalAgentsState | null, notice: string) {
    this.state = existing
      ? { ...existing, notice, pendingGeneration: false }
      : { phase: "failure", seed: null, people: [], snapshot: null, agents: [], notice, pendingGeneration: false };
  }
}
