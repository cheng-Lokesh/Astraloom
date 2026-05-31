import type { RealityIntakeDraft } from "@/types/reality-intake";

const realityIntakeDraftPrefix = "mirofish.reality-intake";

function key(seedContextId: string) {
  return `${realityIntakeDraftPrefix}.${seedContextId}`;
}

export function loadRealityIntakeDraft(seedContextId: string) {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(key(seedContextId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RealityIntakeDraft;
  } catch {
    window.localStorage.removeItem(key(seedContextId));
    return null;
  }
}

export function saveRealityIntakeDraft(draft: RealityIntakeDraft) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key(draft.seedContextId), JSON.stringify(draft));
}

export function clearRealityIntakeDraft(seedContextId: string) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(key(seedContextId));
}
