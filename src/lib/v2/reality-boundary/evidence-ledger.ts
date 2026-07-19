import type {
  EvidenceConflictV2,
  EvidenceItemInputV2,
  EvidenceItemV2,
  EvidenceLedgerV2,
  EvidenceProvenanceV2,
  RealityBoundaryRuntimeV2,
} from "./types";
import { REALITY_BOUNDARY_SCHEMA_VERSION_V2 } from "./types";
import { assertEvidenceLedgerV2 } from "./validation";

export function normalizeRealityBoundaryTextV2(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function optionalText(value: string | undefined) {
  if (value === undefined) return undefined;
  const normalized = normalizeRealityBoundaryTextV2(value);
  return normalized || undefined;
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map(normalizeRealityBoundaryTextV2).filter(Boolean)),
  );
}

function normalizeProvenance(
  provenance: EvidenceProvenanceV2[],
): EvidenceProvenanceV2[] {
  return provenance.map((entry) => ({
    sourceRef: normalizeRealityBoundaryTextV2(entry.sourceRef),
    capturedAt: normalizeRealityBoundaryTextV2(entry.capturedAt),
    occurredAt: optionalText(entry.occurredAt),
    locator: optionalText(entry.locator),
    url: optionalText(entry.url),
    title: optionalText(entry.title),
    excerpt: optionalText(entry.excerpt),
  }));
}

function provenanceIdentity(entry: EvidenceProvenanceV2) {
  return JSON.stringify([
    entry.sourceRef,
    entry.locator ?? "",
    entry.url ?? "",
    entry.title ?? "",
    entry.excerpt ?? "",
    entry.capturedAt,
    entry.occurredAt ?? "",
  ]);
}

function itemDedupKey(item: EvidenceItemInputV2) {
  const primary = item.provenance[0];
  return JSON.stringify([
    normalizeRealityBoundaryTextV2(primary?.sourceRef ?? "").toLowerCase(),
    normalizeRealityBoundaryTextV2(primary?.locator ?? "").toLowerCase(),
    normalizeRealityBoundaryTextV2(item.statement).toLowerCase(),
  ]);
}

function itemFingerprint(seedContextId: string, item: EvidenceItemInputV2) {
  const primary = item.provenance[0];
  return JSON.stringify({
    seedContextId,
    statement: normalizeRealityBoundaryTextV2(item.statement).toLowerCase(),
    claimKey: optionalText(item.claimKey)?.toLowerCase(),
    sourceRef: primary?.sourceRef.toLowerCase(),
    locator: primary?.locator?.toLowerCase(),
  });
}

function normalizeInput(item: EvidenceItemInputV2): EvidenceItemInputV2 {
  const searchSummary = item.sourceKind === "search_summary";
  return {
    id: item.id,
    statement: normalizeRealityBoundaryTextV2(item.statement),
    claimKey: optionalText(item.claimKey),
    sourceKind: item.sourceKind,
    sourceTier: searchSummary ? "unrated" : item.sourceTier,
    verificationStatus: searchSummary
      ? "unverified"
      : item.verificationStatus,
    provenance: normalizeProvenance(item.provenance),
    limitations: uniqueStrings(item.limitations),
    legacyHeuristic: item.legacyHeuristic
      ? { ...item.legacyHeuristic }
      : undefined,
  };
}

function mergeDuplicateEvidence(
  existing: EvidenceItemV2,
  duplicate: EvidenceItemInputV2,
): EvidenceItemV2 {
  const provenance = new Map(
    existing.provenance.map((entry) => [provenanceIdentity(entry), entry]),
  );
  for (const entry of duplicate.provenance) {
    provenance.set(provenanceIdentity(entry), entry);
  }

  return {
    ...existing,
    provenance: Array.from(provenance.values()),
    limitations: uniqueStrings([
      ...existing.limitations,
      ...duplicate.limitations,
    ]),
  };
}

function buildConflicts(
  items: EvidenceItemV2[],
  runtime: RealityBoundaryRuntimeV2,
  now: string,
): EvidenceConflictV2[] {
  const byClaimKey = new Map<string, EvidenceItemV2[]>();
  for (const item of items) {
    if (!item.claimKey) continue;
    const group = byClaimKey.get(item.claimKey) ?? [];
    group.push(item);
    byClaimKey.set(item.claimKey, group);
  }

  const conflicts: EvidenceConflictV2[] = [];
  for (const [claimKey, group] of byClaimKey) {
    const normalizedValues = new Set(
      group.map((item) => item.statement.toLowerCase()),
    );
    if (normalizedValues.size < 2) continue;
    const evidenceIds = group.map((item) => item.id);
    conflicts.push({
      id: runtime.idFactory(
        "evidence_conflict",
        JSON.stringify([claimKey, evidenceIds]),
      ),
      claimKey,
      evidenceIds,
      status: "unresolved",
      createdAt: now,
      updatedAt: now,
    });
  }
  return conflicts;
}

export function buildEvidenceLedgerV2({
  seedContextId,
  items: rawItems,
  runtime,
}: {
  seedContextId: string;
  items: EvidenceItemInputV2[];
  runtime: RealityBoundaryRuntimeV2;
}): EvidenceLedgerV2 {
  const now = runtime.clock();
  const itemsByDedupKey = new Map<string, EvidenceItemV2>();

  for (const rawItem of rawItems) {
    const item = normalizeInput(rawItem);
    const key = itemDedupKey(item);
    const existing = itemsByDedupKey.get(key);
    if (existing) {
      itemsByDedupKey.set(key, mergeDuplicateEvidence(existing, item));
      continue;
    }

    const firstProvenance = item.provenance[0];
    const evidence: EvidenceItemV2 = {
      ...item,
      id:
        item.id ??
        runtime.idFactory("evidence", itemFingerprint(seedContextId, item)),
      capturedAt: firstProvenance?.capturedAt ?? "",
      occurredAt: firstProvenance?.occurredAt,
      createdAt: now,
      updatedAt: now,
    };
    itemsByDedupKey.set(key, evidence);
  }

  const items = Array.from(itemsByDedupKey.values());
  const ledger: EvidenceLedgerV2 = {
    id: runtime.idFactory("evidence_ledger", seedContextId),
    seedContextId: normalizeRealityBoundaryTextV2(seedContextId),
    schemaVersion: REALITY_BOUNDARY_SCHEMA_VERSION_V2,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    items,
    conflicts: buildConflicts(items, runtime, now),
  };

  return assertEvidenceLedgerV2(ledger);
}
