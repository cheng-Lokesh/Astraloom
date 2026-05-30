"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { Button, SurfaceCard } from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";
import {
  deleteLocalSupportDraft,
  listLocalSupportDrafts,
  saveLocalSupportDraft,
  type LocalSupportDraft,
} from "@/lib/support/support-drafts";
import {
  createPrivacyDeleteRequest,
  listSupportTickets,
  saveSupportTicket,
} from "@/lib/support/support-repository";
import type {
  SupportTicketDraft,
  SupportTicketType,
} from "@/lib/support/support-types";

const ticketTypes: Array<{
  value: SupportTicketType;
  label: string;
  zhLabel: string;
  helper: string;
  zhHelper: string;
}> = [
  {
    value: "generation_failure",
    label: "Generation failure",
    zhLabel: "生成失败",
    helper: "Report a failed graph, simulation, claim, or report generation.",
    zhHelper: "报告关系图、推演、关键发现或报告生成失败。",
  },
  {
    value: "safety_appeal",
    label: "Safety appeal",
    zhLabel: "安全申诉",
    helper: "Ask for review when a safety adjustment seems too restrictive.",
    zhHelper: "当安全调整看起来过于限制时，请求复核。",
  },
  {
    value: "privacy_delete_request",
    label: "Privacy delete request",
    zhLabel: "隐私删除请求",
    helper: "Record an auditable request. No deletion is executed here.",
    zhHelper: "记录一条可审计请求。这里不会执行删除。",
  },
  {
    value: "general_support",
    label: "General support",
    zhLabel: "一般支持",
    helper: "Ask a product or account support question.",
    zhHelper: "提出产品或账户支持问题。",
  },
  {
    value: "billing_question",
    label: "Billing question",
    zhLabel: "账单问题",
    helper: "Placeholder for unlock or receipt questions. No payment action runs.",
    zhHelper: "用于解锁或收据问题的占位请求。不会运行支付操作。",
  },
];

function trackingCode(ticket: SupportTicketDraft) {
  const compact = ticket.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `AL-${compact || "LOCAL1"}`;
}

