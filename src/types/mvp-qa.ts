export type QaItemStatus = "ready" | "manual" | "blocked";

export type QaPhaseId =
  | "local_runtime"
  | "supabase_environment"
  | "rls_boundary"
  | "route_acceptance"
  | "release_blocks";

export type QaChecklistItem = {
  id: string;
  status: QaItemStatus;
  command?: string;
  expected: string;
};

export type QaChecklistPhase = {
  id: QaPhaseId;
  items: readonly QaChecklistItem[];
};
