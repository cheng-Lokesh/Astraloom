import type { GroundedSocialSimulationDraft } from "@/types/grounded-social-simulation";

const groundedSocialSimulationDraftPrefix = "mirofish.grounded-social-simulation";

function key(seedContextId: string) {
  return `${groundedSocialSimulationDraftPrefix}.${seedContextId}`;
}

export function loadGroundedSocialSimulationDraft(seedContextId: string) {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(key(seedContextId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GroundedSocialSimulationDraft;
  } catch {
    window.localStorage.removeItem(key(seedContextId));
    return null;
  }
}

export function saveGroundedSocialSimulationDraft(
  draft: GroundedSocialSimulationDraft,
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key(draft.seedContextId), JSON.stringify(draft));
}

export function clearGroundedSocialSimulationDraft(seedContextId: string) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(key(seedContextId));
}
