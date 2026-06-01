import type { RealityIntakeDraft } from "@/types/reality-intake";
import type {
  RuntimeCapabilityMode,
  RuntimeCapabilityState,
} from "@/types/runtime-capability";

function modeFor({
  hasManualRealitySources,
  hasExternalRealitySources,
  llmAvailable,
}: {
  hasManualRealitySources: boolean;
  hasExternalRealitySources: boolean;
  llmAvailable: boolean;
}): RuntimeCapabilityMode {
  if (hasManualRealitySources && hasExternalRealitySources && llmAvailable) {
    return "full_grounded_reality";
  }
  if (hasExternalRealitySources) return "external_reality";
  if (llmAvailable) return "ai_reality_intake";
  if (hasManualRealitySources) return "manual_reality";
  return "local_assumption";
}

function warningFor(mode: RuntimeCapabilityMode) {
  if (mode === "local_assumption") {
    return "当前不是现实推演，只是本地假设演示。";
  }
  if (mode === "manual_reality") {
    return "当前使用你提供的现实材料，但没有联网验证。";
  }
  if (mode === "ai_reality_intake") {
    return "AI 已参与现实抽取，但未获取外部现实来源。";
  }
  if (mode === "external_reality") {
    return "已接入外部现实来源；请同时查看置信度和来源限制。";
  }
  return "AI、外部来源和手动材料均已参与；仍需按来源限制和置信度阅读。";
}

export function getRuntimeCapability({
  realityIntake,
}: {
  realityIntake?: RealityIntakeDraft | null;
}): RuntimeCapabilityState {
  const llmEnabled = realityIntake?.llmStatus?.enabled === true;
  const llmAvailable = realityIntake?.llmStatus?.succeeded === true;
  const realitySearchEnabled =
    realityIntake?.realitySearchStatus?.enabled === true;
  const realitySearchAvailable =
    realityIntake?.realitySearchStatus?.succeeded === true;
  const hasManualRealitySources = Boolean(
    realityIntake?.manualSources.length,
  );
  const hasExternalRealitySources = Boolean(
    realityIntake?.externalSources.length,
  );
  const currentMode = modeFor({
    hasManualRealitySources,
    hasExternalRealitySources,
    llmAvailable,
  });
  const canClaimGroundedSimulation =
    currentMode === "external_reality" ||
    currentMode === "full_grounded_reality";
  const blockingIssues = [
    ...(!llmAvailable ? ["DeepSeek Reality Intake is not available for this run."] : []),
    ...(!hasExternalRealitySources
      ? ["No validated external reality source is attached."]
      : []),
    ...(!hasManualRealitySources
      ? ["No user-provided manual reality material is attached."]
      : []),
  ];

  return {
    llmEnabled,
    llmAvailable,
    realitySearchEnabled,
    realitySearchAvailable,
    hasManualRealitySources,
    hasExternalRealitySources,
    currentMode,
    canClaimGroundedSimulation,
    userFacingWarning: warningFor(currentMode),
    blockingIssues,
  };
}
