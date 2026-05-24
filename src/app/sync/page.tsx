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
    status: "Safe client sync",
    body: "Sync only user-authored MVP records: seed context, key people, feedback calibration, and support requests. Generated artifacts remain blocked until server writers are reviewed.",
    configured: "Supabase configured",
    notConfigured: "Supabase not configured",
    localOnly:
      "Local trial mode still works. Nothing is uploaded until Supabase is configured and the user is authenticated.",
    checkSession: "Check login session",
    syncAllowed: "Sync safe drafts",
    verifyRemote: "Verify remote boundary",
    clearState: "Clear sync state",
    missingClient: "Supabase client could not be created.",
    missingUser: "No authenticated user found. Sign in with magic link first.",
    sessionReady: "Authenticated session found.",
    synced: "Safe user-authored drafts synced to Supabase.",
    remoteVerified: "Remote boundary verified.",
    remoteVerificationFailed:
      "Remote boundary needs review. A server-owned table has browser-created rows.",
    syncFailed: "Sync failed",
    verifyFailed: "Remote verification failed",
    stateCleared: "Local sync state cleared.",
    lastSynced: "Last synced",
    remoteSeed: "Remote seed id",
    never: "Never",
    none: "None",
    table: "Draft object",
    capability: "Capability",
    local: "Local",
    remote: "Remote",
    detail: "Detail",
    remoteVerification: "Remote boundary",
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
      report: "Report and claims",
      feedback_log: "Feedback calibration",
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
      "Next, implement server writer dry-run adapters for generated artifacts. Keep AI, Stripe, and service-role writes disabled until the approval gates pass.",
    openWriters: "Open server writers",
  },
  zh: {
    title: "Supabase 同步中心",
    status: "安全客户端同步",
    body: "这里只同步用户自己产生的 MVP 数据：种子上下文、关键人物、反馈校准和客服请求。Agent、关系边、事件、Claim、报告、支付仍保持后端边界。",
    configured: "Supabase 已配置",
    notConfigured: "Supabase 未配置",
    localOnly:
      "本地试用模式仍可使用。只有 Supabase 配置完成且用户已登录时，才会上传安全草稿。",
    checkSession: "检查登录状态",
    syncAllowed: "同步安全草稿",
    verifyRemote: "验证远端边界",
    clearState: "清空同步状态",
    missingClient: "无法创建 Supabase 客户端。",
    missingUser: "没有找到已登录用户。请先使用 magic link 登录。",
    sessionReady: "已找到登录会话。",
    synced: "安全的用户草稿已同步到 Supabase。",
    remoteVerified: "远端边界已验证。",
    remoteVerificationFailed:
      "远端边界需要检查：某个服务端所有表出现了浏览器创建的数据。",
    syncFailed: "同步失败",
    verifyFailed: "远端验证失败",
    stateCleared: "本地同步状态已清空。",
    lastSynced: "最近同步",
    remoteSeed: "远端 seed id",
    never: "从未",
    none: "无",
    table: "草稿对象",
    capability: "写入能力",
    local: "本地",
    remote: "远端",
    detail: "说明",
    remoteVerification: "远端边界",
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
      report: "报告和 Claims",
      feedback_log: "反馈校准",
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
      "下一步实现生成物的服务端写入 dry-run adapter。AI、Stripe 和 service-role 写入继续关闭，直到审批闸门通过。",
    openWriters: "打开服务端写入",
  },
} as const;

function getStatusTone(status: SyncItemStatus) {
  if (status === "synced") return "ready";
  if (status === "blocked" || status === "error") return "blocked";
  return "planned";
}

function getBoundaryTone(check: RemoteBoundaryCheck) {
  return check.ok ? "ready" : "blocked";
}

