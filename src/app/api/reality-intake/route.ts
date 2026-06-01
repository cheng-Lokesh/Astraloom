import { NextResponse } from "next/server";

import { getLlmConfig } from "@/lib/llm/llm-config";
import { callDeepSeekChatCompletions } from "@/lib/llm/llm-gateway";
import type { RealityIntakeTaskInput } from "@/lib/llm/llm-task-types";
import {
  buildExtractRealityIntakeMessages,
  extractRealityIntakePromptVersion,
} from "@/lib/llm/prompts/extract-reality-intake";
import { validateRealityIntakeJson } from "@/lib/llm/validators/reality-intake-validator";
import { buildRealityIntakeDraft } from "@/lib/reality-intake/build-manual-reality-intake";
import type {
  ManualRealitySource,
  RealityIntakeDraft,
} from "@/types/reality-intake";
import type { SeedContextDraft } from "@/types/seed-context";

export const runtime = "nodejs";

const failureWarning =
  "DeepSeek Reality Intake failed; this run uses local fallback only.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validSeedContext(value: unknown): value is SeedContextDraft {
  return isRecord(value) && typeof value.id === "string";
}

function manualSources(value: unknown): ManualRealitySource[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (source): source is ManualRealitySource =>
      isRecord(source) &&
      typeof source.id === "string" &&
      typeof source.title === "string" &&
      typeof source.content === "string",
  );
}

function fallbackIntake({
  seedContext,
  manualRealitySources,
  warnings,
  llmEnabled,
  attempted,
}: {
  seedContext: SeedContextDraft;
  manualRealitySources: ManualRealitySource[];
  warnings: string[];
  llmEnabled: boolean;
  attempted: boolean;
}): RealityIntakeDraft {
  const now = new Date().toISOString();
  const draft = buildRealityIntakeDraft({
    seedContext,
    manualSources: manualRealitySources,
    externalSources: [],
    now,
  });

  return {
    ...draft,
    missingExternalInfo: Array.from(
      new Set([
        ...draft.missingExternalInfo,
        ...(attempted ? [failureWarning] : []),
      ]),
    ),
    llmStatus: {
      enabled: llmEnabled,
      attempted,
      succeeded: false,
      fallback: true,
      provider: "deepseek",
      warning: warnings[0],
    },
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        llmUsed: false,
        provider: "deepseek",
        realityIntake: null,
        warnings: ["Invalid JSON request body."],
        validationErrors: ["request_json_parse_failed"],
      },
      { status: 400 },
    );
  }

  if (!isRecord(body) || !validSeedContext(body.seedContext)) {
    return NextResponse.json(
      {
        ok: false,
        llmUsed: false,
        provider: "deepseek",
        realityIntake: null,
        warnings: ["Missing seedContext."],
        validationErrors: ["seed_context_required"],
      },
      { status: 400 },
    );
  }

  const config = getLlmConfig();
  const seedContext = body.seedContext;
  const sourceMaterials = manualSources(body.manualRealitySources);
  const locale = body.locale === "zh" ? "zh" : "en";

  if (!config.enabled) {
    const realityIntake = fallbackIntake({
      seedContext,
      manualRealitySources: sourceMaterials,
      warnings: ["DeepSeek Reality Intake is disabled; this run uses local fallback only."],
      llmEnabled: false,
      attempted: false,
    });

    return NextResponse.json({
      ok: true,
      llmUsed: false,
      provider: "deepseek",
      realityIntake,
      warnings: realityIntake.llmStatus?.warning ? [realityIntake.llmStatus.warning] : [],
      validationErrors: [],
    });
  }

  const taskInput: RealityIntakeTaskInput = {
    seedContext,
    destinyProfile: body.destinyProfile,
    destinyClimate: body.destinyClimate,
    manualRealitySources: sourceMaterials,
    locale,
  };
  const gatewayResult = await callDeepSeekChatCompletions({
    config,
    messages: buildExtractRealityIntakeMessages(taskInput),
  });

  if (!gatewayResult.ok) {
    const realityIntake = fallbackIntake({
      seedContext,
      manualRealitySources: sourceMaterials,
      warnings: [failureWarning, gatewayResult.errorCode],
      llmEnabled: true,
      attempted: true,
    });

    return NextResponse.json({
      ok: true,
      llmUsed: false,
      provider: "deepseek",
      realityIntake,
      warnings: [failureWarning, gatewayResult.errorCode],
      validationErrors: [],
    });
  }

  const validation = validateRealityIntakeJson({
    raw: gatewayResult.content,
    seedContext,
    manualSources: sourceMaterials,
  });

  if (!validation.ok) {
    const realityIntake = fallbackIntake({
      seedContext,
      manualRealitySources: sourceMaterials,
      warnings: [failureWarning],
      llmEnabled: true,
      attempted: true,
    });

    return NextResponse.json({
      ok: true,
      llmUsed: false,
      provider: "deepseek",
      realityIntake,
      warnings: [failureWarning, ...validation.warnings],
      validationErrors: validation.errors,
    });
  }

  const now = new Date().toISOString();
  const localBase = buildRealityIntakeDraft({
    seedContext,
    manualSources: sourceMaterials,
    externalSources: [],
    now,
  });
  const realityIntake: RealityIntakeDraft = {
    ...localBase,
    missingExternalInfo: Array.from(
      new Set([
        ...localBase.missingExternalInfo,
        ...validation.data.missingInfo.map(
          (item) => `${item.missingField}: ${item.whyItMatters}`,
        ),
      ]),
    ),
    intakeSummary: `DeepSeek Reality Intake extracted ${validation.data.groundedRealityNodes.length} grounded node${validation.data.groundedRealityNodes.length === 1 ? "" : "s"} and ${validation.data.groundedRealityPressures.length} pressure signal${validation.data.groundedRealityPressures.length === 1 ? "" : "s"} for validator-reviewed intake only.`,
    confidence: Math.min(localBase.confidence, 65),
    llmStatus: {
      enabled: true,
      attempted: true,
      succeeded: true,
      fallback: false,
      provider: "deepseek",
    },
    llmExtraction: {
      sourceType: "llm_extraction",
      provider: "deepseek",
      model: gatewayResult.model,
      promptVersion: extractRealityIntakePromptVersion,
      ...validation.data,
      warnings: validation.warnings,
      createdAt: now,
    },
  };

  return NextResponse.json({
    ok: true,
    llmUsed: true,
    provider: "deepseek",
    realityIntake,
    warnings: validation.warnings,
    validationErrors: [],
  });
}

