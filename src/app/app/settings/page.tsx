"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import {
  type ChineseFontPreference,
  type LatinFontPreference,
  useLanguage,
} from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { clearLocalSupportDrafts } from "@/lib/support/support-drafts";

function storageEstimate() {
  if (typeof window === "undefined") return "unknown";
  let total = 0;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith("mirofish.")) continue;
    total += key.length + (window.localStorage.getItem(key)?.length ?? 0);
  }
  return `${Math.max(1, Math.round(total / 1024))} KB`;
}

const copy = {
  en: {
    status: "Settings",
    title: "Local preferences, privacy, and product boundaries.",
    intro:
      "Settings explains what Astraloom stores locally and what the product will not do. Clearing data here only affects this browser.",
    openArchive: "Open archive",
    languageTitle: "Language and region",
    languageBody:
      "This local setting changes page preference only. It does not call a translation service.",
    localDataTitle: "Current local data",
    localDataBody:
      "Astraloom Local MVP stores drafts in this browser. Production database sync is not started from Settings.",
    privacyTitle: "Privacy and local data",
    privacyItems: [
      "Local drafts are stored in browser localStorage.",
      "Support drafts are local unless submitted as a local ticket.",
      "Deletion requests are recorded as requests, not executed as production deletion.",
    ],
    clearDrafts: "Clear browser-local drafts",
    boundariesTitle: "Product boundaries",
    boundaryCards: [
      [
        "Not professional advice",
        "Astraloom does not provide medical, legal, investment, or psychotherapy advice.",
      ],
      [
        "Not a prediction engine",
        "The sandbox uses evidence-linked scenario dynamics, not certain future claims.",
      ],
      [
        "Read-only graph",
        "Users can inspect relation edges but cannot edit trust, hostility, dependency, or other weights.",
      ],
      [
        "Safety gate first",
        "Safety downgraded or paused states cannot be bypassed by full-depth views.",
      ],
    ],
    safetyTitle: "Safety levels",
    safetyRows: [
      ["Safe", "The full local flow can continue."],
      ["Caution", "The flow continues with careful confidence language."],
      ["Downgraded", "Strong claims and depth expansion stay unavailable."],
      ["Blocked", "The flow pauses until setup is revised or reviewed."],
    ],
    accountTitle: "Account placeholders",
    accountBody:
      "Account export, production deletion, billing receipts, and team settings are not active in this local MVP screen.",
    support: "Open support",
    localOnly: "Browser-local only",
    clearTitle: "Clear local Astraloom drafts?",
    clearBody:
      "This clears local scenario, people, agents, graph, simulation, report, feedback, support drafts, and placeholder unlock state in this browser. It does not execute production deletion.",
    typeClear: "Type CLEAR LOCAL DATA",
    clearLocal: "Clear local drafts",
    keepData: "Keep data",
    stored: "stored",
    empty: "empty",
    typeMessage: "Type CLEAR LOCAL DATA to clear browser-local drafts.",
    clearMessage:
      "Browser-local Astraloom drafts were cleared. No production deletion was executed.",
  },
  zh: {
    status: "设置",
    title: "本地偏好、隐私和产品边界。",
    intro:
      "设置页说明 Astraloom 会在本地保存什么，以及产品不会做什么。这里清除数据只影响当前浏览器。",
    openArchive: "打开归档",
    languageTitle: "语言与地区",
    languageBody: "这个本地设置只改变页面语言偏好，不会调用翻译服务。",
    localDataTitle: "当前本地数据",
    localDataBody:
      "Astraloom Local MVP 会把草稿保存在这个浏览器里。设置页不会启动生产数据库同步。",
    privacyTitle: "隐私与本地数据",
    privacyItems: [
      "本地草稿保存在浏览器 localStorage 中。",
      "支持请求草稿在提交为本地工单前只保存在本地。",
      "删除请求会被记录为请求，不会在这里执行生产删除。",
    ],
    clearDrafts: "清除浏览器本地草稿",
    boundariesTitle: "产品边界",
    boundaryCards: [
      ["不是专业建议", "Astraloom 不提供医疗、法律、投资或心理治疗建议。"],
      ["不是预测引擎", "沙盘使用有证据链接的情景动态，而不是确定未来的断言。"],
      ["只读关系图", "用户可以检查关系边，但不能编辑信任、敌意、依赖等权重。"],
      ["安全门先行", "安全降级或暂停状态不能被完整深度视图绕过。"],
    ],
    safetyTitle: "安全等级",
    safetyRows: [
      ["安全", "完整本地流程可以继续。"],
      ["谨慎", "流程继续，但会使用更谨慎的置信度语言。"],
      ["降级", "强 Claim 和深度展开保持不可用。"],
      ["暂停", "流程会暂停，直到设置被修改或复核。"],
    ],
    accountTitle: "账户占位功能",
    accountBody:
      "账户导出、生产删除、账单收据和团队设置在这个本地 MVP 页面中尚未启用。",
    support: "打开支持",
    localOnly: "仅浏览器本地",
    clearTitle: "清除本地 Astraloom 草稿？",
    clearBody:
      "这会清除当前浏览器中的本地处境、人物、Agent、关系图、推演、报告、反馈、支持草稿和占位解锁状态。它不会执行生产删除。",
    typeClear: "输入 CLEAR LOCAL DATA",
    clearLocal: "清除本地草稿",
    keepData: "保留数据",
    stored: "已保存",
    empty: "为空",
    typeMessage: "请输入 CLEAR LOCAL DATA 以清除浏览器本地草稿。",
    clearMessage: "浏览器本地 Astraloom 草稿已清除。没有执行生产删除。",
  },
} as const;

