import type {
  ConsentEventDraft,
  SupportRepositoryResult,
  SupportRepositorySnapshot,
  SupportTicketAdminSummary,
  SupportTicketDraft,
  SupportTicketInput,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketType,
} from "./support-types";

const supportStorageKey = "mirofish.support.repository";

const supportTypes = new Set<SupportTicketType>([
  "generation_failure",
  "refund_request",
  "safety_appeal",
  "privacy_delete_request",
  "billing_question",
  "general_support",
]);

const supportStatuses = new Set<SupportTicketStatus>([
  "open",
  "triaged",
  "in_review",
  "resolved",
  "closed",
]);

type GlobalSupportStore = {
  snapshot?: SupportRepositorySnapshot;
};

function traceId(prefix = "support") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function ok<T>(data: T, id = traceId()): SupportRepositoryResult<T> {
  return {
    ok: true,
    data,
    errorCode: null,
    traceId: id,
  };
}

function fail<T>(errorCode: string, id = traceId()): SupportRepositoryResult<T> {
  return {
    ok: false,
    data: null,
    errorCode,
    traceId: id,
  };
}

function createEmptySnapshot(): SupportRepositorySnapshot {
  return {
    tickets: [],
    consentEvents: [],
    updatedAt: new Date().toISOString(),
  };
}

function getServerStore() {
  const globalStore = globalThis as typeof globalThis & {
    __mirofishSupportStore?: GlobalSupportStore;
  };
  globalStore.__mirofishSupportStore ??= {};
  globalStore.__mirofishSupportStore.snapshot ??= createEmptySnapshot();
  return globalStore.__mirofishSupportStore.snapshot;
}

function loadSnapshot(): SupportRepositorySnapshot {
  if (typeof window === "undefined") {
    return getServerStore();
  }

  const raw = window.localStorage.getItem(supportStorageKey);
  if (!raw) return createEmptySnapshot();

  try {
    return JSON.parse(raw) as SupportRepositorySnapshot;
  } catch {
    window.localStorage.removeItem(supportStorageKey);
    return createEmptySnapshot();
  }
}

function saveSnapshot(snapshot: SupportRepositorySnapshot) {
  if (typeof window === "undefined") {
    const serverStore = getServerStore();
    serverStore.tickets = snapshot.tickets;
    serverStore.consentEvents = snapshot.consentEvents;
    serverStore.updatedAt = snapshot.updatedAt;
    return;
  }

  window.localStorage.setItem(supportStorageKey, JSON.stringify(snapshot));
}

function normalizeText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function messagePreview(message: string) {
  const normalized = normalizeText(message, 220);
  return normalized.length > 0 ? normalized : "No message preview provided.";
}

function priorityForType(ticketType: SupportTicketType): SupportTicketPriority {
  if (
    ticketType === "privacy_delete_request" ||
    ticketType === "safety_appeal" ||
    ticketType === "generation_failure"
  ) {
    return "p1";
  }

  if (ticketType === "refund_request" || ticketType === "billing_question") {
    return "p2";
  }

  return "p3";
}

function validateInput(input: SupportTicketInput) {
  if (!supportTypes.has(input.ticketType)) return "invalid_ticket_type";
  if (normalizeText(input.subject, 160).length < 3) return "invalid_subject";
  if (normalizeText(input.message, 4000).length < 3) return "invalid_message";
  return null;
}

function toAdminSummary(ticket: SupportTicketDraft): SupportTicketAdminSummary {
  return {
    id: ticket.id,
    userId: ticket.userId,
    ticketType: ticket.ticketType,
    status: ticket.status,
    priority: ticket.priority,
    subject: ticket.subject,
    messagePreview: ticket.messagePreview,
    relatedReportId: ticket.relatedReportId,
    relatedSimulationId: ticket.relatedSimulationId,
    traceId: ticket.traceId,
    source: ticket.source,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    sensitiveInputHidden: true,
  };
}

