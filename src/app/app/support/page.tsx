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
    helper:
      "Report a failed relation structure, sandbox run, finding, or report generation.",
    zhHelper: "报告关系结构、推演、关键发现或报告生成失败。",
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
    zhHelper: "提出产品或账号支持问题。",
  },
  {
    value: "billing_question",
    label: "Billing question",
    zhLabel: "账单问题",
    helper: "Placeholder for unlock or receipt questions. No payment action runs.",
    zhHelper: "用于解锁或收据问题的占位请求。不会运行支付操作。",
  },
];

const supportCopy = {
  en: {
    badge: "Support",
    title: "Local support drafts and safe requests.",
    body:
      "This page records local support tickets and drafts. It does not execute refunds, payments, production deletion, or admin actions.",
    requestTitle: "Request details",
    requestBody:
      "Keep only the context needed for support. Avoid unnecessary private source text.",
    editingDraft: "editing draft",
    newDraft: "new draft",
    ticketType: "Ticket type",
    subject: "Subject",
    subjectPlaceholder: "Short issue title",
    relatedResult: "Related result reference",
    relatedSandbox: "Related sandbox reference",
    optional: "Optional",
    message: "Message",
    messagePlaceholder:
      "Describe the issue. Local support tickets store only a short preview in summaries.",
    saveTicket: "Save local ticket",
    saveDraft: "Save draft",
    clearForm: "Clear form",
    billingNotice:
      "Billing questions are placeholders in local MVP. This screen cannot issue payments, refunds, or receipt changes.",
    ticketsTitle: "Local submitted tickets",
    tickets: "Tickets",
    delete: "Delete",
    ticketsEmpty:
      "Saved local tickets will appear here with a short preview and tracking code.",
    draftsTitle: "Drafts",
    draftsEmpty: "Save a draft if you need to come back before submitting.",
    untitledDraft: "Untitled draft",
    edit: "Edit",
    remove: "Remove",
    noSafety: "No saved safety review is available yet.",
    safetyContext: "Current safety level",
    safetyReason: "Reason",
    draftSaved: "Support draft saved locally in this browser.",
    draftLoaded: "Draft loaded for editing.",
    draftRemoved: "Local support draft removed.",
    ticketFailed: "Local ticket was not saved",
    ticketSavedSuffix:
      "saved locally. This does not execute refunds, deletion, payment, or production writes.",
  },
  zh: {
    badge: "支持",
    title: "本地支持草稿与安全请求",
    body:
      "这里只记录本地支持工单和草稿，不会执行退款、支付、生产删除或管理员操作。",
    requestTitle: "请求详情",
    requestBody: "只保留支持所需的上下文，避免填写不必要的私人原文。",
    editingDraft: "正在编辑草稿",
    newDraft: "新草稿",
    ticketType: "工单类型",
    subject: "主题",
    subjectPlaceholder: "简短问题标题",
    relatedResult: "相关结果编号",
    relatedSandbox: "相关沙盘编号",
    optional: "可选",
    message: "说明",
    messagePlaceholder: "描述问题。工单摘要只会保留较短预览。",
    saveTicket: "保存本地工单",
    saveDraft: "保存草稿",
    clearForm: "清空表单",
    billingNotice:
      "账单问题目前只是本地 MVP 占位。此页面不能发起支付、退款或收据变更。",
    ticketsTitle: "已提交的本地工单",
    tickets: "工单",
    delete: "删除",
    ticketsEmpty: "保存后的本地工单会显示短预览和追踪编号。",
    draftsTitle: "草稿",
    draftsEmpty: "如果需要稍后再提交，可以先保存草稿。",
    untitledDraft: "未命名草稿",
    edit: "编辑",
    remove: "删除",
    noSafety: "还没有保存的安全复核。",
    safetyContext: "当前安全级别",
    safetyReason: "原因",
    draftSaved: "支持草稿已保存在当前浏览器。",
    draftLoaded: "草稿已载入，可以继续编辑。",
    draftRemoved: "本地支持草稿已删除。",
    ticketFailed: "本地工单保存失败",
    ticketSavedSuffix: "已保存在本地。这里不会执行退款、删除、支付或生产写入。",
  },
} as const;

