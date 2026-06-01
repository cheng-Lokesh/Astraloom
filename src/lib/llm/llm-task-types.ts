import type {
  ManualRealitySource,
  RealityIntakeClarificationQuestion,
  RealityIntakeExtractionNode,
  RealityIntakeExtractionPressure,
  RealityIntakeMissingInfo,
  RealityIntakePrimaryDomain,
  RealityIntakeSafetyNotes,
  RealityIntakeSearchQuestion,
} from "@/types/reality-intake";
import type { SeedContextDraft } from "@/types/seed-context";

export type RealityIntakeLocale = "en" | "zh";

export type RealityIntakeTaskInput = {
  seedContext: SeedContextDraft;
  destinyProfile?: unknown;
  destinyClimate?: unknown;
  manualRealitySources?: ManualRealitySource[];
  locale: RealityIntakeLocale;
};

export type RealityIntakeTaskOutput = {
  primaryDomain: RealityIntakePrimaryDomain;
  groundedRealityNodes: RealityIntakeExtractionNode[];
  groundedRealityPressures: RealityIntakeExtractionPressure[];
  externalInfoNeeded: boolean;
  searchQuestions: RealityIntakeSearchQuestion[];
  clarificationQuestions: RealityIntakeClarificationQuestion[];
  missingInfo: RealityIntakeMissingInfo[];
  safetyNotes: RealityIntakeSafetyNotes;
};

export type RealityIntakeApiResponse = {
  ok: boolean;
  llmUsed: boolean;
  provider: "deepseek";
  realityIntake: import("@/types/reality-intake").RealityIntakeDraft;
  warnings: string[];
  validationErrors: string[];
};

