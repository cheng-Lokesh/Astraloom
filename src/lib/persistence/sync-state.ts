import type { PersistenceSyncState } from "@/types/persistence-sync";

const persistenceSyncStateKey = "mirofish.persistence-sync";

export const emptyPersistenceSyncState: PersistenceSyncState = {
  remoteSeedContextId: null,
  remoteFeedbackIds: {},
  remoteSupportTicketIds: {},
  lastSyncedAt: null,
};

export function loadPersistenceSyncState() {
  if (typeof window === "undefined") {
    return emptyPersistenceSyncState;
  }

  const raw = window.localStorage.getItem(persistenceSyncStateKey);
  if (!raw) {
    return emptyPersistenceSyncState;
  }

  try {
    return {
      ...emptyPersistenceSyncState,
      ...(JSON.parse(raw) as PersistenceSyncState),
    };
  } catch {
    window.localStorage.removeItem(persistenceSyncStateKey);
    return emptyPersistenceSyncState;
  }
}

export function savePersistenceSyncState(state: PersistenceSyncState) {
  window.localStorage.setItem(persistenceSyncStateKey, JSON.stringify(state));
}

export function clearPersistenceSyncState() {
  window.localStorage.removeItem(persistenceSyncStateKey);
}
