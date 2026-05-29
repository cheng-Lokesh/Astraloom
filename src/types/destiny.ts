import type { TimeWindow } from "./seed-context";

export type BirthInfo = {
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
  timezone?: string;
};

export type DestinyMode = "full" | "rough" | "skipped";

export type HeavenlyStem =
  | "jia"
  | "yi"
  | "bing"
  | "ding"
  | "wu"
  | "ji"
  | "geng"
  | "xin"
  | "ren"
  | "gui";

export type EarthlyBranch =
  | "zi"
  | "chou"
  | "yin"
  | "mao"
  | "chen"
  | "si"
  | "wu"
  | "wei"
  | "shen"
  | "you"
  | "xu"
  | "hai";

export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";

export type YinYang = "yang" | "yin";

export type Pillar = {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemElement: FiveElement;
  branchElement: FiveElement;
  stemYinYang: YinYang;
  branchYinYang: YinYang;
  hiddenStems: HeavenlyStem[];
  label: string;
};

export type FourPillarsDraft = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  dayMaster: HeavenlyStem;
  pillarsAvailable: 3 | 4;
  calculationMethod: "local-deterministic-v1";
  localWarnings: string[];
};

export type TenGodName =
  | "friend"
  | "rob_wealth"
  | "eating_god"
  | "hurting_officer"
  | "indirect_wealth"
  | "direct_wealth"
  | "seven_killings"
  | "direct_officer"
  | "indirect_resource"
  | "direct_resource";

export type TenGodSignal = {
  god: TenGodName;
  stem: HeavenlyStem;
  source:
    | "year_stem"
    | "month_stem"
    | "day_stem"
    | "hour_stem"
    | "year_hidden"
    | "month_hidden"
    | "day_hidden"
    | "hour_hidden";
  countWeight: number;
  userFacingSummary: string;
};

export type ElementBalanceDraft = {
  counts: Record<FiveElement, number>;
  percentages: Record<FiveElement, number>;
  strongestElement: FiveElement;
  weakestElement: FiveElement;
  dayMasterElement: FiveElement;
  dayMasterStrength: "strong" | "balanced" | "weak";
  dayMasterStrengthScore: number;
  userFacingSummary: string;
};

export type DestinyCalculationConfidence = {
  score: number;
  calculationVersion: "destiny-core-local-v1";
  precisionLevel: "skipped" | "date-only" | "date-time-local";
  hasBirthDate: boolean;
  hasBirthTime: boolean;
  hasBirthPlace: boolean;
  usesSolarTermApproximation: true;
  usesTrueSolarTime: false;
  localWarnings: string[];
};

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

export type DestinyInterpretationItem = {
  id: string;
  label: string;
  intensity?: "mild" | "moderate" | "strong";
  userFacingSummary: string;
  evidenceRefs: string[];
};

export type DestinyTechnicalDetail = {
  id: string;
  label: string;
  value: string;
  plainLanguage: string;
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
  fourPillars?: FourPillarsDraft | null;
  elementBalance?: ElementBalanceDraft | null;
  tenGodsSummary?: TenGodSignal[];
  destinyCalculationConfidence?: DestinyCalculationConfidence;
  localWarnings?: string[];
  coreTendencies?: DestinyInterpretationItem[];
  pressureThemes?: DestinyInterpretationItem[];
  opportunityThemes?: DestinyInterpretationItem[];
  relationshipThemes?: DestinyInterpretationItem[];
  cautionNotes?: DestinyInterpretationItem[];
  observationSignals?: DestinyInterpretationItem[];
  technicalDetails?: DestinyTechnicalDetail[];
  baseThemes: DestinyThemeSignal[];
  userFacingSummary: string;
  technicalSummary: {
    seedHash: string;
    monthBucket: number | null;
    dayBucket: number | null;
    hasProfessionalChart: false;
    calculationNote: string;
    destinyCoreVersion?: "destiny-core-local-v1";
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
  coreTendencies?: DestinyInterpretationItem[];
  pressureThemes?: DestinyInterpretationItem[];
  opportunityThemes?: DestinyInterpretationItem[];
  relationshipThemes?: DestinyInterpretationItem[];
  cautionNotes?: DestinyInterpretationItem[];
  observationSignals?: DestinyInterpretationItem[];
  technicalDetails?: DestinyTechnicalDetail[];
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
