import "server-only";

import type {
  RemoteTableCheck,
  SupabaseRemoteSchemaStatus,
} from "@/types/supabase-remote-schema";

const expectedTables = [
  "users",
  "profiles",
  "seed_contexts",
  "key_people",
  "agent_profiles",
  "relation_edges",
  "simulation_runs",
  "simulation_ticks",
  "events",
  "claims",
  "reports",
  "feedback_log",
  "payments",
  "support_tickets",
  "consent_events",
] as const;

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

async function fetchWithTimeout(url: string, headers: HeadersInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    return await fetch(url, {
      headers,
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkTable(
  projectUrl: string,
  publishableKey: string,
  tableName: string,
): Promise<RemoteTableCheck> {
  const url = `${projectUrl.replace(/\/$/, "")}/rest/v1/${tableName}?select=id&limit=1`;

  try {
    const response = await fetchWithTimeout(url, {
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`,
    });

    if (response.status === 200) {
      return {
        tableName,
        present: true,
        statusCode: response.status,
        detail: "Table reachable through Supabase REST.",
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        tableName,
        present: false,
        statusCode: response.status,
        detail: "Publishable key was rejected or lacks access.",
      };
    }

    if (response.status === 404) {
      return {
        tableName,
        present: false,
        statusCode: response.status,
        detail: "Table was not found. The migration may not have been applied.",
      };
    }

    const body = await response.text();
    return {
      tableName,
      present: false,
      statusCode: response.status,
      detail: body.slice(0, 180) || "Unexpected Supabase REST response.",
    };
  } catch (error) {
    return {
      tableName,
      present: false,
      statusCode: null,
      detail:
        error instanceof Error
          ? error.message
          : "Network error while checking Supabase REST.",
    };
  }
}

export async function checkSupabaseRemoteSchema(): Promise<SupabaseRemoteSchemaStatus> {
  const { url, publishableKey } = getSupabaseConfig();
  const base = {
    checkedAt: new Date().toISOString(),
    projectUrlConfigured: Boolean(url),
    publishableKeyConfigured: Boolean(publishableKey),
    checkedTableCount: expectedTables.length,
  };

  if (!url || !publishableKey) {
    return {
      ...base,
      status: "missing_config",
      presentTableCount: 0,
      tables: [],
    };
  }

  const tables = await Promise.all(
    expectedTables.map((tableName) => checkTable(url, publishableKey, tableName)),
  );
  const presentTableCount = tables.filter((table) => table.present).length;
  const authFailed = tables.some(
    (table) => table.statusCode === 401 || table.statusCode === 403,
  );
  const networkError = tables.every((table) => table.statusCode === null);

  if (networkError) {
    return {
      ...base,
      status: "network_error",
      presentTableCount,
      tables,
    };
  }

  if (authFailed && presentTableCount === 0) {
    return {
      ...base,
      status: "auth_failed",
      presentTableCount,
      tables,
    };
  }

  return {
    ...base,
    status:
      presentTableCount === expectedTables.length
        ? "schema_present"
        : "schema_incomplete",
    presentTableCount,
    tables,
  };
}
