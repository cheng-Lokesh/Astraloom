import type { FormalSandboxResultProjection as Projection } from "@/lib/formal-sandbox/client";

export type ComparisonEntry = { title: string; lines: string[] };
export type ComparisonSide = { recorded: boolean; entries: ComparisonEntry[]; note: string };
export type ComparisonStatus = "same" | "different" | "order_only" | "not_recorded";
export type ComparisonCategory = { id: string; label: string; status: ComparisonStatus; left: ComparisonSide; right: ComparisonSide; boundary: string };

const unsafe = /[\u0000-\u001f]|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[^\s@]+@[^\s@]+\.[^\s@]+|https?:\/\/|\b(?:person|relation|claim|step|path|fact|assumption|background|resource|rule)-\d+\b|\b(?:token|secret|password|bearer|trace[_ -]?id|internal[_ -]?key|raw\s+(?:scenario|evidence))\b/i;
export function comparisonText(value: string) { return unsafe.test(value) ? "内容未公开（安全边界）" : value; }
const text = comparisonText;
const lookup = (labels: Record<string, string>, value: string) => labels[value] ?? "未记录";
const classification = (value: string) => lookup({ fact: "明确事实", assumption: "明确假设", unknown: "明确未知" }, value);
const role = (value: string) => lookup({ user_core: "本人", user_variant: "平行自我", npc: "其他人物", group: "组织", "scenario decision maker": "本人", "frozen participant": "冻结人物" }, value);
const signal = (value: string) => lookup({ negative: "负向", neutral: "中性", positive: "正向" }, value);
const type = (value: string) => lookup({ time: "时间", budget: "预算", position_availability: "岗位可用量", information: "信息" }, value);
const entry = (title: string, ...lines: string[]): ComparisonEntry => ({ title: text(title), lines: lines.map(text) });
const source = (value: string) => `来源：${text(value)}`;
function side(recorded: boolean, entries: ComparisonEntry[], note = "此 Run 未记录此类冻结数据；不会用当前模型或另一侧补回。"): ComparisonSide { return { recorded, entries, note }; }

