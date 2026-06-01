export type RealityIntakeMode =
  | "local_assumption"
  | "manual_reality"
  | "external_reality";

export type RealityIntakePrimaryDomain =
  | "career"
  | "relationship"
  | "collaboration"
  | "family"
  | "migration"
  | "study"
  | "finance"
  | "self_direction"
  | "other";

export type ExternalRealityExpectedSourceType =
  | "job_market"
  | "policy"
  | "company"
  | "news"
  | "city"
  | "industry"
  | "education"
  | "migration"
  | "finance"
  | "relationship_context"
  | "other";

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

export type ExternalRealitySearchQuestion = {
  id: string;
  question: string;
  reason: string;
  expectedSourceType: ExternalRealityExpectedSourceType;
  priority: number;
  confidence: number;
};

export type ExternalRealitySource = {
  id: string;
  questionId: string;
  title: string;
  url?: string;
  sourceType: ExternalRealityExpectedSourceType;
  retrievedAt: string;
  summary: string;
  relevantNodes: string[];
  relevantPressures: string[];
  limitations: string[];
  confidence: number;
  contentSummary?: string;
};

export type RealityIntakeExtractionNode = {
  label: string;
  nodeType: string;
  sourceText: string;
  roleInSituation: string;
  resourcesControlled: string[];
  informationHeld: string[];
  opportunitiesProvided: string[];
  constraintsCreated: string[];
  confidence: number;
  evidenceRefs: string[];
};

export type RealityIntakeExtractionPressure = {
  sourceLabel: string;
  targetLabel: string;
  pressureType: string;
  explanation: string;
  confidence: number;
  evidenceRefs: string[];
};

export type RealityIntakeSearchQuestion = ExternalRealitySearchQuestion;

export type RealityIntakeClarificationQuestion = {
  question: string;
  reason: string;
  required: boolean;
};

export type RealityIntakeMissingInfo = {
  missingField: string;
  whyItMatters: string;
};

export type RealityIntakeSafetyNotes = {
  deterministic_fate_risk: boolean;
  medical_legal_financial_risk: boolean;
  self_harm_or_crisis_risk: boolean;
  privacy_risk: boolean;
};

export type RealityIntakeLlmExtraction = {
  sourceType: "llm_extraction";
  provider: "deepseek";
  model: string;
  promptVersion: string;
  primaryDomain: RealityIntakePrimaryDomain;
  groundedRealityNodes: RealityIntakeExtractionNode[];
  groundedRealityPressures: RealityIntakeExtractionPressure[];
  externalInfoNeeded: boolean;
  searchQuestions: RealityIntakeSearchQuestion[];
  clarificationQuestions: RealityIntakeClarificationQuestion[];
  missingInfo: RealityIntakeMissingInfo[];
  safetyNotes: RealityIntakeSafetyNotes;
  warnings: string[];
  createdAt: string;
};

export type RealityIntakeLlmStatus = {
  enabled: boolean;
  attempted: boolean;
  succeeded: boolean;
  fallback: boolean;
  provider: "deepseek";
  warning?: string;
};

export type RealitySearchStatus = {
  enabled: boolean;
  attempted: boolean;
  succeeded: boolean;
  fallback: boolean;
  provider: "noop" | "generic_http_search" | string;
  warning?: string;
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
  llmStatus?: RealityIntakeLlmStatus;
  llmExtraction?: RealityIntakeLlmExtraction;
  realitySearchStatus?: RealitySearchStatus;
  createdAt: string;
};
