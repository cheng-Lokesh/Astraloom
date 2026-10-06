import { z } from "zod";
import { digitalLifeSafeText } from "@/lib/digital-life/model";

export const safeDigitalLifeContextSchema = z.object({
  graphSnapshotId: z.string().uuid(), agentSnapshotId: z.string().uuid(), profileRevision: z.number().int().nonnegative(),
  agents: z.array(z.object({ key: z.string().regex(/^person-[1-9]\d*$/), label: digitalLifeSafeText, role: z.enum(["user_core", "user_variant", "npc", "group"]) }).strict()).min(1).max(50),
  relationships: z.array(z.object({ key: z.string().regex(/^relation-[1-9]\d*$/), label: digitalLifeSafeText, fromPersonKey: z.string().regex(/^person-[1-9]\d*$/), toPersonKey: z.string().regex(/^person-[1-9]\d*$/) }).strict()).max(200),
  resources: z.array(z.object({ key: z.string().regex(/^resource-[1-9]\d*$/), label: digitalLifeSafeText, available: z.number().finite().nonnegative(), minimum: z.number().finite().nonnegative(), maximum: z.number().finite().nonnegative(), unit: digitalLifeSafeText, usePerTick: z.number().finite().positive().nullable(), classification: z.enum(["fact", "assumption"]), evidenceSummary: digitalLifeSafeText }).strict()).max(8),
}).strict();
export type SafeDigitalLifeContext = z.infer<typeof safeDigitalLifeContextSchema>;
