import "server-only";

export type ServerWriterConfig = {
  supabaseUrlConfigured: boolean;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  deepSeekConfigured: boolean;
  stripeSecretConfigured: boolean;
  stripeWebhookConfigured: boolean;
};

export function getServerWriterConfig(): ServerWriterConfig {
  return {
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    systemWritersEnabled: process.env.ENABLE_SYSTEM_WRITERS === "true",
    aiGenerationEnabled: process.env.ENABLE_AI_GENERATION === "true",
    stripeWritesEnabled: process.env.ENABLE_STRIPE_WRITES === "true",
    deepSeekConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    stripeSecretConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };
}
