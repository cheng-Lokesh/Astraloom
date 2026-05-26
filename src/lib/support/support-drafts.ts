import type { SupportTicketType } from "./support-types";

export type LocalSupportDraft = {
  id: string;
  ticketType: SupportTicketType;
  subject: string;
  message: string;
  relatedReportId: string;
  relatedSimulationId: string;
  createdAt: string;
  updatedAt: string;
};

const supportDraftsKey = "mirofish.support.drafts";

function draftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `draft_${crypto.randomUUID()}`;
  }

  return `draft_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function readDrafts() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(supportDraftsKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalSupportDraft[];
  } catch {
    window.localStorage.removeItem(supportDraftsKey);
    return [];
  }
}

function writeDrafts(drafts: LocalSupportDraft[]) {
  if (typeof window === "undefined") return drafts;
  window.localStorage.setItem(supportDraftsKey, JSON.stringify(drafts));
  return drafts;
}

export function listLocalSupportDrafts() {
  return readDrafts();
}

export function saveLocalSupportDraft(
  input: Omit<LocalSupportDraft, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
) {
  const now = new Date().toISOString();
  const drafts = readDrafts();
  const existing = input.id
    ? drafts.find((draft) => draft.id === input.id)
    : null;
  const nextDraft: LocalSupportDraft = {
    id: input.id || draftId(),
    ticketType: input.ticketType,
    subject: input.subject.trim(),
    message: input.message.trim(),
    relatedReportId: input.relatedReportId.trim(),
    relatedSimulationId: input.relatedSimulationId.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const nextDrafts = [
    nextDraft,
    ...drafts.filter((draft) => draft.id !== nextDraft.id),
  ];
  writeDrafts(nextDrafts);
  return nextDraft;
}

export function deleteLocalSupportDraft(id: string) {
  writeDrafts(readDrafts().filter((draft) => draft.id !== id));
}

export function clearLocalSupportDrafts() {
  writeDrafts([]);
}
