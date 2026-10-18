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

const legacyModelContextSchema = safeDigitalLifeContextSchema.omit({ variables: true });
const modelDraftSourceV1 = z.object({
  signature: z.string().regex(/^[a-f0-9]{64}$/),
  modelContext: legacyModelContextSchema,
}).strict();
export const preparedModelDraftSourceSchema = z.object({
  version: z.literal("digital-life-model-draft-source-v2"),
  signature: z.string().regex(/^[a-f0-9]{64}$/),
  modelContext: safeDigitalLifeContextSchema.required({ variables: true }),
}).strict();
export const digitalLifeModelDraftSourceSchema = z.union([modelDraftSourceV1, preparedModelDraftSourceSchema]);
export const preparedModelDraftProtocolSchema = z.object({ version: z.literal("digital-life-model-draft-protocol-v3"), draftVersion: z.literal("digital-life-model-draft-v3"), rulesVersion: z.literal("digital-life-rules-v3") }).strict();
function protocolMatches(version: string, source: DigitalLifeModelDraftSource, rulesVersion: string) {
  return version === "digital-life-model-draft-v1" ? !("version" in source) && rulesVersion === "digital-life-rules-v1" : "version" in source && rulesVersion === (version === "digital-life-model-draft-v3" ? "digital-life-rules-v3" : "digital-life-rules-v2");
}
export const saveDigitalLifeModelDraftSchema = z.object({
  version: z.enum(["digital-life-model-draft-v1", "digital-life-model-draft-v2", "digital-life-model-draft-v3"]),
  expectedRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1),
  idempotencyKey: z.string().uuid(),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  sourceContext: digitalLifeModelDraftSourceSchema,
  draftRules: digitalLifeRulesDraftSchema,
}).strict().superRefine((value, ctx) => {
  if (!protocolMatches(value.version, value.sourceContext, value.draftRules.version)) ctx.addIssue({ code: "custom", message: "Draft/source/rule versions must match." });
});
export const digitalLifeModelDraftSchema = z.object({
  version: z.enum(["digital-life-model-draft-v1", "digital-life-model-draft-v2", "digital-life-model-draft-v3"]),
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
    if (!protocolMatches(value.version, value.sourceContext, value.draftRules.version)) context.addIssue({ code: "custom", message: "Draft/source/rule versions must match." });
    const source = value.sourceContext.modelContext;
    if (value.draftRules.graphSnapshotId !== source.graphSnapshotId || value.draftRules.agentSnapshotId !== source.agentSnapshotId || value.draftRules.profileRevision !== source.profileRevision) context.addIssue({ code: "custom", message: "Invalid saved rule binding" });
  }
});
export type DigitalLifeModelDraftSource = z.infer<typeof digitalLifeModelDraftSourceSchema>;
export type DigitalLifeModelDraft = z.infer<typeof digitalLifeModelDraftSchema>;
export type SaveDigitalLifeModelDraft = z.infer<typeof saveDigitalLifeModelDraftSchema>;
const modelReconciliationV1Schema = z.object({
  version: z.literal("digital-life-model-reconciliation-v1"),
  draftRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  sourceRules: digitalLifeRulesDraftSchema,
  requirements: z.array(z.object({ ruleKey: z.string().regex(/^rule-[1-9]\d*$/), kind: z.enum(["resource", "variable", "detach_profile_entry"]), previousSelector: z.string().min(1).max(100), previousLabel: z.string().optional() }).strict()).max(18),
  permissionsReset: z.object({ planning: z.literal(true), symbolic: z.literal(true), outcomeCalibration: z.literal(true), requestIdentity: z.literal(true) }).strict(),
}).strict().refine(value => value.sourceRules.version !== "digital-life-rules-v3");
export const modelReconciliationV2Schema = z.object({
  version: z.literal("digital-life-model-reconciliation-v2"), draftRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), horizonDays: z.union([z.literal(30), z.literal(90)]),
  sourceRules: digitalLifeRulesDraftSchema.refine(value => value.version === "digital-life-rules-v3"),
  requirements: z.array(z.object({ requirementKey: z.string().regex(/^rule-[1-9]\d*:(operation|guard)$/), ruleKey: z.string().regex(/^rule-[1-9]\d*$/), role: z.enum(["operation", "guard"]), kind: z.enum(["resource", "variable", "detach_profile_entry"]), previousSelector: z.string().min(1).max(100), previousLabel: z.string().optional() }).strict()).max(36),
  permissionsReset: modelReconciliationV1Schema.shape.permissionsReset,
}).strict();
export const modelReconciliationSchema = z.union([modelReconciliationV1Schema, modelReconciliationV2Schema]);
export type ModelReconciliation = z.infer<typeof modelReconciliationSchema>;
export type PreparedModelDraftSource = z.infer<typeof preparedModelDraftSourceSchema>;
export type ModelDraftError = "invalid_request" | "unauthenticated" | "model_source_stale" | "model_source_invalid" | "revision_conflict" | "model_reconciliation_scope_changed" | "idempotency_key_content_conflict" | "persistence_failed";
export type ModelDraftResult = { ok: true; draft: DigitalLifeModelDraft; idempotent?: boolean; preparedSourceContext?: PreparedModelDraftSource; preparedProtocol?: z.infer<typeof preparedModelDraftProtocolSchema>; reconciliation?: ModelReconciliation } | { ok: false; errorCode: ModelDraftError };
