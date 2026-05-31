"use client";

import { StatusPill } from "@/components/status-pill";
import type {
  GroundedRealityNode,
  GroundedRealityPressure,
  GroundedSocialSimulationDraft,
} from "@/types/grounded-social-simulation";

type Locale = "en" | "zh";

type GroundedSimulationDebugPanelProps = {
  groundedSocialSimulation: GroundedSocialSimulationDraft | null;
  locale: Locale;
  defaultOpen?: boolean;
};

const copy = {
  en: {
    title: "Grounded Simulation debug panel",
    summary: "Open accuracy debug panel",
    unavailableTitle: "Grounded Simulation debug panel unavailable",
    unavailableBody:
      "No GroundedSocialSimulationDraft is saved yet. The page can still show legacy sandbox data, but the reality-first accuracy layer cannot be inspected here.",
    boundary:
      "Reality nodes come from user input or grounded real-world semantic inference; destiny is only used to weight user reactions and is not used to create real-world facts.",
    purpose:
      "Use this panel to inspect whether the product is grounded enough to trust before treating a path as useful.",
    nodes: "Reality Nodes",
    pressures: "Reality Pressures",
    modifier: "Destiny Person Modifier",
    paths: "Grounded Path Events",
    uncertainty: "Uncertainty",
    observableSignals: "Observable signals",
    keyUncertainties: "Key uncertainties",
    confidence: "confidence",
    noItems: "No items recorded.",
    noRefs: "No evidence refs.",
    evidenceRefs: "evidence refs",
    nodeFields: {
      type: "nodeType",
      source: "source",
      role: "roleInSituation",
      resources: "resourcesControlled",
      information: "informationHeld",
      opportunities: "opportunitiesProvided",
      constraints: "constraintsCreated",
    },
    pressureFields: {
      type: "pressureType",
      sourceTarget: "sourceNodeId / targetNodeId",
      explanation: "explanation",
      evidenceCount: "evidenceRefs count",
    },
    modifierFields: {
      decisionStyle: "decisionStyle",
      stressResponse: "stressResponse",
      opportunityResponse: "opportunityResponse",
      resourcePressureResponse: "resourcePressureResponse",
      relationshipPressureResponse: "relationshipPressureResponse",
      boundaryStyle: "boundaryStyle",
      timingSensitivity: "timingSensitivity",
      uncertaintyNotes: "uncertaintyNotes",
    },
    pathFields: {
      userAction: "userAction",
      expectedRealityReaction: "expectedRealityReaction",
      destinyModifierEffect: "destinyModifierEffect",
      pressureChange: "pressureChange",
      informationChange: "informationChange",
      opportunityChange: "opportunityChange",
      relatedNodes: "realityNodeIds",
    },
  },
  zh: {
    title: "Grounded Simulation 调试面板",
    summary: "打开准确性调试面板",
    unavailableTitle: "Grounded Simulation 调试面板不可用",
    unavailableBody:
      "还没有保存的 GroundedSocialSimulationDraft。页面仍可展示旧沙盘数据，但无法在这里检查现实优先的准确性层。",
    boundary:
      "现实节点来自用户输入或现实语义推断；命理只用于调权用户反应，不用于创造现实事实。",
    purpose:
      "这个面板用于快速检查产品是否足够 grounded，避免把证据不足的路径当成可信结论。",
    nodes: "现实节点 Reality Nodes",
    pressures: "现实压力 Reality Pressures",
    modifier: "命理调权 Destiny Person Modifier",
    paths: "路径事件 Grounded Path Events",
    uncertainty: "不确定性",
    observableSignals: "可观察信号",
    keyUncertainties: "关键信息不足",
    confidence: "置信度",
    noItems: "暂无记录。",
    noRefs: "暂无证据引用。",
    evidenceRefs: "证据引用",
    nodeFields: {
      type: "节点类型",
      source: "来源",
      role: "现实角色",
      resources: "控制资源",
      information: "掌握信息",
      opportunities: "提供机会",
      constraints: "制造约束",
    },
    pressureFields: {
      type: "压力类型",
      sourceTarget: "来源节点 / 目标节点",
      explanation: "解释",
      evidenceCount: "证据引用数量",
    },
    modifierFields: {
      decisionStyle: "决策风格",
      stressResponse: "压力反应",
      opportunityResponse: "机会响应",
      resourcePressureResponse: "资源压力反应",
      relationshipPressureResponse: "关系压力反应",
      boundaryStyle: "边界风格",
      timingSensitivity: "时间敏感度",
      uncertaintyNotes: "不确定性备注",
    },
    pathFields: {
      userAction: "用户动作",
      expectedRealityReaction: "预期现实反应",
      destinyModifierEffect: "命理调权影响",
      pressureChange: "压力变化",
      informationChange: "信息变化",
      opportunityChange: "机会变化",
      relatedNodes: "关联现实节点",
    },
  },
} as const;

