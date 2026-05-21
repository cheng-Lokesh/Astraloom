import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import type {
  SupabaseSetupStatusPayload,
  SupabaseSetupStep,
} from "@/types/supabase-setup";

function isTrue(value: string | undefined) {
  return value === "true";
}

export function buildSupabaseSetupStatus(): SupabaseSetupStatusPayload {
  const appUrlConfigured = Boolean(process.env.NEXT_PUBLIC_APP_URL);
  const supabaseUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKeyConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const supabaseConfigured = supabaseUrlConfigured && supabaseAnonKeyConfigured;
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const systemWritersEnabled = isTrue(process.env.ENABLE_SYSTEM_WRITERS);
  const aiGenerationEnabled = isTrue(process.env.ENABLE_AI_GENERATION);
  const stripeWritesEnabled = isTrue(process.env.ENABLE_STRIPE_WRITES);
  const migrationFilePresent = existsSync(
    path.join(process.cwd(), "supabase", "migrations", "0001_mvp_core_schema.sql"),
  );
  const dangerousFlagsOff =
    !serviceRoleConfigured &&
    !systemWritersEnabled &&
    !aiGenerationEnabled &&
    !stripeWritesEnabled;

  const steps: SupabaseSetupStep[] = [
    {
      id: "env_file",
      status: appUrlConfigured ? "ready" : "missing",
      detail: appUrlConfigured
        ? "NEXT_PUBLIC_APP_URL is configured for local redirects."
        : "Create .env.local from .env.example and keep NEXT_PUBLIC_APP_URL=http://localhost:3000.",
    },
    {
      id: "public_keys",
      status: supabaseConfigured ? "ready" : "missing",
      detail: supabaseConfigured
        ? "Public Supabase URL and anon key are configured."
        : "Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase project settings.",
    },
    {
      id: "dangerous_flags",
      status: dangerousFlagsOff ? "ready" : "blocked",
      detail: dangerousFlagsOff
        ? "Service-role, system writers, AI generation, and Stripe writes are disabled."
        : "Disable service-role/system writer/AI/Stripe flags before testing auth sync.",
    },
    {
      id: "migration",
      status: migrationFilePresent ? "manual" : "missing",
      detail: migrationFilePresent
        ? "Run supabase/migrations/0001_mvp_core_schema.sql in the Supabase SQL Editor."
        : "Migration file is missing from the local workspace.",
    },
    {
      id: "auth",
      status: supabaseConfigured ? "manual" : "missing",
      detail: supabaseConfigured
        ? "Use /login to send a magic link, then return to /sync."
        : "Auth cannot be tested until Supabase public values are configured.",
    },
    {
      id: "sync",
      status: supabaseConfigured ? "manual" : "missing",
      detail: supabaseConfigured
        ? "Use /sync to write only seed_contexts, key_people, and support_tickets."
        : "Client-writable draft sync is unavailable until auth is configured.",
    },
  ];

  return {
    appUrlConfigured,
    supabaseUrlConfigured,
    supabaseAnonKeyConfigured,
    supabaseConfigured,
    serviceRoleConfigured,
    systemWritersEnabled,
    aiGenerationEnabled,
    stripeWritesEnabled,
    migrationFilePresent,
    safeForAuthSync: supabaseConfigured && dangerousFlagsOff && migrationFilePresent,
    steps,
  };
}
