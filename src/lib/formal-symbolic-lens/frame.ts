import { z } from "zod";
import { calculateFourPillars } from "@/lib/destiny/calculate-four-pillars";
import { calculateElementBalance } from "@/lib/destiny/calculate-element-balance";
import { calculateTenGods, summarizeTenGods } from "@/lib/destiny/calculate-ten-gods";
import { CONTROLS, GENERATES } from "@/lib/destiny/constants";
import type { FiveElement } from "@/types/destiny";

export const SYMBOLIC_FRAME_VERSION = "formal-symbolic-frame-v1" as const;
export const SYMBOLIC_RULE_VERSION = "symbolic-product-rules-v1" as const;
const elementSchema = z.enum(["wood", "fire", "earth", "metal", "water"]);
const channels = ["peer", "expression", "resource", "responsibility", "support"] as const;
const channelNames = { peer: "自我节奏", expression: "表达", resource: "资源协调", responsibility: "角色边界", support: "信息支持" };
type Channel = typeof channels[number];
const safeText = z.string().min(1).max(600).refine(value => !/[\u0000-\u001f]|[^\s@]+@[^\s@]+\.[^\s@]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{4}-\d{2}-\d{2}/i.test(value));
export const birthSourceSchema = z.object({
  birthDate: z.string().regex(/^(19|20)\d{2}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }),
  birthTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
}).strict();
export type BirthSource = z.infer<typeof birthSourceSchema>;
const periodSchema = z.object({ key: z.string().regex(/^20\d{2}-\d{2}$/), referenceDate: z.string().regex(/^20\d{2}-\d{2}-\d{2}$/), structureKey: z.string().regex(/^[a-z_]+$/), timezone: z.literal("Asia/Shanghai"), granularity: z.literal("month") }).strict();
export const symbolicDimensionKeys = ["initial_tendency", "relationship_sensitivity", "rhythm", "symbolic_support_tension", "observation_window"] as const;
const dimensionSchema = z.object({ key: z.enum(symbolicDimensionKeys), label: safeText, value: safeText, summary: safeText, ruleId: z.enum(["natal-group-max-v1", "natal-relation-presence-v1", "period-channel-match-v1", "period-element-relation-v1", "coarse-period-review-v1"]), sourceRefs: z.array(z.enum(["natal_stem_counts", "natal_day_element", "current_year_month", "element_relation_table", "calendar_period"])).min(1).max(3), limitations: z.array(safeText).min(1).max(5) }).strict();
export const symbolicFrameSchema = z.object({
  version: z.literal(SYMBOLIC_FRAME_VERSION), ruleVersion: z.literal(SYMBOLIC_RULE_VERSION), sourceVersion: z.number().int().positive(), referencePeriod: periodSchema,
  classification: z.literal("symbolic_lens"), methodKind: z.literal("explicit_product_symbolic_rules"), causalUse: z.literal(false),
  calculation: z.object({ calculationVersion: z.literal("local-pillar-approximation-v1"), precision: z.enum(["date_only", "date_time_local"]), inputUsed: z.array(z.enum(["birthDate", "birthTime"])).min(1).max(2), usesSolarTermApproximation: z.literal(true), usesTrueSolarTime: z.literal(false), birthTimezoneCorrection: z.literal(false), pillarsAvailable: z.union([z.literal(3), z.literal(4)]), natalDayElement: elementSchema, natalStrongestElement: elementSchema, periodYearElement: elementSchema, periodMonthElement: elementSchema, groupCounts: z.object({ peer: z.number().min(0), expression: z.number().min(0), resource: z.number().min(0), responsibility: z.number().min(0), support: z.number().min(0) }).strict() }).strict(),
  dimensions: z.array(dimensionSchema).length(5), limitations: z.array(safeText).min(3).max(8),
}).strict().superRefine((frame, ctx) => {
  if (frame.dimensions.some((item, index) => item.key !== symbolicDimensionKeys[index])) ctx.addIssue({ code: "custom", message: "invalid_dimension_order" });
  const timed = frame.calculation.precision === "date_time_local";
  if (frame.calculation.pillarsAvailable !== (timed ? 4 : 3) || frame.calculation.inputUsed.join(",") !== (timed ? "birthDate,birthTime" : "birthDate")) ctx.addIssue({ code: "custom", message: "invalid_precision" });
});
export type SymbolicFrame = z.infer<typeof symbolicFrameSchema>;

