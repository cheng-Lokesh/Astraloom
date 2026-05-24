export type SyncCapability = "client_writable" | "server_required" | "missing";

export type SyncItemStatus =
  | "local_only"
  | "synced"
  | "blocked"
  | "missing"
  | "error";

export type SyncItemId =
  | "seed_context"
  | "key_people"
  | "agent_ecology"
  | "simulation_run"
  | "safety_review"
  | "report"
  | "feedback_log"
  | "payment_entitlement"
  | "support_tickets";

export type SyncItem = {
  id: SyncItemId;
  capability: SyncCapability;
  status: SyncItemStatus;
  localCount: number;
  remoteCount: number;
  detail: string;
};

export type PersistenceSyncState = {
  remoteSeedContextId: string | null;
  remoteFeedbackIds: Record<string, string>;
  remoteSupportTicketIds: Record<string, string>;
  lastSyncedAt: string | null;
};

export type PersistenceSyncResult = {
  ok: boolean;
  message: string;
  state: PersistenceSyncState;
};

export type RemoteBoundaryCategory = "client_writable" | "server_owned";

export type RemoteBoundaryCheck = {
  tableName: string;
  category: RemoteBoundaryCategory;
  count: number;
  ok: boolean;
  detail: string;
};

export type RemoteBoundaryVerification = {
  checkedAt: string;
  checks: RemoteBoundaryCheck[];
};
