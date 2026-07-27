import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { LocalDraftBundle } from "@/lib/persistence/local-drafts";
import { loadPersistenceSyncState } from "@/lib/persistence/sync-state";
import type {
  PersistenceSyncResult,
  RemoteBoundaryCategory,
  RemoteBoundaryVerification,
} from "@/types/persistence-sync";

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
