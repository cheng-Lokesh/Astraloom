"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ObservatoryShell } from "@/components/astraloom/ObservatoryShell";

export type SimulationTrack = "track_a" | "track_b";
export type TimeHorizon = "30d" | "90d" | "1y" | "3y" | "5y";
export type ScenarioType = "career" | "intimacy" | "wealth_pressure" | "collaboration" | "life_direction";

export default function NewSimulationPage() {
  const router = useRouter();
  const [track, setTrack] = useState<SimulationTrack>("track_a");
  const [scenario, setScenario] = useState<ScenarioType>("career");
  const [horizon, setHorizon] = useState<TimeHorizon>("90d");
  const [question, setQuestion] = useState("");
  const [contextStory, setContextStory] = useState("");
  const [keyPeopleInput, setKeyPeopleInput] = useState("");
  const [forbiddenActions, setForbiddenActions] = useState<string[]>([]);
  const [forbiddenActionInput, setForbiddenActionInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addBoundary() {
    const value = forbiddenActionInput.trim();
    if (!value || forbiddenActions.includes(value)) return;
    setForbiddenActions((current) => [...current, value]);
    setForbiddenActionInput("");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim() || !contextStory.trim()) return;
    setIsSubmitting(true);
    router.push("/review/agents");
  }

  return <ObservatoryShell title="装载新沙盘 · 种子上下文采集 (Seed Context Intake)" stage="阶段 1 / 4 · 问题收窄与边界初始化"><form onSubmit={submit} className="space-y-6">
    <Panel title="[01] 选择推演视界与轨道"><div className="grid gap-4 md:grid-cols-2"><TrackCard active={track === "track_a"} tone="amber" title="轨道 A · 十字路口决策模式" description="针对明确的去留、冲突、沟通或合作十字路口，观察 30/90 天内的多方互动。" onClick={() => { setTrack("track_a"); setHorizon("90d"); }} horizons={["30d", "90d"]} selected={horizon} onHorizon={setHorizon} /><TrackCard active={track === "track_b"} tone="sky" title="轨道 B · 人生阶段气候模式" description="针对阶段转型，以粗粒度观察 1 至 5 年关系结构，不承诺具体日期与事件。" onClick={() => { setTrack("track_b"); setHorizon("1y"); }} horizons={["1y", "3y", "5y"]} selected={horizon} onHorizon={setHorizon} /></div></Panel>
    <Panel title="[02] 场景领域与核心主问题"><div className="flex flex-wrap gap-2">{([{ id: "career", label: "职场博弈 / 权威关系" }, { id: "intimacy", label: "亲密关系 / 沟通冷淡" }, { id: "collaboration", label: "合伙合作 / 资源对齐" }, { id: "wealth_pressure", label: "财务承压 / 现金流决策" }, { id: "life_direction", label: "人生转折 / 城市迁移" }] as const).map((item) => <button key={item.id} type="button" onClick={() => setScenario(item.id)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition-[background-color,border-color,transform] active:scale-95 ${scenario === item.id ? "border-slate-200 bg-slate-100 text-slate-950" : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"}`}>{item.label}</button>)}</div><Field label="你希望这个沙盘帮助观察什么？" required><input value={question} onChange={(e) => setQuestion(e.target.value)} required className="observatory-input" placeholder="例如：未来 90 天继续留任与接受新机会，各自会怎样影响我的关系与资源？" /></Field></Panel>
    <Panel title="[03] 现实上下文与关键人物"><Field label="用自己的话讲述近期事实" required><textarea value={contextStory} onChange={(e) => setContextStory(e.target.value)} required rows={6} className="observatory-input resize-y" placeholder="只写你确认的事实、近期事件和仍不确定的部分。" /></Field><Field label="关键人物提示"><input value={keyPeopleInput} onChange={(e) => setKeyPeopleInput(e.target.value)} className="observatory-input" placeholder="例如：直属上级、伴侣、招聘方。不要填写不必要的敏感信息。" /></Field></Panel>
    <Panel title="[04] 行动边界"><div className="flex gap-2"><input value={forbiddenActionInput} onChange={(e) => setForbiddenActionInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBoundary(); } }} className="observatory-input" placeholder="例如：不在情绪高峰时裸辞" /><button type="button" onClick={addBoundary} className="min-h-11 shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-4 text-xs hover:bg-slate-700 active:scale-95">添加</button></div><div className="flex flex-wrap gap-2">{forbiddenActions.map((action) => <button key={action} type="button" onClick={() => setForbiddenActions((items) => items.filter((item) => item !== action))} className="min-h-10 rounded-md border border-rose-900/60 bg-rose-950/20 px-3 text-xs text-rose-200 active:scale-95">{action} ×</button>)}</div></Panel>
    <div className="flex justify-end"><button type="submit" disabled={isSubmitting || !question.trim() || !contextStory.trim()} className="min-h-11 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-slate-950 transition-[background-color,transform,opacity] hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">{isSubmitting ? "正在冻结种子…" : "确认上下文并生成人物智能体 →"}</button></div>
  </form></ObservatoryShell>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-4 rounded-2xl border border-observatory-subtle bg-observatory-surface p-5 md:p-6"><h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-slate-200">{title}</h2>{children}</section>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block space-y-2 text-xs font-medium text-slate-300"><span>{label}{required && <span className="text-amber-400"> *</span>}</span>{children}</label>; }
function TrackCard({ active, tone, title, description, onClick, horizons, selected, onHorizon }: { active: boolean; tone: "amber" | "sky"; title: string; description: string; onClick: () => void; horizons: TimeHorizon[]; selected: TimeHorizon; onHorizon: (value: TimeHorizon) => void }) { const border = tone === "amber" ? "border-amber-500/70" : "border-sky-500/70"; return <div className={`rounded-xl border p-4 ${active ? `bg-observatory-raised ${border}` : "border-slate-800 bg-slate-900/40"}`}><button type="button" onClick={onClick} className="min-h-10 w-full text-left text-sm font-semibold text-slate-100 active:scale-[0.99]">{title}</button><p className="mb-3 text-xs leading-relaxed text-slate-400">{description}</p><div className="flex flex-wrap gap-2">{horizons.map((value) => <button key={value} type="button" onClick={() => onHorizon(value)} className={`min-h-10 rounded border px-2.5 font-mono text-xs active:scale-95 ${active && selected === value ? "border-slate-100 bg-slate-200 font-semibold text-slate-950" : "border-slate-800 bg-slate-950 text-slate-400"}`}>{value}</button>)}</div></div>; }
