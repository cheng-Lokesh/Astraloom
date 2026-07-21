import { z } from "zod";

import { claimsFingerprintV2, claimsReportIdV2 } from "./ids";
import type { ClaimV2, ClaimsReportV2 } from "./types";
import {
  CLAIMS_REPORTS_ENGINE_VERSION_V2,
  REPORT_POLICY_VERSION_V2,
  REPORT_SCHEMA_VERSION_V2,
} from "./types";
import { claimSchemaV2, parseValidatedClaimV2 } from "./validation";

const reportSpecId = z.string().regex(/^claims_report_spec_v2_[a-z0-9][a-z0-9_-]*$/);
const claimId = z.string().regex(/^claim_v2_[a-z0-9][a-z0-9_-]*$/);
const inputSchema = z.object({
  reportSpecId,
  seedContextId: z.string().trim().min(1).max(1000),
  claims: z.array(z.unknown()).min(1).max(1000),
  claimIds: z.array(claimId).min(1).max(1000),
}).strict();
const sectionSchema = z.object({
  claimId,
  statement: z.string().min(1),
  realEvidenceIds: z.array(z.string().regex(/^real_evidence_v2_[a-z0-9][a-z0-9_-]*$/)).min(1),
  simulationEventIds: z.array(z.string().regex(/^world_event_v2_[a-z0-9][a-z0-9_-]*$/)).min(1),
  assumptionIds: z.array(z.string().regex(/^assumption_v2_[a-z0-9][a-z0-9_-]*$/)),
  uncertaintyStatement: z.string().min(1),
  claim: claimSchemaV2,
}).strict();
const reportSchema = z.object({
  id: z.string().regex(/^claims_report_v2_[a-z0-9][a-z0-9_-]*$/),
  reportSpecId,
  seedContextId: z.string().trim().min(1).max(1000),
  title: z.literal("Stage 6 Claims Report"),
  metricLabel: z.literal("simulation frequency and deterministic differences"),
  claimIds: z.array(claimId).min(1).max(1000),
  sections: z.array(sectionSchema).min(1).max(1000),
  sampleCount: z.number().int().positive(),
  claimsReportsEngineVersion: z.literal(CLAIMS_REPORTS_ENGINE_VERSION_V2),
  reportSchemaVersion: z.literal(REPORT_SCHEMA_VERSION_V2),
  reportPolicyVersion: z.literal(REPORT_POLICY_VERSION_V2),
  uncertaintyStatements: z.array(z.string().min(1)).min(1),
  reportIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();

function canonicalClaims(input: unknown[]) {
  const claims: ClaimV2[] = [];
  for (const item of input) {
    const parsed = parseValidatedClaimV2(item);
    if (!parsed.ok) return parsed;
    claims.push(parsed.claim);
  }
  if (new Set(claims.map((item) => item.id)).size !== claims.length) return { ok: false as const, errorCode: "duplicate_id" as const };
  return { ok: true as const, claims: claims.sort((left, right) => left.id.localeCompare(right.id)) };
}

export function buildClaimsReportV2(input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_report_input" as const };
  if (new Set(parsed.data.claimIds).size !== parsed.data.claimIds.length) return { ok: false as const, errorCode: "duplicate_id" as const };
  const validated = canonicalClaims(parsed.data.claims);
  if (!validated.ok) return validated;
  const byId = new Map<string, ClaimV2>(validated.claims.map((item) => [item.id, item]));
  const ids = [...parsed.data.claimIds].sort();
  if (ids.some((id) => !byId.has(id))) return { ok: false as const, errorCode: "unknown_claim_reference" as const };
  const selected = ids.map((id) => byId.get(id)!);
  if (selected.some((claim) => claim.seedContextId !== parsed.data.seedContextId)) return { ok: false as const, errorCode: "cross_seed_reference" as const };
  if (new Set(selected.map((claim) => claim.sampleCount)).size !== 1) return { ok: false as const, errorCode: "invalid_report_input" as const };
  const unsigned: Omit<ClaimsReportV2, "id" | "reportIntegritySignature"> = {
    reportSpecId: parsed.data.reportSpecId as ClaimsReportV2["reportSpecId"],
    seedContextId: parsed.data.seedContextId,
    title: "Stage 6 Claims Report",
    metricLabel: "simulation frequency and deterministic differences",
    claimIds: ids as ClaimsReportV2["claimIds"],
    sections: selected.map((claim) => ({
      claimId: claim.id,
      statement: claim.statement,
      realEvidenceIds: [...claim.realEvidenceIds],
      simulationEventIds: [...claim.simulationEventIds],
      assumptionIds: [...claim.assumptionIds],
      uncertaintyStatement: claim.uncertaintyStatement,
      claim: structuredClone(claim),
    })),
    sampleCount: selected[0]!.sampleCount,
    claimsReportsEngineVersion: CLAIMS_REPORTS_ENGINE_VERSION_V2,
    reportSchemaVersion: REPORT_SCHEMA_VERSION_V2,
    reportPolicyVersion: REPORT_POLICY_VERSION_V2,
    uncertaintyStatements: [...new Set(selected.map((claim) => claim.uncertaintyStatement))].sort(),
  };
  const report: ClaimsReportV2 = {
    id: claimsReportIdV2(unsigned),
    ...unsigned,
    reportIntegritySignature: claimsFingerprintV2(unsigned),
  };
  return { ok: true as const, report };
}

export function validateClaimsReportV2(reportInput: unknown, claimsInput: unknown) {
  const parsed = reportSchema.safeParse(reportInput);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_report_input" as const };
  if (!Array.isArray(claimsInput)) return { ok: false as const, errorCode: "invalid_report_input" as const };
  const built = buildClaimsReportV2({
    reportSpecId: parsed.data.reportSpecId,
    seedContextId: parsed.data.seedContextId,
    claims: claimsInput,
    claimIds: parsed.data.claimIds,
  });
  if (!built.ok) return built;
  if (JSON.stringify(built.report) !== JSON.stringify(reportInput)) return { ok: false as const, errorCode: "report_claim_escalation" as const };
  return { ok: true as const };
}
