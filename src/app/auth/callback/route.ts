import { NextResponse } from "next/server";

import { appConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/sync";
  const next = requestedNext.startsWith("/") ? requestedNext : "/sync";
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
    return redirectToLogin(requestUrl, exchangeError.message);
  }

  return NextResponse.redirect(redirectUrl);
}

function redirectToLogin(requestUrl: URL, error: string) {
  const loginUrl = new URL("/login", requestUrl.origin || appConfig.appUrl);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}
