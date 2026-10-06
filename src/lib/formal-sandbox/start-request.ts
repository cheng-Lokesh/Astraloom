import { z } from "zod";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";

export const formalSandboxStartRequestSchema = z.object({
  graph_snapshot_id: z.string().uuid(), idempotency_key: z.string().uuid(),
  horizon_days: z.union([z.literal(30), z.literal(90)]), digital_life_rules: digitalLifeRulesSchema.optional(),
}).strict();