const latinFontOptions: Array<{
  value: LatinFontPreference;
  en: string;
  zh: string;
  sample: string;
}> = [
  { value: "modern", en: "Modern", zh: "现代", sample: "Decision rhythm" },
  { value: "system", en: "System", zh: "系统", sample: "Evidence replay" },
  { value: "serif", en: "Serif", zh: "衬线", sample: "Climate notes" },
];

const chineseFontOptions: Array<{
  value: ChineseFontPreference;
  en: string;
  zh: string;
  sample: string;
}> = [
  { value: "system", en: "System Chinese", zh: "系统中文", sample: "动态沙盘推演" },
  { value: "hei", en: "Hei / UI", zh: "黑体界面", sample: "证据链与关系压力" },
  { value: "song", en: "Song / Reading", zh: "宋体阅读", sample: "观察信号与决策节奏" },
];

export default function SettingsPage() {
  const [repos] = useState(() => getRepositories());
  const {
    chineseFont,
    latinFont,
    locale,
    setChineseFont,
    setLatinFont,
    setLocale,
  } = useLanguage();
  const t = copy[locale];
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState("");
  const [seedContext, setSeedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [storageSize, setStorageSize] = useState(storageEstimate);

  const localStatus = useMemo(() => {
    if (!seedContext) {
      return {
        seed: false,
        people: false,
        agents: false,
        graph: false,
        run: false,
        report: false,
        feedback: false,
      };
    }
    const people = repos.keyPeople.load(seedContext.id);
    const agents = repos.agentProfiles.load(seedContext.id);
    const graph = repos.relationGraphs.load(seedContext.id);
    const run = repos.simulations.load(seedContext.id);
    const report = repos.reports.load(seedContext.id);
    const feedback = repos.feedback.load(seedContext.id);
    return {
      seed: true,
      people: Boolean(people.ok && people.data?.people.length),
      agents: Boolean(agents.ok && agents.data?.agents.length),
      graph: Boolean(graph.ok && graph.data?.edges.length),
      run: Boolean(run.ok && run.data?.events.length),
      report: Boolean(report.ok && report.data?.claims.length),
      feedback: Boolean(feedback.ok && feedback.data?.feedback.length),
    };
  }, [repos, seedContext]);

  function clearBrowserDrafts() {
    if (confirmText !== "CLEAR LOCAL DATA") {
      setMessage(t.typeMessage);
      return;
    }

    if (seedContext) {
      repos.feedback.clearDraft(seedContext.id);
      repos.reports.clearDraft(seedContext.id);
      repos.simulations.clearDraft(seedContext.id);
      repos.relationGraphs.clearDraft(seedContext.id);
      repos.agentProfiles.clearDraft(seedContext.id);
      repos.keyPeople.clearDraft(seedContext.id);
      repos.safetyReviews.clearDraft(seedContext.id);
    }
    repos.seedContexts.clearDraft();
    repos.billingSupport.clearDraft();
    clearLocalSupportDrafts();
    setSeedContext(null);
    setConfirmText("");
    setShowClearModal(false);
    setStorageSize(storageEstimate());
    setMessage(t.clearMessage);
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="planned">{t.status}</StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            {t.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            {t.intro}
          </p>
        </div>
        <ButtonLink href="/app/archive" variant="secondary" className="px-4 py-2">
          {t.openArchive}
        </ButtonLink>
      </div>

      {message ? (
        <p className="mb-5 rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
          {message}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <SurfaceCard className="p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              {t.languageTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {t.languageBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["en", "English"],
                ["zh", "中文"],
              ].map(([optionLocale, label]) => (
                <button
                  key={optionLocale}
                  type="button"
                  onClick={() => setLocale(optionLocale as "en" | "zh")}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                    locale === optionLocale
                      ? "border-[#11150f] bg-[#11150f] text-white"
                      : "border-black/10 bg-white text-[#52594d]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <FontPreferenceGroup
                title={locale === "zh" ? "英文字体" : "English font"}
                description={
                  locale === "zh"
                    ? "用于英文导航、标签、数据字段和技术细节。"
                    : "Used for English navigation, labels, data fields, and technical details."
                }
                activeValue={latinFont}
                options={latinFontOptions}
                locale={locale}
                onChange={setLatinFont}
              />
              <FontPreferenceGroup
                title={locale === "zh" ? "中文字体" : "Chinese font"}
                description={
                  locale === "zh"
                    ? "用于中文标题、段落和结果解释。"
                    : "Used for Chinese headings, paragraphs, and interpretation copy."
                }
                activeValue={chineseFont}
                options={chineseFontOptions}
                locale={locale}
                onChange={setChineseFont}
              />
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              {t.localDataTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {t.localDataBody}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Object.entries(localStatus).map(([key, ready]) => (
                <SettingState
                  key={key}
                  label={key}
                  ready={ready}
                  emptyLabel={t.empty}
                  storedLabel={t.stored}
                />
              ))}
              <SettingState
                label="storage"
                ready={seedContext !== null}
                value={storageSize}
                emptyLabel={t.empty}
                storedLabel={t.stored}
              />
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              {t.privacyTitle}
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[#62695d]">
              {t.privacyItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowClearModal(true)}
              className="mt-5 px-4 py-3"
            >
              {t.clearDrafts}
            </Button>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              {t.boundariesTitle}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {t.boundaryCards.map(([title, body]) => (
                <BoundaryCard key={title} title={title} body={body} />
              ))}
            </div>
          </SurfaceCard>
        </main>

        <aside className="h-fit space-y-5">
          <SurfaceCard emphasis="dark" className="p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              {t.safetyTitle}
            </h2>
            <div className="mt-4 space-y-3">
              {t.safetyRows.map(([label, body]) => (
                <SafetyRow key={label} label={label} body={body} />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              {t.accountTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {t.accountBody}
            </p>
            <ButtonLink href="/app/support" variant="secondary" className="mt-4 px-4 py-3">
              {t.support}
            </ButtonLink>
          </SurfaceCard>
        </aside>
      </section>

      {showClearModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <section className="w-full max-w-lg rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.22)]">
            <StatusPill tone="caution">{t.localOnly}</StatusPill>
            <h2 className="mt-4 text-xl font-semibold text-[#11150f]">
              {t.clearTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#62695d]">
              {t.clearBody}
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                {t.typeClear}
              </span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                className="mt-2 w-full rounded-md border border-black/10 px-3 py-3 text-sm"
              />
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={clearBrowserDrafts}
                disabled={confirmText !== "CLEAR LOCAL DATA"}
              >
                {t.clearLocal}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowClearModal(false)}
              >
                {t.keepData}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

function SettingState({
  label,
  ready,
  value,
  emptyLabel,
  storedLabel,
}: {
  label: string;
  ready: boolean;
  value?: string;
  emptyLabel: string;
  storedLabel: string;
}) {
  return (
    <div className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold capitalize text-[#11150f]">
          {label}
        </span>
        <StatusPill tone={ready ? "ready" : "planned"}>
          {value ?? (ready ? storedLabel : emptyLabel)}
        </StatusPill>
      </div>
    </div>
  );
}

function BoundaryCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
      <h3 className="text-sm font-semibold text-[#11150f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#62695d]">{body}</p>
    </article>
  );
}

function FontPreferenceGroup<T extends string>({
  title,
  description,
  activeValue,
  options,
  locale,
  onChange,
}: {
  title: string;
  description: string;
  activeValue: T;
  options: Array<{ value: T; en: string; zh: string; sample: string }>;
  locale: "en" | "zh";
  onChange: (value: T) => void;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-[#fbfcf8] p-4">
      <h3 className="text-sm font-semibold text-[#11150f]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#62695d]">{description}</p>
      <div className="mt-3 grid gap-2">
        {options.map((option) => {
          const active = option.value === activeValue;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-md border px-3 py-3 text-left transition ${
                active
                  ? "border-[#11150f] bg-[#11150f] text-white shadow-[0_14px_32px_rgba(17,21,15,0.16)]"
                  : "border-black/8 bg-white text-[#52594d] hover:border-[#568262]/40 hover:bg-[#eef5ee]"
              }`}
            >
              <span className="block text-sm font-semibold">
                {locale === "zh" ? option.zh : option.en}
              </span>
              <span
                className={`mt-1 block text-base ${
                  active ? "text-white/72" : "text-[#62695d]"
                }`}
              >
                {option.sample}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SafetyRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-sm font-semibold text-white">{label}</div>
      <p className="mt-1 text-xs leading-5 text-white/58">{body}</p>
    </div>
  );
}
