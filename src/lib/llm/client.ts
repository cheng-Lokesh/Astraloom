import "server-only";

import {
  estimateLlmCostUsd,
  estimateTokenPair,
} from "@/lib/observability/cost-estimator";

import { keyPeopleExtractionModelConfig } from "./model-config";

export type GenerateJsonInput = {
  traceId: string;
  systemPrompt: string;
  userPrompt: string;
  config?: typeof keyPeopleExtractionModelConfig;
};

export type GenerateJsonResult =
  | {
      ok: true;
      traceId: string;
      rawText: string;
      modelVersion: string;
      latencyMs: number;
      inputTokenEstimate: number;
      outputTokenEstimate: number;
      costEstimate: number;
      errorCode: null;
    }
  | {
      ok: false;
      traceId: string;
      rawText: null;
      modelVersion: string;
      latencyMs: number;
      inputTokenEstimate: number;
      outputTokenEstimate: number;
      costEstimate: number;
      errorCode: string;
    };

export async function generateJsonWithLlm({
  traceId,
  systemPrompt,
  userPrompt,
  config = keyPeopleExtractionModelConfig,
}: GenerateJsonInput): Promise<GenerateJsonResult> {
  const startedAt = Date.now();
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const modelVersion = config.modelVersion;
  const inputEstimate = estimateTokenPair(`${systemPrompt}\n${userPrompt}`);

  if (!apiKey) {
    return {
      ok: false,
      traceId,
      rawText: null,
      modelVersion,
      latencyMs: Date.now() - startedAt,
      inputTokenEstimate: inputEstimate.inputTokenEstimate,
      outputTokenEstimate: 0,
      costEstimate: 0,
      errorCode: "missing_llm_api_key",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs,
  );

  try {
    const response = await fetch(
      `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
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
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        traceId,
        rawText: null,
        modelVersion,
        latencyMs: Date.now() - startedAt,
        inputTokenEstimate: inputEstimate.inputTokenEstimate,
        outputTokenEstimate: 0,
        costEstimate: 0,
        errorCode: `llm_http_${response.status}`,
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
    const rawText = body.choices?.[0]?.message?.content ?? "";
    const outputTokenEstimate =
      body.usage?.completion_tokens ?? estimateTokenPair("", rawText).outputTokenEstimate;
    const inputTokenEstimate =
      body.usage?.prompt_tokens ?? inputEstimate.inputTokenEstimate;
    const costEstimate = estimateCost({
      totalTokens: body.usage?.total_tokens,
      inputTokenEstimate,
      outputTokenEstimate,
    });

    if (!rawText.trim()) {
      return {
        ok: false,
        traceId,
        rawText: null,
        modelVersion,
        latencyMs: Date.now() - startedAt,
        inputTokenEstimate,
        outputTokenEstimate,
        costEstimate,
        errorCode: "empty_llm_response",
      };
    }

    return {
      ok: true,
      traceId,
      rawText,
      modelVersion,
      latencyMs: Date.now() - startedAt,
      inputTokenEstimate,
      outputTokenEstimate,
      costEstimate,
      errorCode: null,
    };
  } catch (error) {
    return {
      ok: false,
      traceId,
      rawText: null,
      modelVersion,
      latencyMs: Date.now() - startedAt,
      inputTokenEstimate: inputEstimate.inputTokenEstimate,
      outputTokenEstimate: 0,
      costEstimate: 0,
      errorCode:
        error instanceof DOMException && error.name === "AbortError"
          ? "llm_timeout"
          : "llm_request_failed",
    };
  } finally {
    clearTimeout(timeout);
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
