import { z } from "zod";

import { isAssumptionIdV2, isRealEvidenceIdV2 } from "./ids";
import type {
  AssumptionLedgerV2,
  EvidenceLedgerV2,
  RealityBoundaryDraftV2,
} from "./types";

const nonEmpty = z.string().trim().min(1);
function isValidIsoTimestamp(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[9] ?? 0);
  const offsetMinute = Number(match[10] ?? 0);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysByMonth[month - 1]! &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetHour <= 23 &&
    offsetMinute <= 59 &&
    !Number.isNaN(Date.parse(value))
  );
}

const timestamp = nonEmpty.refine(isValidIsoTimestamp, {
  message: "Must be a valid ISO timestamp.",
});
const httpUrl = nonEmpty.refine((value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}, "Must be a valid http/https URL.");
const realEvidenceId = nonEmpty.refine(isRealEvidenceIdV2, {
  message: "Real evidence id must use the real_evidence_v2_ namespace.",
});
const assumptionId = nonEmpty.refine(isAssumptionIdV2, {
  message: "Assumption id must use the assumption_v2_ namespace.",
});

const legacyHeuristicSchema = z
  .object({
    legacyHeuristicConfidence: z.number().finite(),
    interpretation: z.literal("non-probabilistic"),
  })
  .strict();

const provenanceSchema = z
  .object({
    sourceRef: nonEmpty,
    capturedAt: timestamp,
    occurredAt: timestamp.optional(),
    locator: nonEmpty.optional(),
    url: httpUrl.optional(),
    title: nonEmpty.optional(),
    excerpt: nonEmpty.max(2000).optional(),
  })
  .strict();

