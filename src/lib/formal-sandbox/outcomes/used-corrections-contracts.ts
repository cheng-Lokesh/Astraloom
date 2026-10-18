import { z } from "zod";

// Browser contract only. Source Run identity is navigation data, never display text.
const unsafe = /[\u0000-\u001f\u007f-\u009f]|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:raw\s+(?:scenario|evidence)|trace(?:[_ -]?id)?|internal(?:[_ -]?key)?|token|secret|password|api[_ -]?key|bearer|private\s+key)\b|(?:https?|file):\/\/|[a-z]:[\\/]/i;
const text = z.string().trim().min(1).max(600).refine(value => !unsafe.test(value));
const value = z.union([z.number().finite(), z.enum(["negative", "neutral", "positive"])]);
const sample = z.object({
  sampleKey: z.string().regex(/^sample-[1-3]$/),
  status: z.enum(["executed", "not_executed"]),
  stepKeys: z.array(z.string().regex(/^step-[1-9]\d*$/)).max(6),
}).strict().superRefine((item, ctx) => {
  if ((item.status === "executed") !== (item.stepKeys.length > 0) || new Set(item.stepKeys).size !== item.stepKeys.length) ctx.addIssue({ code: "custom", message: "Execution requires recorded unique steps." });
});
export const safeUsedCorrectionsSchema = z.object({
  version: z.literal("formal-used-corrections-v1"),
  status: z.enum(["recorded", "none_recorded", "source_unavailable"]),
  items: z.array(z.object({
    key: z.string().regex(/^correction-[1-9]\d*$/), sourceRunId: z.string().uuid(), ruleKey: z.string().regex(/^rule-[1-9]\d*$/),
    label: text, previousValue: value, nextValue: value, evidenceSummary: text.max(160), recordedAt: z.string().datetime({ offset: true }),
    samples: z.array(sample).length(3).refine(items => new Set(items.map(item => item.sampleKey)).size === 3),
  }).strict()).max(6),
}).strict().superRefine((receipt, ctx) => {
  if ((receipt.status === "recorded") !== (receipt.items.length > 0)) ctx.addIssue({ code: "custom", message: "Only verified recorded receipts contain items." });
  if (new Set(receipt.items.map(item => item.ruleKey)).size !== receipt.items.length || receipt.items.some(item => item.previousValue === item.nextValue)) ctx.addIssue({ code: "custom", message: "Corrections must be distinct changes." });
});
export type SafeUsedCorrections = z.infer<typeof safeUsedCorrectionsSchema>;
