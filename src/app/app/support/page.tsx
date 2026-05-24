"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { buildBillingSupportDraft, createSupportTicket } from "@/lib/billing/build";
import {
  clearBillingSupportDraft,
  loadBillingSupportDraft,
  saveBillingSupportDraft,
} from "@/lib/billing/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import type {
  BillingSupportDraft,
  SupportTicketType,
} from "@/types/billing-support";

const supportTypes: Array<{
  type: SupportTicketType;
  title: string;
  body: string;
}> = [
  {
    type: "general_support",
    title: "Generation failure",
    body: "Use when local run, graph, event, or claim output looks broken.",
  },
  {
    type: "refund_request",
    title: "Refund request",
    body: "Visible before real payment launch so commercial risk is explicit.",
  },
  {
    type: "deletion_request",
    title: "Privacy deletion request",
    body: "Records a local deletion request for the current simulation context.",
  },
  {
    type: "general_support",
    title: "Safety review",
    body: "Use when the safety downgrade or report boundary needs review.",
  },
];

export default function SupportPage() {
  const [seedContext] = useState(() => loadSeedContextDraft());
  const [billing, setBilling] = useState<BillingSupportDraft>(
    () => loadBillingSupportDraft() ?? buildBillingSupportDraft(),
  );
  const [ticketType, setTicketType] = useState<SupportTicketType>("general_support");
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState("");

  function persist(nextBilling: BillingSupportDraft, nextMessage: string) {
    saveBillingSupportDraft(nextBilling);
    setBilling(nextBilling);
    setMessage(nextMessage);
  }

  function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedSummary = summary.trim();
    if (trimmedSummary.length < 8) {
      setMessage("Add a short description so the support ticket is usable.");
      return;
    }

    const ticket = createSupportTicket(
      ticketType,
      [
        `summary: ${trimmedSummary}`,
        `question: ${seedContext?.questionText ?? "not provided"}`,
      ].join("\n"),
      null,
    );

    persist(
      {
        ...billing,
        tickets: [ticket, ...billing.tickets],
        updatedAt: new Date().toISOString(),
      },
      "Support ticket recorded locally.",
    );
    setSummary("");
  }

  function quickTicket(type: SupportTicketType, text: string) {
    const ticket = createSupportTicket(
      type,
      [`summary: ${text}`, `question: ${seedContext?.questionText ?? "not provided"}`].join("\n"),
      null,
    );
    persist(
      {
        ...billing,
        tickets: [ticket, ...billing.tickets],
        updatedAt: new Date().toISOString(),
      },
      `${text} recorded locally.`,
    );
  }

  function reset() {
    clearBillingSupportDraft();
    setBilling(buildBillingSupportDraft());
    setMessage("Local support ledger reset.");
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <StatusPill tone="planned">Support ledger</StatusPill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              Failure, refund, deletion, and safety review are first-class MVP paths.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
              This page records local support tickets. It does not send data to a
              server yet, but it makes the required commercial and privacy
              boundary visible before real payment launch.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            {supportTypes.map((item) => (
              <button
                key={`${item.type}:${item.title}`}
                type="button"
                onClick={() => {
                  setTicketType(item.type);
                  setSummary(item.title);
                }}
                className="rounded-lg border border-black/8 bg-white p-5 text-left transition hover:border-[#568262]/40 hover:bg-[#eef5ee]"
              >
                <h2 className="text-sm font-semibold text-[#11150f]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {item.body}
                </p>
              </button>
            ))}
          </section>

          <form
            onSubmit={submitTicket}
            className="rounded-lg border border-black/8 bg-white p-6"
          >
            <h2 className="text-base font-semibold text-[#11150f]">
              Create support ticket
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[240px_1fr]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Type
                </span>
                <select
                  value={ticketType}
                  onChange={(event) =>
                    setTicketType(event.target.value as SupportTicketType)
                  }
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                >
                  <option value="general_support">general_support</option>
                  <option value="refund_request">refund_request</option>
                  <option value="deletion_request">deletion_request</option>
                  <option value="unlock_intent">unlock_intent</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Summary
                </span>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={4}
                  placeholder="Describe what happened or what you want reviewed."
                  className="mt-2 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-3 text-sm leading-6 text-[#11150f] outline-none focus:border-[#568262]"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white"
              >
                Save ticket
              </button>
              <button
                type="button"
                onClick={() =>
                  quickTicket("deletion_request", "Delete current simulation data")
                }
                className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#11150f]"
              >
                Quick deletion request
              </button>
              <button
                type="button"
                onClick={() => quickTicket("refund_request", "Refund request")}
                className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#11150f]"
              >
                Quick refund request
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
            ) : null}
          </form>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            Local ticket ledger
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Tickets" value={billing.tickets.length} />
            <Metric label="Unlocks" value={billing.unlockIntents?.length ?? 0} />
          </div>
          <div className="mt-5 space-y-3">
            {billing.tickets.slice(0, 6).map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-md border border-white/10 bg-white/[0.06] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-white">
                    {ticket.ticketType}
                  </span>
                  <StatusPill tone={ticket.priority === "p1" ? "blocked" : "planned"}>
                    {ticket.priority}
                  </StatusPill>
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/52">
                  {ticket.summary}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            <Link
              href="/app/settings"
              className="inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Reset local tickets
            </button>
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
