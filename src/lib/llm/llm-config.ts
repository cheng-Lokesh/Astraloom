export type LlmConfig = {
  enabled: boolean;
  provider: "deepseek";
  apiKey?: string;
  baseUrl: string;
  model: string;
};

const defaultDeepSeekChatCompletionsUrl =
  "https://api.deepseek.com/chat/completions";

function envFlag(value: string | undefined) {
  return value?.toLowerCase() === "true";
}

function chatCompletionsUrl(value: string | undefined) {
  const base = value?.trim() || defaultDeepSeekChatCompletionsUrl;
  if (base.endsWith("/chat/completions")) return base;
  return `${base.replace(/\/+$/, "")}/chat/completions`;
}

export function getLlmConfig(): LlmConfig {
  return {
    enabled: envFlag(process.env.LLM_ENABLED),
    provider: "deepseek",
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: chatCompletionsUrl(process.env.DEEPSEEK_BASE_URL),
    model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat",
  };
}

