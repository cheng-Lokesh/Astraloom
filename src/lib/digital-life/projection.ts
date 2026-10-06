import { z } from "zod";
import { buildDigitalLifeModel, digitalLifeModelSchema, digitalLifeSafeText, digitalLifeTriggerSchema, digitalLifeOperationSchema } from "./model";

export const safeDigitalLifeModelSchema = z.object({
  status: z.enum(["frozen", "not_recorded"]), version: z.literal("digital-life-model-v1").nullable(), profileRevision: z.number().int().nonnegative().nullable(),
  background: z.array(z.object({ key: z.string().regex(/^background-[1-9]\d*$/), label: digitalLifeSafeText, value: z.string().max(240), classification: z.enum(["fact", "assumption", "unknown"]), evidenceSummary: digitalLifeSafeText, usage: z.literal("background_only") }).strict()).max(91),
  agents: z.array(z.object({ key: z.string().regex(/^person-[1-9]\d*$/), label: digitalLifeSafeText, role: z.enum(["user_core", "user_variant", "npc", "group"]), strategyStatus: z.enum(["explicit", "not_defined", "not_applicable"]), evidenceSummary: digitalLifeSafeText }).strict()).max(50),
  rules: z.array(z.object({ key: z.string().regex(/^rule-[1-9]\d*$/), actorKey: z.string().regex(/^person-[1-9]\d*$/), pathKey: z.union([z.literal("main"), z.string().regex(/^person-[1-9]\d*$/)]), when: digitalLifeTriggerSchema, operation: digitalLifeOperationSchema, actionType: z.enum(["request_information", "update_commitment", "update_relation_signal", "allocate_resource"]), evidenceSummary: digitalLifeSafeText, boundary: z.literal("confirmed_simulation_assumption") }).strict()).max(18),
  limitations: z.array(digitalLifeSafeText).max(8),
}).strict();

export function projectDigitalLifeModel(rawModel: unknown, source: unknown) {
  if (rawModel === undefined) return { status: "not_recorded" as const, version: null, profileRevision: null, background: [], agents: [], rules: [], limitations: [] };
  const parsed = digitalLifeModelSchema.safeParse(rawModel);
  if (!parsed.success) return null;
  const rebuilt = buildDigitalLifeModel(source, parsed.data.rules);
  if (!rebuilt.ok || JSON.stringify(rebuilt.model) !== JSON.stringify(parsed.data)) return null;
  const model = parsed.data;
  return safeDigitalLifeModelSchema.parse({
    status: "frozen", version: model.version, profileRevision: model.profileRevision,
    background: model.background.map(({ label, value, classification, evidenceSummary, usage }, index) => ({ key: `background-${index + 1}`, label, value, classification, evidenceSummary, usage })),
    agents: model.agents.map(({ key, label, role, strategyStatus, evidenceSummary }) => ({ key, label, role, strategyStatus, evidenceSummary })),
    rules: model.rules.actions.map(({ key, actorKey, pathKey, when, operation, evidenceSummary }) => ({ key, actorKey, pathKey, when, operation, actionType: operation.actionType, evidenceSummary, boundary: "confirmed_simulation_assumption" })),
    limitations: model.limitations,
  });
}