export default function SupportPage() {
  const { locale } = useLanguage();
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [simulationRun] = useState(() => {
    if (!seedContext) return null;
    const result = repos.simulations.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [claimLedger] = useState(() => {
    if (!seedContext) return null;
    const result = repos.reports.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [safetyReview] = useState(() => {
    if (!seedContext) return null;
    const result = repos.safetyReviews.load(seedContext.id);
    return result.ok ? result.data : null;
  });

  const [ticketType, setTicketType] =
    useState<SupportTicketType>("generation_failure");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [relatedReportId, setRelatedReportId] = useState(
    claimLedger?.simulationRunId ?? "",
  );
  const [relatedSimulationId, setRelatedSimulationId] = useState(
    simulationRun?.id ?? "",
  );
  const [editingDraftId, setEditingDraftId] = useState("");
  const [status, setStatus] = useState("");
  const [drafts, setDrafts] = useState<LocalSupportDraft[]>(() =>
    listLocalSupportDrafts(),
  );
  const [tickets, setTickets] = useState<SupportTicketDraft[]>(() => {
    const result = listSupportTickets();
    return result.ok ? result.data : [];
  });

  const safetyContext = useMemo(() => {
    if (!safetyReview) return "No saved safety review is available yet.";
    return `Current safety level: ${safetyReview.safetyLevel}. Reason: ${safetyReview.reportBlockedReason}`;
  }, [safetyReview]);

  function selectTicketType(nextType: SupportTicketType) {
    setTicketType(nextType);
    setSubject(ticketTypes.find((item) => item.value === nextType)?.label ?? "");
    if (nextType === "safety_appeal") {
      setMessage(safetyContext);
    } else if (nextType === "privacy_delete_request") {
      setMessage(
        "Please record a privacy deletion request for my local or account data. I understand this screen does not execute deletion.",
      );
    } else if (nextType === "billing_question") {
      setMessage(
        "I have a question about unlock status or billing placeholder behavior. No payment action should be taken from this request.",
      );
    }
  }

  function resetForm() {
    setEditingDraftId("");
    setSubject("");
    setMessage("");
    setRelatedReportId(claimLedger?.simulationRunId ?? "");
    setRelatedSimulationId(simulationRun?.id ?? "");
  }

  function saveDraft() {
    const draft = saveLocalSupportDraft({
      id: editingDraftId || undefined,
      ticketType,
      subject,
      message,
      relatedReportId,
      relatedSimulationId,
    });
    setEditingDraftId(draft.id);
    setDrafts(listLocalSupportDrafts());
    setStatus("Support draft saved locally in this browser.");
  }

  function loadDraft(draft: LocalSupportDraft) {
    setEditingDraftId(draft.id);
    setTicketType(draft.ticketType);
    setSubject(draft.subject);
    setMessage(draft.message);
    setRelatedReportId(draft.relatedReportId);
    setRelatedSimulationId(draft.relatedSimulationId);
    setStatus("Draft loaded for editing.");
  }

  function deleteDraft(id: string) {
    deleteLocalSupportDraft(id);
    setDrafts(listLocalSupportDrafts());
    if (editingDraftId === id) resetForm();
    setStatus("Local support draft removed.");
  }

  function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      ticketType,
      subject: subject.trim(),
      message: message.trim(),
      relatedReportId: relatedReportId.trim() || null,
      relatedSimulationId: relatedSimulationId.trim() || null,
      source: "support_page" as const,
    };
    const result =
      ticketType === "privacy_delete_request"
        ? createPrivacyDeleteRequest(input)
        : saveSupportTicket(input);

    if (!result.ok) {
      setStatus(`Local ticket was not saved: ${result.errorCode}`);
      return;
    }

    if (editingDraftId) deleteLocalSupportDraft(editingDraftId);
    const nextTickets = listSupportTickets();
    setTickets(nextTickets.ok ? nextTickets.data : []);
    setDrafts(listLocalSupportDrafts());
    resetForm();
    const ticket =
      "ticket" in result.data ? result.data.ticket : result.data;
    setStatus(
      `${trackingCode(ticket)} saved locally. This does not execute refunds, deletion, payment, or production writes.`,
    );
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <main className="space-y-6">
          <SurfaceCard emphasis="strong" className="p-6">
            <StatusPill tone="planned">Support</StatusPill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              Local support drafts and safe requests.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
              This page records local support tickets and drafts. It does not
              execute refunds, payments, production deletion, or admin actions.
            </p>
          </SurfaceCard>

          <section className="grid gap-3 md:grid-cols-2">
            {ticketTypes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => selectTicketType(item.value)}
                className={`rounded-lg border p-5 text-left transition ${
                  ticketType === item.value
                    ? "border-[#568262] bg-[#eef5ee]"
                    : "border-black/8 bg-white hover:border-[#568262]/40"
                }`}
              >
                <h2 className="text-sm font-semibold text-[#11150f]">
                  {locale === "zh" ? item.zhLabel : item.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {locale === "zh" ? item.zhHelper : item.helper}
                </p>
              </button>
            ))}
          </section>

          <form
            onSubmit={submitTicket}
            className="rounded-lg border border-black/8 bg-white p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  Request details
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  Keep only the context needed for support. Avoid unnecessary
                  private source text.
                </p>
              </div>
              <StatusPill tone={editingDraftId ? "active" : "planned"}>
                {editingDraftId ? "editing draft" : "new draft"}
              </StatusPill>
            </div>

            {ticketType === "safety_appeal" ? (
              <div className="mt-4 rounded-md border border-[#8c6bb1]/25 bg-[#f4effa] p-4 text-sm leading-6 text-[#4b3568]">
                {safetyContext}
              </div>
            ) : null}
            {ticketType === "billing_question" ? (
              <div className="mt-4 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
                Billing questions are placeholders in local MVP. This screen
                cannot issue payments, refunds, or receipt changes.
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Ticket type
                </span>
                <select
                  value={ticketType}
                  onChange={(event) =>
                    selectTicketType(event.target.value as SupportTicketType)
                  }
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                >
                  {ticketTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {locale === "zh" ? item.zhLabel : item.label}
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
                placeholder="Describe the issue. Local support tickets store only a short preview in summaries."
              />
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="submit" className="px-5 py-3">
                Save local ticket
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={saveDraft}
                className="px-5 py-3"
              >
                Save draft
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                className="px-5 py-3"
              >
                Clear form
              </Button>
            </div>
            {status ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{status}</p>
            ) : null}
          </form>
        </main>

        <aside className="h-fit space-y-5">
          <SurfaceCard emphasis="dark" className="p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              Local submitted tickets
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Tickets" value={tickets.length} />
              <Metric
                label="Delete"
                value={
                  tickets.filter(
                    (ticket) =>
                      ticket.ticketType === "privacy_delete_request",
                  ).length
                }
              />
            </div>
            <div className="mt-5 space-y-3">
              {tickets.length === 0 ? (
                <p className="text-sm leading-6 text-white/56">
                  Saved local tickets will appear here with a short preview and
                  tracking code.
                </p>
              ) : null}
              {tickets.slice(0, 6).map((ticket) => (
                <article
                  key={ticket.id}
                  className="rounded-md border border-white/10 bg-white/[0.06] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-white">
                      {trackingCode(ticket)}
                    </span>
                    <StatusPill tone={ticket.priority === "p1" ? "caution" : "planned"}>
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
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              Drafts
            </h2>
            <div className="mt-4 space-y-3">
              {drafts.length === 0 ? (
                <p className="rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
                  Save a draft if you need to come back before submitting.
                </p>
              ) : null}
              {drafts.map((draft) => (
                <article
                  key={draft.id}
                  className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    {draft.ticketType}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#11150f]">
                    {draft.subject || "Untitled draft"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => loadDraft(draft)}
                      className="px-3 py-2"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => deleteDraft(draft.id)}
                      className="px-3 py-2"
                    >
                      Remove
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </SurfaceCard>
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
