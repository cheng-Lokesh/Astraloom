import {
  getRealitySearchConfig,
  runGenericHttpRealitySearch,
  runNoopRealitySearch,
} from "@/lib/reality-intake/reality-search-adapter";
import { validateExternalRealitySources } from "@/lib/reality-intake/validators/external-source-validator";
import type {
  ExternalRealitySearchQuestion,
  ExternalRealitySource,
  RealityIntakePrimaryDomain,
} from "@/types/reality-intake";

export type ExternalRealitySearchResult = {
  ok: boolean;
  searchUsed: boolean;
  provider: string;
  sources: ExternalRealitySource[];
  warnings: string[];
  validationErrors: string[];
};

export async function searchExternalReality({
  searchQuestions,
  locale,
  primaryDomain,
}: {
  searchQuestions: ExternalRealitySearchQuestion[];
  locale: "en" | "zh";
  primaryDomain: RealityIntakePrimaryDomain;
}): Promise<ExternalRealitySearchResult> {
  const config = getRealitySearchConfig();
  const provider = config.enabled ? config.provider : "noop";

  if (!config.enabled || provider === "noop") {
    const noopResult = await runNoopRealitySearch();
    return {
      ok: true,
      searchUsed: false,
      provider,
      sources: [],
      warnings: noopResult.warnings,
      validationErrors: [],
    };
  }

  const warnings: string[] = [];
  const validationErrors: string[] = [];
  const sources: ExternalRealitySource[] = [];
  const questions = [...searchQuestions]
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 5);

  for (const question of questions) {
    const result = await runGenericHttpRealitySearch({
      config,
      input: {
        question,
        locale,
        primaryDomain,
      },
    });

    if (!result.ok) {
      warnings.push(...result.warnings);
      validationErrors.push(result.errorCode);
      continue;
    }

    const validation = validateExternalRealitySources({
      rawSources: result.rawSources,
      questionId: question.id,
      fallbackSourceType: question.expectedSourceType,
      retrievedAt: new Date().toISOString(),
    });

    warnings.push(...validation.warnings);
    sources.push(...validation.sources);
    if (!validation.ok) {
      validationErrors.push(...validation.errors);
    }
  }

  if (!sources.length) {
    warnings.push(
      "External reality search unavailable; this run uses local and intake evidence only.",
    );
  }

  return {
    ok: true,
    searchUsed: sources.length > 0,
    provider,
    sources,
    warnings: Array.from(new Set(warnings)),
    validationErrors: Array.from(new Set(validationErrors)),
  };
}

