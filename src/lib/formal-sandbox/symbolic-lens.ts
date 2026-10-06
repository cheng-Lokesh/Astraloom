import { z } from "zod";
import { currentSymbolicPeriod, symbolicFrameSchema } from "@/lib/formal-symbolic-lens/frame";

const periodSchema = symbolicFrameSchema.shape.referencePeriod;
const legacySymbolicLensSchema = z.object({ mode: z.literal("bounded_fusion"), summary: z.string().trim().max(1_000) }).strict();
const provenanceSchema = z.object({
  ownerId: z.string().uuid(), sourceId: z.string().uuid(), sourceVersion: z.number().int().positive(),
  snapshotId: z.string().uuid(), snapshotVersion: z.literal("formal-symbolic-frame-v1"), writerVersion: z.literal("formal-symbolic-writer-v1"),
  storageConsentId: z.string().uuid(), calculationConsentId: z.string().uuid(), futureAttachmentConsentId: z.string().uuid(),
  consentVersion: z.literal("symbolic-future-attachment-v1"), consentRevision: z.number().int().positive(),
}).strict();
export const frozenSymbolicLensSchema = z.object({
  version: z.literal("formal-symbolic-run-v1"), classification: z.literal("symbolic_lens"), causalUse: z.literal(false),
  status: z.enum(["attached", "not_configured", "not_authorized", "stale", "withdrawn"]),
  frozenAt: z.string().datetime({ offset: true }), assessedPeriod: periodSchema,
  preferenceRevision: z.number().int().nonnegative(), frame: symbolicFrameSchema.nullable(), provenance: provenanceSchema.nullable(),
}).strict().superRefine((lens, ctx) => {
  const current = currentSymbolicPeriod(lens.frozenAt);
  if (JSON.stringify(current) !== JSON.stringify(lens.assessedPeriod)) ctx.addIssue({ code: "custom", message: "invalid_assessment_period" });
  if (lens.status !== "attached") {
    if (lens.frame !== null || lens.provenance !== null) ctx.addIssue({ code: "custom", message: "unavailable_frame_must_be_empty" });
    return;
  }
  const { frame, provenance } = lens;
  if (!frame || !provenance || frame.sourceVersion !== provenance.sourceVersion || provenance.snapshotVersion !== frame.version
    || provenance.consentRevision !== lens.preferenceRevision || frame.referencePeriod.key !== current.key
    || frame.referencePeriod.structureKey !== current.structureKey || frame.referencePeriod.referenceDate > current.referenceDate) {
    ctx.addIssue({ code: "custom", message: "invalid_symbolic_attachment_binding" });
  }
});
export const runSymbolicLensSchema = z.union([frozenSymbolicLensSchema, legacySymbolicLensSchema]);
export type FrozenSymbolicLens = z.infer<typeof frozenSymbolicLensSchema>;
export function parseFrozenSymbolicLens(value: unknown, ownerId: string, acceptedAt: string) {
  const lens = runSymbolicLensSchema.parse(value);
  if ("version" in lens && (Date.parse(lens.frozenAt) !== Date.parse(acceptedAt) || lens.provenance && lens.provenance.ownerId !== ownerId)) throw new Error("invalid_symbolic_attachment_scope");
  return lens;
}
export const safeRunSymbolicLensSchema = z.object({
  status: z.enum(["attached", "not_configured", "not_authorized", "stale", "withdrawn", "not_recorded"]),
  frozenAt: z.string().datetime({ offset: true }).nullable(), preferenceRevision: z.number().int().nonnegative().nullable(),
  frame: symbolicFrameSchema.nullable(), causalUse: z.literal(false),
}).strict().superRefine((lens, ctx) => {
  if (lens.status === "attached" ? !lens.frame || !lens.frozenAt || lens.preferenceRevision === null : lens.frame !== null) ctx.addIssue({ code: "custom", message: "invalid_safe_symbolic_state" });
  if (lens.status === "not_recorded" && (lens.frozenAt !== null || lens.preferenceRevision !== null)) ctx.addIssue({ code: "custom", message: "legacy_symbolic_state_must_be_empty" });
});
export function projectFrozenSymbolicLens(value: unknown) {
  if (value === undefined) return safeRunSymbolicLensSchema.parse({ status: "not_recorded", frozenAt: null, preferenceRevision: null, frame: null, causalUse: false });
  const lens = runSymbolicLensSchema.parse(value);
  return safeRunSymbolicLensSchema.parse("version" in lens
    ? { status: lens.status, frozenAt: lens.frozenAt, preferenceRevision: lens.preferenceRevision, frame: lens.frame, causalUse: false }
    : { status: "not_recorded", frozenAt: null, preferenceRevision: null, frame: null, causalUse: false });
}
