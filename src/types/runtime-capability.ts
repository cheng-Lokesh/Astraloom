export type RuntimeCapabilityMode =
  | "local_assumption"
  | "manual_reality"
  | "ai_reality_intake"
  | "external_reality"
  | "full_grounded_reality";

export type RuntimeCapabilityState = {
  llmEnabled: boolean;
  llmAvailable: boolean;
  realitySearchEnabled: boolean;
  realitySearchAvailable: boolean;
  hasManualRealitySources: boolean;
  hasExternalRealitySources: boolean;
  currentMode: RuntimeCapabilityMode;
  canClaimGroundedSimulation: boolean;
  userFacingWarning: string;
  blockingIssues: string[];
};