function shanghaiDate(now: string) {
  const time = Date.parse(now);
  if (!Number.isFinite(time)) throw new Error("invalid_reference_time");
  return new Date(time + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
/** Calendar only: never receives the user's birth source. */
export function currentSymbolicPeriod(now: string) {
  const referenceDate = shanghaiDate(now);
  const pillars = calculateFourPillars({ birthDate: referenceDate });
  if (!pillars || !referenceDate.startsWith("20")) throw new Error("invalid_reference_time");
  return periodSchema.parse({ key: referenceDate.slice(0, 7), referenceDate, structureKey: `${pillars.year.stem}_${pillars.year.branch}_${pillars.month.stem}_${pillars.month.branch}`, timezone: "Asia/Shanghai", granularity: "month" });
}
function relation(anchor: FiveElement, current: FiveElement): Channel {
  if (anchor === current) return "peer";
  if (GENERATES[anchor] === current) return "expression";
  if (GENERATES[current] === anchor) return "support";
  if (CONTROLS[anchor] === current) return "resource";
  return "responsibility";
}
export function buildSymbolicFrame(sourceInput: unknown, sourceVersion: number, now: string): SymbolicFrame {
  const parsed = birthSourceSchema.safeParse(sourceInput);
  if (!parsed.success || parsed.data.birthDate > shanghaiDate(now)) throw new Error("invalid_birth_source");
  const source = parsed.data;
  const natal = calculateFourPillars({ birthDate: source.birthDate, birthTime: source.birthTime ?? undefined });
  if (!natal) throw new Error("invalid_birth_source");
  const balance = calculateElementBalance(natal);
  const counts = summarizeTenGods(calculateTenGods(natal));
  const groupCounts = { peer: counts.friend + counts.rob_wealth, expression: counts.eating_god + counts.hurting_officer, resource: counts.direct_wealth + counts.indirect_wealth, responsibility: counts.direct_officer + counts.seven_killings, support: counts.direct_resource + counts.indirect_resource };
  const max = Math.max(...Object.values(groupCounts));
  const leading = channels.filter(channel => groupCounts[channel] === max).map(channel => channelNames[channel]);
  const relational = [counts.rob_wealth > 0 ? "共享资源" : null, groupCounts.responsibility > 0 ? "角色边界" : null, groupCounts.expression > 0 ? "表达方式" : null].filter(Boolean).join("、") || "未出现指定主题";
  const referencePeriod = currentSymbolicPeriod(now);
  const periodPillars = calculateFourPillars({ birthDate: referencePeriod.referenceDate })!;
  const yearChannel = relation(balance.dayMasterElement, periodPillars.year.stemElement);
  const monthChannel = relation(balance.dayMasterElement, periodPillars.month.stemElement);
  const limitations = ["采用本地近似节气边界；未完成专业排盘比对。", "出生日期与时刻按填写的民用时间计算，未做时区或真太阳时修正。", "这些是公开的产品象征规则，不能成为现实事实、证据、概率或事件预测。", "当前镜头仅供对照，不会改变人物行动、世界状态或推演结论。"];
  if (!source.birthTime) limitations.push("出生时刻未知；只使用三柱结构，解释精度降低。");
  if (source.birthTime?.startsWith("23:")) limitations.push("沿用本地计算的夜间换日规则；临界时刻存在计算限制。");
  const dimension = (key: typeof symbolicDimensionKeys[number], label: string, value: string, summary: string, ruleId: SymbolicFrame["dimensions"][number]["ruleId"], sourceRefs: SymbolicFrame["dimensions"][number]["sourceRefs"]) => ({ key, label, value, summary, ruleId, sourceRefs, limitations: [limitations[2]] });
  return symbolicFrameSchema.parse({
    version: SYMBOLIC_FRAME_VERSION, ruleVersion: SYMBOLIC_RULE_VERSION, sourceVersion, referencePeriod, classification: "symbolic_lens", methodKind: "explicit_product_symbolic_rules", causalUse: false,
    calculation: { calculationVersion: "local-pillar-approximation-v1", precision: source.birthTime ? "date_time_local" : "date_only", inputUsed: source.birthTime ? ["birthDate", "birthTime"] : ["birthDate"], usesSolarTermApproximation: true, usesTrueSolarTime: false, birthTimezoneCorrection: false, pillarsAvailable: natal.pillarsAvailable, natalDayElement: balance.dayMasterElement, natalStrongestElement: balance.strongestElement, periodYearElement: periodPillars.year.stemElement, periodMonthElement: periodPillars.month.stemElement, groupCounts },
    dimensions: [
      dimension("initial_tendency", "初始倾向", leading.join("、"), "将本地出生结构的干与藏干计数归为五组，只列计数最多的主题；并列全部保留。这不是个性诊断。", "natal-group-max-v1", ["natal_stem_counts"]),
      dimension("relationship_sensitivity", "关系敏感度", relational, "只检查共享资源、角色边界和表达对应的结构是否出现，不推断任何人的真实心理或关系强弱。", "natal-relation-presence-v1", ["natal_stem_counts"]),
      dimension("rhythm", "人生节奏", yearChannel === monthChannel ? "年、月象征主题相同" : "年、月象征主题不同", "比较参考日期的年干、月干与出生锚点的元素关系。相同或不同仅表示结构对照，不代表该行动或等待。", "period-channel-match-v1", ["current_year_month", "natal_day_element"]),
      dimension("symbolic_support_tension", "象征性支持与张力", `年：${channelNames[yearChannel]}；月：${channelNames[monthChannel]}`, "同类归为自我节奏，生成关系归为表达或信息支持，控制关系归为资源协调或角色边界。没有现实顺逆风分数。", "period-element-relation-v1", ["natal_day_element", "current_year_month", "element_relation_table"]),
      dimension("observation_window", "值得观察的窗口", "下个月或下一次近似年、月结构变更", "这里只提示框架更新的复核窗口；更新后仍需与本人现实近况分别阅读，不表示届时会发生事件。", "coarse-period-review-v1", ["calendar_period", "current_year_month"]),
    ], limitations,
  });
}
