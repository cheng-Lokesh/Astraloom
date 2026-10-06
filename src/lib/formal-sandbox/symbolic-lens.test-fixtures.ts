import { buildSymbolicFrame, currentSymbolicPeriod } from "@/lib/formal-symbolic-lens/frame";

export const symbolicTestOwner = "11111111-1111-4111-8111-111111111111";
export function attachedSymbolicFixture(now = "2026-10-06T00:00:00.000Z") {
  const frame = buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 1, now);
  return {
    version: "formal-symbolic-run-v1" as const, classification: "symbolic_lens" as const, causalUse: false as const,
    status: "attached" as const, frozenAt: now, assessedPeriod: currentSymbolicPeriod(now), preferenceRevision: 2,
    frame,
    provenance: {
      ownerId: symbolicTestOwner, sourceId: "22222222-2222-4222-8222-222222222222", sourceVersion: 1,
      snapshotId: "33333333-3333-4333-8333-333333333333", snapshotVersion: "formal-symbolic-frame-v1" as const,
      writerVersion: "formal-symbolic-writer-v1" as const,
      storageConsentId: "44444444-4444-4444-8444-444444444444", calculationConsentId: "55555555-5555-4555-8555-555555555555",
      futureAttachmentConsentId: "66666666-6666-4666-8666-666666666666",
      consentVersion: "symbolic-future-attachment-v1" as const, consentRevision: 2,
    },
  };
}
export function emptySymbolicFixture(status = "not_authorized", now = "2026-10-06T00:00:00.000Z") {
  return { version: "formal-symbolic-run-v1", classification: "symbolic_lens", causalUse: false, status, frozenAt: now, assessedPeriod: currentSymbolicPeriod(now), preferenceRevision: 1, frame: null, provenance: null };
}
