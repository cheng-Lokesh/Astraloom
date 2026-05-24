import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type GenerationJobInput = {
  supabase: SupabaseClient;
  userId: string;
  seedContextId?: string | null;
  simulationRunId?: string | null;
  traceId: string;
  jobType: string;
  status: "completed" | "failed" | "blocked";
  inputRefs: Record<string, unknown>;
  outputRefs: Record<string, unknown>;
  modelVersion: string;
  promptVersion: string;
  costEstimate: number;
  errorCode: string | null;
  safetyLevel?: string;
};

export async function recordGenerationJob({
  supabase,
  userId,
  seedContextId = null,
  simulationRunId = null,
  traceId,
  jobType,
  status,
  inputRefs,
  outputRefs,
  modelVersion,
  promptVersion,
  costEstimate,
  errorCode,
  safetyLevel = "normal",
}: GenerationJobInput) {
  await supabase.from("generation_jobs").insert({
    user_id: userId,
    seed_context_id: seedContextId,
    simulation_run_id: simulationRunId,
    trace_id: traceId,
    version: "paid-beta-writer-v1",
    job_type: jobType,
    status,
    input_refs: inputRefs,
    output_refs: outputRefs,
    model_version: modelVersion,
    prompt_version: promptVersion,
    cost_estimate: costEstimate,
    error_code: errorCode,
    safety_level: safetyLevel,
  });
}
