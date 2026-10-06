import { z } from "zod";
import { currentSymbolicPeriod, symbolicFrameSchema } from "./frame";
const preferenceSchema = z.object({ revision: z.number().int().positive(), storage_consent: z.boolean(), calculation_consent: z.boolean(), future_attachment_consent: z.boolean(), source_version: z.number().int().positive().nullable(), current_snapshot: z.unknown().nullable(), updated_at: z.string().datetime({ offset: true }) }).strict();
export function projectSymbolicLens(row: unknown, now: string) {
  if (row === null) return { revision: 0, status: "not_configured" as const, sourceVersion: null, snapshot: null, consent: { storage: false, calculation: false, futureAttachment: false }, futureAttachmentStatus: "not_connected" as const };
  const pref = preferenceSchema.parse(row);
  const active = pref.storage_consent && pref.calculation_consent;
  const nested = pref.current_snapshot && typeof pref.current_snapshot === "object" && "frame" in pref.current_snapshot ? pref.current_snapshot.frame : pref.current_snapshot;
  const snapshot = active ? symbolicFrameSchema.parse(nested) : null;
  if (snapshot && snapshot.sourceVersion !== pref.source_version) throw new Error("invalid_symbolic_projection");
  const calendar = currentSymbolicPeriod(now);
  const status = !active ? "withdrawn" as const : snapshot?.referencePeriod.key === calendar.key && snapshot.referencePeriod.structureKey === calendar.structureKey ? "active" as const : "stale" as const;
  return { revision: pref.revision, status, sourceVersion: pref.source_version, snapshot, consent: { storage: pref.storage_consent, calculation: pref.calculation_consent, futureAttachment: pref.future_attachment_consent }, futureAttachmentStatus: "not_connected" as const };
}
export type SymbolicLensProjection = ReturnType<typeof projectSymbolicLens>;
