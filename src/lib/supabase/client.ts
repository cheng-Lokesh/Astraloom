"use client";

import { createClient } from "@supabase/supabase-js";

import { appConfig, isSupabaseConfigured } from "@/lib/env";

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
}
