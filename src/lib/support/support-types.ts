export type SupportTicketType =
  | "generation_failure"
  | "refund_request"
  | "safety_appeal"
  | "privacy_delete_request"
  | "billing_question"
  | "general_support";

export type SupportTicketStatus =
  | "open"
  | "triaged"
  | "in_review"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "p1" | "p2" | "p3";

export type SupportTicketSource = "support_page" | "delete_request_api";

export type SupportTicketDraft = {
  id: string;
  userId: string;
  ticketType: SupportTicketType;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
  messagePreview: string;
  relatedReportId: string | null;
  relatedSimulationId: string | null;
  traceId: string;
  source: SupportTicketSource;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketInput = {
  ticketType: SupportTicketType;
  subject: string;
  message: string;
  relatedReportId?: string | null;
  relatedSimulationId?: string | null;
  userId?: string | null;
  source?: SupportTicketSource;
};

export type SupportTicketAdminSummary = Omit<SupportTicketDraft, "message"> & {
  sensitiveInputHidden: true;
};

export type ConsentEventDraft = {
  id: string;
  userId: string;
  consentType: "privacy_delete_request";
  status: "requested";
  source: "delete_request_api";
  relatedTicketId: string;
  traceId: string;
  metadata: {
    relatedReportId: string | null;
    relatedSimulationId: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type SupportRepositorySnapshot = {
  tickets: SupportTicketDraft[];
  consentEvents: ConsentEventDraft[];
  updatedAt: string;
};

export type SupportRepositoryResult<T> =
  | {
      ok: true;
      data: T;
      errorCode: null;
      traceId: string;
    }
  | {
      ok: false;
      data: null;
      errorCode: string;
      traceId: string;
    };
