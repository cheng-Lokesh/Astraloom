import "server-only";

import { getServerWriterConfig } from "@/lib/server-writers/config";

export type RuntimeGateKind = "system" | "ai" | "stripe";

export type RuntimeGateResult = {
  allowed: boolean;
  traceId: string;
  blockedCodes: string[];
};

export function createTraceId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function checkRuntimeGate(kind: RuntimeGateKind): RuntimeGateResult {
  const config = getServerWriterConfig();
  const blockedCodes: string[] = [];

  if (!config.supabaseUrlConfigured) {
    blockedCodes.push("supabase_url_missing");
  }

  if (!config.serviceRoleConfigured) {
    blockedCodes.push("service_role_missing");
  }

  if (!config.systemWritersEnabled) {
    blockedCodes.push("system_writers_disabled");
  }

  if (kind === "ai") {
    if (!config.aiGenerationEnabled) {
      blockedCodes.push("ai_generation_disabled");
    }

    if (!config.deepSeekConfigured) {
      blockedCodes.push("missing_deepseek_api_key");
    }
  }

  if (kind === "stripe") {
    if (!config.stripeWritesEnabled) {
      blockedCodes.push("stripe_writes_disabled");
    }

    if (!config.stripeSecretConfigured) {
      blockedCodes.push("stripe_secret_missing");
    }
  }

  return {
    allowed: blockedCodes.length === 0,
    traceId: createTraceId(kind),
    blockedCodes,
  };
}

export function gateErrorResponse(gate: RuntimeGateResult) {
  return {
    ok: false,
    trace_id: gate.traceId,
    error_code: gate.blockedCodes[0] ?? "writer_gate_blocked",
    blocked_codes: gate.blockedCodes,
  };
}
