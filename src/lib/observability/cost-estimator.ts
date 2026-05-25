const defaultCostPerThousandTokensUsd = 0.001;

export function estimateTokenCount(text: string) {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateTokenPair(inputText: string, outputText = "") {
  return {
    inputTokenEstimate: estimateTokenCount(inputText),
    outputTokenEstimate: estimateTokenCount(outputText),
  };
}

export function estimateLlmCostUsd({
  inputTokenEstimate,
  outputTokenEstimate,
  costPerThousandTokensUsd = defaultCostPerThousandTokensUsd,
}: {
  inputTokenEstimate: number;
  outputTokenEstimate: number;
  costPerThousandTokensUsd?: number;
}) {
  const totalTokens = inputTokenEstimate + outputTokenEstimate;
  return Number(((totalTokens / 1000) * costPerThousandTokensUsd).toFixed(6));
}

export function estimateCostCents(costUsd: number) {
  return Number((costUsd * 100).toFixed(4));
}
