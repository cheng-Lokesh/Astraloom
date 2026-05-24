import type {
  BillingSupportDraft,
  PaymentEntitlementDraft,
  SupportTicketDraft,
  SupportTicketType,
} from "@/types/billing-support";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function buildPaymentEntitlementDraft(): PaymentEntitlementDraft {
  const now = new Date().toISOString();

  return {
    id: `payment_${hashText("stripe-placeholder")}`,
    provider: "stripe",
    providerPaymentId: null,
    amountCents: 0,
    currency: "usd",
    status: "not_configured",
    entitlementType: "none",
    entitlementStatus: "none",
    createdAt: now,
    updatedAt: now,
  };
}

export function activatePlaceholderEntitlement(
  payment: PaymentEntitlementDraft,
) {
  return {
    ...payment,
    status: "placeholder" as const,
    entitlementType: "single_simulation_report" as const,
    entitlementStatus: "placeholder_active" as const,
    updatedAt: new Date().toISOString(),
  };
}

export function markCheckoutCreated(
  payment: PaymentEntitlementDraft,
  providerPaymentId: string,
) {
  return {
    ...payment,
    providerPaymentId,
    amountCents: 990,
    status: "checkout_created" as const,
    entitlementType: "none" as const,
    entitlementStatus: "checkout_pending" as const,
    updatedAt: new Date().toISOString(),
  };
}

export function blockPlaceholderEntitlement(payment: PaymentEntitlementDraft) {
  return {
    ...payment,
    status: "blocked" as const,
    entitlementType: "none" as const,
    entitlementStatus: "blocked" as const,
    updatedAt: new Date().toISOString(),
  };
}

export function buildBillingSupportDraft(): BillingSupportDraft {
  const now = new Date().toISOString();

  return {
    payment: buildPaymentEntitlementDraft(),
    tickets: [],
    unlockIntents: [],
    updatedAt: now,
  };
}

export function createSupportTicket(
  ticketType: SupportTicketType,
  summary: string,
  relatedReportId: string | null,
): SupportTicketDraft {
  const now = new Date().toISOString();

  return {
    id: `ticket_${hashText(`${ticketType}:${summary}:${now}`)}`,
    ticketType,
    status: "open",
    priority:
      ticketType === "deletion_request"
        ? "p1"
        : ticketType === "unlock_intent"
          ? "p3"
          : "p2",
    relatedReportId,
    summary,
    createdAt: now,
    updatedAt: now,
  };
}
