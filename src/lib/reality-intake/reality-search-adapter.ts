import type {
  ExternalRealitySearchQuestion,
  ExternalRealitySource,
  RealityIntakePrimaryDomain,
} from "@/types/reality-intake";

export type RealitySearchProvider = "noop" | "generic_http_search";

export type RealitySearchConfig = {
  enabled: boolean;
  provider: RealitySearchProvider;
  apiKey?: string;
  endpoint?: string;
};

export type RealitySearchAdapterInput = {
  question: ExternalRealitySearchQuestion;
  locale: "en" | "zh";
  primaryDomain: RealityIntakePrimaryDomain;
};

export type RealitySearchAdapterResult =
  | {
      ok: true;
      sources: ExternalRealitySource[];
      warnings: string[];
    }
  | {
      ok: false;
      sources: ExternalRealitySource[];
      warnings: string[];
      errorCode: string;
    };

function envFlag(value: string | undefined) {
  return value?.toLowerCase() === "true";
}

export function getRealitySearchConfig(): RealitySearchConfig {
  const provider = process.env.REALITY_SEARCH_PROVIDER === "generic_http_search"
    ? "generic_http_search"
    : "noop";

  return {
    enabled: envFlag(process.env.REALITY_SEARCH_ENABLED),
    provider,
    apiKey: process.env.REALITY_SEARCH_API_KEY,
    endpoint: process.env.REALITY_SEARCH_ENDPOINT,
  };
}

export async function runNoopRealitySearch(): Promise<RealitySearchAdapterResult> {
  return {
    ok: false,
    sources: [],
    warnings: ["External reality search unavailable; this run uses local and intake evidence only."],
    errorCode: "external_search_unavailable",
  };
}

function rawResultsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.sources)) return record.sources;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

export async function runGenericHttpRealitySearch({
  config,
  input,
}: {
  config: RealitySearchConfig;
  input: RealitySearchAdapterInput;
}): Promise<
  | { ok: true; rawSources: unknown[]; warnings: string[] }
  | { ok: false; rawSources: unknown[]; warnings: string[]; errorCode: string }
> {
  if (!config.endpoint) {
    return {
      ok: false,
      rawSources: [],
      warnings: ["External reality search endpoint is not configured."],
      errorCode: "missing_reality_search_endpoint",
    };
  }

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        query: input.question.question,
        locale: input.locale,
        domain: input.primaryDomain,
        expectedSourceType: input.question.expectedSourceType,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        rawSources: [],
        warnings: [`External reality search returned HTTP ${response.status}.`],
        errorCode: `reality_search_http_${response.status}`,
      };
    }

    const payload = await response.json();
    return {
      ok: true,
      rawSources: rawResultsFromPayload(payload),
      warnings: [],
    };
  } catch {
    return {
      ok: false,
      rawSources: [],
      warnings: ["External reality search request failed."],
      errorCode: "reality_search_fetch_failed",
    };
  }
}

