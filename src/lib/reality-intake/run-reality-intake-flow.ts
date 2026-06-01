import type { RealityIntakeApiResponse } from "@/lib/llm/llm-task-types";
import type { ExternalRealitySearchResult } from "@/lib/reality-intake/external-reality-search";
import { buildRealityIntakeDraft } from "@/lib/reality-intake/build-manual-reality-intake";
import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";
import type {
  ExternalRealitySource,
  ManualRealitySource,
  RealityIntakeDraft,
} from "@/types/reality-intake";
import type { SeedContextDraft } from "@/types/seed-context";

const deepSeekFailureWarning =
  "DeepSeek Reality Intake failed; this run uses local fallback only.";
const searchFailureWarning =
  "External reality search unavailable; this run uses local and intake evidence only.";

function unique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function externalSourceKey(source: ExternalRealitySource) {
  return source.url?.trim() || `${source.questionId}:${source.id}:${source.title}`;
}

function mergeExternalSources(
  existing: ExternalRealitySource[],
  incoming: ExternalRealitySource[],
) {
  const sources = new Map<string, ExternalRealitySource>();
  existing.forEach((source) => sources.set(externalSourceKey(source), source));
  incoming.forEach((source) => sources.set(externalSourceKey(source), source));
  return Array.from(sources.values());
}

function fallbackIntake({
  seedContext,
  manualSources,
  existingExternalSources,
  warning,
  now,
}: {
  seedContext: SeedContextDraft;
  manualSources: ManualRealitySource[];
  existingExternalSources: ExternalRealitySource[];
  warning: string;
  now: string;
}): RealityIntakeDraft {
  const draft = buildRealityIntakeDraft({
    seedContext,
    manualSources,
    externalSources: existingExternalSources,
    now,
  });

  return {
    ...draft,
    missingExternalInfo: unique([...draft.missingExternalInfo, warning]),
    llmStatus: {
      enabled: true,
      attempted: true,
      succeeded: false,
      fallback: true,
      provider: "deepseek",
      warning,
    },
  };
}

export async function runRealityIntakeFlow({
  seedContext,
  destinyProfile,
  destinyClimate,
  manualRealitySources,
  existingExternalSources = [],
  locale,
  now = new Date().toISOString(),
}: {
  seedContext: SeedContextDraft;
  destinyProfile?: DestinyProfileDraft | null;
  destinyClimate?: DestinyClimateDraft | null;
  manualRealitySources: ManualRealitySource[];
  existingExternalSources?: ExternalRealitySource[];
  locale: "en" | "zh";
  now?: string;
}): Promise<RealityIntakeDraft> {
  let realityIntake = buildRealityIntakeDraft({
    seedContext,
    manualSources: manualRealitySources,
    externalSources: existingExternalSources,
    now,
  });

  try {
    const response = await fetch("/api/reality-intake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        seedContext,
        destinyProfile,
        destinyClimate,
        manualRealitySources,
        locale,
      }),
    });

    if (!response.ok) {
      realityIntake = fallbackIntake({
        seedContext,
        manualSources: manualRealitySources,
        existingExternalSources,
        warning: deepSeekFailureWarning,
        now,
      });
    } else {
      const payload = (await response.json()) as RealityIntakeApiResponse;
      if (payload.ok && payload.realityIntake) {
        realityIntake = {
          ...payload.realityIntake,
          externalSources: mergeExternalSources(
            existingExternalSources,
            payload.realityIntake.externalSources,
          ),
          missingExternalInfo: unique([
            ...payload.realityIntake.missingExternalInfo,
            ...payload.warnings,
          ]),
        };
      } else {
        realityIntake = fallbackIntake({
          seedContext,
          manualSources: manualRealitySources,
          existingExternalSources,
          warning: payload.warnings[0] ?? deepSeekFailureWarning,
          now,
        });
      }
    }
  } catch {
    realityIntake = fallbackIntake({
      seedContext,
      manualSources: manualRealitySources,
      existingExternalSources,
      warning: deepSeekFailureWarning,
      now,
    });
  }

  const searchQuestions = realityIntake.llmExtraction?.searchQuestions ?? [];
  if (!searchQuestions.length) return realityIntake;

  try {
    const searchResponse = await fetch("/api/reality-search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        searchQuestions,
        locale,
        primaryDomain: realityIntake.llmExtraction?.primaryDomain,
      }),
    });

    if (!searchResponse.ok) {
      return {
        ...realityIntake,
        missingExternalInfo: unique([
          ...realityIntake.missingExternalInfo,
          searchFailureWarning,
        ]),
        realitySearchStatus: {
          enabled: true,
          attempted: true,
          succeeded: false,
          fallback: true,
          provider: "generic_http_search",
          warning: searchFailureWarning,
        },
      };
    }

    const searchPayload =
      (await searchResponse.json()) as ExternalRealitySearchResult;
    const externalSources = mergeExternalSources(
      realityIntake.externalSources,
      searchPayload.sources,
    );

    return {
      ...realityIntake,
      mode: externalSources.length ? "external_reality" : realityIntake.mode,
      externalSources,
      missingExternalInfo: unique([
        ...realityIntake.missingExternalInfo,
        ...searchPayload.warnings,
      ]),
      realitySearchStatus: {
        enabled: searchPayload.provider !== "noop",
        attempted: true,
        succeeded: searchPayload.sources.length > 0,
        fallback: searchPayload.sources.length === 0,
        provider: searchPayload.provider,
        warning: searchPayload.warnings[0],
      },
    };
  } catch {
    return {
      ...realityIntake,
      missingExternalInfo: unique([
        ...realityIntake.missingExternalInfo,
        searchFailureWarning,
      ]),
      realitySearchStatus: {
        enabled: true,
        attempted: true,
        succeeded: false,
        fallback: true,
        provider: "generic_http_search",
        warning: searchFailureWarning,
      },
    };
  }
}
