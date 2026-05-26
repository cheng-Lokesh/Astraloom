import type { KeyPeopleDraft } from "@/types/key-person";
import { normalizePersonDraft } from "./extract";

function keyPeopleDraftKey(seedContextId: string) {
  return `mirofish.key-people.${seedContextId}`;
}

function normalizeKeyPeopleDraft(draft: KeyPeopleDraft): KeyPeopleDraft {
  return {
    seedContextId: draft.seedContextId,
    people: (draft.people ?? []).map(normalizePersonDraft),
    updatedAt: draft.updatedAt ?? new Date().toISOString(),
  };
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
    return normalizeKeyPeopleDraft(JSON.parse(raw) as KeyPeopleDraft);
  } catch {
    window.localStorage.removeItem(keyPeopleDraftKey(seedContextId));
    return null;
  }
}

export function saveKeyPeopleDraft(draft: KeyPeopleDraft) {
  window.localStorage.setItem(
    keyPeopleDraftKey(draft.seedContextId),
    JSON.stringify(normalizeKeyPeopleDraft(draft)),
  );
}

export function clearKeyPeopleDraft(seedContextId: string) {
  window.localStorage.removeItem(keyPeopleDraftKey(seedContextId));
}
