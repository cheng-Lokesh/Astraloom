import type { ClaimDraft } from "@/types/claim";
import type { ReportStrategyOption, StrategyType } from "@/types/report";
import type { SimulationEventDraft } from "@/types/simulation-run";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function strategyTypeForClaim(
  claim: ClaimDraft,
  events: SimulationEventDraft[],
): StrategyType {
  const hasGap = events.some((event) =>
    Object.values(event.edgeWeightDeltas).some(
      (delta) => (delta.informationGap ?? 0) > 0,
    ),
  );
  const hasSupport = events.some((event) =>
    ["support", "cooperation", "disclosure"].includes(event.eventType),
  );

  if (claim.riskLevel === "high") return "boundary";
  if (hasGap) return "information_fill";
  if (claim.claimType === "opportunity_window") return "proceed";
  if (hasSupport) return "communicate";
  if (claim.claimType === "friction_signal") return "observe";
  return "delay";
}

function titleForType(type: StrategyType) {
  const titles: Record<StrategyType, string> = {
    observe: "建议优先观察",
    communicate: "低风险沟通",
    delay: "延后决策",
    proceed: "小步推进",
    boundary: "边界准备",
    information_fill: "补齐信息差",
    resource_exchange: "资源交换",
    exit_prepare: "退出预案",
  };
  return titles[type];
}

function bodyForType(type: StrategyType, claim: ClaimDraft) {
  if (type === "boundary") {
    return "若现有互动惯性不变，可能进入风险窗口。先整理边界、可接受范围和需要暂停的互动。";
  }
  if (type === "information_fill") {
    return "这条结论来自以下事件证据。下一步优先补齐缺失事实，而不是直接放大结论。";
  }
  if (type === "communicate") {
    return "当前沙盘显示存在可沟通窗口。用低压力问题确认事实，避免把信号说成定论。";
  }
  if (type === "proceed") {
    return "当前沙盘显示有机会窗口。可以小步推进，同时保留复盘点和退出条件。";
  }
  if (type === "delay") {
    return "若证据仍偏少，延后不可逆动作，把下一步用于观察事件是否重复出现。";
  }
  if (type === "resource_exchange") {
    return "先确认双方可交换的资源、时间和信息，避免在信息不足时承诺过多。";
  }
  if (type === "exit_prepare") {
    return "准备低风险退出路径，只作为预案，不把沙盘信号当作确定结果。";
  }
  return `当前沙盘显示 ${claim.claimType}。建议优先观察重复信号和事件证据。`;
}

export function buildStrategyOptions(
  claims: ClaimDraft[],
  events: SimulationEventDraft[],
): ReportStrategyOption[] {
  return claims.flatMap((claim) => {
    const claimEvents = events.filter((event) =>
      claim.evidenceEventIds.includes(event.id),
    );
    const primaryType = strategyTypeForClaim(claim, claimEvents);
    const secondaryType: StrategyType =
      primaryType === "information_fill" ? "observe" : "information_fill";

    return [primaryType, secondaryType].map((strategyType) => ({
      id: `strategy_${hashText(`${claim.id}:${strategyType}`)}`,
      claimId: claim.id,
      strategyType,
      title: titleForType(strategyType),
      body: bodyForType(strategyType, claim),
      expectedUse:
        "Use this as a scenario option tied to the claim evidence, not as a command.",
    }));
  });
}
