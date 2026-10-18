"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createEmptyRealityProfileDraft,
  type RealityProfileDraft,
} from "@/lib/reality-profile/profile";

import { RealityProfileEditor } from "@/components/reality-profile/profile-editor";

export function RealityProfileClient() {
  const [profile, setProfile] = useState<RealityProfileDraft>(() => createEmptyRealityProfileDraft());
  const [status, setStatus] = useState("读取已保存资料…");
  const [ready, setReady] = useState(false);
  const [savedForModelReview, setSavedForModelReview] = useState(false);

  useEffect(() => {
    void fetch("/api/reality-profile", { cache: "no-store" }).then(async response => {
      const body = await response.json().catch(() => null) as { profile?: RealityProfileDraft | null; error_code?: string } | null;
      if (!response.ok) throw new Error(body?.error_code ?? "unavailable");
      setProfile(body?.profile ?? createEmptyRealityProfileDraft());
      setStatus("逐项确认资料来源；未填写内容会保留为明确未知。");
      setReady(true);
    }).catch(() => setStatus("无法读取资料。请确认已登录并已提交正式 Seed 后重试。"));
  }, []);

  const save = async () => {
    setSavedForModelReview(false);
    setStatus("正在安全保存…");
    try {
      const response = await fetch("/api/reality-profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
      const body = await response.json().catch(() => null) as { profile?: RealityProfileDraft; error_code?: string } | null;
      if (response.ok && body?.profile) {
        setProfile(body.profile);
        setSavedForModelReview(true);
        setStatus("已保存到当前正式链。事实、假设和未知会分别显示，世界状态只反映这些已保存资料。");
        return;
      }
      setStatus(body?.error_code === "reality_profile_conflict" ? "资料已在其他窗口更新。请刷新后再保存，避免覆盖；当前表单仍保留。" : "保存未完成；当前表单仍保留，可检查后重试。");
    } catch {
      setStatus("暂时无法保存；当前表单仍保留，请检查连接后重试。");
    }
  };

  return <main id="main-content" className="mx-auto w-full max-w-4xl py-7 sm:py-12">
    <p className="font-mono text-xs uppercase tracking-[.14em] text-[var(--evidence-gold)]">Reality Profile / 当前正式链</p>
    <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">复核现实资料，而让系统保留不确定。</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">逐条记录目标、价值观、人生主题、压力、外部变量与长期生命结构。每条都由你标记为事实、假设或明确未知；自由描述不会被自动转成数值。长期结构目前会安全保存并展示，尚不代表已具备 Track B 预测能力。</p>
    <RealityProfileEditor profile={profile} disabled={!ready} onChange={next => { setProfile(next); setSavedForModelReview(false); }} />
    <button type="button" disabled={!ready} onClick={() => void save()} className="mt-7 min-h-11 rounded bg-[var(--evidence-gold)] px-5 py-3 text-sm font-semibold text-black transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50">保存当前正式链资料</button>
    <p role="status" className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{status}</p>
    {savedForModelReview ? <div className="mt-4 space-y-3"><p className="max-w-prose text-sm leading-6 text-[var(--text-secondary)]">现实资料已保存。可继续核对行动模型；符合条件时能延续已有规则，人物或关系变化时需重新配置。</p><Link href="/app/start?model_draft=current" className="inline-flex min-h-11 items-center rounded border border-white/15 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]">核对并继续调整行动模型</Link></div> : null}
  </main>;
}