function person(p: Projection, key: string) { return text(p.digitalLifeModel?.agents.find(item => item.key === key)?.label ?? p.participants.find(item => item.key === key)?.label ?? "人物未记录"); }
function relation(p: Projection, key: string) {
  const item = p.relationships.find(item => item.key === key);
  return item ? `${text(item.label)}（${person(p, item.fromPersonKey)} → ${person(p, item.toPersonKey)}）` : "关系未记录";
}
function support(p: Projection, keys: string[]) {
  return keys.map(key => {
    const step = p.steps.find(item => item.key === key);
    return step ? `步骤 ${step.order}：${text(step.label)}` : "支持步骤未记录";
  }).join("；") || "未单独记录";
}
function rules(p: Projection): ComparisonEntry[] {
  const model = p.digitalLifeModel;
  return (model?.rules ?? []).map((rule, index) => {
    const priorKey = rule.when.kind === "after_rule" ? rule.when.ruleKey : null;
    const prior = priorKey ? model?.rules.findIndex(item => item.key === priorKey) : -1;
    const trigger = rule.when.kind === "at_tick" ? `第 ${rule.when.tickIndex + 1} 个模拟周期` : prior !== undefined && prior >= 0 ? `本策略行动 ${prior + 1} 之后` : "前置行动未记录";
    const op = rule.operation;
    let action: string;
    if (op.actionType === "request_information") action = `询问信息：${person(p, op.targetPersonKey)}；${text(op.question)}`;
    else if (op.actionType === "update_commitment") action = `承诺：${text(op.label)}；${({ planned: "计划", active: "进行中", fulfilled: "已完成", cancelled: "取消" })[op.status]}`;
    else if (op.actionType === "update_relation_signal") action = `条件关系回应：${relation(p, op.relationKey)}；${signal(op.signal)}（确认假设，非真实意图）`;
    else {
      const resource = p.realityProfile.structuredResources[Number(op.resourceKey.replace("resource-", "")) - 1];
      action = `资源分配：${resource ? text(resource.label) : "资源未记录"}；${op.amount}${resource ? ` ${text(resource.unit)}` : ""}`;
    }
    return entry(`行动 ${index + 1}`, `执行人物：${person(p, rule.actorKey)}`, `独立条件：${rule.pathKey === "main" ? "采样主路径" : person(p, rule.pathKey)}`, `触发：${trigger}`, action, source(rule.evidenceSummary), "确认边界：用户确认的模拟假设");
  });
}
function frozenSections(p: Projection): { id: string; label: string; value: ComparisonSide; boundary: string }[] {
  const profile = p.realityProfile;
  const frozen = profile.status === "frozen";
  const model = p.digitalLifeModel;
  const modelFrozen = model?.status === "frozen";
  const profileItems = (items: typeof profile.facts, baseline: { statement: string }[]) => [ ...(frozen ? items.map(item => entry(item.label, item.statement, source(item.evidenceSummary), "冻结 Reality Profile 项")) : []), ...baseline.map(item => entry(item.statement, "本 Run 冻结输入记录；非当前 Profile")) ];
  const values = [
    { id: "background", label: "十四维数字生命背景", value: side(Boolean(modelFrozen), modelFrozen ? [entry("冻结模型与限制", `模型版本：${model!.version}`, `Profile Revision ${model!.profileRevision}`, ...model!.limitations), ...model!.background.map(item => entry(item.label, classification(item.classification), item.classification === "unknown" ? "明确未知" : item.value, source(item.evidenceSummary), "仅作背景，不构成行动规则"))] : []), boundary: "事实、假设与未知分别保留；所有背景均不自动进入因果逻辑。" },
    { id: "people", label: "人物角色与关系", value: side(true, [ ...(modelFrozen ? model!.agents.map(item => entry(item.label, `角色：${role(item.role)}`, `策略：${({ explicit: "明确条件", not_defined: "未定义", not_applicable: "不适用" })[item.strategyStatus]}`, source(item.evidenceSummary))) : p.participants.map(item => entry(item.label, `角色：${role(item.role)}`, "数字生命角色来源未记录"))), ...p.relationships.map(item => entry(relation(p, item.key), "本 Run 的冻结关系")) ]), boundary: "两侧人物与关系各属其 Run；相同序号或标签不证明是同一现实人物。" },
    { id: "rules", label: "显式行动与确认边界", value: side(Boolean(modelFrozen), rules(p)), boundary: "只显示冻结的明确条件，不从背景或文本推导行动。" },
    { id: "facts", label: "明确事实与来源", value: side(frozen, profileItems(profile.facts, p.facts), "此 Run 未记录 Reality Profile 事实快照；以下仅保留本 Run 已有冻结输入，不补回当前 Profile。"), boundary: "这些是冻结的用户输入，模拟事件不能成为现实事实。" },
    { id: "assumptions", label: "明确假设与来源", value: side(frozen, profileItems(profile.assumptions, p.assumptions), "此 Run 未记录 Reality Profile 假设快照；以下仅保留本 Run 已有冻结输入，不补回当前 Profile。"), boundary: "假设保留条件性，不代表已经确认的现实。" },
    { id: "unknowns", label: "明确未知", value: side(frozen, profile.unknowns.map(item => entry(item.label, "明确未知"))), boundary: "未知保持未知，不用另一次 Run 补齐。" },
    { id: "resources", label: "资源量与上下限", value: side(frozen, profile.structuredResources.map(item => entry(item.label, `类型：${type(item.resourceType)}`, `资源量：${item.available} ${text(item.unit)}`, `下限：${item.minimum}；上限：${item.maximum}`, `周期消耗：${item.usePerTick ?? "未记录"}`, classification(item.classification), source(item.evidenceSummary)))), boundary: "左右原值按各自记录展示；同名资源不自动合并，不计算现实变化或改善率。" },
    { id: "constraints", label: "资源截止与约束", value: side(frozen, profile.structuredConstraints.map(item => entry(item.label, `资源：${text(item.resourceLabel)}`, `截止：${item.rule.value}`, classification(item.classification), source(item.evidenceSummary)))), boundary: "这是冻结的期限条件；不表示已经兑现或产生现实变化。" },
    { id: "world", label: "静态压力与外部变量", value: side(frozen, profile.worldVariables.map(item => entry(item.label, item.category === "pressure" ? "压力" : "外部变量", item.value, classification(item.classification), source(item.evidenceSummary), item.state === "static_without_explicit_rule" ? "静态值，未定义演化规则" : "未记录"))), boundary: "没有明确规则的变量保持静态。" },
    { id: "resource-changes", label: "各自采样资源变化", value: side(true, p.resourceChanges.map(item => entry(item.label, `模拟前：${item.before} ${text(item.unit)}；模拟后：${item.after} ${text(item.unit)}`, `下限：${item.minimum}；上限：${item.maximum}`, `采样路径 ${Number(item.pathKey.replace("path-", ""))}`, "本 Run 模拟变化，非现实观测"))), boundary: "每个 before/after 仅属于本 Run 的采样路径，不跨 Run 拼接资源变迁。" },
    { id: "relationship-changes", label: "各自关系回应与支持步骤", value: side(p.relationshipChanges !== undefined, (p.relationshipChanges ?? []).map(item => entry(relation(p, item.relationshipKey), `模拟前：${signal(item.before)}；模拟后：${signal(item.after)}`, `本 Run 支持：${support(p, [item.stepKey])}`, "条件回应，不代表真实人物意图"))), boundary: "支持步骤只从本 Run 读取，不沿另一列的相同序号查找。" },
    { id: "steps", label: "各自模拟步骤", value: side(true, p.steps.map(item => entry(`步骤 ${item.order}：${text(item.label)}`, `人物：${item.participantKeys.map(key => person(p, key)).join("、") || "未单独列出"}`, `关系：${item.relationshipKeys.map(key => relation(p, key)).join("、") || "未单独列出"}`, "模拟过程记录，非现实事件"))), boundary: "步骤编号只用于各自历史记录。" },
    { id: "claims", label: "各自条件结论与证据", value: side(true, p.claims.map(item => entry(item.statement, item.uncertainty, `关联模拟步骤：${support(p, item.stepKeys)}`, `本 Run 支持：${support(p, item.supportingStepKeys)}`, `人物：${item.participantKeys.map(key => person(p, key)).join("、") || "未单独列出"}`, `关系：${item.relationshipKeys.map(key => relation(p, key)).join("、") || "未单独列出"}`))), boundary: "结论与支持链属于各自 Run，不形成跨 Run 的因果结论。" },
  ];
  return values;
}

