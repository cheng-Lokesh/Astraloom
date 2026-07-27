import { NextResponse } from "next/server";

import { appConfig } from "@/lib/env";
import { getSafeNextPath } from "@/lib/auth/callback-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const error = requestUrl.searchParams.get("error_description");
  const redirectUrl = new URL(next, requestUrl.origin || appConfig.appUrl);

  if (error) {
    return redirectToLogin(requestUrl, error);
  }

  if (!code) {
    return redirectToLogin(requestUrl, "missing_auth_code");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return redirectToLogin(requestUrl, "supabase_not_configured");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code,
  );

  if (exchangeError) {
    return redirectToLogin(requestUrl, "auth_exchange_failed");
  }

  const { data: auth, error: userError } = await supabase.auth.getUser();
  if (userError || !auth.user) {
    return redirectToLogin(requestUrl, "auth_session_restore_failed");
  }

  return noStoreRedirect(redirectUrl);
}

function redirectToLogin(requestUrl: URL, error: string) {
  const loginUrl = new URL("/login", requestUrl.origin || appConfig.appUrl);
  loginUrl.searchParams.set("error", error);
  return noStoreRedirect(loginUrl);
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
