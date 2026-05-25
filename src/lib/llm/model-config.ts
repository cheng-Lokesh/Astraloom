export const keyPeopleExtractionModelConfig = {
  provider: "deepseek-openai-compatible",
  baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  modelVersion: process.env.DEEPSEEK_MODEL_FAST ?? "deepseek-v4-flash",
  promptVersion: "extract-people-v1",
  timeoutMs: Number(process.env.LLM_EXTRACT_PEOPLE_TIMEOUT_MS ?? 12000),
  maxTokens: 900,
  temperature: 0.1,
};

export const agentProfileDraftingModelConfig = {
  provider: "deepseek-openai-compatible",
  baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  modelVersion: process.env.DEEPSEEK_MODEL_FAST ?? "deepseek-v4-flash",
  promptVersion: "generate-agents-v1",
  timeoutMs: Number(process.env.LLM_GENERATE_AGENTS_TIMEOUT_MS ?? 14000),
  maxTokens: 1800,
  temperature: 0.15,
};

export function isAiGenerationEnabled() {
  return process.env.ENABLE_AI_GENERATION === "true";
}

export function isKeyPeopleLlmConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}
