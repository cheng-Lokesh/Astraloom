export type SupabaseSetupStepId =
  | "env_file"
  | "public_keys"
  | "dangerous_flags"
  | "migration"
  | "paid_beta_keys"
  | "auth"
  | "sync";

export type SupabaseSetupStepStatus = "ready" | "missing" | "manual" | "blocked";

export type SupabaseSetupStep = {
  id: SupabaseSetupStepId;
  status: SupabaseSetupStepStatus;
  detail: string;
};

export type SupabaseSetupStatusPayload = {
  appUrlConfigured: boolean;
  supabaseUrlConfigured: boolean;
  supabaseAnonKeyConfigured: boolean;
  supabaseConfigured: boolean;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  migrationFilePresent: boolean;
  safeForAuthSync: boolean;
  safeForStagingBeta: boolean;
  steps: SupabaseSetupStep[];
};
