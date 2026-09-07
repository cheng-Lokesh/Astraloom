"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";

type Phase = "loading" | "draft" | "queued" | "running" | "completed" | "blocked" | "failed" | "error";
type StatusClient = Pick<ReturnType<typeof createFormalSandboxClient>, "status">;

type RunningStatus = {
  phase: Phase;
  statusLabel: string;
  title: string;
  message: string;
  canOpenResult: boolean;
};

export function projectRunningPhase(phase: Phase) {
  if (phase === "loading") {
    return { statusLabel: "正在读取服务器状态", title: "正在读取服务器状态" };
  }
  if (phase === "draft") {
    return { statusLabel: "尚未开始运行", title: "本次沙盘尚未开始运行" };
  }
  if (phase === "queued") {
    return { statusLabel: "等待运行", title: "本次沙盘正在等待运行" };
  }
  if (phase === "running") {
    return { statusLabel: "沙盘运行中", title: "正在梳理可能路径。" };
  }
  if (phase === "completed") {
    return { statusLabel: "结果已生成", title: "结果已生成" };
  }
  if (phase === "blocked") {
    return { statusLabel: "服务端已阻断", title: "本次沙盘已被服务端阻断" };
  }
  if (phase === "failed") {
    return { statusLabel: "服务端运行失败", title: "服务端未能完成本次沙盘" };
  }
  return { statusLabel: "状态暂不可用", title: "暂时无法读取本次沙盘状态。" };
}

function runningStatusMessage(phase: Phase) {
  if (phase === "draft") return "服务端尚未开始本次沙盘运行。";
  if (phase === "queued") return "服务端已接收本次沙盘，正在等待运行。";
  if (phase === "running") return "服务端正在运行本次沙盘，结果尚未生成。";
  if (phase === "completed") return "服务端已完成本次沙盘运行，结果已生成。";
  if (phase === "blocked") return "服务端已阻断本次沙盘运行。请返回关系图检查可运行条件。";
  if (phase === "failed") return "服务端未能完成本次沙盘。请稍后重新读取状态或返回关系图。";
  return "暂时无法读取本次沙盘状态。";
}

function phaseForPersistedStatus(status: string): Phase {
  if (status === "draft" || status === "queued" || status === "running" || status === "completed" || status === "blocked" || status === "failed") return status;
  return "error";
}

export async function readRunningStatus(runId: string, client: StatusClient = createFormalSandboxClient()): Promise<RunningStatus> {
  try {
    const response = await client.status(runId);
    const phase = response.ok ? phaseForPersistedStatus(response.data.run.status) : "error";
    return { phase, ...projectRunningPhase(phase), message: runningStatusMessage(phase), canOpenResult: phase === "completed" };
  } catch {
    const phase = "error";
    return { phase, ...projectRunningPhase(phase), message: runningStatusMessage(phase), canOpenResult: false };
  }
}

export default function RunningPage() {
  return <AppShell><Suspense fallback={<RunningSurface phase="loading" />}><RunningController /></Suspense></AppShell>;
}

export function RunningController() {
  const params = useSearchParams();
  const router = useRouter();
  const runId = params.get("run_id");
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("正在读取服务器状态。");

  const refresh = useCallback(async () => {
    if (!runId) return;
    setPhase("loading");
    setMessage("正在读取服务器状态。");
    const resolution = await readRunningStatus(runId);
    setPhase(resolution.phase);
    setMessage(resolution.message);
    if (resolution.canOpenResult) router.replace(`/app/simulation/result?run_id=${runId}`);
  }, [router, runId]);

  useEffect(() => {
    if (!runId) return;
    let current = true;
    void readRunningStatus(runId).then((resolution) => {
      if (!current) return;
      setPhase(resolution.phase);
      setMessage(resolution.message);
      if (resolution.canOpenResult) router.replace(`/app/simulation/result?run_id=${runId}`);
    });
    return () => { current = false; };
  }, [router, runId]);

  if (!runId) return <NoActiveRun />;
  return <RunningSurface phase={phase} message={message} retry={() => void refresh()} />;
}

function NoActiveRun() {
  return <section id="main-content" className="mx-auto min-h-[70svh] max-w-5xl py-8 sm:py-14"><p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--text-muted)]">我的沙盘 / Running</p><h1 className="mt-5 font-[var(--font-display)] text-4xl leading-[1.08] text-[var(--text-primary)] sm:text-6xl">当前没有正在运行的沙盘</h1><p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">从 My Sandbox 查看你的账户链，开始一段新的正式处境，或回到 History 打开已完成的结果。</p><div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/app/dashboard" className="!w-auto px-4 py-3">My Sandbox</ButtonLink><ButtonLink href="/app/new/scene" variant="secondary" className="!w-auto px-4 py-3">Start</ButtonLink><ButtonLink href="/app/archive" variant="secondary" className="!w-auto px-4 py-3">History</ButtonLink></div></section>;
}

function RunningSurface({ phase, message = "正在读取服务器状态。", retry }: { phase: Phase; message?: string; retry?: () => void }) {
  const active = phase === "loading" || phase === "queued" || phase === "running";
  const { statusLabel, title } = projectRunningPhase(phase);
  const canRetry = phase === "error" || phase === "blocked" || phase === "failed";

  return <section id="main-content" className="mx-auto min-h-[70svh] max-w-5xl py-8 sm:py-14"><p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--text-muted)]">Formal account sandbox / Run state</p><div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]"><div><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${active ? "formal-status-pulse bg-[var(--evidence-gold)]" : phase === "completed" ? "bg-[var(--verified-green)]" : "bg-[var(--risk-red)]"}`} aria-hidden="true" /><p role="status" aria-live="polite" className="font-mono text-xs uppercase tracking-[.14em] text-[var(--text-secondary)]">{statusLabel}</p></div><h1 className="mt-5 max-w-3xl font-[var(--font-display)] text-4xl leading-[1.08] text-[var(--text-primary)] sm:text-6xl">{title}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">{message}</p>{canRetry ? <div className="mt-7 flex flex-wrap gap-3">{retry ? <Button onClick={retry} className="!w-auto px-4 py-3">重新读取状态</Button> : null}<ButtonLink href="/app/new/graph" variant="secondary" className="!w-auto px-4 py-3">返回关系图</ButtonLink></div> : null}</div><SurfaceCard emphasis="dark" className="p-5"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-white/45">Completion rule</p><p className="mt-3 text-sm leading-7 text-white/70">This screen reads the account database. It never infers completion from a timer, animation, or browser cache.</p></SurfaceCard></div></section>;
}