function trackingCode(ticket: SupportTicketDraft) {
  const compact = ticket.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `AL-${compact || "LOCAL1"}`;
}

export default function SupportPage() {
  const { locale } = useLanguage();
  const t = supportCopy[locale];
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
    if (!safetyReview) return t.noSafety;
    return `${t.safetyContext}: ${safetyReview.safetyLevel}. ${t.safetyReason}: ${safetyReview.reportBlockedReason}`;
  }, [safetyReview, t]);

  function selectTicketType(nextType: SupportTicketType) {
    setTicketType(nextType);
    const selectedType = ticketTypes.find((item) => item.value === nextType);
    setSubject(
      locale === "zh"
        ? (selectedType?.zhLabel ?? "")
        : (selectedType?.label ?? ""),
    );
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
    setStatus(t.draftSaved);
  }

  function loadDraft(draft: LocalSupportDraft) {
    setEditingDraftId(draft.id);
    setTicketType(draft.ticketType);
    setSubject(draft.subject);
    setMessage(draft.message);
    setRelatedReportId(draft.relatedReportId);
    setRelatedSimulationId(draft.relatedSimulationId);
    setStatus(t.draftLoaded);
  }

  function deleteDraft(id: string) {
    deleteLocalSupportDraft(id);
    setDrafts(listLocalSupportDrafts());
    if (editingDraftId === id) resetForm();
    setStatus(t.draftRemoved);
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
      setStatus(`${t.ticketFailed}: ${result.errorCode}`);
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
      `${trackingCode(ticket)} ${t.ticketSavedSuffix}`,
    );
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <main className="space-y-6">
          <SurfaceCard emphasis="strong" className="p-6">
            <StatusPill tone="planned">{t.badge}</StatusPill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              {t.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
              {t.body}
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
                  {t.requestTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {t.requestBody}
                </p>
              </div>
              <StatusPill tone={editingDraftId ? "active" : "planned"}>
                {editingDraftId ? t.editingDraft : t.newDraft}
              </StatusPill>
            </div>

            {ticketType === "safety_appeal" ? (
              <div className="mt-4 rounded-md border border-[#8c6bb1]/25 bg-[#f4effa] p-4 text-sm leading-6 text-[#4b3568]">
                {safetyContext}
              </div>
            ) : null}
            {ticketType === "billing_question" ? (
              <div className="mt-4 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
                {t.billingNotice}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  {t.ticketType}
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
                  {t.subject}
                </span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                  placeholder={t.subjectPlaceholder}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  {t.relatedResult}
                </span>
                <input
                  value={relatedReportId}
                  onChange={(event) => setRelatedReportId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                  placeholder={t.optional}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  {t.relatedSandbox}
                </span>
                <input
                  value={relatedSimulationId}
                  onChange={(event) =>
                    setRelatedSimulationId(event.target.value)
                  }
                  className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                  placeholder={t.optional}
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                {t.message}
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-3 text-sm leading-6 text-[#11150f] outline-none focus:border-[#568262]"
                placeholder={t.messagePlaceholder}
              />
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="submit" className="px-5 py-3">
                {t.saveTicket}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={saveDraft}
                className="px-5 py-3"
              >
                {t.saveDraft}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                className="px-5 py-3"
              >
                {t.clearForm}
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
              {t.ticketsTitle}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label={t.tickets} value={tickets.length} />
              <Metric
                label={t.delete}
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
                  {t.ticketsEmpty}
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
              {t.draftsTitle}
            </h2>
            <div className="mt-4 space-y-3">
              {drafts.length === 0 ? (
                <p className="rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
                  {t.draftsEmpty}
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
                    {draft.subject || t.untitledDraft}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => loadDraft(draft)}
                      className="px-3 py-2"
                    >
                      {t.edit}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => deleteDraft(draft.id)}
                      className="px-3 py-2"
                    >
                      {t.remove}
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

