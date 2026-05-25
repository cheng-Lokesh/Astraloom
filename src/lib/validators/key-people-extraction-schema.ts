import { z } from "zod";

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
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  known_evidence: z.array(z.string().trim().min(1).max(240)).max(6),
  missing_fields: z.array(z.string().trim().min(1).max(120)).max(8),
  source_refs: z.array(z.string().trim().min(1).max(120)).max(8),
});

export const keyPeopleExtractionSchema = z.object({
  people: z.array(keyPeopleExtractionPersonSchema).max(12),
  uncertainty_flags: z.array(z.string().trim().min(1).max(160)).max(12),
});

export type KeyPeopleExtractionOutput = z.infer<
  typeof keyPeopleExtractionSchema
>;
