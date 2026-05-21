import type { KeyPeopleDraft } from "@/types/key-person";

function keyPeopleDraftKey(seedContextId: string) {
  return `mirofish.key-people.${seedContextId}`;
}

export function loadKeyPeopleDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(keyPeopleDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as KeyPeopleDraft;
  } catch {
    window.localStorage.removeItem(keyPeopleDraftKey(seedContextId));
    return null;
  }
}

export function saveKeyPeopleDraft(draft: KeyPeopleDraft) {
  window.localStorage.setItem(
    keyPeopleDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearKeyPeopleDraft(seedContextId: string) {
  window.localStorage.removeItem(keyPeopleDraftKey(seedContextId));
}
