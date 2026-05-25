"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { buildProductPreview } from "@/lib/preview/build";
import type {
  PreviewNextAction,
  PreviewRiskWindow,
  PreviewScenarioPath,
  PreviewTimelineEvent,
} from "@/types/product-preview";

const sample = {
  questionText:
    "我应该接受一个更高薪但不确定的新机会，还是留在现在稳定但增长变慢的团队？",
  situationSummary:
    "新公司给了更高薪资和更大职责，但行业不确定性更高。现在的团队稳定，直属上级口头支持晋升，但时间不明确。我担心跳槽影响长期声誉，也担心留下会错过窗口。",
  keyPeopleText: "现任上级、伴侣、招聘方、核心同事、未来的我",
};

const copy = {
  en: {
    title: "See the shape of a decision before you move.",
    subtitle:
      "MiroFish turns a real career crossroad into a local agent map, scenario paths, risk windows, and a paid-report preview.",
    question: "Decision question",
    situation: "Current context",
    people: "Key people",
    generate: "Generate",
    loadSample: "Load sample",
    fullFlow: "Start full flow",
    mapTitle: "Decision map",
    readoutTitle: "Readout",
    scenarioTitle: "Three possible paths",
    timelineTitle: "Signals to watch",
    riskTitle: "Risk windows",
    actionTitle: "Next actions",
    reportTitle: "Free report preview",
    lockedTitle: "Complete report value",
    lockedCopy:
      "The locked report expands assumptions, negotiation language, stakeholder moves, and decision timing. Suggested test price: 19-49 CNY.",
    unlock: "Join beta / unlock report",
    safety: "Safety",
    inputTitle: "Your decision",
    centerNode: "Current context",
    selfNode: "You",
    confidence: "confidence",
    influence: "impact",
    tension: "tension",
  },
  zh: {
    title: "先看见一次决定的可能走向",
    subtitle:
      "输入真实的跳槽、晋升、创业或合作问题，MiroFish 会把它整理成 Agent 关系、三条情景路径、风险窗口和报告预览。",
    question: "决策问题",
    situation: "当前处境",
    people: "关键人物",
    generate: "生成推演",
    loadSample: "载入示例",
    fullFlow: "开始完整流程",
    mapTitle: "决策关系图",
    readoutTitle: "推演读数",
    scenarioTitle: "三条可能路径",
    timelineTitle: "需要观察的信号",
    riskTitle: "风险窗口",
    actionTitle: "下一步行动",
    reportTitle: "免费报告预览",
    lockedTitle: "完整报告价值",
    lockedCopy:
      "完整报告会展开关键假设、沟通话术、人物应对、行动时机和复盘清单。建议测试价位：19-49 元。",
    unlock: "加入内测 / 解锁完整报告",
    safety: "安全提示",
    inputTitle: "你的决策",
    centerNode: "当前处境",
    selfNode: "你",
    confidence: "可信度",
    influence: "影响力",
    tension: "张力",
  },
} as const;

const agentPositions = [
  { left: "8%", top: "16%" },
  { left: "66%", top: "13%" },
  { left: "74%", top: "60%" },
  { left: "13%", top: "66%" },
  { left: "43%", top: "78%" },
];

