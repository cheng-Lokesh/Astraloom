"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import {
  activatePlaceholderEntitlement,
  blockPlaceholderEntitlement,
  buildBillingSupportDraft,
  createSupportTicket,
} from "@/lib/billing/build";
import {
  clearBillingSupportDraft,
  loadBillingSupportDraft,
  saveBillingSupportDraft,
} from "@/lib/billing/storage";
import { loadReportDraft } from "@/lib/reports/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import type {
  BillingSupportDraft,
  PaymentEntitlementStatus,
  SupportTicketStatus,
  SupportTicketType,
} from "@/types/billing-support";
import type { ReportDraft } from "@/types/report";
import type { SeedContextDraft } from "@/types/seed-context";

type BillingPageContext = {
  seedContext: SeedContextDraft | null;
  report: ReportDraft | null;
  savedBilling: BillingSupportDraft | null;
};

const billingCopy = {
  en: {
    title: "Payment and support shell",
    status: "Stripe placeholder",
    body: "This page defines entitlement and support workflows without collecting money or calling Stripe.",
    stripeNote:
      "Stripe is configuration-only here. No checkout session, webhook, subscription, or charge is created.",
    activate: "Activate placeholder entitlement",
    block: "Block entitlement",
    reset: "Clear billing draft",
    activated: "Placeholder entitlement activated locally.",
    blocked: "Entitlement marked blocked locally.",
    resetDone: "Billing and support draft cleared.",
    entitlementTitle: "Entitlement state",
    provider: "Provider",
    paymentStatus: "Payment status",
    entitlementType: "Entitlement",
    amount: "Amount",
    reportGate: "Report access gate",
    reportLocked:
      "Report access remains locked until both SafetyVerifier and entitlement gates are real.",
    reportAvailable:
      "Report shell exists locally, but real report access is still gated.",
    statusLabels: {
      none: "None",
      placeholder_active: "Placeholder active",
      blocked: "Blocked",
    },
    ticketTitle: "Support ticket shell",
    ticketType: "Request type",
    ticketSummary: "Summary",
    summaryPlaceholder:
      "Describe the request. This stays local until support persistence is wired.",
    submitTicket: "Create local ticket",
    ticketCreated: "Support ticket created locally.",
    ticketValidation: "Add a short summary before creating a ticket.",
    ticketTypes: {
      refund_request: "Refund request",
      deletion_request: "Deletion request",
      general_support: "General support",
    },
    ticketStatusLabels: {
      draft: "Draft",
      open: "Open",
    },
    tickets: "Tickets",
    noTickets: "No local support tickets yet.",
    priority: "Priority",
    relatedReport: "Related report",
    none: "None",
    nextStep: "Next build step",
    nextStepBody:
      "Connect Supabase persistence and authentication so all local drafts can become user-owned records.",
    openSync: "Open sync center",
  },
  zh: {
    title: "支付权益与客服外壳",
    status: "Stripe 占位",
    body: "这个页面只定义权益和客服流程，不收钱，也不调用 Stripe。",
    stripeNote:
      "这里的 Stripe 只是配置占位。不会创建 checkout、webhook、订阅或扣款。",
    activate: "激活占位权益",
    block: "阻断权益",
    reset: "清空支付草稿",
    activated: "占位权益已保存到本地。",
    blocked: "权益已在本地标记为阻断。",
    resetDone: "支付与客服草稿已清空。",
    entitlementTitle: "权益状态",
    provider: "支付渠道",
    paymentStatus: "支付状态",
    entitlementType: "权益类型",
    amount: "金额",
    reportGate: "报告访问闸门",
    reportLocked: "报告访问仍然锁定，直到 SafetyVerifier 和权益闸门都接入真实逻辑。",
    reportAvailable: "本地报告外壳已存在，但真实报告访问仍受闸门控制。",
    statusLabels: {
      none: "无",
      placeholder_active: "占位已激活",
      blocked: "已阻断",
    },
    ticketTitle: "客服工单外壳",
    ticketType: "请求类型",
    ticketSummary: "摘要",
    summaryPlaceholder: "描述你的请求。接入客服持久化之前，这只保存在本地。",
    submitTicket: "创建本地工单",
    ticketCreated: "客服工单已保存到本地。",
    ticketValidation: "创建工单前请填写简短摘要。",
    ticketTypes: {
      refund_request: "退款请求",
      deletion_request: "删除请求",
      general_support: "通用客服",
    },
    ticketStatusLabels: {
      draft: "草稿",
      open: "已打开",
    },
    tickets: "工单",
    noTickets: "当前还没有本地客服工单。",
    priority: "优先级",
    relatedReport: "关联报告",
    none: "无",
    nextStep: "下一步构建",
    nextStepBody:
      "接入 Supabase 持久化和登录认证，让所有本地草稿变成用户自己的数据库记录。",
    openSync: "打开同步中心",
  },
} as const;

