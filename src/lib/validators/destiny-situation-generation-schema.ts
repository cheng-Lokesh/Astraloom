import { z } from "zod";

const confidenceSchema = z.number().min(0).max(1);
const nonEmptyStringSchema = z.string().trim().min(1);
const evidenceRefsSchema = z.array(nonEmptyStringSchema).min(1).max(12);

const safetyFlagSchema = z.object({
  code: z.enum([
    "self_harm",
    "violence",
    "coercion",
    "medical",
    "legal",
    "investment",
    "therapy",
    "privacy",
    "minors",
    "other",
  ]),
  severity: z.enum(["low", "medium", "high"]),
  sourceText: nonEmptyStringSchema.max(240),
});

export const situationExtractionSchema = z.object({
  situationExtraction: z.object({
    topic: z.enum([
      "career",
      "relationship",
      "family",
      "money",
      "health_context",
      "study",
      "relocation",
      "collaboration",
      "personal_direction",
      "other",
      "unknown",
    ]),
    topicConfidence: confidenceSchema,
    userQuestion: z.object({
      rawText: nonEmptyStringSchema.max(4000),
      normalizedQuestion: nonEmptyStringSchema.max(300),
      sourceText: nonEmptyStringSchema.max(400),
    }),
    keyPeople: z
      .array(
        z.object({
          id: nonEmptyStringSchema.max(80),
          displayName: nonEmptyStringSchema.max(80),
          relationshipToUser: z.enum([
            "boss",
            "partner",
            "coworker",
            "family",
            "friend",
            "client",
            "competitor",
            "institution",
            "other",
            "unknown",
          ]),
          observedRole: z.enum([
            "authority",
            "resource",
            "emotional",
            "conflict",
            "support",
            "opportunity",
            "information",
            "unknown",
          ]),
          confidence: confidenceSchema,
          sourceText: nonEmptyStringSchema.max(240),
          missingInfo: z.array(nonEmptyStringSchema.max(120)).max(8),
        }),
      )
      .max(12),
    recentEvents: z
      .array(
        z.object({
          id: nonEmptyStringSchema.max(80),
          summary: nonEmptyStringSchema.max(240),
          timeHint: z.string().trim().max(120),
          involvedPeople: z.array(nonEmptyStringSchema.max(80)).max(8),
          sourceText: nonEmptyStringSchema.max(240),
          confidence: confidenceSchema,
        }),
      )
      .max(16),
    decisionOptions: z
      .array(
        z.object({
          id: nonEmptyStringSchema.max(80),
          label: nonEmptyStringSchema.max(120),
          sourceText: nonEmptyStringSchema.max(240),
          confidence: confidenceSchema,
        }),
      )
      .max(8),
    worries: z
      .array(
        z.object({
          id: nonEmptyStringSchema.max(80),
          summary: nonEmptyStringSchema.max(200),
          sourceText: nonEmptyStringSchema.max(240),
          confidence: confidenceSchema,
        }),
      )
      .max(12),
    missingInfo: z
      .array(
        z.object({
          field: nonEmptyStringSchema.max(80),
          reason: nonEmptyStringSchema.max(200),
          severity: z.enum(["low", "medium", "high"]),
        }),
      )
      .max(12),
    safetyFlags: z.array(safetyFlagSchema).max(8),
    meta: z.object({
      extractionConfidence: confidenceSchema,
      language: z.enum(["zh", "en", "mixed", "unknown"]),
      insufficientInput: z.boolean(),
    }),
  }),
});

const mappedThemeSchema = z.object({
  id: nonEmptyStringSchema.max(80),
  destinyThemeId: nonEmptyStringSchema.max(120),
  situationAnchorId: nonEmptyStringSchema.max(120),
  themeLabel: nonEmptyStringSchema.max(80),
  realityLabel: nonEmptyStringSchema.max(80),
  narrativeDirection: z.enum(["reveal", "remind", "reframe", "flag"]),
  fusionConfidence: confidenceSchema,
  rationale: nonEmptyStringSchema.max(360),
  destinyEvidenceRefs: evidenceRefsSchema,
  situationEvidenceRefs: evidenceRefsSchema,
  safetyNotes: z.array(nonEmptyStringSchema.max(160)).max(6),
});

const unmappedThemeSchema = z.object({
  id: nonEmptyStringSchema.max(80),
  destinyThemeId: nonEmptyStringSchema.max(120),
  reason: z.enum([
    "no clear real-world anchor",
    "low confidence",
    "safety boundary",
    "insufficient extraction",
  ]),
  fusionConfidence: confidenceSchema,
  evidenceRefs: evidenceRefsSchema,
});

