import { describe, expect, it } from "vitest";

import { buildClaimLedgerDraft } from "./build";
import { buildV1CoreChain } from "@/test/v1-fixtures";

describe("Claim builder V1 baseline", () => {
  it("builds claims only after events and references existing internal Event ids", () => {
    const { seedContext, simulationRun } = buildV1CoreChain();
    expect(simulationRun.events.length).toBeGreaterThan(0);

    const ledger = buildClaimLedgerDraft(seedContext.id, simulationRun);
    const eventIds = new Set(simulationRun.events.map((event) => event.id));

    expect(ledger.claims.length).toBeGreaterThan(0);
    expect(
      ledger.claims.every(
        (claim) =>
          claim.evidenceEventIds.length > 0 &&
          claim.evidenceEventIds.every((eventId) => eventIds.has(eventId)),
      ),
    ).toBe(true);
  });
});
