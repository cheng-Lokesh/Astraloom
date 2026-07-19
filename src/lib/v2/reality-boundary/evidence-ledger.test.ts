import { describe, expect, it } from "vitest";

import { buildEvidenceLedgerV2 } from "./evidence-ledger";
import { evidenceInputV2, createFixedRuntimeV2 } from "./test-fixtures";
import { validateEvidenceLedgerV2 } from "./validation";
import type { RealEvidenceIdV2 } from "./types";

describe("Real-world Evidence Ledger V2", () => {
  it("creates namespaced deterministic real-evidence ids", () => {
    const first = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [evidenceInputV2()],
      runtime: createFixedRuntimeV2(),
    });
    const second = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [evidenceInputV2()],
      runtime: createFixedRuntimeV2(),
    });

    expect(first.id).toMatch(/^real_evidence_ledger_v2_/);
    expect(first.items[0]?.id).toMatch(/^real_evidence_v2_/);
    expect(second).toEqual(first);
  });

  it.each(["event_123", "simulation_event_123", "sim_event_123"])(
    "rejects simulation or V1 Event id %s",
    (id) => {
      expect(() =>
        buildEvidenceLedgerV2({
          seedContextId: "seed_evidence",
          items: [evidenceInputV2({ id: id as RealEvidenceIdV2 })],
          runtime: createFixedRuntimeV2(),
        }),
      ).toThrow(/real_evidence_v2_/);
    },
  );

  it("requires non-empty provenance", () => {
    expect(() =>
      buildEvidenceLedgerV2({
        seedContextId: "seed_evidence",
        items: [evidenceInputV2({ provenance: [] })],
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrow(/provenance/i);
  });

  it("deduplicates only same-source, same-locator, normalized statements", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [
        evidenceInputV2(),
        evidenceInputV2({
          statement: "  The written   offer expires on Friday.  ",
          provenance: [
            {
              sourceRef: "seed:situationSummary",
              locator: "situationSummary:0",
              excerpt: "Offer expires Friday.",
              capturedAt: "2026-07-19T09:01:00.000Z",
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });

    expect(ledger.items).toHaveLength(1);
    expect(ledger.items[0]?.provenance).toHaveLength(2);
  });

  it("keeps matching statements from different sources as independent evidence", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [
        evidenceInputV2(),
        evidenceInputV2({
          provenance: [
            {
              sourceRef: "external:offer_pdf",
              locator: "page:1",
              capturedAt: "2026-07-19T09:02:00.000Z",
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });

    expect(ledger.items).toHaveLength(2);
  });

  it("retains both sides and creates an unresolved conflict for explicit claimKey", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [
        evidenceInputV2({ statement: "The offer expires on Friday." }),
        evidenceInputV2({
          statement: "The offer expires on Monday.",
          provenance: [
            {
              sourceRef: "external:offer_email",
              locator: "message:latest",
              capturedAt: "2026-07-19T09:03:00.000Z",
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });

    expect(ledger.items).toHaveLength(2);
    expect(ledger.conflicts).toHaveLength(1);
    expect(ledger.conflicts[0]).toMatchObject({
      claimKey: "offer.expiry",
      status: "unresolved",
    });
    expect(ledger.conflicts[0]?.evidenceIds).toHaveLength(2);
  });

  it("normalizes claimKey casing before conflict detection", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [
        evidenceInputV2({ claimKey: " Offer.Expiry " }),
        evidenceInputV2({
          claimKey: "offer.expiry",
          statement: "The offer expires on Monday.",
          provenance: [
            {
              sourceRef: "external:offer_email",
              locator: "message:latest",
              capturedAt: fixedTime(),
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });

    expect(ledger.conflicts).toHaveLength(1);
    expect(ledger.conflicts[0]?.claimKey).toBe("offer.expiry");
  });

  it("does not guess a semantic conflict without claimKey", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [
        evidenceInputV2({ claimKey: undefined }),
        evidenceInputV2({
          claimKey: undefined,
          statement: "The written offer does not expire on Friday.",
          provenance: [
            {
              sourceRef: "external:email",
              locator: "message:1",
              capturedAt: "2026-07-19T09:04:00.000Z",
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });

    expect(ledger.conflicts).toEqual([]);
  });

  it("does not treat a URL as verification or source-tier promotion", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [
        evidenceInputV2({
          sourceKind: "search_summary",
          provenance: [
            {
              sourceRef: "search:1",
              url: "https://example.com/result",
              locator: "result:1",
              capturedAt: fixedTime(),
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });

    expect(ledger.items[0]).toMatchObject({
      sourceTier: "unrated",
      verificationStatus: "unverified",
    });
  });

  it("does not produce numeric probability or likelihood fields", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [evidenceInputV2()],
      runtime: createFixedRuntimeV2(),
    });
    const serialized = JSON.stringify(ledger);

    expect(serialized).not.toContain("probability");
    expect(serialized).not.toContain("likelihood");
  });

  it.each([
    { field: "capturedAt", value: "not-a-date" },
    { field: "occurredAt", value: "2026-99-99" },
    { field: "capturedAt", value: "2026-02-30T09:00:00.000Z" },
  ])("rejects a non-ISO provenance $field", ({ field, value }) => {
    expect(() =>
      buildEvidenceLedgerV2({
        seedContextId: "seed_evidence",
        items: [
          evidenceInputV2({
            provenance: [
              {
                sourceRef: "seed:situationSummary",
                locator: "situationSummary:0",
                capturedAt: fixedTime(),
                [field]: value,
              },
            ],
          }),
        ],
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrow(/date|time|ISO/i);
  });

  it.each(["ftp://example.com/file", "not a url", "javascript:alert(1)"])(
    "rejects invalid or non-http URL %s",
    (url) => {
      expect(() =>
        buildEvidenceLedgerV2({
          seedContextId: "seed_evidence",
          items: [
            evidenceInputV2({
              provenance: [
                {
                  sourceRef: "external:1",
                  locator: "result:1",
                  capturedAt: fixedTime(),
                  url,
                },
              ],
            }),
          ],
          runtime: createFixedRuntimeV2(),
        }),
      ).toThrow(/url/i);
    },
  );

  it("rejects excerpts longer than 2000 characters", () => {
    expect(() =>
      buildEvidenceLedgerV2({
        seedContextId: "seed_evidence",
        items: [
          evidenceInputV2({
            provenance: [
              {
                sourceRef: "manual:long",
                locator: "content:0",
                capturedAt: fixedTime(),
                excerpt: "x".repeat(2001),
              },
            ],
          }),
        ],
        runtime: createFixedRuntimeV2(),
      }),
    ).toThrow(/excerpt/i);
  });

  it.each([
    {
      name: "verified search summary",
      sourceKind: "search_summary" as const,
      sourceTier: "tier_3_contextual_public" as const,
      verificationStatus: "source_verified" as const,
    },
    {
      name: "user-confirmed tier without matching verification",
      sourceKind: "user_statement" as const,
      sourceTier: "tier_1_user_confirmed" as const,
      verificationStatus: "unverified" as const,
    },
    {
      name: "primary official tier from an external source",
      sourceKind: "external_source" as const,
      sourceTier: "tier_1_primary_official" as const,
      verificationStatus: "source_verified" as const,
    },
    {
      name: "secondary tier from unverifiable material",
      sourceKind: "user_material" as const,
      sourceTier: "tier_2_reputable_secondary" as const,
      verificationStatus: "source_verified" as const,
    },
  ])("rejects invalid source integrity: $name", (invalidSource) => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [evidenceInputV2()],
      runtime: createFixedRuntimeV2(),
    });
    Object.assign(ledger.items[0]!, invalidSource);

    expect(validateEvidenceLedgerV2(ledger)).toMatchObject({ ok: false });
  });

  it("requires a resolution note for a resolved evidence conflict", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [
        evidenceInputV2({ statement: "The offer expires on Friday." }),
        evidenceInputV2({
          statement: "The offer expires on Monday.",
          provenance: [
            {
              sourceRef: "external:offer_email",
              locator: "message:latest",
              capturedAt: fixedTime(),
            },
          ],
        }),
      ],
      runtime: createFixedRuntimeV2(),
    });
    ledger.conflicts[0]!.status = "resolved";

    expect(validateEvidenceLedgerV2(ledger)).toMatchObject({ ok: false });
  });

  it("rejects evidence whose seed ownership differs from its ledger", () => {
    const ledger = buildEvidenceLedgerV2({
      seedContextId: "seed_evidence",
      items: [evidenceInputV2()],
      runtime: createFixedRuntimeV2(),
    });
    ledger.items[0]!.seedContextId = "seed_other";

    expect(validateEvidenceLedgerV2(ledger)).toMatchObject({ ok: false });
  });
});

function fixedTime() {
  return "2026-07-19T09:00:00.000Z";
}
