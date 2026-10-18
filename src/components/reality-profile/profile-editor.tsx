"use client";

import type { ReactNode } from "react";
import { createUnknownRealityProfileField, type RealityProfileDraft, type RealityProfileField, type RealityProfileLifeModelDomains, type RealityProfileWorldInputs } from "@/lib/reality-profile/profile";

type ReviewRenderer = (key: string, label: string) => ReactNode;
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
type LifeModelDomainKey = Exclude<keyof RealityProfileLifeModelDomains, "version">;
const lifeModelDomainLabels: Record<LifeModelDomainKey, string> = {
  identity: "身份结构",
  career: "职业结构",
  wealth: "财富结构",
  relationships: "关系生态",
  environment: "城市与生活环境",
  lifeStage: "人生阶段",
};


export function RealityProfileEditor({ profile, disabled, onChange, renderReview, renderRateReview }: { profile: RealityProfileDraft; disabled: boolean; onChange: (profile: RealityProfileDraft) => void; renderReview?: ReviewRenderer; renderRateReview?: ReviewRenderer }) {
  const setProfile = (update: (current: RealityProfileDraft) => RealityProfileDraft) => onChange(update(profile));
  const updateScalar = (key: ScalarKey, field: RealityProfileField) => {
    setProfile(current => ({ ...current, [key]: field }));
  };

  const updateListItem = (key: ListKey, index: number, field: RealityProfileField) => {
    setProfile(current => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? field : item) }));
  };

  const updateWorldInputs = (worldInputs: RealityProfileWorldInputs) => {
    setProfile(current => ({ ...current, worldInputs }));
  };

  const updateLifeModelDomain = (key: LifeModelDomainKey, index: number, field: RealityProfileField) => {
    setProfile(current => ({ ...current, lifeModelDomains: { ...current.lifeModelDomains, [key]: current.lifeModelDomains[key].map((item, itemIndex) => itemIndex === index ? field : item) } }));
  };

  const updateLifeModelDomains = (lifeModelDomains: RealityProfileLifeModelDomains) => {
    setProfile(current => ({ ...current, lifeModelDomains }));
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

  return (
    <div className="mt-8 space-y-6">
      {(Object.keys(scalarLabels) as ScalarKey[]).map(key => <section key={key} className="border-y border-white/10 py-5">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{scalarLabels[key]}</h2>
        <FieldEditor title={scalarLabels[key]} field={profile[key]} disabled={disabled} onChange={field => updateScalar(key, field)} />
        {renderReview?.(key, scalarLabels[key])}
      </section>)}
      <WorldInputsEditor inputs={profile.worldInputs} disabled={disabled} onChange={updateWorldInputs} renderReview={renderReview} renderRateReview={renderRateReview} />
      <LifeModelDomainsEditor domains={profile.lifeModelDomains} disabled={disabled} onChange={updateLifeModelDomains} onUpdateItem={updateLifeModelDomain} renderReview={renderReview} />
      {(Object.keys(listLabels) as ListKey[]).map(key => <section key={key} className="border-y border-white/10 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-[var(--text-primary)]">{listLabels[key]}</h2><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">每条单独标记事实、假设或未知。</p></div><button type="button" disabled={disabled || profile[key].length >= 8} onClick={() => addListItem(key)} className="inline-flex min-h-11 items-center border border-white/15 px-4 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50">新增{listLabels[key]}</button></div>
        <div className="mt-4 space-y-5">{profile[key].map((field, index) => <div key={`${key}-${index}`} className="border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[var(--text-primary)]">第 {index + 1} 项</h3><button type="button" disabled={disabled || profile[key].length <= 1} onClick={() => removeListItem(key, index)} aria-label={`移除第 ${index + 1} 项${listLabels[key]}`} className="inline-flex min-h-10 items-center px-3 text-sm text-[var(--text-secondary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-40">移除</button></div>
          <FieldEditor title={`${listLabels[key]}第${index + 1}项`} field={field} disabled={disabled} onChange={next => updateListItem(key, index, next)} />
          {renderReview?.(`${key}.${index + 1}`, `${listLabels[key]}第${index + 1}项`)}
        </div>)}</div>
      </section>)}
    </div>
  );
}