function symbolic(p: Projection): ComparisonSide {
  const lens = p.symbolicLens;
  if (!lens || lens.status === "not_recorded") return side(false, []);
  const state = ({ attached: "已附加", not_configured: "未配置", not_authorized: "未授权", stale: "已过期", withdrawn: "已撤回", not_recorded: "未记录" })[lens.status];
  const frame = lens.frame;
  const entries = [entry("冻结象征状态", state, `冻结时间：${lens.frozenAt ?? "未记录"}`, `授权版本：${lens.preferenceRevision ?? "未记录"}`, "非因果，不影响现实事实、行动或结论")];
  if (frame) {
    entries.push(entry("参考期与版本限制", `参考期：${frame.referencePeriod.key}；参考日期：${frame.referencePeriod.referenceDate}`, `时区：${frame.referencePeriod.timezone}；按月复核`, `框架版本：${frame.version}；规则版本：${frame.ruleVersion}；来源版本：${frame.sourceVersion}`, `计算版本：${frame.calculation.calculationVersion}`, frame.calculation.precision === "date_only" ? "仅日期精度；时刻未知" : "本地民用时间精度", "近似节气；无真太阳时或出生时区校正", ...frame.limitations));
    for (const item of frame.dimensions) entries.push(entry(item.label, item.value, item.summary, "显式产品象征规则；非现实证据", ...item.limitations));
  }
  return side(true, entries);
}
function allSections(p: Projection) {
  const strategies = (p.strategyPaths ?? []).map(path => entry(path.label, "独立策略条件与世界；不与其他策略合并", ...frozenSections(path.projection).flatMap(section => [section.label, ...(section.value.recorded ? section.value.entries.flatMap(item => [item.title, ...item.lines]) : [section.value.note])]), ...(path.projection.digitalLifeModel?.limitations ?? [])));
  return [...frozenSections(p), { id: "strategies", label: "各自独立策略", value: side(p.strategyPaths !== undefined, strategies), boundary: "每个策略独立读取人物、条件、资源、关系、步骤与结论；相同结论序号不会跨策略查证据。" }, { id: "symbolic", label: "冻结象征五维与限制", value: symbolic(p), boundary: "五维仅供固定维度对照，始终非因果；未记录不会重新计算。" }];
}
/** Compares complete safe content collections, never cross-Run entity identifiers. */
export function buildHistoryComparisonModel(left: Projection, right: Projection): ComparisonCategory[] {
  const l = allSections(left), r = allSections(right);
  return l.map((section, index) => {
    const a = section.value, b = r[index].value;
    const leftValues = a.entries.map(item => JSON.stringify(item)), rightValues = b.entries.map(item => JSON.stringify(item));
    const status: ComparisonStatus = !a.recorded || !b.recorded ? "not_recorded" : JSON.stringify(leftValues) === JSON.stringify(rightValues) ? "same" : JSON.stringify([...leftValues].sort()) === JSON.stringify([...rightValues].sort()) ? "order_only" : "different";
    return { id: section.id, label: section.label, boundary: section.boundary, left: a, right: b, status };
  });
}
