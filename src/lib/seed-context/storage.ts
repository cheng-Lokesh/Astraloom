import type { SeedContextDraft } from "@/types/seed-context";

const seedContextDraftKey = "mirofish.seed-context.draft";

export function createSeedContextId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `seed_${Date.now()}`;
}

export function loadSeedContextDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(seedContextDraftKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SeedContextDraft;
  } catch {
    window.localStorage.removeItem(seedContextDraftKey);
    return null;
  }
}

export function saveSeedContextDraft(draft: SeedContextDraft) {
  window.localStorage.setItem(seedContextDraftKey, JSON.stringify(draft));
}

export function clearSeedContextDraft() {
  window.localStorage.removeItem(seedContextDraftKey);
}
