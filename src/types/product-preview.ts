export type PreviewRiskLevel = "normal" | "caution" | "blocked";

export type PreviewAgent = {
  id: string;
  name: string;
  role: string;
  influence: number;
  tension: number;
  stance: string;
};

export type PreviewScenarioPath = {
  id: string;
  title: string;
  confidence: number;
  risk: "low" | "medium" | "high";
  summary: string;
};

export type PreviewTimelineEvent = {
  id: string;
  window: string;
  signal: string;
  detail: string;
};

export type PreviewRiskWindow = {
  id: string;
  title: string;
  level: PreviewRiskLevel;
  detail: string;
};

export type PreviewNextAction = {
  id: string;
  title: string;
  detail: string;
};

export type ProductPreview = {
  previewSummary: string;
  agentEcology: PreviewAgent[];
  scenarioPaths: PreviewScenarioPath[];
  timelineEvents: PreviewTimelineEvent[];
  riskWindows: PreviewRiskWindow[];
  nextActions: PreviewNextAction[];
  lockedReportSections: string[];
  safetyLevel: PreviewRiskLevel;
  safetyMessage: string;
};
