export type TrackType = "crossroad" | "life_climate";

export type TimeWindow = "30_days" | "90_days" | "1_year" | "3_years" | "5_years";

export type SeedContextDraft = {
  id: string;
  questionText: string;
  trackType: TrackType;
  timeWindow: TimeWindow;
  situationSummary: string;
  recentEventsText?: string;
  keyPeopleText: string;
  decisionOptionsText?: string;
  forbiddenActionsText?: string;
  desiredOutputText?: string;
  privacyAck: boolean;
  privacySafetyAck?: boolean;
  locale: "en" | "zh";
  status: "draft" | "submitted";
  createdAt: string;
  updatedAt: string;
};