export function createSupportTicketDraft(
  input: SupportTicketInput,
  id = traceId("support_ticket"),
): SupportRepositoryResult<SupportTicketDraft> {
  const validationError = validateInput(input);
  if (validationError) return fail(validationError, id);

  const now = new Date().toISOString();
  const ticket: SupportTicketDraft = {
    id: `ticket_${id.replace(/[^a-zA-Z0-9_]/g, "_")}`,
    userId: normalizeText(input.userId ?? "local_user", 120) || "local_user",
    ticketType: input.ticketType,
    status: "open",
    priority: priorityForType(input.ticketType),
    subject: normalizeText(input.subject, 160),
    message: normalizeText(input.message, 4000),
    messagePreview: messagePreview(input.message),
    relatedReportId: normalizeText(input.relatedReportId ?? "", 120) || null,
    relatedSimulationId:
      normalizeText(input.relatedSimulationId ?? "", 120) || null,
    traceId: id,
    source: input.source ?? "support_page",
    createdAt: now,
    updatedAt: now,
  };

  return ok(ticket, id);
}

export function saveSupportTicket(
  input: SupportTicketInput,
): SupportRepositoryResult<SupportTicketDraft> {
  const id = traceId("support_create");
  const draft = createSupportTicketDraft(input, id);
  if (!draft.ok) return draft;

  const snapshot = loadSnapshot();
  const nextSnapshot = {
    ...snapshot,
    tickets: [draft.data, ...snapshot.tickets],
    updatedAt: new Date().toISOString(),
  };
  saveSnapshot(nextSnapshot);

  return ok(draft.data, id);
}

export function createPrivacyDeleteRequest(
  input: Omit<SupportTicketInput, "ticketType" | "source">,
): SupportRepositoryResult<{
  ticket: SupportTicketDraft;
  consentEvent: ConsentEventDraft;
}> {
  const id = traceId("privacy_delete");
  const ticketResult = createSupportTicketDraft(
    {
      ...input,
      ticketType: "privacy_delete_request",
      source: "delete_request_api",
    },
    id,
  );

  if (!ticketResult.ok) return ticketResult;

  const now = new Date().toISOString();
  const consentEvent: ConsentEventDraft = {
    id: `consent_${id.replace(/[^a-zA-Z0-9_]/g, "_")}`,
    userId: ticketResult.data.userId,
    consentType: "privacy_delete_request",
    status: "requested",
    source: "delete_request_api",
    relatedTicketId: ticketResult.data.id,
    traceId: id,
    metadata: {
      relatedReportId: ticketResult.data.relatedReportId,
      relatedSimulationId: ticketResult.data.relatedSimulationId,
    },
    createdAt: now,
    updatedAt: now,
  };

  const snapshot = loadSnapshot();
  saveSnapshot({
    tickets: [ticketResult.data, ...snapshot.tickets],
    consentEvents: [consentEvent, ...snapshot.consentEvents],
    updatedAt: now,
  });

  return ok({ ticket: ticketResult.data, consentEvent }, id);
}

export function listSupportTickets(): SupportRepositoryResult<
  SupportTicketDraft[]
> {
  const id = traceId("support_list");
  return ok(loadSnapshot().tickets, id);
}

export function listAdminSupportTickets(): SupportRepositoryResult<
  SupportTicketAdminSummary[]
> {
  const id = traceId("admin_support_list");
  return ok(loadSnapshot().tickets.map(toAdminSummary), id);
}

export function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
): SupportRepositoryResult<SupportTicketAdminSummary> {
  const id = traceId("admin_support_status");
  if (!supportStatuses.has(status)) return fail("invalid_ticket_status", id);

  const snapshot = loadSnapshot();
  const ticketIndex = snapshot.tickets.findIndex(
    (ticket) => ticket.id === ticketId,
  );

  if (ticketIndex < 0) return fail("support_ticket_not_found", id);

  const nextTicket = {
    ...snapshot.tickets[ticketIndex],
    status,
    updatedAt: new Date().toISOString(),
  };
  const tickets = [...snapshot.tickets];
  tickets[ticketIndex] = nextTicket;
  saveSnapshot({
    ...snapshot,
    tickets,
    updatedAt: nextTicket.updatedAt,
  });

  return ok(toAdminSummary(nextTicket), id);
}
