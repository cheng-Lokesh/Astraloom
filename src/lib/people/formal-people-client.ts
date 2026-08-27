import { z } from "zod";

const seedContextSchema = z.object({
  id: z.string().uuid(),
  version: z.union([z.string(), z.number()]),
  submittedAt: z.string().datetime(),
  frozenAt: z.string().datetime(),
}).strict();

const seedListSchema = z.object({
  seedContexts: z.array(seedContextSchema),
}).strict();

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

const peopleSuccessSchema = z.object({
  ok: z.literal(true),
  error_code: z.null(),
  trace_id: z.string(),
  people: z.array(personSchema),
}).strict();

const mutationSuccessSchema = peopleSuccessSchema.extend({
  idempotent: z.boolean(),
}).strict();

const failureSchema = z.object({
  ok: z.literal(false),
  error_code: z.string(),
  trace_id: z.string(),
}).strict();

const personId = z.string().uuid();
export const formalPeopleActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("confirm"), person_id: personId }).strict(),
  z.object({ type: z.literal("rename"), person_id: personId, display_name: z.string().trim().min(1).max(120) }).strict(),
  z.object({ type: z.literal("delete"), person_id: personId }).strict(),
  z.object({ type: z.literal("merge"), source_person_id: personId, target_person_id: personId }).strict(),
  z.object({
    type: z.literal("supplement"),
    display_name: z.string().trim().min(1).max(120),
    relationship_to_user: z.string().trim().min(1).max(80),
    role_type: z.string().trim().min(1).max(80),
    note: z.string().trim().min(1).max(1000).optional(),
  }).strict(),
]);

export type FormalSeedContext = z.infer<typeof seedContextSchema>;
export type FormalPerson = z.infer<typeof personSchema>;
export type FormalPeopleAction = z.infer<typeof formalPeopleActionSchema>;
export type FormalPeopleFetch = (input: string, init: RequestInit) => Promise<Response>;

export type FormalPeopleState = {
  phase: "loading" | "ready" | "unauthenticated" | "no_seed" | "failure";
  seed: FormalSeedContext | null;
  people: FormalPerson[];
  notice: string | null;
  pendingAction: "extract" | FormalPeopleAction["type"] | null;
};

type FormalPeopleControllerOptions = {
  fetcher: FormalPeopleFetch;
  newId: () => string;
};

const recoveryFailure = "We couldn't recover saved people. Please try again.";
const mutationFailure = "We couldn't save this people update. Your saved view has not changed.";

function chooseNewestSeed(seedContexts: FormalSeedContext[]) {
  return [...seedContexts].sort((left, right) => {
    const submittedAtOrder = right.submittedAt.localeCompare(left.submittedAt);
    return submittedAtOrder || right.id.localeCompare(left.id);
  })[0] ?? null;
}

async function jsonBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function actionFailureNotice(status: number, errorCode: string) {
  if (status === 401 || errorCode === "unauthenticated") {
    return "Your session has ended. Sign in to recover saved people.";
  }
  if (status === 404 || errorCode === "seed_not_found") {
    return "This submitted scenario is no longer available. Return to intake to recover it.";
  }
  if (status === 409 && errorCode === "idempotency_key_content_conflict") {
    return "Saved people changed elsewhere. Reload saved people before trying again.";
  }
  if (status === 409 && errorCode === "invalid_people_transition") {
    return "This saved change can no longer be applied. Reload saved people before trying again.";
  }
  return mutationFailure;
}

/**
 * Browser-only controller for the formal Phase 3 People ledger. It deliberately
 * accepts only the safe API projections and never reads a local people draft.
 */
export class FormalPeopleController {
  private readonly fetcher: FormalPeopleFetch;
  private readonly newId: () => string;
  private inFlight = false;

  state: FormalPeopleState = {
    phase: "loading",
    seed: null,
    people: [],
    notice: null,
    pendingAction: null,
  };

  constructor({ fetcher, newId }: FormalPeopleControllerOptions) {
    this.fetcher = fetcher;
    this.newId = newId;
  }

  async recover() {
    const existing = this.state.phase === "ready" ? this.state : null;
    this.state = {
      ...this.state,
      phase: "loading",
      notice: null,
      pendingAction: null,
    };

    try {
      const seedResponse = await this.fetcher("/api/seed-context", { method: "GET" });
      if (seedResponse.status === 401) {
        this.state = { phase: "unauthenticated", seed: null, people: [], notice: null, pendingAction: null };
        return;
      }

      const seedResult = seedListSchema.safeParse(await jsonBody(seedResponse));
      if (!seedResponse.ok || !seedResult.success) {
        this.restoreOrFail(existing, recoveryFailure);
        return;
      }

      const seed = chooseNewestSeed(seedResult.data.seedContexts);
      if (!seed) {
        this.state = { phase: "no_seed", seed: null, people: [], notice: null, pendingAction: null };
        return;
      }

      const peopleResponse = await this.fetcher(`/api/key-people?seed_id=${seed.id}`, { method: "GET" });
      if (peopleResponse.status === 401) {
        this.state = { phase: "unauthenticated", seed: null, people: [], notice: null, pendingAction: null };
        return;
      }
      const peopleResult = peopleSuccessSchema.safeParse(await jsonBody(peopleResponse));
      if (!peopleResponse.ok || !peopleResult.success) {
        this.restoreOrFail(existing, recoveryFailure);
        return;
      }

      this.state = { phase: "ready", seed, people: peopleResult.data.people, notice: null, pendingAction: null };
    } catch {
      this.restoreOrFail(existing, recoveryFailure);
    }
  }

  async extract() {
    if (!this.begin("extract")) return;
    const seed = this.state.seed;
    if (!seed) return;

    await this.applyMutation("/api/key-people/extract", {
      selector: { seed_id: seed.id },
      idempotency_key: this.newId(),
    });
  }

  async mutate(action: FormalPeopleAction) {
    const parsedAction = formalPeopleActionSchema.safeParse(action);
    if (!parsedAction.success || !this.begin(action.type)) return;
    const seed = this.state.seed;
    if (!seed) return;

    await this.applyMutation("/api/key-people/confirm", {
      selector: { seed_id: seed.id },
      idempotency_key: this.newId(),
      operations: [parsedAction.data],
    });
  }

  private begin(action: FormalPeopleState["pendingAction"]) {
    if (this.inFlight || this.state.phase !== "ready" || !this.state.seed) return false;
    this.inFlight = true;
    this.state = { ...this.state, notice: null, pendingAction: action };
    return true;
  }

  private async applyMutation(url: string, body: Record<string, unknown>) {
    try {
      const response = await this.fetcher(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await jsonBody(response);
      const success = mutationSuccessSchema.safeParse(payload);

      if (response.ok && success.success) {
        this.state = { ...this.state, people: success.data.people, notice: null, pendingAction: null };
        return;
      }

      const failure = failureSchema.safeParse(payload);
      this.state = {
        ...this.state,
        notice: failure.success ? actionFailureNotice(response.status, failure.data.error_code) : mutationFailure,
        pendingAction: null,
      };
    } catch {
      this.state = { ...this.state, notice: mutationFailure, pendingAction: null };
    } finally {
      this.inFlight = false;
    }
  }

  private restoreOrFail(existing: FormalPeopleState | null, notice: string) {
    this.state = existing
      ? { ...existing, notice, pendingAction: null }
      : { phase: "failure", seed: null, people: [], notice, pendingAction: null };
  }
}
