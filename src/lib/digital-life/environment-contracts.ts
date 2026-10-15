import { z } from "zod";
import { digitalLifeSafeText } from "./model";

const step = z.string().regex(/^step-[1-9]\d*$/);
export const safeEnvironmentConditionSchema = z.object({
  key: z.string().regex(/^environment-condition-[1-9]\d*$/), ruleKey: z.string().regex(/^rule-[1-9]\d*$/),
  pathKey: z.string().regex(/^(main|person-[1-9]\d*)$/), variableKey: z.string().regex(/^(pressure|external-variable)-[1-8]$/),
  label: digitalLifeSafeText, initialValue: digitalLifeSafeText, initialClassification: z.enum(["fact", "assumption"]),
  proposedValue: digitalLifeSafeText, boundary: z.literal("confirmed_simulation_assumption"),
  samples: z.array(z.object({ key: z.string().regex(/^sample-[1-9]\d*$/), state: z.enum(["selected", "not_selected", "not_triggered", "not_reached"]), stepKey: step.nullable(), actualValue: digitalLifeSafeText.nullable(), successorStepKeys: z.array(step).max(6) }).strict()).length(3),
}).strict();
export type SafeEnvironmentCondition = z.infer<typeof safeEnvironmentConditionSchema>;
