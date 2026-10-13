import { z } from "zod";
import { digitalLifeRulesDraftSchema } from "@/lib/formal-sandbox/correction-context";
import { safeDigitalLifeContextSchema } from "@/lib/formal-sandbox/model-context";

/** Object-key order is irrelevant; array order and every JSON value remain significant. */
export function canonicalModelDraftJson(value: unknown): string {
  const normalized: unknown = JSON.parse(JSON.stringify(value));
  const canonical = (item: unknown): string => {
    if (item === null || typeof item !== "object") return JSON.stringify(item);
    if (Array.isArray(item)) return `[${item.map(canonical).join(",")}]`;
    const record = item as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  };
  return canonical(normalized);
}

export const digitalLifeModelDraftSourceSchema = z.object({
  signature: z.string().regex(/^[a-f0-9]{64}$/),
  modelContext: safeDigitalLifeContextSchema,
}).strict();
export const saveDigitalLifeModelDraftSchema = z.object({
  version: z.literal("digital-life-model-draft-v1"),
  expectedRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1),
  idempotencyKey: z.string().uuid(),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  sourceContext: digitalLifeModelDraftSourceSchema,
  draftRules: digitalLifeRulesDraftSchema,
}).strict();
export const digitalLifeModelDraftSchema = z.object({
  version: z.literal("digital-life-model-draft-v1"),
  status: z.enum(["current", "stale", "not_saved"]),
  currentRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  horizonDays: z.union([z.literal(30), z.literal(90)]).nullable(),
  sourceContext: digitalLifeModelDraftSourceSchema.nullable(),
  currentSourceContext: digitalLifeModelDraftSourceSchema.nullable(),
  draftRules: digitalLifeRulesDraftSchema.nullable(),
}).strict().superRefine((value, context) => {
  const empty = value.currentRevision === 0 && value.horizonDays === null && value.sourceContext === null && value.draftRules === null;
  const saved = value.currentRevision > 0 && value.horizonDays !== null && value.sourceContext !== null && value.draftRules !== null;
  if (value.status === "not_saved" ? !empty : !saved) context.addIssue({ code: "custom", message: "Invalid draft state" });
  if (value.status === "current" && (!value.currentSourceContext || canonicalModelDraftJson(value.sourceContext) !== canonicalModelDraftJson(value.currentSourceContext))) context.addIssue({ code: "custom", message: "Invalid current source" });
  if (value.draftRules && value.sourceContext) {
    const source = value.sourceContext.modelContext;
    if (value.draftRules.graphSnapshotId !== source.graphSnapshotId || value.draftRules.agentSnapshotId !== source.agentSnapshotId || value.draftRules.profileRevision !== source.profileRevision) context.addIssue({ code: "custom", message: "Invalid saved rule binding" });
  }
});
export type DigitalLifeModelDraftSource = z.infer<typeof digitalLifeModelDraftSourceSchema>;
export type DigitalLifeModelDraft = z.infer<typeof digitalLifeModelDraftSchema>;
export type SaveDigitalLifeModelDraft = z.infer<typeof saveDigitalLifeModelDraftSchema>;
export type ModelDraftError = "invalid_request" | "unauthenticated" | "model_source_stale" | "model_source_invalid" | "revision_conflict" | "idempotency_key_content_conflict" | "persistence_failed";
export type ModelDraftResult = { ok: true; draft: DigitalLifeModelDraft; idempotent?: boolean } | { ok: false; errorCode: ModelDraftError };