export function LifeModelDomainsEditor({ domains, disabled, onChange, onUpdateItem, renderReview }: { renderReview?: ReviewRenderer; domains: RealityProfileLifeModelDomains; disabled: boolean; onChange: (domains: RealityProfileLifeModelDomains) => void; onUpdateItem: (key: LifeModelDomainKey, index: number, field: RealityProfileField) => void }) {
  const add = (key: LifeModelDomainKey) => {
    if (domains[key].length >= 8) return;
    onChange({ ...domains, [key]: [...domains[key], createUnknownRealityProfileField()] });
  };
  const remove = (key: LifeModelDomainKey, index: number) => {
    const remaining = domains[key].filter((_, itemIndex) => itemIndex !== index);
    onChange({ ...domains, [key]: remaining.length ? remaining : [createUnknownRealityProfileField()] });
  };
  return <section className="border-y border-white/10 py-5">
    <div className="border-b border-white/10 pb-4"><h2 className="text-xl font-semibold text-[var(--text-primary)]">长期生命结构</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">为长期路径整理身份、职业、财富、关系、生活环境和人生阶段。资料先按事实、假设、未知保存；无需填写账号、证件号或其他敏感原文，当前不会据此生成长期预测。</p></div>
    <div className="mt-2 grid gap-5 md:grid-cols-2">{(Object.keys(lifeModelDomainLabels) as LifeModelDomainKey[]).map(key => <section key={key} className="border-b border-white/10 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-base font-semibold text-[var(--text-primary)]">{lifeModelDomainLabels[key]}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">逐条标记来源与确定性。</p></div><button type="button" disabled={disabled || domains[key].length >= 8} onClick={() => add(key)} className="inline-flex min-h-10 items-center border border-white/15 px-3 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50">新增</button></div>
      <div className="mt-3 space-y-4">{domains[key].map((field, index) => <div key={`${key}-${index}`} className="border-t border-white/10 pt-3"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs text-[var(--text-muted)]">第 {index + 1} 项</p><button type="button" disabled={disabled || domains[key].length <= 1} onClick={() => remove(key, index)} aria-label={`移除${lifeModelDomainLabels[key]}第 ${index + 1} 项`} className="min-h-9 px-2 text-xs text-[var(--text-secondary)] disabled:opacity-40">移除</button></div><FieldEditor title={`${lifeModelDomainLabels[key]}第${index + 1}项`} field={field} disabled={disabled} onChange={next => onUpdateItem(key, index, next)} />{renderReview?.(`lifeModelDomains.${key}.${index + 1}`, `${lifeModelDomainLabels[key]}第${index + 1}项`)}</div>)}</div>
    </section>)}</div>
  </section>;
}

type WorldResourceInput = RealityProfileWorldInputs["resources"][number];
type WorldConstraintInput = RealityProfileWorldInputs["constraints"][number];

function nextWorldInputKey(prefix: string, keys: string[]) {
  let index = 1;
  while (keys.includes(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function localDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function isoDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function WorldInputsEditor({ inputs, disabled, onChange, renderReview, renderRateReview }: { renderReview?: ReviewRenderer; renderRateReview?: ReviewRenderer; inputs: RealityProfileWorldInputs; disabled: boolean; onChange: (inputs: RealityProfileWorldInputs) => void }) {
  const updateResource = (index: number, update: Partial<WorldResourceInput>) => {
    onChange({ ...inputs, resources: inputs.resources.map((resource, itemIndex) => itemIndex === index ? { ...resource, ...update } : resource) });
  };
  const updateConstraint = (index: number, update: Partial<WorldConstraintInput>) => {
    onChange({ ...inputs, constraints: inputs.constraints.map((constraint, itemIndex) => itemIndex === index ? { ...constraint, ...update } : constraint) });
  };
  const addResource = () => {
    if (inputs.resources.length >= 8) return;
    const key = nextWorldInputKey("resource", inputs.resources.map(resource => resource.key));
    onChange({ ...inputs, resources: [...inputs.resources, { key, label: "", resourceType: "time", available: 0, unit: "", minimum: 0, maximum: 0, usePerTick: null, classification: "assumption", evidenceSummary: "" }] });
  };
  const removeResource = (key: string) => {
    onChange({
      ...inputs,
      resources: inputs.resources.filter(resource => resource.key !== key),
      constraints: inputs.constraints.filter(constraint => constraint.resourceKey !== key),
    });
  };
  const addConstraint = () => {
    if (inputs.resources.length === 0 || inputs.constraints.length >= 8) return;
    const key = nextWorldInputKey("constraint", inputs.constraints.map(constraint => constraint.key));
    onChange({ ...inputs, constraints: [...inputs.constraints, { key, label: "", resourceKey: inputs.resources[0]!.key, rule: { kind: "before_time", value: "" }, classification: "fact", evidenceSummary: "" }] });
  };

  return <section className="border-y border-white/10 py-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">用于推演的结构化资源</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">仅录入有明确数值、单位和依据的项目。自由文本资源与限制保持为背景描述，不会被猜成模型参数。</p>
      </div>
      <button type="button" disabled={disabled || inputs.resources.length >= 8} onClick={addResource} className="inline-flex min-h-11 items-center border border-white/15 px-4 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50">新增结构化资源</button>
    </div>
    {inputs.resources.length === 0 ? <p className="mt-4 border border-dashed border-white/15 p-4 text-sm leading-6 text-[var(--text-secondary)]">尚无明确的结构化资源。需要至少一项资源并设定每次受控行动的变化量，正式 Run 才会构造对应的 World State；不会用默认的虚构容量代替。</p> : null}
    <div className="mt-4 space-y-5">{inputs.resources.map((resource, index) => <article key={resource.key} className="border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[var(--text-primary)]">资源 {index + 1}</h3><button type="button" disabled={disabled} onClick={() => removeResource(resource.key)} aria-label={`移除资源 ${index + 1}`} className="inline-flex min-h-10 items-center px-3 text-sm text-[var(--text-secondary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-40">移除</button></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-[var(--text-secondary)]">资源名称<input aria-label={`资源 ${index + 1} 名称`} disabled={disabled} value={resource.label} onChange={event => updateResource(index, { label: event.target.value })} maxLength={80} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" placeholder="例如：每周可投入时间" /></label>
        <label className="text-sm text-[var(--text-secondary)]">资源类型<select aria-label={`资源 ${index + 1} 类型`} disabled={disabled} value={resource.resourceType} onChange={event => updateResource(index, { resourceType: event.target.value as WorldResourceInput["resourceType"] })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]"><option value="time">时间</option><option value="budget">预算</option><option value="position_availability">岗位/机会名额</option><option value="information">信息</option></select></label>
        <label className="text-sm text-[var(--text-secondary)]">资料类别<select aria-label={`资源 ${index + 1} 资料类别`} disabled={disabled} value={resource.classification} onChange={event => updateResource(index, { classification: event.target.value as WorldResourceInput["classification"] })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]"><option value="fact">事实</option><option value="assumption">模拟假设</option></select></label>
        <label className="text-sm text-[var(--text-secondary)]">单位<input aria-label={`资源 ${index + 1} 单位`} disabled={disabled} value={resource.unit} onChange={event => updateResource(index, { unit: event.target.value })} maxLength={32} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" placeholder="例如：小时、元" /></label>
        <label className="text-sm text-[var(--text-secondary)]">当前可用数值<input aria-label={`资源 ${index + 1} 当前数值`} type="number" min="0" max="1000000" step="any" disabled={disabled} value={resource.available} onChange={event => updateResource(index, { available: Number(event.target.value) })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" /></label>
        <label className="text-sm text-[var(--text-secondary)]">最低保留<input aria-label={`资源 ${index + 1} 最低保留`} type="number" min="0" max="1000000" step="any" disabled={disabled} value={resource.minimum} onChange={event => updateResource(index, { minimum: Number(event.target.value) })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" /></label>
        <label className="text-sm text-[var(--text-secondary)]">最高边界<input aria-label={`资源 ${index + 1} 最高边界`} type="number" min="0" max="1000000" step="any" disabled={disabled} value={resource.maximum} onChange={event => updateResource(index, { maximum: Number(event.target.value) })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" /></label>
        <label className="text-sm text-[var(--text-secondary)]">每次受控行动的资源变化量<input aria-label={`资源 ${index + 1} 每次受控行动的资源变化量`} type="number" min="0.000001" max="1000000" step="any" disabled={disabled} value={resource.usePerTick ?? ""} onChange={event => updateResource(index, { usePerTick: event.target.value === "" ? null : Number(event.target.value) })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" placeholder="留空表示不执行资源变化" /></label>
      </div>
      <label className="mt-4 block text-sm text-[var(--text-secondary)]">安全证据摘要<input aria-label={`资源 ${index + 1} 安全证据摘要`} disabled={disabled} value={resource.evidenceSummary} onChange={event => updateResource(index, { evidenceSummary: event.target.value })} maxLength={160} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" placeholder="写明来源；不要粘贴原始隐私材料" /></label>
      {renderReview?.(`worldInputs.resources.${index + 1}`, `资源 ${index + 1}：${resource.label || "未命名"}`)}
      {resource.usePerTick !== null ? renderRateReview?.(`worldInputs.resources.${index + 1}`, resource.label || `资源 ${index + 1}`) : null}
    </article>)}</div>
    <div className="mt-7 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-5">
      <div><h3 className="text-base font-semibold text-[var(--text-primary)]">明确时间限制</h3><p className="mt-1 text-sm text-[var(--text-muted)]">截止时间会冻结进 Run，并约束对应资源的后续变化。</p></div>
      <button type="button" disabled={disabled || inputs.resources.length === 0 || inputs.constraints.length >= 8} onClick={addConstraint} className="inline-flex min-h-11 items-center border border-white/15 px-4 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50">新增时间限制</button>
    </div>
    <div className="mt-4 space-y-4">{inputs.constraints.map((constraint, index) => <article key={constraint.key} className="grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
      <label className="text-sm text-[var(--text-secondary)]">限制名称<input aria-label={`限制 ${index + 1} 名称`} disabled={disabled} value={constraint.label} onChange={event => updateConstraint(index, { label: event.target.value })} maxLength={80} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" placeholder="例如：合同确认截止" /></label>
      <label className="text-sm text-[var(--text-secondary)]">约束资源<select aria-label={`限制 ${index + 1} 约束资源`} disabled={disabled || inputs.resources.length === 0} value={constraint.resourceKey} onChange={event => updateConstraint(index, { resourceKey: event.target.value })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]">{inputs.resources.map(resource => <option key={resource.key} value={resource.key}>{resource.label || `资源 ${inputs.resources.indexOf(resource) + 1}`}</option>)}</select></label>
      <label className="text-sm text-[var(--text-secondary)]">截止时间<input aria-label={`限制 ${index + 1} 截止时间`} type="datetime-local" disabled={disabled} value={localDateTime(constraint.rule.value)} onChange={event => updateConstraint(index, { rule: { kind: "before_time", value: isoDateTime(event.target.value) } })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" /></label>
      <label className="text-sm text-[var(--text-secondary)]">资料类别<select aria-label={`限制 ${index + 1} 资料类别`} disabled={disabled} value={constraint.classification} onChange={event => updateConstraint(index, { classification: event.target.value as WorldConstraintInput["classification"] })} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]"><option value="fact">事实</option><option value="assumption">模拟假设</option></select></label>
      <label className="text-sm text-[var(--text-secondary)] md:col-span-2">安全证据摘要<input aria-label={`限制 ${index + 1} 安全证据摘要`} disabled={disabled} value={constraint.evidenceSummary} onChange={event => updateConstraint(index, { evidenceSummary: event.target.value })} maxLength={160} className="mt-2 block min-h-11 w-full border border-white/15 bg-black/20 px-3 text-[var(--text-primary)]" placeholder="写明来源；不要粘贴原始隐私材料" /></label>
      <div className="md:col-span-2">{renderReview?.(`worldInputs.constraints.${index + 1}`, `时间限制 ${index + 1}：${constraint.label || "未命名"}`)}</div>
      <button type="button" disabled={disabled} onClick={() => onChange({ ...inputs, constraints: inputs.constraints.filter((_, itemIndex) => itemIndex !== index) })} className="min-h-10 justify-self-start px-3 text-sm text-[var(--text-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-40">移除此时间限制</button>
    </article>)}</div>
    <p className="mt-5 border border-white/15 p-3 text-sm leading-6 text-[var(--text-secondary)]">“每次受控行动的资源变化量”是你明确填写的模拟规则，不是系统对现实的预测。留空时资源只作为冻结的 World State 输入，不会被假定发生变化。</p>
  </section>;
}

export function FieldEditor({ title, field, disabled, onChange }: { title: string; field: RealityProfileField; disabled: boolean; onChange: (field: RealityProfileField) => void }) {
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