function compactList(values: string[], locale: Locale) {
  if (!values.length) return copy[locale].noItems;
  return values.join(locale === "zh" ? "、" : ", ");
}

function sourceLabel(source: GroundedRealityNode["source"], locale: Locale) {
  if (locale === "en") return source;
  if (source === "user_input") return "用户输入";
  if (source === "inferred_from_user_context") return "现实语义推断";
  if (source === "sample_data") return "示例数据";
  return "未来外部数据";
}

function branchGroups(
  pathEvents: GroundedSocialSimulationDraft["pathEvents"],
) {
  return pathEvents.reduce<
    Record<string, GroundedSocialSimulationDraft["pathEvents"]>
  >((groups, event) => {
    groups[event.branchId] = [...(groups[event.branchId] ?? []), event];
    return groups;
  }, {});
}

function nodeName(
  nodesById: Map<string, GroundedRealityNode>,
  nodeId: string,
) {
  return nodesById.get(nodeId)?.label ?? nodeId;
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded border border-black/8 bg-[#f7f8f4] p-3">
      <div className="text-[11px] font-semibold uppercase text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 break-words text-xs leading-5 text-[#62695d]">
        {value}
      </p>
    </div>
  );
}

function TextRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="mt-2 text-xs leading-5 text-[#62695d]">
      <span className="font-semibold text-[#11150f]">{label}: </span>
      {value}
    </p>
  );
}

function EvidenceRefs({
  refs,
  locale,
}: {
  refs: string[];
  locale: Locale;
}) {
  return (
    <details className="mt-3 rounded border border-black/8 bg-[#f7f8f4] p-3">
      <summary className="cursor-pointer text-xs font-semibold text-[#7d8578]">
        {refs.length} {copy[locale].evidenceRefs}
      </summary>
      <div className="mt-2 space-y-1">
        {refs.length ? (
          refs.map((ref) => (
            <code
              key={ref}
              className="block break-all text-xs text-[#62695d]"
              data-no-localize
            >
              {ref}
            </code>
          ))
        ) : (
          <p className="text-xs text-[#7d8578]">{copy[locale].noRefs}</p>
        )}
      </div>
    </details>
  );
}

