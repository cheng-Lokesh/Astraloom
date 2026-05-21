import type { AgentEcologyDraft } from "@/types/agent-profile";

function agentEcologyDraftKey(seedContextId: string) {
  return `mirofish.agent-ecology.${seedContextId}`;
}

export function loadAgentEcologyDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(agentEcologyDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AgentEcologyDraft;
  } catch {
    window.localStorage.removeItem(agentEcologyDraftKey(seedContextId));
    return null;
  }
}

export function saveAgentEcologyDraft(draft: AgentEcologyDraft) {
  window.localStorage.setItem(
    agentEcologyDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearAgentEcologyDraft(seedContextId: string) {
  window.localStorage.removeItem(agentEcologyDraftKey(seedContextId));
}