function formatDate(value: string | null, locale: "en" | "zh", fallback: string) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAuthErrorMessage(errorMessage: string | undefined, fallback: string) {
  if (!errorMessage) return fallback;
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

  async function getAuthenticatedUser() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage(copy.missingClient);
      setMessageTone("blocked");
      return null;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setMessage(getAuthErrorMessage(error?.message, copy.missingUser));
      setMessageTone("blocked");
      return null;
    }

    return { supabase, user };
  }

  async function checkSession() {
    const context = await getAuthenticatedUser();
    if (!context) return;
    setMessage(copy.sessionReady);
    setMessageTone("ready");
  }

  async function syncAllowedDrafts() {
    const context = await getAuthenticatedUser();
    if (!context) return;

    try {
      const result = await syncClientWritableDrafts(
        context.supabase,
        context.user,
        bundle,
      );
      const verification = await verifyRemotePersistenceBoundary(
        context.supabase,
        context.user,
      );
      const hasBoundaryIssue = verification.checks.some((check) => !check.ok);

      setSyncState(result.state);
      setRemoteVerification(verification);
      refreshLocalState();
      setMessage(hasBoundaryIssue ? copy.remoteVerificationFailed : copy.synced);
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
    const context = await getAuthenticatedUser();
    if (!context) return;

    try {
      const verification = await verifyRemotePersistenceBoundary(
        context.supabase,
        context.user,
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
          <StatusPill tone="planned">{copy.status}</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            {copy.body}
          </p>
        </div>
        <StatusPill tone={configured ? "ready" : "blocked"}>
          {configured ? copy.configured : copy.notConfigured}
        </StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <p className="rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm leading-6 text-[#2f5d3d]">
              {copy.localOnly}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={checkSession}
                disabled={!configured}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f] disabled:cursor-not-allowed disabled:bg-[#e5e8df] disabled:text-[#8a9085]"
              >
                {copy.checkSession}
              </button>
              <button
                type="button"
                onClick={syncAllowedDrafts}
                disabled={!configured}
                className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9aa096]"
              >
                {copy.syncAllowed}
              </button>
              <button
                type="button"
                onClick={verifyRemoteBoundary}
                disabled={!configured}
                className="rounded-md border border-[#568262]/30 bg-[#eef5ee] px-4 py-2 text-sm font-semibold text-[#2f5d3d] disabled:cursor-not-allowed disabled:bg-[#e5e8df] disabled:text-[#8a9085]"
              >
                {copy.verifyRemote}
              </button>
              <button
                type="button"
                onClick={clearState}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
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

          <section className="rounded-lg border border-black/8 bg-white p-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-[#7d8578]">
                    <th className="py-3 pr-4 font-semibold">{copy.table}</th>
                    <th className="py-3 pr-4 font-semibold">{copy.capability}</th>
                    <th className="py-3 pr-4 font-semibold">{copy.local}</th>
                    <th className="py-3 pr-4 font-semibold">{copy.remote}</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 font-semibold">{copy.detail}</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((item) => (
                    <tr key={item.id} className="border-b border-black/6">
                      <td className="py-3 pr-4 font-semibold text-[#11150f]">
                        {copy.itemLabels[item.id]}
                      </td>
                      <td className="py-3 pr-4 text-[#62695d]">
                        {copy.capabilityLabels[item.capability]}
                      </td>
                      <td className="py-3 pr-4 text-[#62695d]">
                        {item.localCount}
                      </td>
                      <td className="py-3 pr-4 text-[#62695d]">
                        {item.remoteCount}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill tone={getStatusTone(item.status)}>
                          {copy.statusLabels[item.status]}
                        </StatusPill>
                      </td>
                      <td className="py-3 text-[#62695d]">{item.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {remoteVerification ? (
            <RemoteBoundarySection
              copy={copy}
              locale={locale}
              remoteVerification={remoteVerification}
            />
          ) : null}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="text-base font-semibold text-[#11150f]">Supabase</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-[#11150f]">
                  {copy.lastSynced}
                </dt>
                <dd className="mt-1 leading-6 text-[#62695d]">
                  {formatDate(syncState.lastSyncedAt, locale, copy.never)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#11150f]">
                  {copy.remoteSeed}
                </dt>
                <dd className="mt-1 break-all leading-6 text-[#62695d]">
                  {syncState.remoteSeedContextId ?? copy.none}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-black/8 bg-[#11150f] p-5 text-white">
            <h2 className="text-base font-semibold text-[#b7e6c6]">
              {copy.nextStep}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              {copy.nextStepBody}
            </p>
            <Link
              href="/server-writers"
              className="mt-4 inline-flex rounded-md border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white"
            >
              {copy.openWriters}
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function RemoteBoundarySection({
  copy,
  locale,
  remoteVerification,
}: {
  copy: (typeof syncCopy)["en"] | (typeof syncCopy)["zh"];
  locale: "en" | "zh";
  remoteVerification: RemoteBoundaryVerification;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#11150f]">
          {copy.remoteVerification}
        </h2>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d8578]">
          {formatDate(remoteVerification.checkedAt, locale, copy.never)}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/8 text-[#7d8578]">
              <th className="py-3 pr-4 font-semibold">Table</th>
              <th className="py-3 pr-4 font-semibold">{copy.category}</th>
              <th className="py-3 pr-4 font-semibold">{copy.count}</th>
              <th className="py-3 pr-4 font-semibold">{copy.result}</th>
              <th className="py-3 font-semibold">{copy.detail}</th>
            </tr>
          </thead>
          <tbody>
            {remoteVerification.checks.map((check) => (
              <tr key={check.tableName} className="border-b border-black/6">
                <td className="py-3 pr-4 font-semibold text-[#11150f]">
                  {check.tableName}
                </td>
                <td className="py-3 pr-4 text-[#62695d]">
                  {copy.categoryLabels[check.category]}
                </td>
                <td className="py-3 pr-4 text-[#62695d]">{check.count}</td>
                <td className="py-3 pr-4">
                  <StatusPill tone={getBoundaryTone(check)}>
                    {check.ok ? copy.passed : copy.needsReview}
                  </StatusPill>
                </td>
                <td className="py-3 text-[#62695d]">{check.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
