import { z } from "zod";

import { listRealityProfileEntries, realityProfileDraftSchema, type RealityProfileDraft } from "./profile";

export const REALITY_PROFILE_CONTINUATION_VERSION = "reality-profile-continuation-v1" as const;

// A continuation is a complete new revision-zero draft, never a partial patch.
const reviewedProfileSchema = realityProfileDraftSchema.extend({
  revision: z.literal(0),
  lifeModelDomains: realityProfileDraftSchema.shape.lifeModelDomains.unwrap(),
  worldInputs: realityProfileDraftSchema.shape.worldInputs.unwrap(),
});

export function listRealityContinuationReviewKeys(profile: RealityProfileDraft): string[] {
  const draft = realityProfileDraftSchema.parse(profile);
  return [
    ...listRealityProfileEntries(draft).map(entry => entry.key),
    ...draft.worldInputs.resources.map((_, index) => `worldInputs.resources.${index + 1}`),
    ...draft.worldInputs.constraints.map((_, index) => `worldInputs.constraints.${index + 1}`),
  ];
}

export function listRealityContinuationRateKeys(profile: RealityProfileDraft): string[] {
  const draft = realityProfileDraftSchema.parse(profile);
  return draft.worldInputs.resources.flatMap((resource, index) => resource.usePerTick === null ? [] : [`worldInputs.resources.${index + 1}`]);
}

export function listExpiredRealityContinuationConstraintKeys(profile: RealityProfileDraft, assessedAt: string): string[] {
  const draft = realityProfileDraftSchema.parse(profile);
  const now = Date.parse(z.iso.datetime({ offset: true }).parse(assessedAt));
  return draft.worldInputs.constraints.flatMap((constraint, index) => Date.parse(constraint.rule.value) <= now ? [`worldInputs.constraints.${index + 1}`] : []);
}

export function prepareRealityProfileContinuation(profile: RealityProfileDraft): RealityProfileDraft {
  const draft = realityProfileDraftSchema.parse(profile);
  return { ...draft, revision: 0, worldInputs: { ...draft.worldInputs, resources: draft.worldInputs.resources.map(resource => ({ ...resource, usePerTick: null })) } };
}

function sameExactSet(actual: string[], expected: string[]) {
  const values = new Set(actual);
  return values.size === actual.length && actual.length === expected.length && expected.every(key => values.has(key));
}

export const realityProfileContinuationSchema = z.object({
  version: z.literal(REALITY_PROFILE_CONTINUATION_VERSION),
  sourceSeedContextId: z.string().uuid(),
  sourceRevision: z.number().int().positive().max(2_147_483_647),
  reviewedProfile: reviewedProfileSchema,
  reviewedKeys: z.array(z.string().min(1).max(100)).max(128),
  confirmedRateKeys: z.array(z.string().min(1).max(100)).max(8),
  confirmedForNewSituation: z.literal(true),
}).strict().superRefine((input, context) => {
  if (!reviewedProfileSchema.safeParse(input.reviewedProfile).success) return;
  if (!sameExactSet(input.reviewedKeys, listRealityContinuationReviewKeys(input.reviewedProfile))) {
    context.addIssue({ code: "custom", path: ["reviewedKeys"], message: "Review every current profile entry, resource and constraint exactly once." });
  }
  if (!sameExactSet(input.confirmedRateKeys, listRealityContinuationRateKeys(input.reviewedProfile))) {
    context.addIssue({ code: "custom", path: ["confirmedRateKeys"], message: "Confirm every declared per-tick rate independently and exactly once." });
  }
});

export const preparedRealityProfileContinuationSchema = z.object({
  version: z.literal(REALITY_PROFILE_CONTINUATION_VERSION),
  sourceSeedContextId: z.string().uuid(),
  sourceRevision: z.number().int().positive().max(2_147_483_647),
  preparedAt: z.iso.datetime({ offset: true }),
  profile: reviewedProfileSchema,
  expiredConstraintKeys: z.array(z.string().min(1).max(100)).max(8),
}).strict().superRefine((input, context) => {
  if (!reviewedProfileSchema.safeParse(input.profile).success || !z.iso.datetime({ offset: true }).safeParse(input.preparedAt).success) return;
  if (listRealityContinuationRateKeys(input.profile).length || !sameExactSet(input.expiredConstraintKeys, listExpiredRealityContinuationConstraintKeys(input.profile, input.preparedAt))) {
    context.addIssue({ code: "custom", message: "Prepared rates must be cleared and expired deadlines must be identified exactly." });
  }
});

export const realityProfileContinuationReceiptSchema = z.object({
  version: z.literal(REALITY_PROFILE_CONTINUATION_VERSION),
  profileRevision: z.literal(1),
}).strict();

export type RealityProfileContinuation = z.infer<typeof realityProfileContinuationSchema>;
export type PreparedRealityProfileContinuation = z.infer<typeof preparedRealityProfileContinuationSchema>;
