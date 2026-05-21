import "server-only";

export type ServerWriterConfig = {
  supabaseUrlConfigured: boolean;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
};

export function getServerWriterConfig(): ServerWriterConfig {
  return {
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    systemWritersEnabled: process.env.ENABLE_SYSTEM_WRITERS === "true",
    aiGenerationEnabled: process.env.ENABLE_AI_GENERATION === "true",
    stripeWritesEnabled: process.env.ENABLE_STRIPE_WRITES === "true",
  };
}
