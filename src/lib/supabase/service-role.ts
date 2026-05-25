import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appConfig } from "@/lib/env";

export type ServiceRoleClientResult =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; errorCode: "service_role_not_configured" };

export function createSupabaseServiceRoleClient(): ServiceRoleClientResult {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appConfig.supabaseUrl || !serviceRoleKey) {
    return { ok: false, errorCode: "service_role_not_configured" };
  }

  return {
    ok: true,
    supabase: createClient(appConfig.supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
}
