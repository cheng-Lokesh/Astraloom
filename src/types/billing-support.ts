export type PaymentEntitlementStatus =
  | "none"
  | "placeholder_active"
  | "blocked"
  | "checkout_pending"
  | "active";

export type PaymentStatus =
  | "not_configured"
  | "placeholder"
  | "blocked"
  | "checkout_ready"
  | "checkout_created"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export type EntitlementType = "none" | "single_simulation_report";

export type PaymentEntitlementDraft = {
  id: string;
  provider: "stripe";
  providerPaymentId: string | null;
  amountCents: number;
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
  | "general_support"
  | "unlock_intent";

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
  unlockIntents?: SupportTicketDraft[];
  updatedAt: string;
};
