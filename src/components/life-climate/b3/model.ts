import { b3RuleSchema, type LifeClimateB3Assumption, type LifeClimateB3Condition, type LifeClimateB3Horizon, type LifeClimateB3Request, type LifeClimateB3Rule } from "@/lib/life-climate/b3/contracts";
import { listRealityProfileEntries } from "@/lib/reality-profile/profile";
import type { B3Source } from "./http";

export const ruleNames = { scenario_change: "背景或环境情景", recurring_resource_flow: "逐期补给、积累或必要支出", one_time_resource_change: "一次性资源变化", investment_cycle: "学习与长期投入", relocation: "迁居与一次成本", guarded_structure_transition: "有前提的结构变化", transition_readiness: "转型条件核对" } as const;
export type RuleKind = keyof typeof ruleNames;
export type Editor = { kind: RuleKind; label: string; path: string; stages: number[]; source: string; value: string; resource: string; direction: "credit" | "debit"; amount: string; amounts: string[]; obligation: "required" | "optional"; timeResource: string; budgetResource: string; initial: string; time: string; cost: string; investment: string; investmentMinimum: string; resourceMinimum: string; domain: "career" | "lifeStage"; guardResource: string; guardAmount: string; guardSource: string; guardValue: string; priorRule: string };
export function blankEditor(): Editor { return { kind: "scenario_change", label: "", path: "choice-one", stages: [1], source: "", value: "", resource: "", direction: "debit", amount: "", amounts: ["", "", "", "", ""], obligation: "required", timeResource: "", budgetResource: "", initial: "", time: "", cost: "", investment: "", investmentMinimum: "", resourceMinimum: "", domain: "career", guardResource: "", guardAmount: "", guardSource: "", guardValue: "", priorRule: "" }; }
export function decimalInput(value: string): string {
  const trimmed = value.trim();
  if (!/^\d{1,13}(?:\.\d{1,6})?$/.test(trimmed)) throw new Error("数量须填写非负数，最多六位小数；请直接输入，不会自动计算或四舍五入。");
  const [whole, fraction = ""] = trimmed.split(".");
  const integer = whole.replace(/^0+(?=\d)/, "");
  const tail = fraction.replace(/0+$/, "");
  return tail ? `${integer}.${tail}` : integer;
}
export const stageCount = (horizon: LifeClimateB3Horizon) => horizon === "1_year" ? 4 : horizon === "3_years" ? 3 : 5;
export const stageName = (horizon: LifeClimateB3Horizon, index: number) => `第 ${index} ${horizon === "1_year" ? "季度" : "年"}`;
const nextId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export type DeclaredResource = LifeClimateB3Request["model"]["resources"][number] & { initialAssumption?: LifeClimateB3Assumption };
export const profileResources = (source: B3Source): DeclaredResource[] => source.view.profile.worldInputs.resources.map(item => ({ id: item.key, label: item.label, resourceType: item.resourceType === "budget" || item.resourceType === "time" ? item.resourceType : "other", unit: item.unit, initial: { kind: "profile_resource", resourceKey: item.key }, minimum: String(item.minimum), maximum: String(item.maximum) }));
export function makeRule(editor: Editor, source: B3Source, horizon: LifeClimateB3Horizon, order: number, declaredResources = profileResources(source)): { rule: LifeClimateB3Rule; assumptions: LifeClimateB3Assumption[] } {
  if (!editor.label.trim() || editor.stages.length === 0) throw new Error("请命名这项条件，并选择适用阶段。");
  const resources = declaredResources;
  const entries = listRealityProfileEntries(source.view.profile);
  const assumptions: LifeClimateB3Assumption[] = [];
  const refs = new Set<string>();
  const resource = (key: string) => { const found = resources.find(item => item.id === key); if (!found) throw new Error("请选择已明确声明的资源。"); if (found.initial.kind === "profile_resource") refs.add(`worldInputs.resources.${found.initial.resourceKey}`); return { ...found, key: found.id }; };
  const entry = (key: string) => { if (!entries.some(item => item.key === key)) throw new Error("请选择已有资料项。"); refs.add(key); return key; };
  const quantity = (label: string, value: string, unit: string, periodUnit: "once" | "quarter" | "year") => { const id = nextId("a"); assumptions.push({ id, kind: "quantity", label, value: value.trim() ? decimalInput(value) : null, unit, periodUnit, evidenceSummary: "本人明确输入并需单独确认的沙盘数量假设" }); return id; };
  const state = (label: string, value: string) => { const id = nextId("a"); assumptions.push({ id, kind: "state", label, value: value.trim() || null, evidenceSummary: "本人明确设定并需单独确认的条件情景" }); return id; };
  const unit = horizon === "1_year" ? "quarter" : "year";
  const guards: LifeClimateB3Condition[] = [];
  if (editor.guardResource) { const found = resource(editor.guardResource); guards.push({ kind: "resource_at_least", resourceId: found.key, amountAssumptionId: quantity("阶段前提：保留资源", editor.guardAmount, found.unit, "once") }); }
  if (editor.guardSource) guards.push({ kind: "source_state_is", sourceEntryKey: entry(editor.guardSource), valueAssumptionId: state("阶段前提：背景条件", editor.guardValue) });
  if (editor.priorRule) guards.push({ kind: "rule_executed", ruleId: editor.priorRule });
  let specific: Record<string, unknown>;
  switch (editor.kind) {
    case "scenario_change": if (editor.source.startsWith("lifeModelDomains.")) throw new Error("六域结构变化请使用有前提的结构变化类型。"); specific = { sourceEntryKey: entry(editor.source), valueAssumptionId: state(editor.label, editor.value) }; break;
    case "one_time_resource_change": { const found = resource(editor.resource); specific = { resourceId: found.key, direction: editor.direction, amountAssumptionId: quantity(editor.label, editor.amount, found.unit, "once") }; break; }
    case "recurring_resource_flow": { const found = resource(editor.resource); specific = { resourceId: found.key, direction: editor.direction, obligation: editor.obligation, amountByStage: editor.stages.map(stageIndex => ({ stageIndex, amountAssumptionId: quantity(`${editor.label} · ${stageName(horizon, stageIndex)}`, editor.amounts[stageIndex - 1], found.unit, unit) })) }; break; }
    case "investment_cycle": { const time = resource(editor.timeResource), budget = resource(editor.budgetResource); specific = { investmentId: nextId("i"), initialProgressAssumptionId: quantity("已完成的学习投入", editor.initial, time.unit, "once"), timeResourceId: time.key, budgetResourceId: budget.key, timeAmountAssumptionId: quantity("每期学习时间", editor.time, time.unit, unit), costAmountAssumptionId: quantity("每期学习费用", editor.cost, budget.unit, unit) }; break; }
    case "relocation": { const budget = resource(editor.budgetResource); if (!editor.source.startsWith("lifeModelDomains.environment.")) throw new Error("迁居请选择城市与生活环境资料项。"); specific = { targetEntryKey: entry(editor.source), valueAssumptionId: state("迁居后的环境条件", editor.value), budgetResourceId: budget.key, costAmountAssumptionId: quantity("迁居一次成本", editor.cost, budget.unit, "once") }; break; }
    case "guarded_structure_transition": if (!editor.source.startsWith("lifeModelDomains.") || guards.length === 0) throw new Error("结构变化必须选择六域资料项，并明确至少一个阶段前提。"); specific = { effects: [{ targetEntryKey: entry(editor.source), valueAssumptionId: state(editor.label, editor.value) }] }; break;
    case "transition_readiness": { const time = resource(editor.timeResource), reserve = resource(editor.resource); if (!editor.investment) throw new Error("请选择同一路径已添加的学习投入。"); guards.push({ kind: "investment_at_least", investmentId: editor.investment, amountAssumptionId: quantity("转型所需累计投入", editor.investmentMinimum, time.unit, "once") }, { kind: "resource_at_least", resourceId: reserve.key, amountAssumptionId: quantity("转型所需资源余量", editor.resourceMinimum, reserve.unit, "once") }); specific = { domain: editor.domain, investmentId: editor.investment }; break; }
  }
  const parsed = b3RuleSchema.safeParse({ id: nextId("r"), label: editor.label.trim(), order, stages: editor.stages, assumptionRefs: assumptions.map(item => item.id), sourceRefs: [...refs], guard: guards.length ? { all: guards } : null, kind: editor.kind, ...specific });
  if (!parsed.success) throw new Error("部分条件尚不完整或包含不适合保存的内容，请核对名称、资料项与数量。");
  return { rule: parsed.data, assumptions };
}
