export type ServerWriterId =
  | "agent_profiles"
  | "relation_edges"
  | "simulation_runs"
  | "events"
  | "claims"
  | "reports"
  | "payments";

export type ServerWriterStatus =
  | "disabled"
  | "missing_config"
  | "ready_placeholder";

export type ServerWriterCategory =
  | "agent_ecology"
  | "simulation"
  | "reporting"
  | "payments";

export type ServerWriterCapability = {
  id: ServerWriterId;
  tableName: string;
  category: ServerWriterCategory;
  status: ServerWriterStatus;
  enabled: boolean;
  requiresServiceRole: boolean;
  requiresAiGeneration: boolean;
  requiresStripeWrites: boolean;
  detail: string;
};

export type ServerWriterStatusPayload = {
  supabaseUrlConfigured: boolean;
  serviceRoleConfigured: boolean;
  systemWritersEnabled: boolean;
  aiGenerationEnabled: boolean;
  stripeWritesEnabled: boolean;
  writers: ServerWriterCapability[];
};