const evidenceItemSchema = z
  .object({
    id: realEvidenceId,
    seedContextId: nonEmpty,
    statement: nonEmpty,
    claimKey: nonEmpty.optional(),
    sourceKind: z.enum([
      "user_statement",
      "user_material",
      "external_source",
      "search_summary",
      "official_record",
    ]),
    sourceTier: z.enum([
      "unrated",
      "tier_1_user_confirmed",
      "tier_1_primary_official",
      "tier_2_reputable_secondary",
      "tier_3_contextual_public",
    ]),
    verificationStatus: z.enum([
      "unverified",
      "user_confirmed",
      "source_verified",
      "disputed",
    ]),
    provenance: z.array(provenanceSchema).min(1),
    limitations: z.array(nonEmpty),
    legacyHeuristic: legacyHeuristicSchema.optional(),
    capturedAt: timestamp,
    occurredAt: timestamp.optional(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

const evidenceConflictSchema = z
  .object({
    id: z.string().regex(/^real_evidence_conflict_v2_[a-z0-9]+$/i),
    claimKey: nonEmpty,
    evidenceIds: z.array(realEvidenceId).min(2),
    status: z.enum(["unresolved", "resolved"]),
    resolutionNote: nonEmpty.optional(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict()
  .superRefine((conflict, context) => {
    if (conflict.status === "resolved" && !conflict.resolutionNote?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["resolutionNote"],
        message: "Resolved evidence conflict requires a resolutionNote.",
      });
    }
  });

export const evidenceLedgerSchemaV2 = z
  .object({
    id: z.string().regex(/^real_evidence_ledger_v2_[a-z0-9]+$/i),
    seedContextId: nonEmpty,
    schemaVersion: z.literal("2.0"),
    revision: z.number().int().nonnegative(),
    createdAt: timestamp,
    updatedAt: timestamp,
    items: z.array(evidenceItemSchema),
    conflicts: z.array(evidenceConflictSchema),
  })
  .strict();

const parameterRangeSchema = z
  .object({
    min: z.number().finite(),
    max: z.number().finite(),
    defaultValue: z.number().finite(),
    unit: nonEmpty,
  })
  .strict()
  .superRefine((range, context) => {
    if (range.min > range.max) {
      context.addIssue({
        code: "custom",
        message: "Parameter range min must be less than or equal to max.",
      });
    }
    if (range.defaultValue < range.min || range.defaultValue > range.max) {
      context.addIssue({
        code: "custom",
        message: "Parameter range defaultValue must be inside the range.",
      });
    }
  });

const assumptionSchema = z
  .object({
    id: assumptionId,
    seedContextId: nonEmpty,
    statement: nonEmpty,
    subjectType: z.enum([
      "self",
      "third_party",
      "organization",
      "external_variable",
      "unknown",
    ]),
    category: nonEmpty,
    epistemicStatus: z.enum([
      "unknown",
      "inferred",
      "disputed",
      "confirmed_for_simulation",
      "rejected",
    ]),
    impactLevel: z.enum(["low", "medium", "high"]),
    supportingRealEvidenceIds: z.array(realEvidenceId),
    contradictingRealEvidenceIds: z.array(realEvidenceId),
    limitations: z.array(nonEmpty),
    confirmationRequirement: z.enum(["required", "not_required"]),
    confirmationStatus: z.enum([
      "pending",
      "confirmed",
      "rejected",
      "not_required",
    ]),
    parameterRange: parameterRangeSchema.optional(),
    legacyHeuristic: legacyHeuristicSchema.optional(),
    legacyHeuristicHistory: z.array(legacyHeuristicSchema).optional(),
    factStatus: z.literal("not_real_world_fact"),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

export const assumptionLedgerSchemaV2 = z
  .object({
    id: z.string().regex(/^assumption_ledger_v2_[a-z0-9]+$/i),
    seedContextId: nonEmpty,
    schemaVersion: z.literal("2.0"),
    revision: z.number().int().nonnegative(),
    createdAt: timestamp,
    updatedAt: timestamp,
    assumptions: z.array(assumptionSchema),
  })
  .strict();

const warningSchema = z
  .object({
    code: nonEmpty,
    field: nonEmpty.optional(),
    message: nonEmpty,
  })
  .strict();

export const realityBoundaryDraftSchemaV2 = z
  .object({
    seedContextId: nonEmpty,
    schemaVersion: z.literal("2.0"),
    revision: z.number().int().nonnegative(),
    evidenceLedger: evidenceLedgerSchemaV2,
    assumptionLedger: assumptionLedgerSchemaV2,
    warnings: z.array(warningSchema),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

export type RealityBoundaryValidationResultV2 =
  | { ok: true; issues: [] }
  | { ok: false; issues: string[] };

export class RealityBoundaryValidationErrorV2 extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join(" "));
    this.name = "RealityBoundaryValidationErrorV2";
    this.issues = issues;
  }
}

export type RealityBoundaryDomainErrorCodeV2 =
  | "v1_reality_intake_seed_mismatch"
  | "invalid_assumption_confirmation_transition";

export class RealityBoundaryDomainErrorV2 extends Error {
  readonly code: RealityBoundaryDomainErrorCodeV2;

  constructor(code: RealityBoundaryDomainErrorCodeV2, message: string) {
    super(message);
    this.name = "RealityBoundaryDomainErrorV2";
    this.code = code;
  }
}

function zodIssues(result: z.ZodSafeParseResult<unknown>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      });
}

export function validateEvidenceLedgerV2(
  ledger: unknown,
): RealityBoundaryValidationResultV2 {
  const parsed = evidenceLedgerSchemaV2.safeParse(ledger);
  if (!parsed.success) return { ok: false, issues: zodIssues(parsed) };

  const ids = new Set(parsed.data.items.map((item) => item.id));
  const issues: string[] = [];
  if (ids.size !== parsed.data.items.length) issues.push("Evidence ids must be unique.");
  if (
    parsed.data.items.some(
      (item) => item.seedContextId !== parsed.data.seedContextId,
    )
  ) {
    issues.push("Every Evidence item must share its Ledger seedContextId.");
  }
  for (const item of parsed.data.items) {
    if (
      item.sourceKind === "search_summary" &&
      !["unrated", "tier_3_contextual_public"].includes(item.sourceTier)
    ) {
      issues.push("Search summaries may only use unrated or tier_3_contextual_public.");
    }
    if (
      item.sourceKind === "search_summary" &&
      item.verificationStatus === "source_verified"
    ) {
      issues.push("Search summaries cannot be source_verified.");
    }
    if (
      item.sourceTier === "tier_1_user_confirmed" &&
      item.verificationStatus !== "user_confirmed"
    ) {
      issues.push("tier_1_user_confirmed requires user_confirmed verification.");
    }
    if (
      item.sourceTier === "tier_1_primary_official" &&
      (item.sourceKind !== "official_record" ||
        item.verificationStatus !== "source_verified")
    ) {
      issues.push(
        "tier_1_primary_official requires an official_record with source_verified status.",
      );
    }
    if (
      item.sourceTier === "tier_2_reputable_secondary" &&
      (item.sourceKind !== "external_source" ||
        item.verificationStatus !== "source_verified")
    ) {
      issues.push(
        "tier_2_reputable_secondary requires a verified external_source.",
      );
    }
  }
  const itemsById = new Map(parsed.data.items.map((item) => [item.id, item]));
  const conflictIds = new Set(parsed.data.conflicts.map((conflict) => conflict.id));
  if (conflictIds.size !== parsed.data.conflicts.length) {
    issues.push("Evidence conflict ids must be unique.");
  }
  const conflictClaimKeys = new Set<string>();
  for (const conflict of parsed.data.conflicts) {
    if (conflict.evidenceIds.some((id) => !ids.has(id))) {
      issues.push("Evidence conflict references missing evidence.");
      continue;
    }
    if (new Set(conflict.evidenceIds).size !== conflict.evidenceIds.length) {
      issues.push("Evidence conflict must reference distinct evidence ids.");
    }
    const conflictItems = conflict.evidenceIds.map((id) => itemsById.get(id)!);
    if (conflictItems.some((item) => item.claimKey !== conflict.claimKey)) {
      issues.push("Evidence conflict claimKey must match every referenced item.");
    }
    if (
      new Set(conflictItems.map((item) => item.statement.toLowerCase())).size < 2
    ) {
      issues.push("Evidence conflict must retain different normalized values.");
    }
    const normalizedClaimKey = conflict.claimKey.trim().toLowerCase();
    if (conflictClaimKeys.has(normalizedClaimKey)) {
      issues.push("Evidence Ledger must contain at most one conflict per claimKey.");
    }
    conflictClaimKeys.add(normalizedClaimKey);
  }
  const claimGroups = new Map<string, Set<string>>();
  for (const item of parsed.data.items) {
    if (!item.claimKey) continue;
    const normalizedClaimKey = item.claimKey.trim().toLowerCase();
    const values = claimGroups.get(normalizedClaimKey) ?? new Set<string>();
    values.add(item.statement.toLowerCase());
    claimGroups.set(normalizedClaimKey, values);
  }
  for (const [claimKey, values] of claimGroups) {
    if (values.size > 1 && !conflictClaimKeys.has(claimKey)) {
      issues.push("Explicit claimKey disagreement must have a conflict record.");
    }
  }
  return issues.length ? { ok: false, issues } : { ok: true, issues: [] };
}

export function validateAssumptionLedgerV2(
  ledger: unknown,
  evidenceLedger: EvidenceLedgerV2,
): RealityBoundaryValidationResultV2 {
  const parsed = assumptionLedgerSchemaV2.safeParse(ledger);
  if (!parsed.success) return { ok: false, issues: zodIssues(parsed) };

  const evidenceIds = new Set(evidenceLedger.items.map((item) => item.id));
  const assumptionIds = new Set(parsed.data.assumptions.map((item) => item.id));
  const issues: string[] = [];
  if (assumptionIds.size !== parsed.data.assumptions.length) {
    issues.push("Assumption ids must be unique.");
  }
  if (parsed.data.seedContextId !== evidenceLedger.seedContextId) {
    issues.push("Assumption and Evidence Ledgers must share the same seedContextId.");
  }
  for (const assumption of parsed.data.assumptions) {
    if (assumption.seedContextId !== parsed.data.seedContextId) {
      issues.push("Every Assumption must share its Ledger seedContextId.");
    }
    const referenced = [
      ...assumption.supportingRealEvidenceIds,
      ...assumption.contradictingRealEvidenceIds,
    ];
    if (referenced.some((id) => !evidenceIds.has(id))) {
      issues.push("Assumption references evidence missing from the same Evidence Ledger.");
    }
    const contradicting = new Set(assumption.contradictingRealEvidenceIds);
    if (assumption.supportingRealEvidenceIds.some((id) => contradicting.has(id))) {
      issues.push("The same evidence id cannot be both supporting and contradicting.");
    }
    if (
      assumption.subjectType === "third_party" &&
      assumption.impactLevel === "high" &&
      assumption.confirmationRequirement !== "required"
    ) {
      issues.push("High-impact third-party assumptions require confirmation.");
    }
    if (
      assumption.confirmationRequirement === "required" &&
      assumption.confirmationStatus === "not_required"
    ) {
      issues.push("Required confirmation cannot have not_required status.");
    }
    if (
      assumption.confirmationRequirement === "not_required" &&
      assumption.confirmationStatus === "pending"
    ) {
      issues.push("Pending confirmation requires confirmationRequirement required.");
    }
    if (
      assumption.epistemicStatus === "confirmed_for_simulation" &&
      assumption.confirmationStatus !== "confirmed"
    ) {
      issues.push("confirmed_for_simulation requires confirmed status.");
    }
    if (
      assumption.confirmationStatus === "confirmed" &&
      assumption.epistemicStatus !== "confirmed_for_simulation"
    ) {
      issues.push("Confirmed status is simulation confirmation, not a fact promotion.");
    }
    if (
      assumption.confirmationStatus === "rejected" &&
      assumption.epistemicStatus !== "rejected"
    ) {
      issues.push("Rejected confirmation requires rejected epistemic status.");
    }
    if (
      assumption.epistemicStatus === "rejected" &&
      assumption.confirmationStatus !== "rejected"
    ) {
      issues.push("Rejected epistemic status requires rejected confirmation status.");
    }
    if (
      assumption.epistemicStatus === "disputed" &&
      assumption.confirmationStatus === "confirmed"
    ) {
      issues.push("Disputed assumptions cannot be confirmed.");
    }
  }
  return issues.length ? { ok: false, issues } : { ok: true, issues: [] };
}

export function validateRealityBoundaryDraftV2(
  draft: unknown,
): RealityBoundaryValidationResultV2 {
  const parsed = realityBoundaryDraftSchemaV2.safeParse(draft);
  if (!parsed.success) return { ok: false, issues: zodIssues(parsed) };

  const value = parsed.data as RealityBoundaryDraftV2;
  const issues: string[] = [];
  if (
    value.evidenceLedger.seedContextId !== value.seedContextId ||
    value.assumptionLedger.seedContextId !== value.seedContextId
  ) {
    issues.push("Reality Boundary ledgers must share the same seedContextId.");
  }
  if (
    value.evidenceLedger.revision !== value.revision ||
    value.assumptionLedger.revision !== value.revision
  ) {
    issues.push("Reality Boundary and ledger revisions must match.");
  }
  const evidenceResult = validateEvidenceLedgerV2(value.evidenceLedger);
  if (!evidenceResult.ok) issues.push(...evidenceResult.issues);
  const assumptionResult = validateAssumptionLedgerV2(
    value.assumptionLedger,
    value.evidenceLedger,
  );
  if (!assumptionResult.ok) issues.push(...assumptionResult.issues);
  return issues.length ? { ok: false, issues } : { ok: true, issues: [] };
}

export function assertEvidenceLedgerV2(
  ledger: EvidenceLedgerV2,
): EvidenceLedgerV2 {
  const result = validateEvidenceLedgerV2(ledger);
  if (!result.ok) throw new RealityBoundaryValidationErrorV2(result.issues);
  return ledger;
}

export function assertAssumptionLedgerV2(
  ledger: AssumptionLedgerV2,
  evidenceLedger: EvidenceLedgerV2,
): AssumptionLedgerV2 {
  const result = validateAssumptionLedgerV2(ledger, evidenceLedger);
  if (!result.ok) throw new RealityBoundaryValidationErrorV2(result.issues);
  return ledger;
}
