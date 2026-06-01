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
    return "Current run is Local Assumption Mode: no manual or external reality source is attached.";
  }
  if (mode === "manual_reality") {
    return "Current run uses user-provided reality material, but no external source was retrieved.";
  }
  if (mode === "ai_reality_intake") {
    return "DeepSeek Reality Intake participated successfully, but no external reality source was attached.";
  }
  if (mode === "external_reality") {
    return "External reality sources are attached. Read them with their confidence caps and limitations.";
  }
  return "DeepSeek Reality Intake, external sources, and manual material all participated; confidence still follows source limits.";
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
  const hasManualRealitySources = Boolean(realityIntake?.manualSources.length);
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
    ...(!llmAvailable
      ? ["DeepSeek Reality Intake is not available for this run."]
      : []),
    ...(realityIntake?.llmStatus?.warning
      ? [realityIntake.llmStatus.warning]
      : []),
    ...(!hasExternalRealitySources
      ? ["No validated external reality source is attached."]
      : []),
    ...(realityIntake?.realitySearchStatus?.warning
      ? [realityIntake.realitySearchStatus.warning]
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
