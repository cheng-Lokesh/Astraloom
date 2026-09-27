import { z } from "zod";

const failure = z.object({ ok: z.literal(false), error_code: z.string(), trace_id: z.string() }).passthrough();
const run = z.object({ id: z.string().uuid(), status: z.string(), graph_snapshot_id: z.string().uuid().nullable().optional(), time_horizon: z.enum(["30_days", "90_days"]).optional(), completed_at: z.string().nullable().optional() }).passthrough();
const startSuccess = z.object({ ok: z.literal(true), idempotent: z.boolean(), run }).passthrough();
const statusSuccess = z.object({ ok: z.literal(true), run }).passthrough();
const resultProfileItemKey = (prefix: "fact" | "assumption" | "unknown") => z.string().regex(new RegExp(`^${prefix}-[1-9]\\d*$`));
export const formalSandboxResultProjectionSchema = z.object({
  participants: z.array(z.object({ key: z.string().regex(/^person-[1-9]\d*$/), label: z.string(), role: z.enum(["scenario decision maker", "frozen participant"]) })),
  relationships: z.array(z.object({ key: z.string().regex(/^relation-[1-9]\d*$/), fromPersonKey: z.string().regex(/^person-[1-9]\d*$/), toPersonKey: z.string().regex(/^person-[1-9]\d*$/), label: z.string() })),
  facts: z.array(z.object({ key: z.string().regex(/^fact-[1-9]\d*$/), statement: z.string(), boundary: z.literal("user_provided_fact") })),
  assumptions: z.array(z.object({ key: z.string().regex(/^assumption-[1-9]\d*$/), statement: z.string(), boundary: z.literal("system_assumption") })),
  realityProfile: z.object({
    status: z.enum(["frozen", "not_recorded"]),
    revision: z.number().int().nonnegative().nullable(),
    facts: z.array(z.object({ key: resultProfileItemKey("fact"), label: z.string(), statement: z.string(), evidenceSummary: z.string() }).strict()),
    assumptions: z.array(z.object({ key: resultProfileItemKey("assumption"), label: z.string(), statement: z.string(), evidenceSummary: z.string() }).strict()),
    unknowns: z.array(z.object({ key: resultProfileItemKey("unknown"), label: z.string() }).strict()),
    structuredResources: z.array(z.object({
      key: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/),
      label: z.string(),
      resourceType: z.enum(["time", "budget", "position_availability", "information"]),
      available: z.number().finite().min(0),
      unit: z.string(),
      minimum: z.number().finite().min(0),
      maximum: z.number().finite().min(0),
      usePerTick: z.number().finite().positive().nullable(),
      classification: z.enum(["fact", "assumption"]),
      evidenceSummary: z.string(),
    }).strict()),
    structuredConstraints: z.array(z.object({
      key: z.string().regex(/^constraint-[1-9]\d*$/),
      label: z.string(),
      resourceLabel: z.string(),
      rule: z.object({ kind: z.literal("before_time"), value: z.string().datetime({ offset: true }) }).strict(),
      classification: z.enum(["fact", "assumption"]),
      evidenceSummary: z.string(),
    }).strict()),
  }).strict(),
  resourceChanges: z.array(z.object({
    key: z.string().regex(/^change-[1-9]\d*$/),
    pathKey: z.string().regex(/^path-[1-9]\d*$/),
    label: z.string(),
    before: z.number().finite().min(0),
    after: z.number().finite().min(0),
    unit: z.string(),
    minimum: z.number().finite().min(0),
    maximum: z.number().finite().min(0),
    boundary: z.literal("simulation_change"),
  }).strict()),
  steps: z.array(z.object({ key: z.string().regex(/^step-[1-9]\d*$/), order: z.number().int().positive(), label: z.string(), kind: z.literal("sandbox_simulation"), boundary: z.literal("simulation_step"), participantKeys: z.array(z.string().regex(/^person-[1-9]\d*$/)), relationshipKeys: z.array(z.string().regex(/^relation-[1-9]\d*$/)) })),
  claims: z.array(z.object({ key: z.string().regex(/^claim-[1-9]\d*$/), statement: z.string(), uncertainty: z.string(), boundary: z.literal("conditional_claim"), stepKeys: z.array(z.string().regex(/^step-[1-9]\d*$/)).min(1), supportingStepKeys: z.array(z.string().regex(/^step-[1-9]\d*$/)).min(1), participantKeys: z.array(z.string().regex(/^person-[1-9]\d*$/)), relationshipKeys: z.array(z.string().regex(/^relation-[1-9]\d*$/)) })),
}).strict();
export type FormalSandboxResultProjection = z.infer<typeof formalSandboxResultProjectionSchema>;
const resultSuccess = z.object({ ok: z.literal(true), completed_at: z.string().nullable(), projection: formalSandboxResultProjectionSchema }).passthrough();
const historySuccess = z.object({ ok: z.literal(true), items: z.array(run), next_cursor: z.string().nullable() }).passthrough();
const feedbackSuccess = z.object({ ok: z.literal(true), idempotent: z.boolean(), feedback: z.record(z.string(), z.unknown()) }).passthrough();
type Fetcher = typeof fetch;
async function read<T>(response: Response, schema: z.ZodType<T>) { const json = await response.json().catch(() => null); const failed = failure.safeParse(json); if (!response.ok) return { ok: false as const, status: response.status, errorCode: failed.success ? failed.data.error_code : "request_failed" }; const parsed = schema.safeParse(json); return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, status: 500, errorCode: "invalid_response" }; }
export function createFormalSandboxClient(fetcher: Fetcher = fetch) { return {
  start: async (input: { graphSnapshotId: string; idempotencyKey: string; horizonDays: 30 | 90 }) => read(await fetcher("/api/sandbox/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ graph_snapshot_id: input.graphSnapshotId, idempotency_key: input.idempotencyKey, horizon_days: input.horizonDays }) }), startSuccess),
  status: async (runId: string) => read(await fetcher(`/api/sandbox/runs/${encodeURIComponent(runId)}`, { cache: "no-store" }), statusSuccess),
  result: async (runId: string) => read(await fetcher(`/api/sandbox/runs/${encodeURIComponent(runId)}/result`, { cache: "no-store" }), resultSuccess),
  history: async (limit = 20, before?: string, horizon?: "30_days" | "90_days") => read(await fetcher(`/api/sandbox/runs?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ""}${horizon ? `&horizon=${horizon}` : ""}`, { cache: "no-store" }), historySuccess),
  feedback: async (runId: string, input: { rating: "useful" | "mixed" | "off"; comment: string; idempotencyKey: string }) => read(await fetcher(`/api/sandbox/runs/${encodeURIComponent(runId)}/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating: input.rating, comment: input.comment, idempotency_key: input.idempotencyKey }) }), feedbackSuccess),
}; }
