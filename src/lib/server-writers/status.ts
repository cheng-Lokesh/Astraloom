import "server-only";

import { getServerWriterConfig } from "@/lib/server-writers/config";
import type {
  ServerWriterCapability,
  ServerWriterStatus,
  ServerWriterStatusPayload,
} from "@/types/server-writer";

type WriterDefinition = Omit<
  ServerWriterCapability,
  "status" | "enabled" | "detail"
> & {
  detailWhenBlocked: string;
  detailWhenReady: string;
};

const writerDefinitions: WriterDefinition[] = [
  {
    id: "agent_profiles",
    tableName: "agent_profiles",
    category: "agent_ecology",
    requiresServiceRole: true,
    requiresAiGeneration: true,
    requiresStripeWrites: false,
    detailWhenBlocked:
      "Digital selves, parallel selves, and NPC profiles stay local/read-only until a backend writer is explicitly enabled.",
    detailWhenReady:
      "Backend boundary exists, but model generation is still controlled by the AI feature flag.",
  },
  {
    id: "relation_edges",
    tableName: "relation_edges",
    category: "agent_ecology",
    requiresServiceRole: true,
    requiresAiGeneration: true,
    requiresStripeWrites: false,
    detailWhenBlocked:
      "Relationship weights stay system-owned. The browser must not edit graph edge values directly.",
    detailWhenReady:
      "Backend boundary exists for generated relationship edges. The MVP graph remains read-only.",
  },
  {
    id: "simulation_runs",
    tableName: "simulation_runs",
    category: "simulation",
    requiresServiceRole: true,
    requiresAiGeneration: true,
    requiresStripeWrites: false,
    detailWhenBlocked:
      "Run creation remains a queued shell until cost, safety, prompt, and backend writer gates are finished.",
    detailWhenReady:
      "Backend boundary exists for run records. Real simulation execution still needs the AI gate.",
  },
  {
    id: "events",
    tableName: "events",
    category: "simulation",
    requiresServiceRole: true,
    requiresAiGeneration: true,
    requiresStripeWrites: false,
    detailWhenBlocked:
      "Event ticks are generated artifacts and remain blocked from browser-side writes.",
    detailWhenReady:
      "Backend boundary exists for event ticks. The generator is still disabled unless AI is enabled.",
  },
  {
    id: "claims",
    tableName: "claims",
    category: "reporting",
    requiresServiceRole: true,
    requiresAiGeneration: true,
    requiresStripeWrites: false,
    detailWhenBlocked:
      "Report claims require SafetyVerifier approval and backend-only generation.",
    detailWhenReady:
      "Backend boundary exists for report claims. SafetyVerifier and AI gates still control output.",
  },
  {
    id: "reports",
    tableName: "reports",
    category: "reporting",
    requiresServiceRole: true,
    requiresAiGeneration: true,
    requiresStripeWrites: false,
    detailWhenBlocked:
      "Locked report records stay server-owned so the browser cannot unlock or fabricate paid output.",
    detailWhenReady:
      "Backend boundary exists for reports. Unlocking still requires safety and entitlement gates.",
  },
  {
    id: "payments",
    tableName: "payments",
    category: "payments",
    requiresServiceRole: true,
    requiresAiGeneration: false,
    requiresStripeWrites: true,
    detailWhenBlocked:
      "Payment entitlements must be written by Stripe webhook/server code, never by browser sync.",
    detailWhenReady:
      "Backend boundary exists for payment records. Real Stripe writes remain controlled by the Stripe flag.",
  },
];

function getWriterStatus(
  config: ReturnType<typeof getServerWriterConfig>,
): ServerWriterStatus {
  if (!config.supabaseUrlConfigured || !config.serviceRoleConfigured) {
    return "missing_config";
  }

  if (!config.systemWritersEnabled) {
    return "disabled";
  }

  return "ready_placeholder";
}

export function buildServerWriterStatus(): ServerWriterStatusPayload {
  const config = getServerWriterConfig();
  const baseStatus = getWriterStatus(config);
  const baseEnabled = baseStatus === "ready_placeholder";

  return {
    ...config,
    writers: writerDefinitions.map((writer) => ({
      id: writer.id,
      tableName: writer.tableName,
      category: writer.category,
      requiresServiceRole: writer.requiresServiceRole,
      requiresAiGeneration: writer.requiresAiGeneration,
      requiresStripeWrites: writer.requiresStripeWrites,
      status: baseStatus,
      enabled: baseEnabled,
      detail: baseEnabled ? writer.detailWhenReady : writer.detailWhenBlocked,
    })),
  };
}
