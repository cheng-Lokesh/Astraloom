import "server-only";

import {
  estimateLlmCostUsd,
  estimateTokenPair,
} from "@/lib/observability/cost-estimator";

export type DeepSeekModelTier = "fast" | "deep";

export type DeepSeekJsonResult<T> =
  | {
      ok: true;
      output: T;
      traceId: string;
      modelVersion: string;
      promptVersion: string;
      latencyMs: number;
      inputTokenEstimate: number;
      outputTokenEstimate: number;
      costEstimate: number;
      errorCode: null;
    }
  | {
      ok: false;
      traceId: string;
      modelVersion: string;
      promptVersion: string;
      latencyMs: number;
      inputTokenEstimate: number;
      outputTokenEstimate: number;
      costEstimate: number;
      errorCode: string;
    };

type GenerateJsonInput = {
  traceId: string;
  modelTier: DeepSeekModelTier;
  promptVersion: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
};

function getModelVersion(modelTier: DeepSeekModelTier) {
  if (modelTier === "deep") {
    return process.env.DEEPSEEK_MODEL_DEEP ?? "deepseek-v4-pro";
  }

  return process.env.DEEPSEEK_MODEL_FAST ?? "deepseek-v4-flash";
}

export async function generateDeepSeekJson<T>({
  traceId,
  modelTier,
  promptVersion,
  systemPrompt,
  userPrompt,
  maxTokens = 900,
}: GenerateJsonInput): Promise<DeepSeekJsonResult<T>> {
  const startedAt = Date.now();
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const modelVersion = getModelVersion(modelTier);
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const inputEstimate = estimateTokenPair(`${systemPrompt}\n${userPrompt}`);

  if (!apiKey) {
    return {
      ok: false,
      traceId,
      modelVersion,
      promptVersion,
      latencyMs: Date.now() - startedAt,
      inputTokenEstimate: inputEstimate.inputTokenEstimate,
      outputTokenEstimate: 0,
      costEstimate: 0,
      errorCode: "missing_deepseek_api_key",
    };
  }

  try {
    // DeepSeek documents an OpenAI-compatible Chat Completions API:
    // https://api-docs.deepseek.com/
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelVersion,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        traceId,
        modelVersion,
        promptVersion,
        latencyMs: Date.now() - startedAt,
        inputTokenEstimate: inputEstimate.inputTokenEstimate,
        outputTokenEstimate: 0,
        costEstimate: 0,
        errorCode: `deepseek_http_${response.status}`,
      };
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        total_tokens?: number;
        prompt_tokens?: number;
        completion_tokens?: number;
      };
    };
    const content = body.choices?.[0]?.message?.content;
    const outputTokenEstimate =
      body.usage?.completion_tokens ??
      estimateTokenPair("", content ?? "").outputTokenEstimate;
    const inputTokenEstimate =
      body.usage?.prompt_tokens ?? inputEstimate.inputTokenEstimate;
    const costEstimate = estimateCost({
      totalTokens: body.usage?.total_tokens,
      inputTokenEstimate,
      outputTokenEstimate,
    });

    if (!content) {
      return {
        ok: false,
        traceId,
        modelVersion,
        promptVersion,
        latencyMs: Date.now() - startedAt,
        inputTokenEstimate,
        outputTokenEstimate,
        costEstimate,
        errorCode: "empty_llm_response",
      };
    }

    try {
      return {
        ok: true,
        output: JSON.parse(content) as T,
        traceId,
        modelVersion,
        promptVersion,
        latencyMs: Date.now() - startedAt,
        inputTokenEstimate,
        outputTokenEstimate,
        costEstimate,
        errorCode: null,
      };
    } catch {
      return {
        ok: false,
        traceId,
        modelVersion,
        promptVersion,
        latencyMs: Date.now() - startedAt,
        inputTokenEstimate,
        outputTokenEstimate,
        costEstimate,
        errorCode: "invalid_llm_json",
      };
    }
  } catch {
    return {
      ok: false,
      traceId,
      modelVersion,
      promptVersion,
      latencyMs: Date.now() - startedAt,
      inputTokenEstimate: inputEstimate.inputTokenEstimate,
      outputTokenEstimate: 0,
      costEstimate: 0,
      errorCode: "deepseek_request_failed",
    };
  }
}

function estimateCost({
  totalTokens,
  inputTokenEstimate,
  outputTokenEstimate,
}: {
  totalTokens: number | undefined;
  inputTokenEstimate: number;
  outputTokenEstimate: number;
}) {
  if (totalTokens) {
    return estimateLlmCostUsd({
      inputTokenEstimate: totalTokens,
      outputTokenEstimate: 0,
    });
  }

  return estimateLlmCostUsd({ inputTokenEstimate, outputTokenEstimate });
}
