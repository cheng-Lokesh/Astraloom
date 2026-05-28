export type TrackType = "crossroad" | "life_climate";

export type TimeWindow = "30_days" | "90_days" | "1_year" | "3_years" | "5_years";

export type SeedContextDraft = {
  id: string;
  questionText: string;
  trackType: TrackType;
  timeWindow: TimeWindow;
  destinyBirthInfo?: string;
  currentQuestionDescription?: string;
  situationSummary: string;
  recentEvents?: string;
  recentEventsText?: string;
  keyPeopleText: string;
  decisionOptions?: string;
  decisionOptionsText?: string;
  worries?: string;
  forbiddenActions?: string;
  forbiddenActionsText?: string;
  safetyBoundaries?: string;
  desiredOutput?: string;
  desiredOutputText?: string;
  contextQualityScore?: number;
  missingContextHints?: string[];
  privacyAck: boolean;
  privacySafetyAck?: boolean;
  locale: "en" | "zh";
  status: "draft" | "submitted";
  createdAt: string;
  updatedAt: string;
};
