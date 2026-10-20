import { birthSourceSchema, buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";
import { z } from "zod";
import { b3HorizonSchema, b3PeriodUnitSchema, LifeClimateB3Error, lifeClimateB3SymbolicSourceSchema, type LifeClimateB3Horizon, type LifeClimateB3PeriodUnit, type LifeClimateB3SymbolicSource } from "./contracts";
import { hashLifeClimateB3Value } from "./context";

export function lifeClimateB3StageCount(horizon: LifeClimateB3Horizon) { return horizon === "1_year" ? 4 : horizon === "3_years" ? 3 : 5; }
function validPeriod(horizon: LifeClimateB3Horizon, periodUnit: LifeClimateB3PeriodUnit) {
  if (!b3HorizonSchema.safeParse(horizon).success || !b3PeriodUnitSchema.safeParse(periodUnit).success || (horizon === "1_year") !== (periodUnit === "quarter")) throw new LifeClimateB3Error("invalid_b3_request");
}
function addUtcMonths(anchor: string, months: number): string {
  const original = new Date(anchor);
  if (!Number.isFinite(original.getTime())) throw new LifeClimateB3Error("invalid_b3_source");
  const year = original.getUTCFullYear(), month = original.getUTCMonth() + months;
  const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const date = new Date(original.getTime());
  date.setUTCDate(1); date.setUTCMonth(month); date.setUTCDate(Math.min(original.getUTCDate(), maxDay));
  return date.toISOString();
}
export function getLifeClimateB3StageWindows(assessedAt: string, horizon: LifeClimateB3Horizon, periodUnit: LifeClimateB3PeriodUnit) {
  validPeriod(horizon, periodUnit);
  const months = periodUnit === "quarter" ? 3 : 12;
  return Array.from({ length: lifeClimateB3StageCount(horizon) }, (_, index) => ({ stageIndex: index + 1, startAt: addUtcMonths(assessedAt, index * months), endAt: addUtcMonths(assessedAt, (index + 1) * months) }));
}
export async function createLifeClimateB3SymbolicSourceContext(content: Omit<LifeClimateB3SymbolicSource, "sourceContext">): Promise<string> {
  const parsed = lifeClimateB3SymbolicSourceSchema.omit({ sourceContext: true }).safeParse(content);
  if (!parsed.success) throw new LifeClimateB3Error("invalid_b3_source");
  return hashLifeClimateB3Value(parsed.data);
}
const symbolicInputSchema = birthSourceSchema.extend({ sourceVersion: z.number().int().positive(), consentRevision: z.number().int().positive(), referenceDate: z.string().regex(/^20\d{2}-\d{2}-\d{2}$/) }).strict();
/** Birth source is consumed locally and never returned. Each point is separately computed, never copied. */
export async function createLifeClimateB3SymbolicSource(input: z.infer<typeof symbolicInputSchema>, horizon: LifeClimateB3Horizon, periodUnit: LifeClimateB3PeriodUnit): Promise<LifeClimateB3SymbolicSource> {
  validPeriod(horizon, periodUnit);
  const parsed = symbolicInputSchema.safeParse(input);
  if (!parsed.success) throw new LifeClimateB3Error("invalid_b3_source");
  const data = parsed.data;
  if (new Date(`${data.referenceDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== data.referenceDate || data.birthDate > data.referenceDate) throw new LifeClimateB3Error("invalid_b3_source");
  const civilAnchor = `${data.referenceDate}T12:00:00+08:00`;
  const months = periodUnit === "quarter" ? 3 : 12;
  const midpoint = periodUnit === "quarter" ? 1 : 6;
  const series: LifeClimateB3SymbolicSource["series"] = Array.from({ length: lifeClimateB3StageCount(horizon) }, (_, index) => {
    const reference = addUtcMonths(civilAnchor, index * months + midpoint);
    const frame = buildSymbolicFrame({ birthDate: data.birthDate, birthTime: data.birthTime }, data.sourceVersion, reference);
    return { stageIndex: index + 1, status: "available", frame, limitations: ["仅表示此粗阶段参考点的象征性镜头，不代表全年气候、未来现实资料或事件结果。", ...(data.birthTime === null ? ["出生时刻未知，保留日期级别精度。"] : [])] };
  });
  const content = { version: "life-climate-b3-symbolic-source-v1" as const, sourceVersion: data.sourceVersion, consentRevision: data.consentRevision, horizon, periodUnit, series };
  return lifeClimateB3SymbolicSourceSchema.parse({ ...content, sourceContext: await createLifeClimateB3SymbolicSourceContext(content) });
}
