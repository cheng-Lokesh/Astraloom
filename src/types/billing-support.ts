export type PaymentEntitlementStatus =
  | "none"
  | "placeholder_active"
  | "blocked";

export type PaymentStatus = "not_configured" | "placeholder" | "blocked";

export type EntitlementType = "none" | "single_simulation_report";

export type PaymentEntitlementDraft = {
  id: string;
  provider: "stripe";
  providerPaymentId: string | null;
  amountCents: 0;
  currency: "usd";
  status: PaymentStatus;
  entitlementType: EntitlementType;
  entitlementStatus: PaymentEntitlementStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketType =
  | "refund_request"
  | "deletion_request"
  | "general_support";

export type SupportTicketStatus = "draft" | "open";

export type SupportTicketPriority = "p1" | "p2" | "p3";

export type SupportTicketDraft = {
  id: string;
  ticketType: SupportTicketType;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  relatedReportId: string | null;
  summary: string;
  createdAt: string;
  updatedAt: string;
};

export type BillingSupportDraft = {
  payment: PaymentEntitlementDraft;
  tickets: SupportTicketDraft[];
  updatedAt: string;
};
