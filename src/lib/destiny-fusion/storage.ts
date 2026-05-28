import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";

const destinyFusionDraftPrefix = "mirofish.destiny-situation-fusion";

function destinyFusionDraftKey(seedContextId: string) {
  return `${destinyFusionDraftPrefix}.${seedContextId}`;
}

export function loadDestinySituationFusionDraft(seedContextId: string) {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(destinyFusionDraftKey(seedContextId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DestinySituationFusionDraft;
  } catch {
    window.localStorage.removeItem(destinyFusionDraftKey(seedContextId));
    return null;
  }
}

export function saveDestinySituationFusionDraft(
  draft: DestinySituationFusionDraft,
) {
  window.localStorage.setItem(
    destinyFusionDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearDestinySituationFusionDraft(seedContextId: string) {
  window.localStorage.removeItem(destinyFusionDraftKey(seedContextId));
}
