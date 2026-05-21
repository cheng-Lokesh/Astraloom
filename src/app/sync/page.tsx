"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { isSupabaseConfigured } from "@/lib/env";
import { loadLocalDraftBundle } from "@/lib/persistence/local-drafts";
import { buildPersistencePlan } from "@/lib/persistence/plan";
import {
  clearPersistenceSyncState,
  loadPersistenceSyncState,
} from "@/lib/persistence/sync-state";
import {
  syncClientWritableDrafts,
  verifyRemotePersistenceBoundary,
} from "@/lib/persistence/sync-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  RemoteBoundaryCheck,
  RemoteBoundaryVerification,
  SyncItemStatus,
} from "@/types/persistence-sync";

const syncCopy = {
  en: {
    title: "Supabase sync center",
    status: "Persistence shell",
    body: "This page moves safe user-authored local drafts into Supabase when auth is configured. System-generated and payment-owned records stay blocked until a backend writer exists.",
    configured: "Supabase configured",
    notConfigured: "Supabase not configured",
    localOnly:
      "Local draft mode is still supported. Nothing is uploaded until Supabase is configured and the user is authenticated.",
    checkSession: "Check login session",
    syncAllowed: "Sync client-writable drafts",
    verifyRemote: "Verify remote boundary",
    clearState: "Clear sync state",
    missingClient: "Supabase client could not be created.",
    missingUser: "No authenticated user found. Sign in with magic link first.",
    sessionReady: "Authenticated session found.",
    synced: "Client-writable drafts synced to Supabase.",
    remoteVerified: "Remote boundary verified.",
    remoteVerificationFailed:
      "Remote boundary needs review. A server-owned table has user rows.",
    syncFailed: "Sync failed",
    verifyFailed: "Remote verification failed",
    stateCleared: "Local sync state cleared.",
    lastSynced: "Last synced",
    never: "Never",
    remoteSeed: "Remote seed id",
    none: "None",
    table: "Draft object",
    capability: "Capability",
    local: "Local",
    remote: "Remote",
    detail: "Detail",
    remoteVerification: "Remote verification",
    category: "Category",
    count: "Rows",
    result: "Result",
    passed: "Passed",
    needsReview: "Needs review",
    categoryLabels: {
      client_writable: "Client writable",
      server_owned: "Server owned",
    },
    itemLabels: {
      seed_context: "Seed context",
      key_people: "Key people",
      agent_ecology: "Agent ecology",
      simulation_run: "Simulation run",
      safety_review: "Safety review",
      report: "Report",
      payment_entitlement: "Payment entitlement",
      support_tickets: "Support tickets",
    },
    capabilityLabels: {
      client_writable: "Client writable",
      server_required: "Server required",
      missing: "Missing",
    },
    statusLabels: {
      local_only: "Local only",
      synced: "Synced",
      blocked: "Blocked",
      missing: "Missing",
      error: "Error",
    },
    nextStep: "Next build step",
    nextStepBody:
      "Review the server writer boundary next. It shows which system-owned objects require backend writes before AI generation or Stripe can be enabled.",
    openWriters: "Open server writers",
  },
  zh: {
    title: "Supabase 同步中心",
    status: "持久化外壳",
    body: "这个页面在登录和 Supabase 配置完成后，把安全的用户输入草稿写入数据库。系统生成物和支付权益继续阻断，直到有后端写入器。",
    configured: "Supabase 已配置",
    notConfigured: "Supabase 未配置",
    localOnly:
      "本地草稿模式会继续保留。只有 Supabase 已配置且用户已登录时，才会上传。",
    checkSession: "检查登录会话",
    syncAllowed: "同步可由客户端写入的草稿",
    verifyRemote: "验证远端边界",
    clearState: "清空同步状态",
    missingClient: "无法创建 Supabase 客户端。",
    missingUser: "没有找到已登录用户。请先用魔法链接登录。",
    sessionReady: "已找到登录会话。",
    synced: "可由客户端写入的草稿已同步到 Supabase。",
    remoteVerified: "远端边界已验证。",
    remoteVerificationFailed: "远端边界需要检查：某个服务端所有表出现了用户行。",
    syncFailed: "同步失败",
    verifyFailed: "远端验证失败",
    stateCleared: "本地同步状态已清空。",
    lastSynced: "最近同步",
    never: "从未",
    remoteSeed: "远端 seed id",
    none: "无",
    table: "草稿对象",
    capability: "写入能力",
    local: "本地",
    remote: "远端",
    detail: "说明",
    remoteVerification: "远端验证",
    category: "类别",
    count: "行数",
    result: "结果",
    passed: "通过",
    needsReview: "需检查",
    categoryLabels: {
      client_writable: "客户端可写",
      server_owned: "服务端所有",
    },
    itemLabels: {
      seed_context: "种子上下文",
      key_people: "关键人物",
      agent_ecology: "Agent 生态",
      simulation_run: "Simulation run",
      safety_review: "安全审查",
      report: "报告",
      payment_entitlement: "支付权益",
      support_tickets: "客服工单",
    },
    capabilityLabels: {
      client_writable: "客户端可写",
      server_required: "需要服务端",
      missing: "缺失",
    },
    statusLabels: {
      local_only: "仅本地",
      synced: "已同步",
      blocked: "已阻断",
      missing: "缺失",
      error: "错误",
    },
    nextStep: "下一步构建",
    nextStepBody:
      "下一步检查服务端写入边界。它会明确哪些系统对象必须先走后端写入，然后才能启用 AI 生成或 Stripe。",
    openWriters: "打开服务端写入",
  },
} as const;

