import type { SimulationRunDraft } from "@/types/simulation-run";

function simulationRunDraftKey(seedContextId: string) {
  return `mirofish.simulation-run.${seedContextId}`;
}

export function loadSimulationRunDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(simulationRunDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SimulationRunDraft;
  } catch {
    window.localStorage.removeItem(simulationRunDraftKey(seedContextId));
    return null;
  }
}

export function saveSimulationRunDraft(draft: SimulationRunDraft) {
  window.localStorage.setItem(
    simulationRunDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearSimulationRunDraft(seedContextId: string) {
  window.localStorage.removeItem(simulationRunDraftKey(seedContextId));
}
