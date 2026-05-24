import type { RelationGraphDraft } from "@/types/relation-edge";

function relationGraphDraftKey(seedContextId: string) {
  return `mirofish.relation-graph.${seedContextId}`;
}

export function loadRelationGraphDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(relationGraphDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RelationGraphDraft;
  } catch {
    window.localStorage.removeItem(relationGraphDraftKey(seedContextId));
    return null;
  }
}

export function saveRelationGraphDraft(draft: RelationGraphDraft) {
  window.localStorage.setItem(
    relationGraphDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearRelationGraphDraft(seedContextId: string) {
  window.localStorage.removeItem(relationGraphDraftKey(seedContextId));
}

