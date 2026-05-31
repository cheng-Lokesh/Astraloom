export type RealityIntakeMode =
  | "local_assumption"
  | "manual_reality"
  | "external_reality";

export type ManualRealitySourceType =
  | "user_note"
  | "chat_summary"
  | "job_description"
  | "company_info"
  | "policy_info"
  | "news_summary"
  | "offer_terms"
  | "agreement_summary"
  | "market_note"
  | "other";

export type ManualRealitySource = {
  id: string;
  title: string;
  sourceType: ManualRealitySourceType;
  content: string;
  userProvidedAt: string;
  relevanceToQuestion: string;
  extractedNodeHints: string[];
  extractedPressureHints: string[];
  confidence: number;
};

export type ExternalRealitySource = {
  id: string;
  title: string;
  url?: string;
  sourceType?: string;
  contentSummary?: string;
  retrievedAt?: string;
  confidence: number;
};

export type RealityIntakeDraft = {
  id: string;
  seedContextId: string;
  mode: RealityIntakeMode;
  manualSources: ManualRealitySource[];
  externalSources: ExternalRealitySource[];
  missingExternalInfo: string[];
  intakeSummary: string;
  confidence: number;
  createdAt: string;
};
