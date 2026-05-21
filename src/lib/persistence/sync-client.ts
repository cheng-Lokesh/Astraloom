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

type BoundaryTable = {
  tableName: string;
  category: RemoteBoundaryCategory;
};

const boundaryTables: BoundaryTable[] = [
  { tableName: "seed_contexts", category: "client_writable" },
  { tableName: "key_people", category: "client_writable" },
  { tableName: "support_tickets", category: "client_writable" },
  { tableName: "agent_profiles", category: "server_owned" },
  { tableName: "relation_edges", category: "server_owned" },
  { tableName: "simulation_runs", category: "server_owned" },
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
    question_text: bundle.seedContext.questionText,
    track_type: bundle.seedContext.trackType,
    time_window: bundle.seedContext.timeWindow,
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

  const rows = bundle.keyPeople.people.map((person) => ({
    user_id: user.id,
    seed_context_id: remoteSeedContextId,
    label: person.label,
    role: person.role,
    confirmed: person.confirmed,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("key_people").insert(rows);

  if (error) {
    throw error;
  }
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
  const currentState = loadPersistenceSyncState();
  const remoteSeedContextId = await upsertSeedContext(
    supabase,
    user,
    bundle,
    currentState.remoteSeedContextId,
  );

  await replaceKeyPeople(supabase, user, bundle, remoteSeedContextId);
  const remoteSupportTicketIds = await syncSupportTickets(
    supabase,
    user,
    bundle,
    null,
  );

  const nextState = {
    remoteSeedContextId,
    remoteSupportTicketIds,
    lastSyncedAt: new Date().toISOString(),
  };

  savePersistenceSyncState(nextState);

  return {
    ok: true,
    message: "Client-writable drafts synced.",
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
