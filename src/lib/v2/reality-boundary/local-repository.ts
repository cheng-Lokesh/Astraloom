import {
  realityBoundaryStorageKeyV2,
  type RealityBoundaryRepositoryResultV2,
  type RealityBoundaryRepositoryV2,
  type StorageLikeV2,
} from "./repository";
import type { RealityBoundaryDraftV2 } from "./types";
import { validateRealityBoundaryDraftV2 } from "./validation";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function success<T>(data: T): RealityBoundaryRepositoryResultV2<T> {
  return { ok: true, data, errorCode: null };
}

function failure<T>(
  errorCode: Exclude<
    RealityBoundaryRepositoryResultV2<T>,
    { ok: true }
  >["errorCode"],
  issues?: string[],
): RealityBoundaryRepositoryResultV2<T> {
  return { ok: false, data: null, errorCode, issues };
}

function parseStoredDraft(
  raw: string,
): RealityBoundaryRepositoryResultV2<RealityBoundaryDraftV2> {
  try {
    const value: unknown = JSON.parse(raw);
    const validation = validateRealityBoundaryDraftV2(value);
    if (!validation.ok) {
      return failure("corrupt_storage", validation.issues);
    }
    return success(value as RealityBoundaryDraftV2);
  } catch {
    return failure("corrupt_storage");
  }
}

export function createLocalRealityBoundaryRepositoryV2({
  storage,
  clock,
}: {
  storage: StorageLikeV2;
  clock: () => string;
}): RealityBoundaryRepositoryV2 {
  return {
    async load(seedContextId) {
      try {
        const raw = storage.getItem(realityBoundaryStorageKeyV2(seedContextId));
        if (raw === null) return success(null);
        const parsed = parseStoredDraft(raw);
        return parsed.ok ? success(clone(parsed.data)) : parsed;
      } catch {
        return failure("storage_failure");
      }
    },

    async save({ draft, expectedRevision }) {
      const candidate = clone(draft);
      const inputValidation = validateRealityBoundaryDraftV2(candidate);
      if (!inputValidation.ok) {
        return failure("invalid_reality_boundary", inputValidation.issues);
      }

      try {
        const key = realityBoundaryStorageKeyV2(candidate.seedContextId);
        const raw = storage.getItem(key);
        let existing: RealityBoundaryDraftV2 | null = null;
        if (raw !== null) {
          const parsed = parseStoredDraft(raw);
          if (!parsed.ok) return parsed;
          existing = parsed.data;
        }

        const currentRevision = existing?.revision ?? 0;
        if (
          expectedRevision !== undefined &&
          expectedRevision !== currentRevision
        ) {
          return failure("stale_revision");
        }

        const now = clock();
        const nextRevision = currentRevision + 1;
        const next: RealityBoundaryDraftV2 = {
          ...candidate,
          revision: nextRevision,
          createdAt: existing?.createdAt ?? candidate.createdAt,
          updatedAt: now,
          evidenceLedger: {
            ...candidate.evidenceLedger,
            revision: nextRevision,
            createdAt:
              existing?.evidenceLedger.createdAt ??
              candidate.evidenceLedger.createdAt,
            updatedAt: now,
          },
          assumptionLedger: {
            ...candidate.assumptionLedger,
            revision: nextRevision,
            createdAt:
              existing?.assumptionLedger.createdAt ??
              candidate.assumptionLedger.createdAt,
            updatedAt: now,
          },
        };

        const validation = validateRealityBoundaryDraftV2(next);
        if (!validation.ok) {
          return failure("invalid_reality_boundary", validation.issues);
        }
        storage.setItem(key, JSON.stringify(next));
        return success(clone(next));
      } catch {
        return failure("storage_failure");
      }
    },

    async clear(seedContextId) {
      try {
        storage.removeItem(realityBoundaryStorageKeyV2(seedContextId));
        return success(null);
      } catch {
        return failure("storage_failure");
      }
    },
  };
}