export default function DemoPage() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [questionText, setQuestionText] = useState(sample.questionText);
  const [situationSummary, setSituationSummary] = useState(
    sample.situationSummary,
  );
  const [keyPeopleText, setKeyPeopleText] = useState(sample.keyPeopleText);
  const [generated, setGenerated] = useState(true);

  const preview = useMemo(
    () =>
      buildProductPreview({
        questionText,
        situationSummary,
        keyPeopleText,
        timeWindow: "90_days",
      }),
    [keyPeopleText, questionText, situationSummary],
  );

  function loadSample() {
    setQuestionText(sample.questionText);
    setSituationSummary(sample.situationSummary);
    setKeyPeopleText(sample.keyPeopleText);
    setGenerated(true);
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div>
              <h1 className="max-w-[11ch] text-[36px] font-semibold leading-[1.04] tracking-[-0.03em] text-[#11150f] md:text-[50px]">
                {t.title}
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#62695d]">
                {t.subtitle}
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => setGenerated(true)}
                className="rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
              >
                {t.generate}
              </button>
              <Link
                href="/app/new/intake"
                className="rounded-md border border-black/10 bg-[#f7f8f4] px-4 py-3 text-center text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
              >
                {t.fullFlow}
              </Link>
            </div>

            <div className="mt-7 hidden grid-cols-3 gap-2 border-t border-black/8 pt-5 lg:grid">
              <HeroStat label="Agents" value={preview.agentEcology.length} />
              <HeroStat label={locale === "zh" ? "路径" : "Paths"} value={3} />
              <HeroStat label={locale === "zh" ? "成本" : "Cost"} value="0" />
            </div>
          </div>

          <section className="rounded-lg border border-black/8 bg-[#11150f] p-5 text-white shadow-[0_24px_80px_rgba(17,21,15,0.14)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {t.mapTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                  {preview.previewSummary}
                </p>
              </div>
              <span className="rounded border border-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#b7e6c6]">
                {preview.safetyLevel}
              </span>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
              <DecisionMap
                agents={preview.agentEcology}
                centerLabel={t.centerNode}
                selfLabel={t.selfNode}
              />

              <div className="space-y-3">
                {preview.agentEcology.slice(0, 5).map((agent) => (
                  <article
                    key={agent.id}
                    className="rounded-md border border-white/10 bg-white/[0.06] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {agent.name}
                        </h3>
                        <p className="mt-1 text-xs text-white/48">
                          {agent.role}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#b7e6c6]">
                        {agent.stance}
                      </span>
                    </div>
                    <MiniMeter label={t.influence} value={agent.influence} />
                    <MiniMeter label={t.tension} value={agent.tension} />
                  </article>
                ))}
              </div>
            </div>
          </section>
        </section>

        <section className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_24px_80px_rgba(17,21,15,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#11150f]">
                {t.inputTitle}
              </h2>
              <button
                type="button"
                onClick={loadSample}
                className="rounded border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#52594d] transition hover:border-[#11150f] hover:text-[#11150f]"
              >
                {t.loadSample}
              </button>
            </div>

            <Field label={t.question}>
              <textarea
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                rows={3}
                className="field-textarea"
              />
            </Field>

            <Field label={t.situation}>
              <textarea
                value={situationSummary}
                onChange={(event) => setSituationSummary(event.target.value)}
                rows={4}
                className="field-textarea"
              />
            </Field>

            <Field label={t.people}>
              <input
                value={keyPeopleText}
                onChange={(event) => setKeyPeopleText(event.target.value)}
                className="field-input"
              />
            </Field>
          </div>

          {generated ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <ScenarioPanel
                  title={t.scenarioTitle}
                  confidenceLabel={t.confidence}
                  paths={preview.scenarioPaths}
                />
                <ReadoutPanel
                  title={t.readoutTitle}
                  safetyTitle={t.safety}
                  summary={preview.previewSummary}
                  safety={preview.safetyMessage}
                />
            </section>
          ) : null}
        </section>

        {generated ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-lg border border-black/8 bg-white p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <TimelineList title={t.timelineTitle} items={preview.timelineEvents} />
                <RiskList title={t.riskTitle} items={preview.riskWindows} />
              </div>
              <div className="mt-6 border-t border-black/8 pt-6">
                <ActionList title={t.actionTitle} items={preview.nextActions} />
              </div>
            </div>

            <aside className="rounded-lg border border-black/8 bg-[#dfe9dc] p-6">
              <h2 className="text-sm font-semibold text-[#11150f]">
                {t.reportTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#3f483d]">
                {preview.previewSummary}
              </p>
              <div className="my-6 h-px bg-black/10" />
              <h3 className="text-lg font-semibold tracking-[-0.01em] text-[#11150f]">
                {t.lockedTitle}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#3f483d]">
                {t.lockedCopy}
              </p>
              <div className="mt-5 space-y-2">
                {preview.lockedReportSections.map((section) => (
                  <div
                    key={section}
                    className="rounded-md border border-black/8 bg-white/58 px-3 py-2 text-sm font-medium text-[#2f372d]"
                  >
                    {section}
                  </div>
                ))}
              </div>
              <Link
                href="/app/billing"
                className="mt-6 inline-flex w-full justify-center rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
              >
                {t.unlock}
              </Link>
            </aside>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        .field-textarea,
        .field-input {
          margin-top: 8px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid rgba(17, 21, 15, 0.12);
          background: rgba(255, 255, 255, 0.72);
          padding: 10px 12px;
          color: #11150f;
          font-size: 14px;
          line-height: 1.65;
          outline: none;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        .field-textarea:focus,
        .field-input:focus {
          border-color: rgba(17, 21, 15, 0.44);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(86, 130, 98, 0.12);
        }
      `}</style>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f766b]">
        {label}
      </span>
      {children}
    </label>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a9185]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}

function DecisionMap({
  agents,
  centerLabel,
  selfLabel,
}: {
  agents: Array<{ id: string; name: string; tension: number; influence: number }>;
  centerLabel: string;
  selfLabel: string;
}) {
  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_45%,rgba(183,230,198,0.16),transparent_34%),#161c15]">
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {agentPositions.map((position, index) => {
          const x = Number.parseInt(position.left, 10) + 9;
          const y = Number.parseInt(position.top, 10) + 7;
          return (
            <line
              key={`${x}-${y}-${index}`}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.35"
            />
          );
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 grid h-32 w-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#b7e6c6]/40 bg-[#11150f] shadow-[0_0_80px_rgba(183,230,198,0.12)]">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
            {selfLabel}
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            {centerLabel}
          </div>
        </div>
      </div>

      {agents.slice(0, 5).map((agent, index) => (
        <div
          key={agent.id}
          className="absolute w-[132px] rounded-md border border-white/12 bg-white/[0.08] p-3 backdrop-blur"
          style={agentPositions[index]}
        >
          <div className="truncate text-sm font-semibold text-white">
            {agent.name}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <NodeStat value={agent.influence} />
            <NodeStat value={agent.tension} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NodeStat({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full bg-white/12">
      <div
        className="h-1.5 rounded-full bg-[#b7e6c6]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function MiniMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-white/45">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-[#b7e6c6]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ScenarioPanel({
  title,
  confidenceLabel,
  paths,
}: {
  title: string;
  confidenceLabel: string;
  paths: PreviewScenarioPath[];
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
      <div className="mt-5 space-y-4">
        {paths.map((path, index) => (
          <article key={path.id} className="grid gap-4 sm:grid-cols-[28px_1fr]">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#11150f] text-xs font-semibold text-white">
              {index + 1}
            </div>
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#11150f]">
                  {path.title}
                </h3>
                <span className="shrink-0 text-xs font-semibold text-[#6f766b]">
                  {path.confidence}% {confidenceLabel}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#62695d]">
                {path.summary}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-black/8">
                <div
                  className="h-1.5 rounded-full bg-[#568262]"
                  style={{ width: `${path.confidence}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReadoutPanel({
  title,
  safetyTitle,
  summary,
  safety,
}: {
  title: string;
  safetyTitle: string;
  summary: string;
  safety: string;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#62695d]">{summary}</p>
      <div className="mt-5 rounded-md border border-[#568262]/20 bg-[#eef5ee] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4d7357]">
          {safetyTitle}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#3f483d]">{safety}</p>
      </div>
    </section>
  );
}

function TimelineList({
  title,
  items,
}: {
  title: string;
  items: PreviewTimelineEvent[];
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="border-l border-black/12 pl-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f766b]">
              {item.window}
            </div>
            <h3 className="mt-1 text-sm font-semibold text-[#11150f]">
              {item.signal}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#62695d]">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskList({
  title,
  items,
}: {
  title: string;
  items: PreviewRiskWindow[];
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#11150f]">
                {item.title}
              </h3>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f766b]">
                {item.level}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionList({
  title,
  items,
}: {
  title: string;
  items: PreviewNextAction[];
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
          >
            <h3 className="text-sm font-semibold text-[#11150f]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
