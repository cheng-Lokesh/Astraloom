"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import type {
  SupportTicketAdminSummary,
  SupportTicketStatus,
} from "@/lib/support/support-types";

type AdminTicketsResponse = {
  ok: boolean;
  trace_id: string;
  tickets?: SupportTicketAdminSummary[];
  ticket?: SupportTicketAdminSummary;
  error_code?: string;
  claims_mutable?: false;
  event_logs_mutable?: false;
  sensitive_input_hidden?: true;
};

const statusOptions: SupportTicketStatus[] = [
  "open",
  "triaged",
  "in_review",
  "resolved",
  "closed",
];

export default function AdminPage() {
  const [tickets, setTickets] = useState<SupportTicketAdminSummary[]>([]);
  const [message, setMessage] = useState(
    "Enter the admin token to load the protected support queue.",
  );
  const [adminToken, setAdminToken] = useState("");
  const [filter, setFilter] = useState<
    "all" | "generation_failure" | "safety_appeal"
  >("all");

  const filteredTickets = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((ticket) => ticket.ticketType === filter);
  }, [filter, tickets]);

  async function loadTickets() {
    const response = await fetch("/api/admin/support-tickets", {
      headers: { "x-mirofish-admin-token": adminToken },
    }).catch(() => null);
    const payload = response
      ? ((await response.json().catch(() => null)) as AdminTicketsResponse | null)
      : null;

    if (!response?.ok || !payload?.ok || !payload.tickets) {
      setMessage(`Could not load tickets: ${payload?.error_code ?? "request_failed"}`);
      return;
    }

    setTickets(payload.tickets);
    setMessage("Support tickets loaded. Sensitive source text is hidden.");
  }

  async function markStatus(ticketId: string, status: SupportTicketStatus) {
    const response = await fetch("/api/admin/support-tickets", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-mirofish-admin-token": adminToken,
      },
      body: JSON.stringify({ ticketId, status }),
    }).catch(() => null);
    const payload = response
      ? ((await response.json().catch(() => null)) as AdminTicketsResponse | null)
      : null;

    if (!response?.ok || !payload?.ok || !payload.ticket) {
      setMessage(`Status update failed: ${payload?.error_code ?? "request_failed"}`);
      return;
    }

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === payload.ticket!.id ? payload.ticket! : ticket,
      ),
    );
    setMessage("Ticket status updated. Claim and EventLog records remain read-only.");
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="planned">Admin/Ops</StatusPill>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Minimal support operations console
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Ops can review ticket metadata, generation failures, and safety
            appeals. This console does not expose unnecessary sensitive input
            text and cannot modify Claim or EventLog records.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <input
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              type="password"
              placeholder="Admin token"
              className="min-w-56 rounded-md border border-black/10 bg-white px-4 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262]"
            />
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={filterButtonClass(filter === "all")}
            >
              All tickets
            </button>
            <button
              type="button"
              onClick={() => setFilter("generation_failure")}
              className={filterButtonClass(filter === "generation_failure")}
            >
              Generation failures
            </button>
            <button
              type="button"
              onClick={() => setFilter("safety_appeal")}
              className={filterButtonClass(filter === "safety_appeal")}
            >
              Safety appeals
            </button>
            <button
              type="button"
              onClick={() => void loadTickets()}
              className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
            >
              Load queue
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Tickets" value={tickets.length} />
          <Metric
            label="Failures"
            value={
              tickets.filter(
                (ticket) => ticket.ticketType === "generation_failure",
              ).length
            }
          />
          <Metric
            label="Appeals"
            value={
              tickets.filter((ticket) => ticket.ticketType === "safety_appeal")
                .length
            }
          />
          <Metric
            label="Delete"
            value={
              tickets.filter(
                (ticket) => ticket.ticketType === "privacy_delete_request",
              ).length
            }
          />
        </section>

        <section className="rounded-lg border border-black/8 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#11150f]">
              Ticket queue
            </h2>
            <button
              type="button"
              onClick={() => void loadTickets()}
              className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
            >
              Refresh
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">{message}</p>
          <div className="mt-5 space-y-3">
            {filteredTickets.length === 0 ? (
              <p className="rounded-md bg-[#f7f8f4] p-4 text-sm text-[#62695d]">
                No tickets in this view.
              </p>
            ) : null}
            {filteredTickets.map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-lg border border-black/8 bg-[#f7f8f4] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        tone={ticket.priority === "p1" ? "blocked" : "planned"}
                      >
                        {ticket.ticketType}
                      </StatusPill>
                      <StatusPill tone="ready">{ticket.status}</StatusPill>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-[#11150f]">
                      {ticket.subject}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62695d]">
                      {ticket.messagePreview}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-[#7d8578] md:grid-cols-2">
                      <code>report: {ticket.relatedReportId ?? "none"}</code>
                      <code>
                        simulation: {ticket.relatedSimulationId ?? "none"}
                      </code>
                      <code>trace: {ticket.traceId}</code>
                      <code>input: hidden unless required</code>
                    </div>
                  </div>
                  <label className="block min-w-44">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                      Status
                    </span>
                    <select
                      value={ticket.status}
                      onChange={(event) =>
                        void markStatus(
                          ticket.id,
                          event.target.value as SupportTicketStatus,
                        )
                      }
                      className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f]"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}

function filterButtonClass(active: boolean) {
  return `rounded-md px-4 py-2 text-sm font-semibold ${
    active
      ? "bg-[#11150f] text-white"
      : "border border-black/10 bg-white text-[#11150f]"
  }`;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}
