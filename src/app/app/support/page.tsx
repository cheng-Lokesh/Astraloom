"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import type {
  SupportTicketAdminSummary,
  SupportTicketType,
} from "@/lib/support/support-types";

const ticketTypes: Array<{
  value: SupportTicketType;
  label: string;
  helper: string;
}> = [
  {
    value: "generation_failure",
    label: "Generation failure",
    helper: "Report a failed graph, simulation, claim, or report generation.",
  },
  {
    value: "refund_request",
    label: "Refund request",
    helper: "Record a refund request for manual review. No real refund is issued here.",
  },
  {
    value: "privacy_delete_request",
    label: "Delete data request",
    helper: "Create an auditable deletion request. Data is not hard-deleted automatically.",
  },
  {
    value: "safety_appeal",
    label: "Safety appeal",
    helper: "Ask for review when a safety downgrade seems too restrictive.",
  },
  {
    value: "billing_question",
    label: "Billing question",
    helper: "Ask about unlock status, receipts, or billing confusion.",
  },
  {
    value: "general_support",
    label: "General support",
    helper: "Ask a product or account support question.",
  },
];

type ApiTicketResponse = {
  ok: boolean;
  trace_id: string;
  ticket?: SupportTicketAdminSummary;
  error_code?: string;
};

export default function SupportPage() {
  const [ticketType, setTicketType] =
    useState<SupportTicketType>("generation_failure");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [relatedReportId, setRelatedReportId] = useState("");
  const [relatedSimulationId, setRelatedSimulationId] = useState("");
  const [status, setStatus] = useState("");
  const [tickets, setTickets] = useState<SupportTicketAdminSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    const endpoint =
      ticketType === "privacy_delete_request"
        ? "/api/privacy/delete-request"
        : "/api/support/create";

    const body =
      ticketType === "privacy_delete_request"
        ? {
            subject: subject.trim() || "Delete data request",
            message,
            relatedReportId: relatedReportId.trim() || null,
            relatedSimulationId: relatedSimulationId.trim() || null,
          }
        : {
            ticketType,
            subject,
            message,
            relatedReportId: relatedReportId.trim() || null,
            relatedSimulationId: relatedSimulationId.trim() || null,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);

    if (!response) {
      setIsSubmitting(false);
      setStatus("Ticket could not be submitted. Please try again.");
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | ApiTicketResponse
      | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok || !payload.ticket) {
      setStatus(`Ticket failed: ${payload?.error_code ?? "request_failed"}`);
      return;
    }

    setTickets((current) => [payload.ticket!, ...current]);
    setSubject("");
    setMessage("");
    setRelatedReportId("");
    setRelatedSimulationId("");
    setStatus(
      ticketType === "privacy_delete_request"
        ? "Delete request recorded. This does not directly hard-delete data."
        : "Support ticket created.",
    );
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <StatusPill tone="planned">Support</StatusPill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              Support, refund, and data deletion requests
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
              Submit a support ticket for product issues, refund review, safety
              review, billing questions, or deletion requests. MiroFish is not
              medical, legal, investment, or psychotherapy advice.
            </p>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            {ticketTypes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setTicketType(item.value);
                  setSubject(item.label);
                }}
                className={`rounded-lg border p-5 text-left transition ${
                  ticketType === item.value
                    ? "border-[#568262] bg-[#eef5ee]"
                    : "border-black/8 bg-white hover:border-[#568262]/40"
                }`}
              >
                <h2 className="text-sm font-semibold text-[#11150f]">
                  {item.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {item.helper}
                </p>
              </button>
            ))}
          </section>

          <form
            onSubmit={submitTicket}
            className="rounded-lg border border-black/8 bg-white p-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Ticket type
                </span>
                <select
                  value={ticketType}
                  onChange={(event) =>
                    setTicketType(event.target.value as SupportTicketType)
                  }
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                >
                  {ticketTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Subject
                </span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                  placeholder="Short issue title"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Related report id
                </span>
                <input
                  value={relatedReportId}
                  onChange={(event) => setRelatedReportId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                  placeholder="Optional"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Related simulation id
                </span>
                <input
                  value={relatedSimulationId}
                  onChange={(event) =>
                    setRelatedSimulationId(event.target.value)
                  }
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                  placeholder="Optional"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                Message
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-3 text-sm leading-6 text-[#11150f] outline-none focus:border-[#568262]"
                placeholder="Describe the issue. Avoid adding unnecessary private source text."
              />
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit request"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTicketType("refund_request");
                  setSubject("Refund request");
                  setMessage("Please review this report unlock for refund eligibility.");
                }}
                className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f]"
              >
                Refund shortcut
              </button>
              <button
                type="button"
                onClick={() => {
                  setTicketType("privacy_delete_request");
                  setSubject("Delete data request");
                  setMessage("Please record a deletion request for my account or selected run.");
                }}
                className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f]"
              >
                Delete request shortcut
              </button>
            </div>
            {status ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{status}</p>
            ) : null}
          </form>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            Submitted requests
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Tickets" value={tickets.length} />
            <Metric
              label="Delete"
              value={
                tickets.filter(
                  (ticket) => ticket.ticketType === "privacy_delete_request",
                ).length
              }
            />
          </div>
          <div className="mt-5 space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm leading-6 text-white/56">
                New requests will appear here with only a short preview.
              </p>
            ) : null}
            {tickets.map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-md border border-white/10 bg-white/[0.06] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-white">
                    {ticket.ticketType}
                  </span>
                  <StatusPill tone={ticket.priority === "p1" ? "blocked" : "planned"}>
                    {ticket.status}
                  </StatusPill>
                </div>
                <p className="mt-2 text-xs font-semibold text-white/80">
                  {ticket.subject}
                </p>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-white/52">
                  {ticket.messagePreview}
                </p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs text-white/48">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
