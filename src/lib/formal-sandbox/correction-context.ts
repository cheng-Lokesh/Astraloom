import { z } from "zod";
import { digitalLifeRulesSchema, validateDigitalLifeRuleVersion } from "@/lib/digital-life/model";
import { safeDigitalLifeContextSchema } from "./model-context";

// A loaded intention is deliberately not a Run POST authorization.
const unconfirmedAction = digitalLifeRulesSchema.shape.actions.element.omit({ confirmedForSimulation: true }).extend({ confirmedForSimulation: z.literal(false) }).strict();
const unconfirmedStrategy = digitalLifeRulesSchema.shape.strategies.element.omit({ confirmedForSimulation: true }).extend({ confirmedForSimulation: z.literal(false) }).strict();
export const digitalLifeRulesDraftSchema = z.object({ ...digitalLifeRulesSchema.shape,
  actions: z.array(unconfirmedAction).max(18),
  strategies: z.array(unconfirmedStrategy).max(2),
}).strict().superRefine(validateDigitalLifeRuleVersion);

export const safeDigitalLifeCorrectionContextSchema = z.object({
  version: z.enum(["digital-life-correction-context-v1", "digital-life-correction-context-v2"]),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  modelContext: safeDigitalLifeContextSchema,
  frozenRules: digitalLifeRulesSchema,
  draftRules: digitalLifeRulesDraftSchema,
  permissionsReset: z.object({ planning: z.literal(true), symbolic: z.literal(true), outcomeCalibration: z.literal(true), requestIdentity: z.literal(true) }).strict(),
}).strict().superRefine((value, ctx) => {
  if ((value.version === "digital-life-correction-context-v2") !== (value.frozenRules.version === "digital-life-rules-v3") || value.frozenRules.version !== value.draftRules.version) ctx.addIssue({ code: "custom", message: "Correction/rule protocols must match." });
});
export type SafeDigitalLifeCorrectionContext = z.infer<typeof safeDigitalLifeCorrectionContextSchema>;
export type DigitalLifeRulesDraft = z.infer<typeof digitalLifeRulesDraftSchema>;
export type CorrectionContextError = "invalid_request" | "run_not_found" | "run_not_completed" | "correction_rules_not_recorded" | "correction_source_stale" | "correction_source_invalid" | "persistence_failed";
export type CorrectionContextResult = { ok: true; context: SafeDigitalLifeCorrectionContext } | { ok: false; errorCode: CorrectionContextError };
