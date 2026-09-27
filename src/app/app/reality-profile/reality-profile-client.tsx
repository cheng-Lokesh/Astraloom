"use client";

import { useEffect, useState } from "react";
import {
  createEmptyRealityProfileDraft,
  createUnknownRealityProfileField,
  type RealityProfileDraft,
  type RealityProfileField,
} from "@/lib/reality-profile/profile";

type ScalarKey = "lifeClimate" | "resources" | "constraints";
type ListKey = "goals" | "values" | "lifeThemes" | "pressures" | "externalVariables";

const scalarLabels: Record<ScalarKey, string> = {
  lifeClimate: "生活气候",
  resources: "资源",
  constraints: "限制",
};

const listLabels: Record<ListKey, string> = {
  goals: "目标",
  values: "价值观",
  lifeThemes: "人生主题",
  pressures: "压力",
  externalVariables: "外部变量",
};

export function RealityProfileClient() {
  const [profile, setProfile] = useState<RealityProfileDraft>(() => createEmptyRealityProfileDraft());
  const [status, setStatus] = useState("读取已保存资料…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetch("/api/reality-profile", { cache: "no-store" }).then(async response => {
      const body = await response.json().catch(() => null) as { profile?: RealityProfileDraft | null; error_code?: string } | null;
      if (!response.ok) throw new Error(body?.error_code ?? "unavailable");
      setProfile(body?.profile ?? createEmptyRealityProfileDraft());
      setStatus("逐项确认资料来源；未填写内容会保留为明确未知。");
      setReady(true);
    }).catch(() => setStatus("无法读取资料。请确认已登录并已提交正式 Seed 后重试。"));
  }, []);

  const updateScalar = (key: ScalarKey, field: RealityProfileField) => {
    setProfile(current => ({ ...current, [key]: field }));
  };

  const updateListItem = (key: ListKey, index: number, field: RealityProfileField) => {
    setProfile(current => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? field : item) }));
  };

  const addListItem = (key: ListKey) => {
    setProfile(current => current[key].length >= 8 ? current : { ...current, [key]: [...current[key], createUnknownRealityProfileField()] });
  };

  const removeListItem = (key: ListKey, index: number) => {
    setProfile(current => {
      const remaining = current[key].filter((_, itemIndex) => itemIndex !== index);
      return { ...current, [key]: remaining.length ? remaining : [createUnknownRealityProfileField()] };
    });
  };

  const save = async () => {
    setStatus("正在安全保存…");
    try {
      const response = await fetch("/api/reality-profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
      const body = await response.json().catch(() => null) as { profile?: RealityProfileDraft; error_code?: string } | null;
      if (response.ok && body?.profile) {
        setProfile(body.profile);
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
    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">逐条记录目标、价值观、人生主题、压力与外部变量。每条都由你标记为事实、假设或明确未知；没有你的输入时，系统不会推断或补写。</p>
    <div className="mt-8 space-y-6">
      {(Object.keys(scalarLabels) as ScalarKey[]).map(key => <section key={key} className="border-y border-white/10 py-5">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{scalarLabels[key]}</h2>
        <FieldEditor title={scalarLabels[key]} field={profile[key]} disabled={!ready} onChange={field => updateScalar(key, field)} />
      </section>)}
      {(Object.keys(listLabels) as ListKey[]).map(key => <section key={key} className="border-y border-white/10 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-[var(--text-primary)]">{listLabels[key]}</h2><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">每条单独标记事实、假设或未知。</p></div><button type="button" disabled={!ready || profile[key].length >= 8} onClick={() => addListItem(key)} className="inline-flex min-h-11 items-center border border-white/15 px-4 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50">新增{listLabels[key]}</button></div>
        <div className="mt-4 space-y-5">{profile[key].map((field, index) => <div key={`${key}-${index}`} className="border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[var(--text-primary)]">第 {index + 1} 项</h3><button type="button" disabled={!ready || profile[key].length <= 1} onClick={() => removeListItem(key, index)} aria-label={`移除第 ${index + 1} 项${listLabels[key]}`} className="inline-flex min-h-10 items-center px-3 text-sm text-[var(--text-secondary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-40">移除</button></div>
          <FieldEditor title={`${listLabels[key]}第${index + 1}项`} field={field} disabled={!ready} onChange={next => updateListItem(key, index, next)} />
        </div>)}</div>
      </section>)}
    </div>
    <button type="button" disabled={!ready} onClick={() => void save()} className="mt-7 min-h-11 rounded bg-[var(--evidence-gold)] px-5 py-3 text-sm font-semibold text-black transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50">保存当前正式链资料</button>
    <p role="status" className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{status}</p>
  </main>;
}

function FieldEditor({ title, field, disabled, onChange }: { title: string; field: RealityProfileField; disabled: boolean; onChange: (field: RealityProfileField) => void }) {
  const setClassification = (classification: RealityProfileField["classification"]) => {
    if (classification === "unknown") {
      onChange(createUnknownRealityProfileField());
      return;
    }
    onChange(field.classification === "unknown" ? { value: "", classification, evidenceSummary: "" } : { ...field, classification });
  };

  return <>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <label className="text-sm text-[var(--text-secondary)]">资料类别<select aria-label={`${title}资料类别`} disabled={disabled} value={field.classification} onChange={event => setClassification(event.target.value as RealityProfileField["classification"])} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]"><option value="fact">事实</option><option value="assumption">假设</option><option value="unknown">明确未知</option></select></label>
      <label className="text-sm text-[var(--text-secondary)]">安全证据摘要<textarea aria-label={`${title}安全证据摘要`} disabled={disabled || field.classification === "unknown"} value={field.evidenceSummary} onChange={event => onChange({ ...field, evidenceSummary: event.target.value })} className="mt-2 block min-h-20 w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--text-primary)]" /></label>
    </div>
    <label className="mt-4 block text-sm text-[var(--text-secondary)]">可复核描述<textarea aria-label={`${title}可复核描述`} disabled={disabled || field.classification === "unknown"} value={field.value} onChange={event => onChange({ ...field, value: event.target.value })} className="mt-2 block min-h-20 w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--text-primary)]" /></label>
  </>;
}
