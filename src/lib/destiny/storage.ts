import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";

const destinyProfileDraftPrefix = "mirofish.destiny-profile";
const destinyClimateDraftPrefix = "mirofish.destiny-climate";

function key(prefix: string, seedContextId: string) {
  return `${prefix}.${seedContextId}`;
}

export function loadDestinyProfileDraft(seedContextId: string) {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(key(destinyProfileDraftPrefix, seedContextId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DestinyProfileDraft;
  } catch {
    window.localStorage.removeItem(key(destinyProfileDraftPrefix, seedContextId));
    return null;
  }
}

export function saveDestinyProfileDraft(draft: DestinyProfileDraft) {
  if (!draft.seedContextId) return;

  window.localStorage.setItem(
    key(destinyProfileDraftPrefix, draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearDestinyProfileDraft(seedContextId: string) {
  window.localStorage.removeItem(key(destinyProfileDraftPrefix, seedContextId));
}

export function loadDestinyClimateDraft(seedContextId: string) {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(key(destinyClimateDraftPrefix, seedContextId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DestinyClimateDraft;
  } catch {
    window.localStorage.removeItem(key(destinyClimateDraftPrefix, seedContextId));
    return null;
  }
}

export function saveDestinyClimateDraft(draft: DestinyClimateDraft) {
  if (!draft.seedContextId) return;

  window.localStorage.setItem(
    key(destinyClimateDraftPrefix, draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearDestinyClimateDraft(seedContextId: string) {
  window.localStorage.removeItem(key(destinyClimateDraftPrefix, seedContextId));
}
