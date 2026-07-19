import type {
  RealityIntakeDraft,
  RealityIntakeExtractionPressure,
} from "@/types/reality-intake";
import type { SeedContextDraft } from "@/types/seed-context";

import { buildAssumptionLedgerV2 } from "./assumption-ledger";
import { buildEvidenceLedgerV2 } from "./evidence-ledger";
import type {
  AdaptationWarningV2,
  AssumptionInputV2,
  AssumptionSubjectTypeV2,
  EvidenceItemInputV2,
  EvidenceLedgerV2,
  RealEvidenceIdV2,
  RealityBoundaryDraftV2,
  RealityBoundaryRuntimeV2,
} from "./types";
import { REALITY_BOUNDARY_SCHEMA_VERSION_V2 } from "./types";
import { RealityBoundaryDomainErrorV2 } from "./validation";

const MAX_EVIDENCE_EXCERPT_LENGTH_V2 = 2000;

function atomicStatements(value: string | undefined) {
  if (!value?.trim()) return [];
  return (
    value.match(/[^.!?。！？；;\n]+[.!?。！？；;]?/gu) ?? [value]
  )
    .map((statement) => statement.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function legacyHeuristic(confidence: number | undefined) {
  return confidence === undefined
    ? undefined
    : {
        legacyHeuristicConfidence: confidence,
        interpretation: "non-probabilistic" as const,
      };
}

function userStatementEvidence({
  value,
  field,
  capturedAt,
}: {
  value: string | undefined;
  field: string;
  capturedAt: string;
}): EvidenceItemInputV2[] {
  return atomicStatements(value).map((statement, index) => ({
    statement,
    sourceKind: "user_statement",
    sourceTier: "unrated",
    verificationStatus: "unverified",
    provenance: [
      {
        sourceRef: `v1-seed:${field}`,
        locator: `${field}:${index}`,
        capturedAt,
      },
    ],
    limitations: [
      "Migrated from a V1 user statement; it was not independently verified.",
    ],
  }));
}

function assumptionFromText({
  value,
  category,
  subjectType = "unknown",
  epistemicStatus = "unknown",
  impactLevel = "medium",
  limitation,
  legacyConfidence,
  supportingRealEvidenceIds = [],
}: {
  value: string | undefined;
  category: string;
  subjectType?: AssumptionSubjectTypeV2;
  epistemicStatus?: "unknown" | "inferred";
  impactLevel?: "low" | "medium" | "high";
  limitation: string;
  legacyConfidence?: number;
  supportingRealEvidenceIds?: RealEvidenceIdV2[];
}): AssumptionInputV2[] {
  return atomicStatements(value).map((statement) => ({
    statement,
    subjectType,
    category,
    epistemicStatus,
    impactLevel,
    supportingRealEvidenceIds,
    contradictingRealEvidenceIds: [],
    limitations: [limitation],
    confirmationRequirement:
      subjectType === "third_party" && impactLevel === "high"
        ? "required"
        : "not_required",
    confirmationStatus:
      subjectType === "third_party" && impactLevel === "high"
        ? "pending"
        : "not_required",
    legacyHeuristic: legacyHeuristic(legacyConfidence),
  }));
}

function thirdPartyPressure(
  pressure: RealityIntakeExtractionPressure,
  thirdPartyLabels: Set<string>,
) {
  const source = pressure.sourceLabel.trim().toLowerCase();
  const target = pressure.targetLabel.trim().toLowerCase();
  if (thirdPartyLabels.has(source) || thirdPartyLabels.has(target)) return true;
  return /\b(manager|supervisor|boss|third party|private|intent|approval|approve|control|constraint|permission)\b/i.test(
    [
      pressure.sourceLabel,
      pressure.targetLabel,
      pressure.pressureType,
      pressure.explanation,
    ].join(" "),
  );
}

function addEvidenceRefAliases(
  map: Map<string, RealEvidenceIdV2[]>,
  sourceRef: string,
  evidenceId: RealEvidenceIdV2,
) {
  const aliases = new Set([sourceRef]);
  if (sourceRef.startsWith("v1-seed:")) {
    const field = sourceRef.slice("v1-seed:".length);
    aliases.add(`seed:${field}`);
    if (field === "recentEvents") aliases.add("seed:recentEventsText");
  } else if (sourceRef.startsWith("v1-manual:")) {
    const id = sourceRef.slice("v1-manual:".length);
    aliases.add(id);
    aliases.add(`manual:${id}`);
  } else if (sourceRef.startsWith("v1-external:")) {
    const id = sourceRef.slice("v1-external:".length);
    aliases.add(id);
    aliases.add(`external:${id}`);
  }
  for (const alias of aliases) {
    map.set(alias, Array.from(new Set([...(map.get(alias) ?? []), evidenceId])));
  }
}

function buildV1EvidenceRefMap(evidenceLedger: EvidenceLedgerV2) {
  const map = new Map<string, RealEvidenceIdV2[]>();
  for (const item of evidenceLedger.items) {
    for (const provenance of item.provenance) {
      addEvidenceRefAliases(map, provenance.sourceRef, item.id);
    }
  }
  return map;
}

function resolveV1EvidenceRefs({
  refs,
  field,
  refMap,
  warnings,
  warningKeys,
}: {
  refs: string[];
  field: string;
  refMap: Map<string, RealEvidenceIdV2[]>;
  warnings: AdaptationWarningV2[];
  warningKeys: Set<string>;
}) {
  const resolved = new Set<RealEvidenceIdV2>();
  for (const ref of refs) {
    const evidenceIds = refMap.get(ref.trim());
    if (evidenceIds) {
      evidenceIds.forEach((id) => resolved.add(id));
      continue;
    }
    const warningKey = `${field}:${ref}`;
    if (warningKeys.has(warningKey)) continue;
    warningKeys.add(warningKey);
    warnings.push({
      code: "v1_evidence_ref_unresolved",
      field,
      message: `V1 evidenceRef could not be resolved and was not fabricated: ${ref}`,
    });
  }
  return Array.from(resolved);
}

function excerptForAdapter({
  value,
  field,
  limitations,
  warnings,
}: {
  value: string;
  field: string;
  limitations: string[];
  warnings: AdaptationWarningV2[];
}) {
  if (value.length <= MAX_EVIDENCE_EXCERPT_LENGTH_V2) return value;
  limitations.push(
    "Excerpt was deterministically truncated to 2000 characters during V1 adaptation.",
  );
  warnings.push({
    code: "v1_evidence_excerpt_truncated",
    field,
    message: `V1 evidence excerpt exceeded 2000 characters and was truncated: ${field}`,
  });
  return value.slice(0, MAX_EVIDENCE_EXCERPT_LENGTH_V2);
}

function subjectTypeFromV1Node(nodeType: string): AssumptionSubjectTypeV2 {
  const normalized = nodeType.toLowerCase();
  if (normalized.includes("person") || normalized.includes("manager")) {
    return "third_party";
  }
  if (
    normalized.includes("company") ||
    normalized.includes("organization") ||
    normalized.includes("institution")
  ) {
    return "organization";
  }
  return "unknown";
}

function buildWarnings(
  seedContext: SeedContextDraft,
  realityIntake: RealityIntakeDraft | undefined,
) {
  const warnings: AdaptationWarningV2[] = [];
  if (seedContext.decisionOptions || seedContext.decisionOptionsText) {
    warnings.push({
      code: "v1_decision_options_excluded_from_evidence",
      field: "decisionOptions",
      message: "Decision options describe possible actions, not real-world evidence.",
    });
  }
  if (seedContext.desiredOutput || seedContext.desiredOutputText) {
    warnings.push({
      code: "v1_desired_output_excluded_from_evidence",
      field: "desiredOutput",
      message: "Desired output describes a request, not a real-world fact.",
    });
  }
  if (seedContext.destinyBirthInfo?.trim()) {
    warnings.push({
      code: "v1_destiny_input_isolated",
      field: "destinyBirthInfo",
      message: "Destiny and birth information is isolated from the V2 reality boundary.",
    });
  }
  if (!realityIntake) {
    warnings.push({
      code: "v1_reality_intake_missing_external_evidence",
      field: "realityIntake",
      message: "No V1 Reality Intake was supplied; only identifiable Seed statements were adapted.",
    });
  } else {
    warnings.push({
      code: "v1_source_authenticity_unavailable",
      field: "realityIntake",
      message: "V1 source metadata cannot establish source authenticity or a verified source tier.",
    });
    if (
      realityIntake.confidence !== undefined ||
      realityIntake.manualSources.some((source) => source.confidence !== undefined) ||
      realityIntake.externalSources.some((source) => source.confidence !== undefined) ||
      realityIntake.llmExtraction
    ) {
      warnings.push({
        code: "v1_confidence_retained_for_audit_only",
        field: "confidence",
        message: "Legacy heuristic confidence is retained only as non-probabilistic audit metadata.",
      });
    }
  }
  return warnings;
}

export function adaptV1RealityBoundary({
  seedContext,
  realityIntake,
  runtime,
}: {
  seedContext: SeedContextDraft;
  realityIntake?: RealityIntakeDraft;
  runtime: RealityBoundaryRuntimeV2;
}): RealityBoundaryDraftV2 {
  if (
    realityIntake &&
    realityIntake.seedContextId !== seedContext.id
  ) {
    throw new RealityBoundaryDomainErrorV2(
      "v1_reality_intake_seed_mismatch",
      "V1 Reality Intake seedContextId must match the Seed Context being adapted.",
    );
  }
  const now = runtime.clock();
  const fixedRuntime: RealityBoundaryRuntimeV2 = {
    clock: () => now,
    idFactory: runtime.idFactory,
  };
  const evidenceInputs: EvidenceItemInputV2[] = [
    ...userStatementEvidence({
      value: seedContext.situationSummary,
      field: "situationSummary",
      capturedAt: seedContext.updatedAt,
    }),
    ...userStatementEvidence({
      value: seedContext.recentEventsText ?? seedContext.recentEvents,
      field: "recentEvents",
      capturedAt: seedContext.updatedAt,
    }),
    ...userStatementEvidence({
      value: seedContext.keyPeopleText,
      field: "keyPeopleText",
      capturedAt: seedContext.updatedAt,
    }),
  ];
  const warnings = buildWarnings(seedContext, realityIntake);

  for (const source of realityIntake?.manualSources ?? []) {
    evidenceInputs.push(
      ...atomicStatements(source.content).map((statement, index) => {
        const limitations = [
          "User-provided material was not explicitly user-confirmed or independently verified in V1.",
        ];
        return {
          statement,
          sourceKind: "user_material" as const,
          sourceTier: "unrated" as const,
          verificationStatus: "unverified" as const,
          provenance: [
            {
              sourceRef: `v1-manual:${source.id}`,
              locator: `content:${index}`,
              title: source.title,
              excerpt: excerptForAdapter({
                value: statement,
                field: `manualSources.${source.id}.content`,
                limitations,
                warnings,
              }),
              capturedAt: source.userProvidedAt,
            },
          ],
          limitations,
          legacyHeuristic: legacyHeuristic(source.confidence),
        };
      }),
    );
  }

  for (const source of realityIntake?.externalSources ?? []) {
    const content = source.summary || source.contentSummary;
    evidenceInputs.push(
      ...atomicStatements(content).map((statement, index) => {
        const limitations = [
          ...source.limitations,
          "A V1 URL or search result does not establish source verification or tier.",
        ];
        let url = source.url;
        if (url) {
          try {
            const parsed = new URL(url);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
              throw new Error("unsupported_protocol");
            }
          } catch {
            warnings.push({
              code: "v1_evidence_url_invalid",
              field: `externalSources.${source.id}.url`,
              message: `Invalid V1 external URL was omitted: ${source.id}`,
            });
            limitations.push("An invalid V1 URL was omitted during adaptation.");
            url = undefined;
          }
        }
        return {
          statement,
          sourceKind: "search_summary" as const,
          sourceTier: "unrated" as const,
          verificationStatus: "unverified" as const,
          provenance: [
            {
              sourceRef: `v1-external:${source.id}`,
              locator: `${source.questionId}:${index}`,
              url,
              title: source.title,
              excerpt: excerptForAdapter({
                value: statement,
                field: `externalSources.${source.id}.summary`,
                limitations,
                warnings,
              }),
              capturedAt: source.retrievedAt,
            },
          ],
          limitations,
          legacyHeuristic: legacyHeuristic(source.confidence),
        };
      }),
    );
  }

  const evidenceLedger = buildEvidenceLedgerV2({
    seedContextId: seedContext.id,
    items: evidenceInputs,
    runtime: fixedRuntime,
  });
  const evidenceRefMap = buildV1EvidenceRefMap(evidenceLedger);
  const unresolvedWarningKeys = new Set<string>();

  const assumptions: AssumptionInputV2[] = [
    ...assumptionFromText({
      value: seedContext.worries,
      category: "user_worry",
      subjectType: "external_variable",
      limitation: "A stated worry is not a confirmed real-world fact.",
    }),
    ...(seedContext.missingContextHints ?? []).flatMap((value) =>
      assumptionFromText({
        value,
        category: "information_gap",
        limitation: "V1 marked this context as missing.",
      }),
    ),
    ...(realityIntake?.missingExternalInfo ?? []).flatMap((value) =>
      assumptionFromText({
        value,
        category: "information_gap",
        limitation: "V1 Reality Intake marked this external information as missing.",
      }),
    ),
  ];

  for (const source of realityIntake?.manualSources ?? []) {
    const supportingRealEvidenceIds = resolveV1EvidenceRefs({
      refs: [source.id],
      field: `manualSources.${source.id}`,
      refMap: evidenceRefMap,
      warnings,
      warningKeys: unresolvedWarningKeys,
    });
    for (const hint of [
      ...source.extractedNodeHints,
      ...source.extractedPressureHints,
    ]) {
      assumptions.push(
        ...assumptionFromText({
          value: hint,
          category: "legacy_heuristic_inference",
          epistemicStatus: "inferred",
          impactLevel: "low",
          limitation: "This was a V1 deterministic extraction hint, not a verified fact.",
          legacyConfidence: source.confidence,
          supportingRealEvidenceIds,
        }),
      );
    }
  }

  const extraction = realityIntake?.llmExtraction;
  const thirdPartyLabels = new Set(
    (extraction?.groundedRealityNodes ?? [])
      .filter((node) => subjectTypeFromV1Node(node.nodeType) === "third_party")
      .map((node) => node.label.trim().toLowerCase()),
  );
  for (const node of extraction?.groundedRealityNodes ?? []) {
    const subjectType = subjectTypeFromV1Node(node.nodeType);
    const supportingRealEvidenceIds = resolveV1EvidenceRefs({
      refs: node.evidenceRefs,
      field: `llmExtraction.groundedRealityNodes.${node.label}.evidenceRefs`,
      refMap: evidenceRefMap,
      warnings,
      warningKeys: unresolvedWarningKeys,
    });
    const statements = [
      node.roleInSituation,
      ...node.resourcesControlled,
      ...node.informationHeld,
      ...node.opportunitiesProvided,
      ...node.constraintsCreated,
    ];
    for (const statement of statements) {
      assumptions.push(
        ...assumptionFromText({
          value: statement,
          category: "llm_inference",
          subjectType,
          epistemicStatus: "inferred",
          impactLevel: subjectType === "third_party" ? "high" : "medium",
          limitation: "Generated by V1 LLM extraction and not accepted as real-world evidence.",
          legacyConfidence: node.confidence,
          supportingRealEvidenceIds,
        }),
      );
    }
  }
  for (const pressure of extraction?.groundedRealityPressures ?? []) {
    const isThirdParty = thirdPartyPressure(pressure, thirdPartyLabels);
    const supportingRealEvidenceIds = resolveV1EvidenceRefs({
      refs: pressure.evidenceRefs,
      field: `llmExtraction.groundedRealityPressures.${pressure.sourceLabel}.${pressure.targetLabel}.evidenceRefs`,
      refMap: evidenceRefMap,
      warnings,
      warningKeys: unresolvedWarningKeys,
    });
    assumptions.push(
      ...assumptionFromText({
        value: pressure.explanation,
        category: "llm_inference",
        subjectType: isThirdParty ? "third_party" : "unknown",
        epistemicStatus: "inferred",
        impactLevel: isThirdParty ? "high" : "medium",
        limitation: "Generated by V1 LLM pressure extraction and not accepted as fact.",
        legacyConfidence: pressure.confidence,
        supportingRealEvidenceIds,
      }),
    );
  }
  for (const question of extraction?.searchQuestions ?? []) {
    assumptions.push(
      ...assumptionFromText({
        value: question.question,
        category: "external_search_question",
        limitation: "An unanswered V1 search question remains an explicit unknown.",
        legacyConfidence: question.confidence,
      }),
    );
  }
  for (const missing of extraction?.missingInfo ?? []) {
    assumptions.push(
      ...assumptionFromText({
        value: `${missing.missingField}: ${missing.whyItMatters}`,
        category: "information_gap",
        limitation: "V1 LLM extraction identified this as missing information.",
      }),
    );
  }
  for (const clarification of extraction?.clarificationQuestions ?? []) {
    assumptions.push(
      ...assumptionFromText({
        value: clarification.question,
        category: "clarification_needed",
        limitation: "This V1 clarification question remains unanswered.",
      }),
    );
  }

  const assumptionLedger = buildAssumptionLedgerV2({
    seedContextId: seedContext.id,
    evidenceLedger,
    assumptions,
    runtime: fixedRuntime,
  });

  return {
    seedContextId: seedContext.id,
    schemaVersion: REALITY_BOUNDARY_SCHEMA_VERSION_V2,
    revision: 0,
    evidenceLedger,
    assumptionLedger,
    warnings,
    createdAt: now,
    updatedAt: now,
  };
}