export const destinySituationFusionOutputSchema = z
  .object({
    fusionResult: z.object({
      mappedThemes: z.array(mappedThemeSchema).max(12),
      unmappedThemes: z.array(unmappedThemeSchema).max(16),
      unmappedSituationAnchors: z
        .array(
          z.object({
            id: nonEmptyStringSchema.max(120),
            reason: z.enum([
              "no clear destiny theme",
              "low confidence",
              "safety boundary",
              "insufficient destiny data",
            ]),
            evidenceRefs: evidenceRefsSchema,
          }),
        )
        .max(16),
      meta: z.object({
        overallFusionConfidence: confidenceSchema,
        evidenceCoverage: z.enum(["low", "medium", "high"]),
        safetyDowngraded: z.boolean(),
      }),
    }),
  })
  .superRefine((output, context) => {
    output.fusionResult.mappedThemes.forEach((theme, index) => {
      if (theme.fusionConfidence < 0.35) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Mapped themes must have fusionConfidence greater than or equal to 0.35.",
          path: ["fusionResult", "mappedThemes", index, "fusionConfidence"],
        });
      }
    });

    output.fusionResult.unmappedThemes.forEach((theme, index) => {
      if (theme.fusionConfidence >= 0.35) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unmapped themes must have fusionConfidence below 0.35.",
          path: ["fusionResult", "unmappedThemes", index, "fusionConfidence"],
        });
      }
    });
  });

const sandboxEventIdSchema = nonEmptyStringSchema.max(80);

export const sandboxEventsOutputSchema = z.object({
  sandboxEvents: z.object({
    events: z
      .array(
        z.object({
          id: sandboxEventIdSchema,
          eventType: z.enum([
            "pressure_shift",
            "information_gap",
            "role_reversal",
            "resource_constraint",
            "boundary_test",
            "option_divergence",
            "timing_window",
            "support_signal",
            "uncertainty_hold",
          ]),
          title: nonEmptyStringSchema.max(80),
          summary: nonEmptyStringSchema.max(320),
          activeThemeIds: evidenceRefsSchema,
          involvedAnchorIds: evidenceRefsSchema,
          evidenceRefs: evidenceRefsSchema,
          uncertainty: nonEmptyStringSchema.max(240),
          confidence: confidenceSchema,
          safetyNotes: z.array(nonEmptyStringSchema.max(160)).max(6),
        }),
      )
      .min(3)
      .max(5),
    eventGraph: z.object({
      sequence: z.array(sandboxEventIdSchema).min(3).max(5),
      dependencies: z
        .array(
          z.object({
            from: sandboxEventIdSchema,
            to: sandboxEventIdSchema,
            relation: z.enum([
              "enables",
              "constrains",
              "reframes",
              "competes_with",
              "clarifies",
            ]),
          }),
        )
        .max(8),
    }),
    meta: z.object({
      generationConfidence: confidenceSchema,
      evidenceCoverage: z.enum(["low", "medium", "high"]),
      safetyDowngraded: z.boolean(),
    }),
  }),
});

const strategyVariableSchema = z.object({
  label: nonEmptyStringSchema.max(120),
  evidenceEventIds: evidenceRefsSchema,
});

export const integratedFindingsOutputSchema = z.object({
  integratedFindings: z.object({
    findings: z
      .array(
        z.object({
          id: nonEmptyStringSchema.max(80),
          title: nonEmptyStringSchema.max(32),
          summary: nonEmptyStringSchema.max(420),
          evidenceEventIds: evidenceRefsSchema,
          evidenceRefs: evidenceRefsSchema,
          sourceChain: z
            .array(
              z.object({
                step: z.enum([
                  "input",
                  "extraction",
                  "destiny_climate",
                  "fusion",
                  "sandbox_event",
                ]),
                refId: nonEmptyStringSchema.max(120),
              }),
            )
            .min(1)
            .max(12),
          confidence: confidenceSchema,
          limits: z.array(nonEmptyStringSchema.max(180)).min(1).max(6),
        }),
      )
      .min(3)
      .max(3),
    strategyVariables: z.object({
      canInfluence: z.array(strategyVariableSchema).min(1).max(8),
      cannotInfluence: z.array(strategyVariableSchema).min(1).max(8),
      underObservation: z.array(strategyVariableSchema).min(1).max(8),
    }),
    evidenceSummary: z.object({
      inputRefs: evidenceRefsSchema,
      extractionRefs: evidenceRefsSchema,
      fusionRefs: evidenceRefsSchema,
      sandboxEventRefs: evidenceRefsSchema,
    }),
    meta: z.object({
      overallConfidence: confidenceSchema,
      safetyDowngraded: z.boolean(),
      noDeterministicClaims: z.literal(true),
    }),
  }),
});

export type SituationExtractionOutput = z.infer<
  typeof situationExtractionSchema
>;
export type DestinySituationFusionOutput = z.infer<
  typeof destinySituationFusionOutputSchema
>;
export type SandboxEventsOutput = z.infer<typeof sandboxEventsOutputSchema>;
export type IntegratedFindingsOutput = z.infer<
  typeof integratedFindingsOutputSchema
>;