function getStatusTone(status: SyncItemStatus) {
  if (status === "synced") {
    return "ready";
  }

  if (status === "blocked" || status === "error") {
    return "blocked";
  }

  return "planned";
}

function getBoundaryTone(check: RemoteBoundaryCheck) {
  return check.ok ? "ready" : "blocked";
}

function formatDate(value: string | null, locale: "en" | "zh", fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAuthErrorMessage(errorMessage: string | undefined, fallback: string) {
  if (!errorMessage) {
    return fallback;
  }

  if (errorMessage.toLowerCase().includes("auth session missing")) {
    return fallback;
  }

  return errorMessage;
}

export default function SyncPage() {
  const { locale } = useLanguage();
  const copy = syncCopy[locale];
  const configured = isSupabaseConfigured();
  const [bundle, setBundle] = useState(loadLocalDraftBundle);
  const [syncState, setSyncState] = useState(loadPersistenceSyncState);
  const [remoteVerification, setRemoteVerification] =
    useState<RemoteBoundaryVerification | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ready" | "blocked" | "planned">(
    "planned",
  );
  const plan = buildPersistencePlan(bundle, syncState);

  function refreshLocalState() {
    setBundle(loadLocalDraftBundle());
    setSyncState(loadPersistenceSyncState());
  }

  async function checkSession() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage(copy.missingClient);
      setMessageTone("blocked");
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setMessage(getAuthErrorMessage(error?.message, copy.missingUser));
      setMessageTone("blocked");
      return;
    }

    setMessage(copy.sessionReady);
    setMessageTone("ready");
  }

  async function syncAllowedDrafts() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage(copy.missingClient);
      setMessageTone("blocked");
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setMessage(getAuthErrorMessage(error?.message, copy.missingUser));
      setMessageTone("blocked");
      return;
    }

    try {
      const result = await syncClientWritableDrafts(supabase, user, bundle);
      const verification = await verifyRemotePersistenceBoundary(
        supabase,
        user,
      );
      const hasBoundaryIssue = verification.checks.some((check) => !check.ok);
      setSyncState(result.state);
      setRemoteVerification(verification);
      refreshLocalState();
      setMessage(
        hasBoundaryIssue ? copy.remoteVerificationFailed : copy.synced,
      );
      setMessageTone(hasBoundaryIssue ? "blocked" : "ready");
    } catch (syncError) {
      setMessage(
        `${copy.syncFailed}: ${
          syncError instanceof Error ? syncError.message : String(syncError)
        }`,
      );
      setMessageTone("blocked");
    }
  }

  async function verifyRemoteBoundary() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage(copy.missingClient);
      setMessageTone("blocked");
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setMessage(getAuthErrorMessage(error?.message, copy.missingUser));
      setMessageTone("blocked");
      return;
    }

    try {
      const verification = await verifyRemotePersistenceBoundary(
        supabase,
        user,
      );
      const hasBoundaryIssue = verification.checks.some((check) => !check.ok);
      setRemoteVerification(verification);
      setMessage(
        hasBoundaryIssue ? copy.remoteVerificationFailed : copy.remoteVerified,
      );
      setMessageTone(hasBoundaryIssue ? "blocked" : "ready");
    } catch (verifyError) {
      setMessage(
        `${copy.verifyFailed}: ${
          verifyError instanceof Error ? verifyError.message : String(verifyError)
        }`,
      );
      setMessageTone("blocked");
    }
  }

  function clearState() {
    clearPersistenceSyncState();
    setRemoteVerification(null);
    refreshLocalState();
    setMessage(copy.stateCleared);
    setMessageTone("planned");
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
        <StatusPill tone={configured ? "ready" : "blocked"}>
          {configured ? copy.configured : copy.notConfigured}
        </StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
              {copy.localOnly}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={checkSession}
                disabled={!configured}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {copy.checkSession}
              </button>
              <button
                type="button"
                onClick={syncAllowedDrafts}
                disabled={!configured}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {copy.syncAllowed}
              </button>
              <button
                type="button"
                onClick={verifyRemoteBoundary}
                disabled={!configured}
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {copy.verifyRemote}
              </button>
              <button
                type="button"
                onClick={clearState}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.clearState}
              </button>
            </div>
            {message ? (
              <div className="mt-4">
                <StatusPill tone={messageTone}>{message}</StatusPill>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-semibold">{copy.table}</th>
                    <th className="py-3 pr-4 font-semibold">
                      {copy.capability}
                    </th>
                    <th className="py-3 pr-4 font-semibold">{copy.local}</th>
                    <th className="py-3 pr-4 font-semibold">{copy.remote}</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 font-semibold">{copy.detail}</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold text-slate-950">
                        {copy.itemLabels[item.id]}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {copy.capabilityLabels[item.capability]}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {item.localCount}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {item.remoteCount}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill tone={getStatusTone(item.status)}>
                          {copy.statusLabels[item.status]}
                        </StatusPill>
                      </td>
                      <td className="py-3 text-slate-600">{item.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {remoteVerification ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-950">
                  {copy.remoteVerification}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {formatDate(remoteVerification.checkedAt, locale, copy.never)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 pr-4 font-semibold">Table</th>
                      <th className="py-3 pr-4 font-semibold">
                        {copy.category}
                      </th>
                      <th className="py-3 pr-4 font-semibold">
                        {copy.count}
                      </th>
                      <th className="py-3 pr-4 font-semibold">
                        {copy.result}
                      </th>
                      <th className="py-3 font-semibold">{copy.detail}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remoteVerification.checks.map((check) => (
                      <tr
                        key={check.tableName}
                        className="border-b border-slate-100"
                      >
                        <td className="py-3 pr-4 font-semibold text-slate-950">
                          {check.tableName}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {copy.categoryLabels[check.category]}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {check.count}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusPill tone={getBoundaryTone(check)}>
                            {check.ok ? copy.passed : copy.needsReview}
                          </StatusPill>
                        </td>
                        <td className="py-3 text-slate-600">
                          {check.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Supabase
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.lastSynced}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {formatDate(syncState.lastSyncedAt, locale, copy.never)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.remoteSeed}
                </dt>
                <dd className="mt-1 break-all leading-6 text-slate-600">
                  {syncState.remoteSeedContextId ?? copy.none}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.nextStep}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.nextStepBody}
            </p>
            <Link
              href="/server-writers"
              className="mt-4 inline-flex rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
            >
              {copy.openWriters}
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