function RealityNodeCard({
  node,
  locale,
}: {
  node: GroundedRealityNode;
  locale: Locale;
}) {
  const t = copy[locale].nodeFields;

  return (
    <article className="rounded-md border border-black/8 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#11150f]">{node.label}</h4>
          <p className="mt-1 text-xs text-[#7d8578]">
            {node.nodeType} / {sourceLabel(node.source, locale)}
          </p>
        </div>
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs font-semibold text-[#3f483d]">
          {node.confidence}% {copy[locale].confidence}
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Field label={t.type} value={node.nodeType} />
        <Field label={t.source} value={sourceLabel(node.source, locale)} />
        <Field label={t.role} value={node.roleInSituation} />
        <Field label={t.resources} value={compactList(node.resourcesControlled, locale)} />
        <Field label={t.information} value={compactList(node.informationHeld, locale)} />
        <Field label={t.opportunities} value={compactList(node.opportunitiesProvided, locale)} />
        <Field label={t.constraints} value={compactList(node.constraintsCreated, locale)} />
      </div>
      <EvidenceRefs refs={node.evidenceRefs} locale={locale} />
    </article>
  );
}

function RealityPressureCard({
  pressure,
  nodeById,
  locale,
}: {
  pressure: GroundedRealityPressure;
  nodeById: Map<string, GroundedRealityNode>;
  locale: Locale;
}) {
  const t = copy[locale].pressureFields;
  const source = nodeName(nodeById, pressure.sourceNodeId);
  const target = nodeName(nodeById, pressure.targetNodeId);

  return (
    <article className="rounded-md border border-black/8 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            {pressure.pressureType}
          </div>
          <h4 className="mt-2 text-sm font-semibold text-[#11150f]">
            {source} -&gt; {target}
          </h4>
        </div>
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs font-semibold text-[#3f483d]">
          {pressure.confidence}% {copy[locale].confidence}
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        <Field label={t.type} value={pressure.pressureType} />
        <Field label={t.sourceTarget} value={`${source} / ${target}`} />
        <Field label={t.explanation} value={pressure.explanation} />
        <Field label={t.evidenceCount} value={pressure.evidenceRefs.length} />
      </div>
    </article>
  );
}

export function GroundedSimulationDebugPanel({
  groundedSocialSimulation,
  locale,
  defaultOpen = false,
}: GroundedSimulationDebugPanelProps) {
  const t = copy[locale];

  if (!groundedSocialSimulation) {
    return (
      <details
        open={defaultOpen}
        className="rounded-lg border border-dashed border-black/12 bg-white p-5 shadow-[0_24px_80px_rgba(17,21,15,0.06)]"
      >
        <summary className="cursor-pointer text-base font-semibold text-[#11150f]">
          {t.unavailableTitle}
        </summary>
        <p className="mt-3 text-sm leading-6 text-[#62695d]">{t.unavailableBody}</p>
      </details>
    );
  }

  const nodes = groundedSocialSimulation.realityNodes;
  const pressures = groundedSocialSimulation.realityPressures;
  const modifier = groundedSocialSimulation.destinyPersonModifier;
  const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
  const groupedPathEvents = branchGroups(groundedSocialSimulation.pathEvents);
  const modifierFields = copy[locale].modifierFields;
  const pathFields = copy[locale].pathFields;

  return (
    <details
      open={defaultOpen}
      className="rounded-lg border border-[#568262]/20 bg-white p-5 shadow-[0_24px_80px_rgba(17,21,15,0.06)]"
    >
      <summary className="cursor-pointer text-base font-semibold text-[#11150f]">
        {t.summary}
      </summary>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">{t.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62695d]">
            {t.purpose}
          </p>
          <p className="mt-3 max-w-3xl rounded-md border border-[#568262]/20 bg-[#eef5ee] px-3 py-2 text-sm leading-6 text-[#2f5d3d]">
            {t.boundary}
          </p>
        </div>
        <StatusPill tone="ready">
          {groundedSocialSimulation.confidence}% {t.confidence}
        </StatusPill>
      </div>

      <div className="mt-5 grid gap-5">
        <section className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#11150f]">{t.nodes}</h3>
            <span className="rounded border border-black/8 bg-white px-2 py-1 text-xs font-semibold text-[#3f483d]">
              {nodes.length}
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {nodes.length ? (
              nodes.map((node) => (
                <RealityNodeCard key={node.id} node={node} locale={locale} />
              ))
            ) : (
              <p className="rounded border border-dashed border-black/12 bg-white p-4 text-xs leading-5 text-[#7d8578]">
                {t.noItems}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#11150f]">{t.pressures}</h3>
            <span className="rounded border border-black/8 bg-white px-2 py-1 text-xs font-semibold text-[#3f483d]">
              {pressures.length}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {pressures.length ? (
              pressures.map((pressure) => (
                <RealityPressureCard
                  key={pressure.id}
                  pressure={pressure}
                  nodeById={nodeById}
                  locale={locale}
                />
              ))
            ) : (
              <p className="rounded border border-dashed border-black/12 bg-white p-4 text-xs leading-5 text-[#7d8578]">
                {t.noItems}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-md border border-[#568262]/20 bg-[#eef5ee] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#11150f]">{t.modifier}</h3>
            <span className="rounded border border-[#568262]/20 bg-white px-2 py-1 text-xs font-semibold text-[#2f5d3d]">
              {modifier.confidence}% {t.confidence}
            </span>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Field label={modifierFields.decisionStyle} value={modifier.decisionStyle} />
            <Field label={modifierFields.stressResponse} value={modifier.stressResponse} />
            <Field label={modifierFields.opportunityResponse} value={modifier.opportunityResponse} />
            <Field
              label={modifierFields.resourcePressureResponse}
              value={modifier.resourcePressureResponse}
            />
            <Field
              label={modifierFields.relationshipPressureResponse}
              value={modifier.relationshipPressureResponse}
            />
            <Field label={modifierFields.boundaryStyle} value={modifier.boundaryStyle} />
            <Field label={modifierFields.timingSensitivity} value={modifier.timingSensitivity} />
          </div>
          <ListBlock
            title={modifierFields.uncertaintyNotes}
            items={modifier.uncertaintyNotes}
            locale={locale}
          />
        </section>

        <section className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
          <h3 className="text-sm font-semibold text-[#11150f]">{t.paths}</h3>
          <div className="mt-4 grid gap-3">
            {Object.entries(groupedPathEvents).map(([branchId, events]) => (
              <section key={branchId} className="rounded-md border border-black/8 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[#11150f]">
                    {branchId}
                  </h4>
                  <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs font-semibold text-[#3f483d]">
                    {events.length}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {events.map((event) => (
                    <article
                      key={event.id}
                      className="rounded border border-black/8 bg-[#f7f8f4] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase text-[#7d8578]">
                          step {event.step}
                        </p>
                        <span className="text-xs font-semibold text-[#568262]">
                          {event.confidence}% {t.confidence}
                        </span>
                      </div>
                      <TextRow label={pathFields.userAction} value={event.userAction} />
                      <TextRow
                        label={pathFields.expectedRealityReaction}
                        value={event.expectedRealityReaction}
                      />
                      <TextRow
                        label={pathFields.destinyModifierEffect}
                        value={event.destinyModifierEffect}
                      />
                      <TextRow label={pathFields.pressureChange} value={event.pressureChange} />
                      <TextRow
                        label={pathFields.informationChange}
                        value={event.informationChange}
                      />
                      <TextRow
                        label={pathFields.opportunityChange}
                        value={event.opportunityChange}
                      />
                      <TextRow
                        label={pathFields.relatedNodes}
                        value={event.realityNodeIds
                          .map((nodeId) => nodeName(nodeById, nodeId))
                          .join(locale === "zh" ? "、" : ", ")}
                      />
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
          <h3 className="text-sm font-semibold text-[#11150f]">{t.uncertainty}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ListBlock
              title={t.keyUncertainties}
              items={groundedSocialSimulation.keyUncertainties}
              locale={locale}
            />
            <ListBlock
              title={t.observableSignals}
              items={groundedSocialSimulation.observableSignals}
              locale={locale}
            />
          </div>
        </section>
      </div>
    </details>
  );
}

function ListBlock({
  title,
  items,
  locale,
}: {
  title: string;
  items: string[];
  locale: Locale;
}) {
  return (
    <div className="mt-3 rounded border border-black/8 bg-white p-3">
      <h4 className="text-xs font-semibold uppercase text-[#7d8578]">{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-xs leading-5 text-[#62695d]">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-5 text-[#7d8578]">
          {copy[locale].noItems}
        </p>
      )}
    </div>
  );
}