function loadBillingPageContext(): BillingPageContext {
  const seedContext = loadSeedContextDraft();
  const report = seedContext ? loadReportDraft(seedContext.id) : null;

  return {
    seedContext,
    report,
    savedBilling: loadBillingSupportDraft(),
  };
}

function getEntitlementTone(status: PaymentEntitlementStatus) {
  if (status === "placeholder_active") {
    return "ready";
  }

  if (status === "blocked") {
    return "blocked";
  }

  return "planned";
}

function getTicketTone(status: SupportTicketStatus) {
  return status === "open" ? "ready" : "planned";
}

export default function BillingPage() {
  const { locale } = useLanguage();
  const copy = billingCopy[locale];
  const [context] = useState(loadBillingPageContext);
  const [billing, setBilling] = useState<BillingSupportDraft>(
    () => context.savedBilling ?? buildBillingSupportDraft(),
  );
  const [ticketType, setTicketType] =
    useState<SupportTicketType>("refund_request");
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState("");

  function persistBilling(nextBilling: BillingSupportDraft, nextMessage: string) {
    saveBillingSupportDraft(nextBilling);
    setBilling(nextBilling);
    setMessage(nextMessage);
  }

  function activateEntitlement() {
    persistBilling(
      {
        ...billing,
        payment: activatePlaceholderEntitlement(billing.payment),
        updatedAt: new Date().toISOString(),
      },
      copy.activated,
    );
  }

  function blockEntitlement() {
    persistBilling(
      {
        ...billing,
        payment: blockPlaceholderEntitlement(billing.payment),
        updatedAt: new Date().toISOString(),
      },
      copy.blocked,
    );
  }

  function resetBilling() {
    clearBillingSupportDraft();
    setBilling(buildBillingSupportDraft());
    setSummary("");
    setMessage(copy.resetDone);
  }

  function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (summary.trim().length < 4) {
      setMessage(copy.ticketValidation);
      return;
    }

    const nextTicket = createSupportTicket(
      ticketType,
      summary.trim(),
      context.report?.id ?? null,
    );

    persistBilling(
      {
        ...billing,
        tickets: [nextTicket, ...billing.tickets],
        updatedAt: new Date().toISOString(),
      },
      copy.ticketCreated,
    );
    setSummary("");
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
        </div>
        <StatusPill tone="planned">{copy.status}</StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
              {copy.stripeNote}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={activateEntitlement}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.activate}
              </button>
              <button
                type="button"
                onClick={blockEntitlement}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.block}
              </button>
              <button
                type="button"
                onClick={resetBilling}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.reset}
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm font-medium text-slate-600">
                {message}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.ticketTitle}
            </h2>
            <form onSubmit={createTicket} className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">
                  {copy.ticketType}
                </span>
                <select
                  value={ticketType}
                  onChange={(event) =>
                    setTicketType(event.target.value as SupportTicketType)
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                >
                  {(
                    [
                      "refund_request",
                      "deletion_request",
                      "general_support",
                    ] as const
                  ).map((type) => (
                    <option key={type} value={type}>
                      {copy.ticketTypes[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-900">
                  {copy.ticketSummary}
                </span>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder={copy.summaryPlaceholder}
                  rows={4}
                  className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />
              </label>

              <button
                type="submit"
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.submitTicket}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.tickets}
            </h2>
            {billing.tickets.length > 0 ? (
              <div className="mt-4 space-y-3">
                {billing.tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-950">
                        {copy.ticketTypes[ticket.ticketType]}
                      </h3>
                      <StatusPill tone={getTicketTone(ticket.status)}>
                        {copy.ticketStatusLabels[ticket.status]}
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {ticket.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span>
                        {copy.priority}: {ticket.priority}
                      </span>
                      <span>
                        {copy.relatedReport}:{" "}
                        {ticket.relatedReportId ?? copy.none}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {copy.noTickets}
              </p>
            )}
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">
                {copy.entitlementTitle}
              </h2>
              <StatusPill
                tone={getEntitlementTone(billing.payment.entitlementStatus)}
              >
                {copy.statusLabels[billing.payment.entitlementStatus]}
              </StatusPill>
            </div>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.provider}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {billing.payment.provider}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.paymentStatus}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {billing.payment.status}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.entitlementType}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {billing.payment.entitlementType}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.amount}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  ${Number(billing.payment.amountCents / 100).toFixed(2)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.reportGate}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {context.report ? copy.reportAvailable : copy.reportLocked}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.nextStep}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.nextStepBody}
            </p>
            <Link
              href="/sync"
              className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openSync}
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
