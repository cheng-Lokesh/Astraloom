import { z } from "zod";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";
import { outcomeCalibrationSelectionSchema } from "./outcomes/contracts";

export const formalSandboxStartRequestSchema = z.object({
  graph_snapshot_id: z.string().uuid(), idempotency_key: z.string().uuid(),
  horizon_days: z.union([z.literal(30), z.literal(90)]), digital_life_rules: digitalLifeRulesSchema.optional(),
  outcome_calibration: outcomeCalibrationSelectionSchema.optional(),
}).strict();
