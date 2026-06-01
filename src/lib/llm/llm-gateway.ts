import type { LlmConfig } from "@/lib/llm/llm-config";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmGatewayResult =
  | {
      ok: true;
      content: string;
      model: string;
    }
  | {
      ok: false;
      errorCode: string;
      message: string;
    };

export async function callDeepSeekChatCompletions({
  config,
  messages,
}: {
  config: LlmConfig;
  messages: readonly ChatMessage[];
}): Promise<LlmGatewayResult> {
  if (!config.enabled) {
    return {
      ok: false,
      errorCode: "llm_disabled",
      message: "LLM is disabled.",
    };
  }

  if (!config.apiKey) {
    return {
      ok: false,
      errorCode: "missing_api_key",
      message: "DEEPSEEK_API_KEY is not configured.",
    };
  }

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        errorCode: `deepseek_http_${response.status}`,
        message: `DeepSeek returned HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return {
        ok: false,
        errorCode: "empty_llm_response",
        message: "DeepSeek returned no message content.",
      };
    }

    return {
      ok: true,
      content,
      model: payload.model || config.model,
    };
  } catch {
    return {
      ok: false,
      errorCode: "deepseek_fetch_failed",
      message: "DeepSeek request failed.",
    };
  }
}

