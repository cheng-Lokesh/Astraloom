import type { LocalDraftBundle } from "@/lib/persistence/local-drafts";
import type { PersistenceSyncState, SyncItem } from "@/types/persistence-sync";

function getStatus(
  exists: boolean,
  synced: boolean,
  blocked: boolean,
): SyncItem["status"] {
  if (!exists) {
    return "missing";
  }

  if (blocked) {
    return "blocked";
  }

  return synced ? "synced" : "local_only";
}

export function buildPersistencePlan(
  bundle: LocalDraftBundle,
  syncState: PersistenceSyncState,
) {
  const keyPeopleCount = bundle.keyPeople?.people.length ?? 0;
  const feedbackCount = bundle.feedback?.feedback.length ?? 0;
  const supportTicketCount = bundle.billing?.tickets.length ?? 0;
  const syncedFeedbackCount = Object.keys(syncState.remoteFeedbackIds).length;
  const syncedSupportCount = Object.keys(syncState.remoteSupportTicketIds).length;
  const remoteSeedExists = Boolean(syncState.remoteSeedContextId);

  return [
    {
      id: "seed_context",
      capability: "client_writable",
      status: getStatus(Boolean(bundle.seedContext), remoteSeedExists, false),
      localCount: bundle.seedContext ? 1 : 0,
      remoteCount: remoteSeedExists ? 1 : 0,
      detail:
        "User-authored seed context can be written through the browser under current RLS.",
    },
    {
      id: "key_people",
      capability: "client_writable",
      status: getStatus(
        keyPeopleCount > 0,
        remoteSeedExists && keyPeopleCount > 0,
        false,
      ),
      localCount: keyPeopleCount,
      remoteCount: remoteSeedExists ? keyPeopleCount : 0,
      detail:
        "Confirmed/candidate people can be written after the seed context has a remote id.",
    },
    {
      id: "agent_ecology",
      capability: bundle.agentEcology ? "server_required" : "missing",
      status: getStatus(Boolean(bundle.agentEcology), false, true),
      localCount: bundle.agentEcology?.agents.length ?? 0,
      remoteCount: 0,
      detail:
        "Agent profiles are system-owned and need a server-side writer under current RLS.",
    },
    {
      id: "simulation_run",
      capability: bundle.simulationRun ? "server_required" : "missing",
      status: getStatus(Boolean(bundle.simulationRun), false, true),
      localCount: bundle.simulationRun ? 1 : 0,
      remoteCount: 0,
      detail:
        "Simulation runs and events are generated artifacts and are read-only to the browser.",
    },
    {
      id: "safety_review",
      capability: bundle.safetyReview ? "server_required" : "missing",
      status: getStatus(Boolean(bundle.safetyReview), false, true),
      localCount: bundle.safetyReview ? 1 : 0,
      remoteCount: 0,
      detail:
        "Safety review has no dedicated table yet; it should be persisted by a server workflow.",
    },
    {
      id: "report",
      capability: bundle.report ? "server_required" : "missing",
      status: getStatus(Boolean(bundle.report), false, true),
      localCount: bundle.report ? 1 : 0,
      remoteCount: 0,
      detail:
        "Reports and claims are read-only to users and should be created by the backend.",
    },
    {
      id: "feedback_log",
      capability: "client_writable",
      status: getStatus(
        feedbackCount > 0,
        feedbackCount > 0 && syncedFeedbackCount >= feedbackCount,
        false,
      ),
      localCount: feedbackCount,
      remoteCount: Math.min(syncedFeedbackCount, feedbackCount),
      detail:
        "Feedback calibration is user-authored and can be saved without changing claims or evidence.",
    },
    {
      id: "payment_entitlement",
      capability: bundle.billing ? "server_required" : "missing",
      status: getStatus(Boolean(bundle.billing), false, true),
      localCount: bundle.billing ? 1 : 0,
      remoteCount: 0,
      detail:
        "Payment entitlement must not be granted by the browser; Stripe webhooks should own it.",
    },
    {
      id: "support_tickets",
      capability: "client_writable",
      status: getStatus(
        supportTicketCount > 0,
        supportTicketCount > 0 && syncedSupportCount >= supportTicketCount,
        false,
      ),
      localCount: supportTicketCount,
      remoteCount: Math.min(syncedSupportCount, supportTicketCount),
      detail:
        "Support, refund, and deletion requests are user-authored and can be saved client-side.",
    },
  ] satisfies SyncItem[];
}
