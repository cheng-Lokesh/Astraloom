import "server-only";

import { recordModelCallEvent } from "@/lib/observability/audit-event";

export type ModelCallLogEntry = {
  traceId: string;
  userId?: string | null;
  jobId?: string | null;
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
  const normalizedEntry = {
    inputTokenEstimate: 0,
    outputTokenEstimate: 0,
    userId: "local_or_unknown_user",
    jobId: null,
    ...entry,
  };

  localModelCallLogs.unshift(normalizedEntry);

  if (localModelCallLogs.length > 100) {
    localModelCallLogs.length = 100;
  }

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
    metadata: normalizedEntry.metadata,
  });

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
    error_code: normalizedEntry.errorCode,
    metadata: normalizedEntry.metadata,
  });
}

export function getLocalModelCallLogs() {
  return [...localModelCallLogs];
}
