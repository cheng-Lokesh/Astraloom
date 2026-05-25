"use client";

import { createBrowserClient } from "@supabase/ssr";

import { appConfig, isSupabaseConfigured } from "@/lib/env";

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createBrowserClient(
    appConfig.supabaseUrl,
    appConfig.supabaseAnonKey,
  );
}
