export const observabilityErrorCodes = {
  invalidRequest: "invalid_request",
  missingApiKey: "missing_llm_api_key",
  llmTimeout: "llm_timeout",
  llmRequestFailed: "llm_request_failed",
  invalidJson: "invalid_llm_json",
  emptyResponse: "empty_llm_response",
  safetyBlocked: "safety_blocked",
  generationBlocked: "generation_blocked",
  reportMissingClaims: "report_missing_claims",
  unknown: "unknown_error",
} as const;

export type ObservabilityErrorCode =
  (typeof observabilityErrorCodes)[keyof typeof observabilityErrorCodes];

export function normalizeErrorCode(errorCode: string | null | undefined) {
  return errorCode ?? null;
}
