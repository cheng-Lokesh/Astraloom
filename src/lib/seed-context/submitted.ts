import { z } from "zod";
import { normalizedSeedContextDraftSchema } from "./storage";

const submittedSeedContextSchema = normalizedSeedContextDraftSchema.extend({
  trackType: z.literal("crossroad"),
  timeWindow: z.enum(["30_days", "90_days"]),
  privacyAck: z.literal(true),
  privacySafetyAck: z.literal(true),
}).strict();

export function parseSubmittedSeedContext(input: unknown) {
  const parsed = submittedSeedContextSchema.safeParse(input);
  return parsed.success
    ? { ok: true as const, data: structuredClone(parsed.data) }
    : { ok: false as const, errorCode: "invalid_submitted_seed_context" as const };
}
