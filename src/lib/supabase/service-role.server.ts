import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type AuthenticatedServerContext =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; errorCode: string; status: number };

export function getServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAuthenticatedServerContext(
  request: Request,
): Promise<AuthenticatedServerContext> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return { ok: false, errorCode: "auth_token_missing", status: 401 };
  }

  const supabase = getServiceRoleSupabaseClient();

  if (!supabase) {
    return { ok: false, errorCode: "service_role_missing", status: 503 };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { ok: false, errorCode: "auth_token_invalid", status: 401 };
  }

  return { ok: true, supabase, user: data.user };
}
