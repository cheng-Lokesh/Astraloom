import "server-only";

import { recordModelCallEvent } from "@/lib/observability/audit-event";
import { writeGeneratedArtifact } from "@/lib/server-writers/write-generated-artifact";

export type ModelCallLogEntry = {
  traceId: string;
  userId?: string | null;
  jobId?: string | null;
  source?: "llm" | "local_fallback";
  jobType:
    | "key_people_extract"
    | "agent_profiles_generate"
    | "report_text_generate";
  promptVersion: string;
  modelVersion: string;
  latencyMs: number;
  inputTokenEstimate?: number;
  outputTokenEstimate?: number;
  costEstimate: number;
  errorCode: string | null;
  metadata?: Record<string, unknown>;
};

const localModelCallLogs: ModelCallLogEntry[] = [];

export async function logModelCall(entry: ModelCallLogEntry) {
  const userId = entry.userId?.trim();
  const source: "llm" | "local_fallback" =
    entry.source ?? (entry.modelVersion === "not_called" ? "local_fallback" : "llm");
  const normalizedEntry = {
    inputTokenEstimate: 0,
    outputTokenEstimate: 0,
    jobId: null,
    source,
    ...entry,
    userId: userId ?? null,
  };

  localModelCallLogs.unshift(normalizedEntry);

  if (localModelCallLogs.length > 100) {
    localModelCallLogs.length = 100;
  }

  if (normalizedEntry.userId) {
    recordModelCallEvent({
      traceId: normalizedEntry.traceId,
      userId: normalizedEntry.userId,
      jobId: normalizedEntry.jobId,
      jobType: normalizedEntry.jobType,
      promptVersion: normalizedEntry.promptVersion,
      modelVersion: normalizedEntry.modelVersion,
      latencyMs: normalizedEntry.latencyMs,
      inputTokenEstimate: normalizedEntry.inputTokenEstimate,
      outputTokenEstimate: normalizedEntry.outputTokenEstimate,
      costEstimate: normalizedEntry.costEstimate,
      errorCode: normalizedEntry.errorCode,
      metadata: {
        ...(normalizedEntry.metadata ?? {}),
        source: normalizedEntry.source,
      },
    });

    await writeGeneratedArtifact({
      table: "model_call_logs",
      userId: normalizedEntry.userId,
      traceId: normalizedEntry.traceId,
      version: "model-call-log-v1",
      writerVersion: "model-call-log-writer-v1",
      idempotencyKey: `model_call_logs:${normalizedEntry.traceId}:${normalizedEntry.jobType}:${normalizedEntry.errorCode ?? "ok"}`,
      artifact: {
        job_type: normalizedEntry.jobType,
        provider:
          normalizedEntry.modelVersion === "not_called"
            ? "not_called"
            : "deepseek-openai-compatible",
        prompt_version: normalizedEntry.promptVersion,
        model_version: normalizedEntry.modelVersion,
        latency_ms: normalizedEntry.latencyMs,
        cost_estimate: normalizedEntry.costEstimate,
        token_counts: {
          input_token_estimate: normalizedEntry.inputTokenEstimate,
          output_token_estimate: normalizedEntry.outputTokenEstimate,
        },
        input_refs: {
          job_id: normalizedEntry.jobId,
        },
        output_refs: {
          ...(normalizedEntry.metadata ?? {}),
          source: normalizedEntry.source,
        },
        safety_level: String(normalizedEntry.metadata?.safety_level ?? "normal"),
        error_code: normalizedEntry.errorCode,
      },
    });
  }

  console.info("[model_call_logs]", {
    trace_id: normalizedEntry.traceId,
    user_id: normalizedEntry.userId,
    job_id: normalizedEntry.jobId,
    job_type: normalizedEntry.jobType,
    prompt_version: normalizedEntry.promptVersion,
    model_version: normalizedEntry.modelVersion,
    latency_ms: normalizedEntry.latencyMs,
    input_token_estimate: normalizedEntry.inputTokenEstimate,
    output_token_estimate: normalizedEntry.outputTokenEstimate,
    cost_estimate: normalizedEntry.costEstimate,
    source: normalizedEntry.source,
    error_code: normalizedEntry.errorCode,
    metadata: normalizedEntry.metadata,
  });
}

export function getLocalModelCallLogs() {
  return [...localModelCallLogs];
}
