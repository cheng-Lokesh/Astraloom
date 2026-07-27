import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { LocalDraftBundle } from "@/lib/persistence/local-drafts";
import {
  loadPersistenceSyncState,
  savePersistenceSyncState,
} from "@/lib/persistence/sync-state";
import type {
  PersistenceSyncResult,
  RemoteBoundaryCategory,
  RemoteBoundaryVerification,
} from "@/types/persistence-sync";

type SeedContextRow = {
  id: string;
};

type SupportTicketRow = {
  id: string;
};

type FeedbackLogRow = {
  id: string;
};

type BoundaryTable = {
  tableName: string;
  category: RemoteBoundaryCategory;
};

const boundaryTables: BoundaryTable[] = [
  { tableName: "seed_contexts", category: "client_writable" },
  { tableName: "key_people", category: "client_writable" },
  { tableName: "feedback_log", category: "client_writable" },
  { tableName: "support_tickets", category: "client_writable" },
  { tableName: "agent_profiles", category: "server_owned" },
  { tableName: "relation_edges", category: "server_owned" },
  { tableName: "simulation_runs", category: "server_owned" },
  { tableName: "simulation_ticks", category: "server_owned" },
  { tableName: "events", category: "server_owned" },
  { tableName: "claims", category: "server_owned" },
  { tableName: "reports", category: "server_owned" },
  { tableName: "payments", category: "server_owned" },
  { tableName: "consent_events", category: "server_owned" },
];

async function upsertSeedContext(
  supabase: SupabaseClient,
  user: User,
  bundle: LocalDraftBundle,
  remoteSeedContextId: string | null,
) {
  if (!bundle.seedContext) {
    return null;
  }

  const payload = {
    user_id: user.id,
    version: "local-deterministic-v0",
    question_text: bundle.seedContext.questionText,
    track_type: bundle.seedContext.trackType,
    simulation_track: bundle.seedContext.trackType,
    time_window: bundle.seedContext.timeWindow,
    time_horizon: bundle.seedContext.timeWindow,
    user_question: bundle.seedContext.questionText,
    raw_context: bundle.seedContext.situationSummary,
    situation_summary: bundle.seedContext.situationSummary,
    key_people_text: bundle.seedContext.keyPeopleText,
    privacy_ack: bundle.seedContext.privacyAck,
    locale: bundle.seedContext.locale,
    status: bundle.seedContext.status,
    updated_at: new Date().toISOString(),
  };

  if (remoteSeedContextId) {
    const { data, error } = await supabase
      .from("seed_contexts")
      .update(payload)
      .eq("id", remoteSeedContextId)
      .eq("user_id", user.id)
      .select("id")
      .single<SeedContextRow>();

    if (!error && data?.id) {
      return data.id;
    }
  }

  const { data, error } = await supabase
    .from("seed_contexts")
    .insert(payload)
    .select("id")
    .single<SeedContextRow>();

  if (error) {
    throw error;
  }

  return data.id;
}

async function replaceKeyPeople(
  supabase: SupabaseClient,
  user: User,
  bundle: LocalDraftBundle,
  remoteSeedContextId: string | null,
) {
  if (!remoteSeedContextId || !bundle.keyPeople?.people.length) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("key_people")
    .delete()
    .eq("user_id", user.id)
    .eq("seed_context_id", remoteSeedContextId);

  if (deleteError) {
    throw deleteError;
  }

  const rows = bundle.keyPeople.people
    .filter((person) => person.status !== "deleted" && person.status !== "merged")
    .map((person) => ({
      user_id: user.id,
      seed_context_id: remoteSeedContextId,
      label: person.label,
      role: person.role,
      display_name: person.label,
      relationship_to_user: person.relationshipToUser,
      role_type: person.roleType,
      confidence: person.confidence,
      known_evidence: person.knownEvidence ? [person.knownEvidence] : [],
      missing_fields: person.missingFields,
      status: person.status,
      evidence_refs: person.evidenceRefs,
      confirmed: person.confirmed,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("key_people").insert(rows);

  if (error) {
    throw error;
  }
}

async function syncFeedbackLog(
  supabase: SupabaseClient,
  user: User,
  bundle: LocalDraftBundle,
  remoteSeedContextId: string | null,
) {
  if (!remoteSeedContextId) {
    return loadPersistenceSyncState().remoteFeedbackIds;
  }

  const state = loadPersistenceSyncState();
  const nextIds = { ...state.remoteFeedbackIds };

  for (const entry of bundle.feedback?.feedback ?? []) {
    const payload = {
      user_id: user.id,
      seed_context_id: remoteSeedContextId,
      simulation_run_id: null,
      target_type: entry.targetType,
      target_id: entry.targetId,
      rating: entry.rating,
      comment: entry.note,
      agent_correction: {},
      edge_correction_note: "",
      updated_at: new Date().toISOString(),
    };

    if (nextIds[entry.id]) {
      const { error } = await supabase
        .from("feedback_log")
        .update(payload)
        .eq("id", nextIds[entry.id])
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      continue;
    }

    const { data, error } = await supabase
      .from("feedback_log")
      .insert(payload)
      .select("id")
      .single<FeedbackLogRow>();

    if (error) {
      throw error;
    }

    nextIds[entry.id] = data.id;
  }

  return nextIds;
}

async function syncSupportTickets(
  supabase: SupabaseClient,
  user: User,
  bundle: LocalDraftBundle,
  reportId: string | null,
) {
  const state = loadPersistenceSyncState();
  const nextIds = { ...state.remoteSupportTicketIds };

  for (const ticket of bundle.billing?.tickets ?? []) {
    const payload = {
      user_id: user.id,
      ticket_type: ticket.ticketType,
      status: ticket.status === "draft" ? "open" : ticket.status,
      priority: ticket.priority,
      related_report_id: reportId,
      summary: ticket.summary,
      subject: ticket.ticketType,
      message: ticket.summary,
      updated_at: new Date().toISOString(),
    };

    if (nextIds[ticket.id]) {
      const { error } = await supabase
        .from("support_tickets")
        .update(payload)
        .eq("id", nextIds[ticket.id])
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      continue;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .insert(payload)
      .select("id")
      .single<SupportTicketRow>();

    if (error) {
      throw error;
    }

    nextIds[ticket.id] = data.id;
  }

  return nextIds;
}

export async function syncClientWritableDrafts(
  supabase: SupabaseClient,
  user: User,
  bundle: LocalDraftBundle,
): Promise<PersistenceSyncResult> {
  void supabase;
  void user;
  void bundle;
  const nextState = loadPersistenceSyncState();
  return {
    ok: true,
    message: "Phase 2 blocks legacy client sync. Local drafts remain local until an explicit submitted SeedContext request.",
    state: nextState,
  };
}

async function countUserRows(
  supabase: SupabaseClient,
  user: User,
  tableName: string,
) {
  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function verifyRemotePersistenceBoundary(
  supabase: SupabaseClient,
  user: User,
): Promise<RemoteBoundaryVerification> {
  const checks = await Promise.all(
    boundaryTables.map(async (table) => {
      const count = await countUserRows(supabase, user, table.tableName);
      const ok = table.category === "client_writable" ? true : count === 0;

      return {
        tableName: table.tableName,
        category: table.category,
        count,
        ok,
        detail:
          table.category === "client_writable"
            ? "Browser may write user-authored rows here under RLS."
            : "Browser must not create generated/payment/system rows here.",
      };
    }),
  );

  return {
    checkedAt: new Date().toISOString(),
    checks,
  };
}
