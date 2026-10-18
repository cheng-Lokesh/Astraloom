import { z } from "zod";
import { digitalLifeSafeText, digitalLifeSafeDescription } from "./model";

const safeValue = z.union([z.number().finite(), digitalLifeSafeText]).nullable();
export const guardObservationSchema = z.object({ ruleKey: z.string().regex(/^rule-[1-9]\d*$/), tickIndex: z.number().int().min(0).max(5), label: digitalLifeSafeText, unit: digitalLifeSafeText.nullable(), conditionDescription: digitalLifeSafeDescription,
  schedule: z.enum(["due", "not_due", "already_selected", "not_reached"]), guard: z.boolean().nullable(), candidate: z.enum(["selected", "not_selected", "ineligible"]).nullable(), before: safeValue, after: safeValue, stepKey: z.string().regex(/^step-[1-9]\d*$/).nullable(),
}).strict();
export const guardObservationsSchema = z.object({ version: z.literal("digital-life-guard-observations-v1"), samples: z.array(z.object({ key: z.string().regex(/^sample-[1-3]$/), ticks: z.array(z.object({ tickIndex: z.number().int().min(0).max(5), occurredAt: z.string().datetime({ offset: true }).nullable(), observations: z.array(guardObservationSchema).max(18) }).strict()).min(3).max(6) }).strict()).length(3) }).strict();
export const pathDiagnosticsSchema = z.object({ version: z.literal("formal-path-diagnostics-v1"), status: z.literal("not_saved"), paths: z.array(z.object({ key: z.string().regex(/^path-[1-3]$/), label: digitalLifeSafeText, status: z.enum(["no_actions", "has_events"]), samples: z.array(z.object({ key: z.string().regex(/^sample-[1-3]$/), terminalStatus: z.enum(["completed", "no_actions"]), executedTickCount: z.number().int().min(1).max(6), selectedEventCount: z.number().int().min(0).max(6) }).strict()).length(3), guardObservations: guardObservationsSchema }).strict()).min(1).max(3) }).strict();
export type GuardObservations = z.infer<typeof guardObservationsSchema>;
export type PathDiagnostics = z.infer<typeof pathDiagnosticsSchema>;
