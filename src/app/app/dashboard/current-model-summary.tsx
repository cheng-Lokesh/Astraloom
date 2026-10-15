"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";
import type { DigitalLifeModelDraft } from "@/lib/digital-life/model-draft";

export function CurrentModelSummary({ draft }: { draft: DigitalLifeModelDraft }) {
  return <section aria-labelledby="current-model-draft-title" className="space-y-3 border-y border-white/10 py-7">
    <h2 id="current-model-draft-title" className="text-xl font-semibold">当前数字生命模型草稿</h2>
    <p className="text-sm leading-6">{draft.status === "not_saved" ? "尚未保存行动与策略草稿。可先配置模型，再开始运行。" : `已保存版本 ${draft.currentRevision} · ${draft.horizonDays} 天 · ${draft.draftRules?.actions.length ?? 0} 条行动假设 · ${draft.draftRules?.strategies.length ?? 0} 个策略。`}</p>
    <p className="text-sm leading-6 text-[var(--text-secondary)]">{draft.status === "stale" ? "资料来源已变化，原模型保留只读。进入复核后，符合条件时可核对并延续原规则；人物或关系变化时须重新配置。" : "草稿保存不代表已开始运行。行动、策略、预算与可选假设须在运行前重新确认。"}</p>
    <Link href="/app/start?model_draft=current" className="inline-flex min-h-11 items-center rounded border border-white/15 px-4 py-3 text-sm font-semibold active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]">{draft.status === "not_saved" ? "配置当前模型草稿" : "复核已保存模型草稿"}</Link>
  </section>;
}

export function DashboardCurrentModelSummary() {
  const [state, setState] = useState<{ draft: DigitalLifeModelDraft | null; error: boolean }>({ draft: null, error: false });
  useEffect(() => {
    let active = true;
    void createFormalSandboxClient().modelDraft().then(result => { if (active) setState(result.ok ? { draft: result.data.draft, error: false } : { draft: null, error: true }); }).catch(() => { if (active) setState({ draft: null, error: true }); });
    return () => { active = false; };
  }, []);
  if (!state.draft) return <section className="border-y border-white/10 py-7"><h2 className="text-xl font-semibold">当前数字生命模型草稿</h2><p role={state.error ? "alert" : "status"} className="mt-3 text-sm">{state.error ? "模型草稿状态暂不可读取，请重新打开我的沙盘后重试。" : "正在读取已保存模型草稿…"}</p></section>;
  return <CurrentModelSummary draft={state.draft} />;
}
