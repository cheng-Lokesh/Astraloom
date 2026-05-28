import type { TimeWindow } from "./seed-context";

export type BirthInfo = {
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
  timezone?: string;
};

export type DestinyMode = "full" | "rough" | "skipped";

export type DestinyThemeLabel =
  | "resource pressure"
  | "boundary pressure"
  | "information uncertainty"
  | "emotional pull"
  | "opportunity shift"
  | "expression friction"
  | "self-rhythm"
  | "relationship tension";

export type DestinyThemeSignal = {
  id: string;
  label: DestinyThemeLabel;
  score: number;
  polarity: "pressure" | "opportunity" | "mixed";
  userFacingSummary: string;
  evidenceRefs: string[];
};

export type DestinyConfidenceDraft = {
  score: number;
  mode: DestinyMode;
  availableFields: Array<keyof BirthInfo>;
  missingFields: Array<keyof BirthInfo>;
  userFacingSummary: string;
};

export type DestinyProfileDraft = {
  id: string;
  seedContextId?: string;
  version: "destiny-profile-local-v0";
  mode: DestinyMode;
  birthInfo: BirthInfo;
  confidence: DestinyConfidenceDraft;
  baseThemes: DestinyThemeSignal[];
  userFacingSummary: string;
  technicalSummary: {
    seedHash: string;
    monthBucket: number | null;
    dayBucket: number | null;
    hasProfessionalChart: false;
    calculationNote: string;
  };
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
};

export type DestinyClimatePanel = {
  id: string;
  label: DestinyThemeLabel;
  intensity: "mild" | "moderate" | "strong";
  direction: "rising" | "steady" | "easing";
  userFacingSummary: string;
  evidenceRefs: string[];
};

export type DestinyClimateDraft = {
  id: string;
  profileId: string;
  seedContextId?: string;
  version: "destiny-climate-local-v0";
  mode: DestinyMode;
  referenceDate: string;
  timeWindow: TimeWindow;
  topic: string;
  activeThemes: DestinyThemeSignal[];
  panels: DestinyClimatePanel[];
  decisionRhythm: {
    overall: "prepare" | "observe" | "act" | "mixed";
    phases: Array<{
      label: string;
      period: string;
      actionLevel: "observe" | "prepare" | "act" | "reflect";
      userFacingSummary: string;
    }>;
  };
  userFacingOverview: string;
  confidence: DestinyConfidenceDraft;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
};
