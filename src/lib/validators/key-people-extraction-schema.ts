import { z } from "zod";

const uncertaintyFlagSchema = z.enum([
  "role_unclear",
  "identity_unclear",
  "relationship_unclear",
  "evidence_sparse",
  "safety_sensitive",
  "inferred_from_context",
]);

export const keyPeopleExtractionPersonSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  relationship_to_user: z.enum([
    "boss",
    "partner",
    "competitor",
    "coworker",
    "family",
    "friend",
    "opportunity_source",
    "advisor",
    "other",
  ]),
  role_type: z.enum([
    "authority",
    "emotional",
    "resource",
    "conflict",
    "support",
    "opportunity",
    "information",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  known_evidence: z.array(z.string().trim().min(1).max(200)).max(6),
  missing_fields: z.array(z.string().trim().min(1).max(120)).max(8),
  uncertainty_flags: z.array(uncertaintyFlagSchema).max(6).default([]),
  source_refs: z.array(z.string().trim().min(1).max(120)).max(8),
}).superRefine((person, context) => {
  if (person.confidence < 0.5 && person.uncertainty_flags.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Low-confidence people must include at least one uncertainty flag.",
      path: ["uncertainty_flags"],
    });
  }
});

export const keyPeopleExtractionSchema = z.object({
  people: z.array(keyPeopleExtractionPersonSchema).max(12),
  uncertainty_flags: z.array(uncertaintyFlagSchema).max(12).default([]),
});

export type KeyPeopleExtractionOutput = z.infer<
  typeof keyPeopleExtractionSchema
>;
