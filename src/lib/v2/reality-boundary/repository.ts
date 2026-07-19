import type { RealityBoundaryDraftV2 } from "./types";

export const REALITY_BOUNDARY_STORAGE_NAMESPACE_V2 =
  "astraloom.v2.reality-boundary.";

export function realityBoundaryStorageKeyV2(seedContextId: string) {
  return `${REALITY_BOUNDARY_STORAGE_NAMESPACE_V2}${encodeURIComponent(seedContextId)}`;
}

export type StorageLikeV2 = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export type RealityBoundaryRepositoryErrorCodeV2 =
  | "invalid_reality_boundary"
  | "stale_revision"
  | "corrupt_storage"
  | "storage_failure";

export type RealityBoundaryRepositoryResultV2<T> =
  | { ok: true; data: T; errorCode: null }
  | {
      ok: false;
      data: null;
      errorCode: RealityBoundaryRepositoryErrorCodeV2;
      issues?: string[];
    };

export type SaveRealityBoundaryInputV2 = {
  draft: RealityBoundaryDraftV2;
  expectedRevision?: number;
};

export type RealityBoundaryRepositoryV2 = {
  load: (
    seedContextId: string,
  ) => Promise<RealityBoundaryRepositoryResultV2<RealityBoundaryDraftV2 | null>>;
  save: (
    input: SaveRealityBoundaryInputV2,
  ) => Promise<RealityBoundaryRepositoryResultV2<RealityBoundaryDraftV2>>;
  clear: (
    seedContextId: string,
  ) => Promise<RealityBoundaryRepositoryResultV2<null>>;
};
