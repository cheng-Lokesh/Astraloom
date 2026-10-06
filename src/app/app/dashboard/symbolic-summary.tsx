"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { symbolicFrameSchema } from "@/lib/formal-symbolic-lens/frame";

const lensSchema = z.object({
  revision: z.number().int().nonnegative(), status: z.enum(["not_configured", "active", "stale", "withdrawn"]),
  sourceVersion: z.number().int().positive().nullable(), snapshot: symbolicFrameSchema.nullable(),
  consent: z.object({ storage: z.boolean(), calculation: z.boolean(), futureAttachment: z.boolean() }).strict(),
  futureAttachmentStatus: z.enum(["connected", "not_connected"]),
}).strict().superRefine((lens, context) => {
  const enabled = lens.consent.storage && lens.consent.calculation;
  const configured = lens.status === "active" || lens.status === "stale";
  if (configured ? !enabled || !lens.snapshot || lens.revision < 1 || lens.snapshot.sourceVersion !== lens.sourceVersion : lens.snapshot !== null || enabled) context.addIssue({ code: "custom", message: "inconsistent_lens" });
  if (lens.status === "not_configured" && (lens.revision !== 0 || lens.sourceVersion !== null || Object.values(lens.consent).some(Boolean))) context.addIssue({ code: "custom", message: "inconsistent_empty_lens" });
  if (lens.status === "withdrawn" && (lens.revision < 1 || lens.consent.futureAttachment)) context.addIssue({ code: "custom", message: "inconsistent_withdrawal" });
  if (lens.consent.futureAttachment && (!enabled || lens.futureAttachmentStatus !== "connected")) context.addIssue({ code: "custom", message: "inconsistent_attachment_consent" });
});
type Load = { phase: "loading" } | { phase: "error" } | { phase: "ready"; lens: z.infer<typeof lensSchema> };
const control = "inline-flex min-h-11 items-center justify-center rounded border border-white/15 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]";

export function DashboardSymbolicSummary() {
  const [load, setLoad] = useState<Load>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    void fetch("/api/symbolic-lens", { cache: "no-store", signal: controller.signal }).then(async response => {
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== "object" || !("ok" in body) || body.ok !== true || !("lens" in body)) throw new Error("unavailable");
      const lens = lensSchema.parse(body.lens);
      if (live) setLoad({ phase: "ready", lens });
    }).catch(() => { if (live) setLoad({ phase: "error" }); });
    return () => { live = false; controller.abort(); };
  }, [attempt]);
  const lens = load.phase === "ready" ? load.lens : null;
  const frame = lens?.snapshot;
  const status = lens ? ({ not_configured: "尚未配置", withdrawn: "已撤回", active: "已配置", stale: "旧时期框架，需要更新" } as const)[lens.status] : null;
  return <section aria-labelledby="symbolic-summary-title" className="border-y border-white/10 py-7">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="max-w-2xl"><h2 id="symbolic-summary-title" className="text-2xl font-semibold text-[var(--text-primary)]">可选象征框架</h2><p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">与本人记录的现实近况分别阅读。这里只呈现你授权保存的象征性对照，不是现实事实、资源、事件证据或未来预测。</p></div>
      <Link href="/app/symbolic-lens" className={control}>{frame ? "管理象征框架" : "配置象征框架"}</Link>
    </div>
    {load.phase === "loading" ? <p role="status" className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">正在读取象征框架；现实资料和下一步仍可查看。</p> : load.phase === "error" ? <div className="mt-5"><p role="alert" className="text-sm leading-7 text-[var(--text-secondary)]">暂时无法读取象征框架，当前配置状态未知。现实资料和下一步仍可查看。</p><button type="button" className={`mt-3 ${control}`} onClick={() => { setLoad({ phase: "loading" }); setAttempt(value => value + 1); }}>重新读取象征框架</button></div> : <>
      <p role="status" className="mt-5 text-sm font-semibold text-[var(--text-primary)]">{status}</p>
      {lens?.status === "not_configured" ? <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">可按意愿配置，也可以继续使用沙盘；不会自动补造框架。</p> : lens?.status === "withdrawn" ? <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">当前不展示已撤回的框架。你可以重新配置并明确授权。</p> : null}
      {frame ? <>
        <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">来源：本人授权的象征资料 · 来源版本：{lens!.sourceVersion} · 参考时期：{frame.referencePeriod.key.replace("-", "年")}月（北京时间，月度对照）。{lens?.status === "stale" ? "下列摘要来自旧时期，请在管理页更新后复核。" : ""}</p>
        <dl className="mt-5 divide-y divide-white/10">{frame.dimensions.map(dimension => <div key={dimension.key} data-dashboard-symbolic-dimension className="grid gap-2 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]"><dt className="text-sm font-semibold text-[var(--text-primary)]">{dimension.label}</dt><dd className="min-w-0"><p className="text-sm text-[var(--text-primary)]">{dimension.value}</p><p className="mt-1 max-w-prose text-sm leading-7 text-[var(--text-secondary)]">{dimension.summary}</p>{dimension.limitations.map((limitation, index) => <p key={index} className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">限制：{limitation}</p>)}</dd></div>)}</dl>
        <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">查看框架限制</summary><ul className="max-w-prose space-y-2 text-sm leading-7 text-[var(--text-secondary)]">{frame.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}</ul></details>
      </> : null}
    </>}
    <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{lens?.futureAttachmentStatus === "connected" ? lens.consent.futureAttachment ? "已授权后续新运行保存象征对照；可在管理页更改授权。" : "后续新运行可保存象征对照，尚未授权；可在管理页按意愿开启。" : "尚未接入新运行。"}当前框架不会改变人物行动、世界状态、推演结论或置信度；不代表任何历史运行已附加框架，请在对应结果中查看冻结记录。</p>
  </section>;
}
