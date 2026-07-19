import { describe, expect, it } from "vitest";

import { createLocalRealityBoundaryRepositoryV2 } from "./local-repository";
import { realityBoundaryStorageKeyV2 } from "./repository";
import type { StorageLikeV2 } from "./repository";
import { adaptV1RealityBoundary } from "./v1-adapter";
import {
  createFixedRuntimeV2,
  fixedNowV2,
  realityIntakeV1,
  seedContextV1,
} from "./test-fixtures";

function memoryStorage() {
  const values = new Map<string, string>();
  const accessedKeys: string[] = [];
  const storage: StorageLikeV2 = {
    getItem(key) {
      accessedKeys.push(key);
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      accessedKeys.push(key);
      values.set(key, value);
    },
    removeItem(key) {
      accessedKeys.push(key);
      values.delete(key);
    },
  };
  return { values, accessedKeys, storage };
}

function draft() {
  return adaptV1RealityBoundary({
    seedContext: seedContextV1(),
    realityIntake: realityIntakeV1(),
    runtime: createFixedRuntimeV2(),
  });
}

describe("Local Reality Boundary repository V2", () => {
  it("uses only the V2 reality-boundary storage namespace", async () => {
    const memory = memoryStorage();
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memory.storage,
      clock: () => fixedNowV2,
    });

    await repository.save({ draft: draft(), expectedRevision: 0 });
    await repository.load("seed_stage_2_adapter");
    await repository.clear("seed_stage_2_adapter");

    expect(memory.accessedKeys.length).toBeGreaterThan(0);
    expect(
      memory.accessedKeys.every((key) =>
        key.startsWith("astraloom.v2.reality-boundary."),
      ),
    ).toBe(true);
  });

  it("returns deep copies from save and load", async () => {
    const memory = memoryStorage();
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memory.storage,
      clock: () => fixedNowV2,
    });
    const input = draft();
    const saved = await repository.save({ draft: input, expectedRevision: 0 });
    expect(saved.ok).toBe(true);
    if (!saved.ok) throw new Error(saved.errorCode);

    saved.data.evidenceLedger.items[0]!.statement = "mutated returned value";
    input.evidenceLedger.items[0]!.statement = "mutated input";
    const loaded = await repository.load(input.seedContextId);

    expect(loaded.ok).toBe(true);
    if (!loaded.ok || !loaded.data) throw new Error("load_failed");
    expect(loaded.data.evidenceLedger.items[0]!.statement).not.toContain(
      "mutated",
    );
  });

  it("increments revision monotonically across valid writes", async () => {
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memoryStorage().storage,
      clock: () => fixedNowV2,
    });
    const first = await repository.save({ draft: draft(), expectedRevision: 0 });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.errorCode);

    const second = await repository.save({
      draft: first.data,
      expectedRevision: 1,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error(second.errorCode);

    expect(first.data.revision).toBe(1);
    expect(first.data.evidenceLedger.revision).toBe(1);
    expect(first.data.assumptionLedger.revision).toBe(1);
    expect(second.data.revision).toBe(2);
  });

  it("rejects stale expectedRevision with a stable error code", async () => {
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memoryStorage().storage,
      clock: () => fixedNowV2,
    });
    await repository.save({ draft: draft(), expectedRevision: 0 });

    const stale = await repository.save({ draft: draft(), expectedRevision: 0 });

    expect(stale).toMatchObject({ ok: false, errorCode: "stale_revision" });
  });

  it("returns a stable failure for corrupted JSON", async () => {
    const memory = memoryStorage();
    memory.values.set(realityBoundaryStorageKeyV2("seed_stage_2_adapter"), "{");
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memory.storage,
      clock: () => fixedNowV2,
    });

    await expect(repository.load("seed_stage_2_adapter")).resolves.toMatchObject({
      ok: false,
      errorCode: "corrupt_storage",
    });
  });

  it("clears only the requested seed draft", async () => {
    const memory = memoryStorage();
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memory.storage,
      clock: () => fixedNowV2,
    });
    const firstDraft = draft();
    const secondDraft = draft();
    secondDraft.seedContextId = "seed_other";
    secondDraft.evidenceLedger.seedContextId = "seed_other";
    secondDraft.assumptionLedger.seedContextId = "seed_other";
    await repository.save({ draft: firstDraft, expectedRevision: 0 });
    await repository.save({ draft: secondDraft, expectedRevision: 0 });

    await repository.clear(firstDraft.seedContextId);

    expect(await repository.load(firstDraft.seedContextId)).toMatchObject({
      ok: true,
      data: null,
    });
    expect(await repository.load(secondDraft.seedContextId)).toMatchObject({
      ok: true,
      data: expect.any(Object),
    });
  });

  it("rejects broken evidence references before saving", async () => {
    const memory = memoryStorage();
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memory.storage,
      clock: () => fixedNowV2,
    });
    const invalid = draft();
    invalid.assumptionLedger.assumptions[0]!.supportingRealEvidenceIds = [
      "real_evidence_v2_missing",
    ];

    const result = await repository.save({
      draft: invalid,
      expectedRevision: 0,
    });

    expect(result).toMatchObject({
      ok: false,
      errorCode: "invalid_reality_boundary",
    });
    expect(memory.values.size).toBe(0);
  });

  it("rejects illegal real-evidence ids before saving", async () => {
    const memory = memoryStorage();
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memory.storage,
      clock: () => fixedNowV2,
    });
    const invalid = draft();
    invalid.evidenceLedger.items[0]!.id = "event_v1_internal";

    const result = await repository.save({
      draft: invalid,
      expectedRevision: 0,
    });

    expect(result).toMatchObject({
      ok: false,
      errorCode: "invalid_reality_boundary",
    });
    expect(memory.values.size).toBe(0);
  });

  it("rejects mismatched boundary and ledger revisions before saving", async () => {
    const memory = memoryStorage();
    const repository = createLocalRealityBoundaryRepositoryV2({
      storage: memory.storage,
      clock: () => fixedNowV2,
    });
    const invalid = draft();
    invalid.revision = 2;
    invalid.evidenceLedger.revision = 1;
    invalid.assumptionLedger.revision = 2;

    const result = await repository.save({
      draft: invalid,
      expectedRevision: 0,
    });

    expect(result).toMatchObject({
      ok: false,
      errorCode: "invalid_reality_boundary",
    });
    expect(memory.values.size).toBe(0);
  });
});
