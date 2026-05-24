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
  const deepSeekConfigured = Boolean(process.env.DEEPSEEK_API_KEY);
  const stripeSecretConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const stripeWebhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const migrationFilePresent =
    existsSync(
    path.join(process.cwd(), "supabase", "migrations", "0001_mvp_core_schema.sql"),
    ) &&
    existsSync(
      path.join(
        process.cwd(),
        "supabase",
        "migrations",
        "0002_mvp_evidence_chain_contracts.sql",
      ),
    ) &&
    existsSync(
      path.join(
        process.cwd(),
        "supabase",
        "migrations",
        "0003_paid_beta_writers.sql",
      ),
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
        ? "Run 0001, 0002, and 0003 from supabase/migrations in the Supabase SQL Editor."
        : "One or more MVP migration files are missing from the local workspace.",
    },
    {
      id: "paid_beta_keys",
      status:
        deepSeekConfigured && stripeSecretConfigured && stripeWebhookConfigured
          ? "ready"
          : "manual",
      detail:
        deepSeekConfigured && stripeSecretConfigured && stripeWebhookConfigured
          ? "DeepSeek and Stripe secrets are configured. Keep writer gates off until QA passes."
          : "Paid Beta needs DEEPSEEK_API_KEY, STRIPE_SECRET_KEY, and STRIPE_WEBHOOK_SECRET before gates can be enabled.",
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
        ? "Use /sync to write only seed_contexts, key_people, feedback_log, and support_tickets."
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
