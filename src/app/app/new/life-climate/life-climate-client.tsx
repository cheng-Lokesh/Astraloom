"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { useLanguage } from "@/components/language-provider";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import type { LifeClimateDomain, LifeClimateHorizon, LifeClimatePathRun, LifeClimatePathRunRequest, LifeClimateRun } from "@/lib/life-climate/engine";
import type { RealityProfileDraft, RealityProfileField } from "@/lib/reality-profile/profile";

type ProfileState = "loading" | "ready" | "needs_seed" | "needs_profile" | "unauthenticated" | "unavailable";
type HistoryItem = {
  id: string;
  created_at: string;
  profile_revision: number;
  horizon: LifeClimateHorizon;
  changes: LifeClimatePathRunRequest["changes"];
};
type RunRecord = {
  id: string;
  created_at: string;
  profile_revision: number;
  result: LifeClimateRun | LifeClimatePathRun;
};
type ApiBody = {
  ok?: boolean;
  error_code?: string | null;
  profile?: RealityProfileDraft | null;
  items?: HistoryItem[];
  run?: RunRecord;
};
type PostBody = {
  profile_revision: number;
  horizon: LifeClimateHorizon;
  changes: LifeClimatePathRunRequest["changes"];
};
type PendingRequest = { key: string; body: PostBody; fingerprint: string };
type Locale = "en" | "zh";

const domains: Array<{ key: LifeClimateDomain; en: string; zh: string }> = [
  { key: "identity", en: "Identity structure", zh: "身份结构" },
  { key: "career", en: "Career structure", zh: "职业结构" },
  { key: "wealth", en: "Wealth structure", zh: "财富结构" },
  { key: "relationships", en: "Relationship ecosystem", zh: "关系生态" },
  { key: "environment", en: "City and living environment", zh: "城市与生活环境" },
  { key: "lifeStage", en: "Life stage", zh: "人生阶段" },
];
const oneYearPeriodLabels: Record<Locale, string[]> = {
  en: ["Stage one", "Stage two", "Stage three", "Stage four"],
  zh: ["第一阶段", "第二阶段", "第三阶段", "第四阶段"],
};
const assumptionEvidenceSummary = "用户明确设定的一项长期结构变化假设";

const copy = {
  en: {
    eyebrow: "Track B / Long-horizon climate",
    title: "Long-horizon life-climate paths",
    intro: "Choose a 1-, 3-, or 5-year horizon and add changes within one theme. Astraloom shows your assumptions over time; it does not forecast what must happen.",
    boundaryTitle: "A conditional scenario, not a prediction",
    boundary: "Only changes you explicitly add are applied. Other dimensions stay as saved or explicitly unknown; the path does not infer cross-domain effects, probabilities, or certain outcomes.",
    periods: "Relative stages",
    currentStructure: "Your saved starting structure",
    readProfile: "Reading your saved life structure…",
    readHistory: "Reading saved comparisons…",
    profileRequired: "No long-horizon structure has been saved for the current formal account path yet.",
    seedRequired: "Complete and submit a formal situation first, then save your life structure before starting Track B.",
    signInRequired: "Sign in to use a saved personal life structure and keep this comparison in your account history.",
    unavailable: "Your saved structure could not be loaded. Please try again.",
    openStart: "Open formal Start",
    editProfile: "Review life structure",
    formTitle: "Build an alternative life path",
    formIntro: "Choose one theme and a horizon, then add changes within that theme. Each change is your assumption, not an AI prediction.",
    horizonLabel: "Time horizon",
    domainLabel: "Life structure domain",
    domainLocked: "This comparison stays within one theme. Remove all listed changes to choose another theme.",
    entryLabel: "Saved item",
    currentLabel: "Current saved state",
    unknown: "Explicitly unknown",
    missingValue: "No value saved",
    startLabel: "Stage when this change begins",
    alternativeLabel: "What changes in this field",
    alternativeHelp: "Describe one bounded assumption in your own words. Avoid private facts about other people or instructions to monitor or control them.",
    addChange: "Add this change to the path",
    addedChanges: "Changes in this path",
    noChanges: "Add at least one change before saving the comparison.",
    removeChange: "Remove this change",
    maxLength: "Up to 240 characters",
    submit: "Build comparison",
    submitting: "Saving comparison…",
    setupFirst: "Set up the formal path first",
    savedHeading: "Saved comparisons",
    savedEmpty: "No long-horizon paths have been saved on this account yet.",
    openSaved: "Open saved comparison",
    savedOn: "Saved",
    noHistory: "History is temporarily unavailable. Your current comparison can still be used.",
    resultHeading: "Path comparison",
    baseline: "Alongside your saved structure",
    alternative: "With your stated alternative",
    noEntry: "Explicitly unknown",
    linkedEvidence: "Every saved assumption is recorded as an Event and has a Claim linked to that Event.",
    resultLimit: "These records show what-if assumptions you entered. They are not evidence that any change happened in real life.",
    onlyOne: "The baseline stays frozen. In the alternative, each field changes only from the stage you selected; unrelated domains stay as saved or unknown.",
    savedMessage: "Comparison saved to your account history.",
    retryMessage: "We could not confirm whether this comparison was saved. Retry the same details to safely check the original request.",
    genericError: "The comparison could not be completed. Your saved profile and earlier history were not changed.",
    safetyError: "This input reached a safety limit, so a long-horizon comparison was not created.",
    conflictError: "Your saved life structure changed in another window. Reload it before comparing again.",
    idempotencyError: "The original request used a different set of details. Edit the form to start a new comparison.",
    runMissing: "That saved comparison is no longer available in this account.",
    stagesOnly: "The stages are ordered sections, not dated milestones.",
    reload: "Reload saved structure",
    back: "Back to Start",
  },
  zh: {
    eyebrow: "路径 B / 长期人生气候",
    title: "长期人生气候路径",
    intro: "选择一年、三年或五年，并在同一个人生领域内逐段写下你想探索的变化。Astraloom 展示的是你设定的假设路径，不会把它说成必然发生的预言。",
    boundaryTitle: "条件式沙盘，不是确定预言",
    boundary: "只有你明确加入的变化会应用到备选路径。其他领域沿用已保存资料或明确未知；系统不会推断跨领域连锁影响、概率或确定结果。",
    periods: "相对阶段",
    currentStructure: "当前已保存的起始结构",
    readProfile: "正在读取已保存的人生结构…",
    readHistory: "正在读取已保存的路径对照…",
    profileRequired: "当前正式账户路径还没有保存长期生命结构资料。",
    seedRequired: "请先完成并提交正式处境资料，再保存人生结构，然后开始路径 B。",
    signInRequired: "登录后才能读取个人已保存结构，并把对照结果保存在账户历史中。",
    unavailable: "暂时无法读取已保存结构，请稍后重试。",
    openStart: "打开正式开始页",
    editProfile: "查看人生结构资料",
    formTitle: "搭建一条备选人生路径",
    formIntro: "先选一个人生领域和时间范围，再逐条加入这个领域内的变化。每条都是你设定的假设，不是 AI 预测。",
    horizonLabel: "推演时间范围",
    domainLabel: "人生结构领域",
    domainLocked: "一次对照只围绕一个领域。移除已加入的所有变化后，才能切换领域。",
    entryLabel: "已保存的资料项",
    currentLabel: "当前已保存状态",
    unknown: "明确未知",
    missingValue: "尚未填写",
    startLabel: "这项变化从哪个阶段开始",
    alternativeLabel: "这个领域会有什么变化",
    alternativeHelp: "用自己的话描述一项有限假设。不要填写他人的私密事实，也不要输入监控或控制他人的指令。",
    addChange: "把这项变化加入路径",
    addedChanges: "这条路径已加入的变化",
    noChanges: "至少加入一项变化后，才能保存路径对照。",
    removeChange: "移除这项变化",
    maxLength: "最多 240 个字符",
    submit: "生成路径对照",
    submitting: "正在保存对照…",
    setupFirst: "先完成正式路径设置",
    savedHeading: "已保存的路径对照",
    savedEmpty: "这个账户还没有保存过长期人生气候路径。",
    openSaved: "打开已保存的对照",
    savedOn: "保存于",
    noHistory: "暂时无法读取历史记录，但仍可使用当前对照。",
    resultHeading: "路径对照",
    baseline: "沿用当前已保存结构",
    alternative: "应用你设定的备选条件",
    noEntry: "明确未知",
    linkedEvidence: "每条已保存的假设变化都会记录成事件，并有一条引用该事件的说明。",
    resultLimit: "这些记录展示的是你输入的假设，不代表任何变化已经在现实中发生。",
    onlyOne: "基线保持不变；备选路径中的资料项只从你选择的阶段起变化，其他领域沿用已保存内容或明确未知。",
    savedMessage: "对照已保存到你的账户历史。",
    retryMessage: "暂时无法确认对照是否保存。保持相同内容重试会安全检查原请求。",
    genericError: "无法完成这次对照。已保存的资料和此前历史不会被改写。",
    safetyError: "这项输入触发了安全限制，因此没有创建长期对照。",
    conflictError: "你的人生结构资料已在其他窗口更新。请重新读取后再生成。",
    idempotencyError: "原请求使用了不同内容。修改表单后可以创建一条新的对照。",
    runMissing: "账户中已无法读取这条历史对照。",
    stagesOnly: "阶段只表示先后顺序，不是带日期的里程碑。",
    reload: "重新读取已保存资料",
    back: "返回开始页",
  },
} as const;

function apiErrorMessage(code: string | undefined, t: (typeof copy)[Locale]) {
  switch (code) {
    case "safety_downgrade": return t.safetyError;
    case "profile_revision_conflict": return t.conflictError;
    case "idempotency_conflict": return t.idempotencyError;
    case "life_climate_run_not_found": return t.runMissing;
    default: return t.genericError;
  }
}

function savedValue(field: RealityProfileField | undefined, unknownLabel: string, missingLabel: string) {
  if (!field || field.classification === "unknown") return unknownLabel;
  return field.value.trim() || missingLabel;
}

function savedDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium" }).format(date);
}

function periodLabelsFor(locale: Locale, horizon: LifeClimateHorizon) {
  if (horizon === "1_year") return oneYearPeriodLabels[locale];
  const count = horizon === "3_years" ? 3 : 5;
  return Array.from({ length: count }, (_, index) => locale === "zh" ? `第 ${index + 1} 年` : `Year ${index + 1}`);
}

function horizonLabel(locale: Locale, horizon: LifeClimateHorizon) {
  if (locale === "zh") return horizon === "1_year" ? "一年" : horizon === "3_years" ? "三年" : "五年";
  return horizon === "1_year" ? "1 year" : horizon === "3_years" ? "3 years" : "5 years";
}

export function selectedLifeClimateChanges(result: LifeClimateRun | LifeClimatePathRun) {
  return "selectedChanges" in result ? result.selectedChanges : [result.selectedChange];
}

export function LifeClimateClient() {
  const { locale: appLocale } = useLanguage();
  const locale: Locale = appLocale === "zh" ? "zh" : "en";
  const t = copy[locale];
  const [profile, setProfile] = useState<RealityProfileDraft | null>(null);
  const [profileState, setProfileState] = useState<ProfileState>("loading");
  const [domain, setDomain] = useState<LifeClimateDomain>("identity");
  const [entryIndex, setEntryIndex] = useState(0);
  const [horizon, setHorizon] = useState<LifeClimateHorizon>("1_year");
  const [startPeriod, setStartPeriod] = useState(1);
  const [newState, setNewState] = useState("");
  const [changes, setChanges] = useState<LifeClimatePathRunRequest["changes"]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<RunRecord | null>(null);
  const pendingRequest = useRef<PendingRequest | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/reality-profile", { cache: "no-store" });
      const body = await response.json().catch(() => null) as ApiBody | null;
      if (response.status === 401) {
        setProfile(null);
        setProfileState("unauthenticated");
      } else if (response.status === 409 && body?.error_code === "current_seed_required") {
        setProfile(null);
        setProfileState("needs_seed");
      } else if (!response.ok || !body?.profile) {
        setProfile(null);
        setProfileState(response.ok ? "needs_profile" : "unavailable");
      } else {
        setProfile(body.profile);
        setProfileState("ready");
      }
    } catch {
      setProfile(null);
      setProfileState("unavailable");
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/life-climate/runs?limit=20", { cache: "no-store" });
      const body = await response.json().catch(() => null) as ApiBody | null;
      if (!response.ok || !Array.isArray(body?.items)) {
        setHistory([]);
        setHistoryState("unavailable");
        return;
      }
      setHistory(body.items);
      setHistoryState("ready");
    } catch {
      setHistory([]);
      setHistoryState("unavailable");
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => {
      void loadProfile();
      void loadHistory();
    }, 0);
    return () => window.clearTimeout(request);
  }, [loadHistory, loadProfile]);

  const fields = profile?.lifeModelDomains[domain] ?? [];
  const selectedField = fields[entryIndex];
  const selectedDomainLabel = domains.find((item) => item.key === domain)?.[locale] ?? domain;
  const periodLabels = periodLabelsFor(locale, horizon);
  const canAddChange = profileState === "ready" && Boolean(selectedField) && Boolean(newState.trim()) && !saving;
  const canSubmit = profileState === "ready" && changes.length > 0 && !saving;

  const addChange = () => {
    if (!selectedField || !newState.trim() || saving) return;
    const nextChange = {
      domain,
      entryIndex,
      startPeriod,
      newState: newState.trim(),
      evidenceSummary: assumptionEvidenceSummary,
    };
    if (changes.some((change) => change.domain === domain && change.entryIndex === entryIndex && change.startPeriod === startPeriod)) {
      setMessage(locale === "zh" ? "同一阶段中，这条资料已经有一项变化。" : "This item already has a change in that stage.");
      return;
    }
    if (changes.length >= 12) {
      setMessage(locale === "zh" ? "一条路径最多添加 12 项变化。" : "A path can contain at most 12 changes.");
      return;
    }
    setChanges((current) => [...current, nextChange]);
    setNewState("");
    setMessage("");
  };

  const removeChange = (index: number) => setChanges((current) => current.filter((_, changeIndex) => changeIndex !== index));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || changes.length === 0 || saving) return;

    const body: PostBody = {
      profile_revision: profile.revision,
      horizon,
      changes,
    };
    const fingerprint = JSON.stringify(body);
    const key = pendingRequest.current?.fingerprint === fingerprint
      ? pendingRequest.current.key
      : crypto.randomUUID();
    pendingRequest.current = { key, body, fingerprint };
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/life-climate/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, idempotency_key: key }),
      });
      const responseBody = await response.json().catch(() => null) as ApiBody | null;
      if (response.ok && responseBody?.run) {
        pendingRequest.current = null;
        setResult(responseBody.run);
        setHistory((current) => [
          {
            id: responseBody.run!.id,
            created_at: responseBody.run!.created_at,
            profile_revision: responseBody.run!.profile_revision,
            horizon: responseBody.run!.result.horizon,
            changes: selectedLifeClimateChanges(responseBody.run!.result),
          },
          ...current.filter((item) => item.id !== responseBody.run!.id),
        ].slice(0, 20));
        setMessage(t.savedMessage);
      } else {
        if (response.status < 500) pendingRequest.current = null;
        setMessage(apiErrorMessage(responseBody?.error_code ?? undefined, t));
        if (responseBody?.error_code === "profile_revision_conflict") void loadProfile();
      }
    } catch {
      setMessage(t.retryMessage);
    } finally {
      setSaving(false);
      void loadHistory();
    }
  };

  const openHistory = async (id: string) => {
    setOpeningId(id);
    setMessage("");
    try {
      const query = new URLSearchParams({ run_id: id });
      const response = await fetch(`/api/life-climate/runs?${query.toString()}`, { cache: "no-store" });
      const body = await response.json().catch(() => null) as ApiBody | null;
      if (!response.ok || !body?.run) {
        setMessage(apiErrorMessage(body?.error_code ?? undefined, t));
      } else {
        setResult(body.run);
      }
    } catch {
      setMessage(t.genericError);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div id="main-content" className="mx-auto max-w-6xl space-y-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--evidence-gold)]">{t.eyebrow}</p>
        <ButtonLink href="/app/new/scene" variant="ghost" className="min-h-11 !w-auto active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)]">{t.back}</ButtonLink>
      </div>

      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
        <div>
          <h1 className="max-w-3xl font-[var(--font-display)] text-4xl leading-[1.08] tracking-[-.022em] text-[var(--text-primary)] sm:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">{t.intro}</p>
        </div>
        <SurfaceCard emphasis="dark" className="p-5">
          <h2 className="text-sm font-semibold text-[var(--signal-cyan)]">{t.boundaryTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">{t.boundary}</p>
        </SurfaceCard>
      </header>

      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t.periods}</h2>
          <p className="text-xs text-[var(--text-muted)]">{t.stagesOnly}</p>
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {periodLabels.map((label, index) => (
            <li key={label} className="flex min-h-11 items-center gap-3 border-l border-[var(--evidence-gold)]/60 bg-white/[.025] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <span className="font-mono text-xs text-[var(--evidence-gold)]">0{index + 1}</span>{label}
            </li>
          ))}
        </ol>
      </SurfaceCard>

      {profileState === "loading" ? <p role="status" className="text-sm text-[var(--text-secondary)]">{t.readProfile}</p> : null}
      {profileState === "needs_seed" || profileState === "needs_profile" || profileState === "unauthenticated" || profileState === "unavailable" ? (
        <SurfaceCard variant="warning" className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">{t.setupFirst}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              {profileState === "needs_seed" ? t.seedRequired : profileState === "needs_profile" ? t.profileRequired : profileState === "unauthenticated" ? t.signInRequired : t.unavailable}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {profileState === "unauthenticated" ? <ButtonLink href="/login?next=%2Fapp%2Fnew%2Flife-climate" className="min-h-11 !w-auto active:scale-95">{t.openStart}</ButtonLink> : null}
            {profileState === "needs_seed" ? <ButtonLink href="/app/new/scene" className="min-h-11 !w-auto active:scale-95">{t.openStart}</ButtonLink> : null}
            {profileState === "needs_profile" ? <ButtonLink href="/app/reality-profile" className="min-h-11 !w-auto active:scale-95">{t.editProfile}</ButtonLink> : null}
            {profileState === "unavailable" ? <Button type="button" variant="secondary" className="min-h-11 active:scale-95" onClick={() => { setProfileState("loading"); void loadProfile(); }}>{t.reload}</Button> : null}
          </div>
        </SurfaceCard>
      ) : null}

      {profileState === "ready" && profile ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <SurfaceCard emphasis="strong" className="p-5 sm:p-7">
            <div className="mb-6 border-b border-white/10 pb-5">
              <h2 className="font-[var(--font-display)] text-2xl tracking-[-.012em] text-[var(--text-primary)]">{t.formTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{t.formIntro}</p>
            </div>
            <form className="space-y-5" onSubmit={submit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-[var(--text-secondary)]">
                  {t.horizonLabel}
                  <select
                    aria-label={t.horizonLabel}
                    value={horizon}
                    onChange={(event) => {
                      const nextHorizon = event.target.value as LifeClimateHorizon;
                      const nextPeriodCount = periodLabelsFor(locale, nextHorizon).length;
                      if (changes.some((change) => change.startPeriod > nextPeriodCount)) {
                        setMessage(locale === "zh" ? "先移除超出新时间范围的后续变化，再缩短时间范围。" : "Remove changes beyond the shorter horizon before changing it.");
                        return;
                      }
                      setHorizon(nextHorizon);
                      setStartPeriod((current) => Math.min(current, nextPeriodCount));
                      setMessage("");
                    }}
                    className="mt-2 block min-h-11 w-full border border-white/15 bg-[#101113] px-3 text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--evidence-gold)]"
                  >
                    <option value="1_year">{horizonLabel(locale, "1_year")}</option>
                    <option value="3_years">{horizonLabel(locale, "3_years")}</option>
                    <option value="5_years">{horizonLabel(locale, "5_years")}</option>
                  </select>
                </label>
                <label className="block text-sm text-[var(--text-secondary)]">
                  {t.domainLabel}
                  <select
                    aria-label={t.domainLabel}
                    value={domain}
                    disabled={changes.length > 0}
                    onChange={(event) => { setDomain(event.target.value as LifeClimateDomain); setEntryIndex(0); }}
                    className="mt-2 block min-h-11 w-full border border-white/15 bg-[#101113] px-3 text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--evidence-gold)]"
                  >
                    {domains.map((item) => <option key={item.key} value={item.key}>{item[locale]}</option>)}
                  </select>
                  {changes.length > 0 ? <span className="mt-2 block text-xs leading-5 text-[var(--text-muted)]">{t.domainLocked}</span> : null}
                </label>
                <label className="block text-sm text-[var(--text-secondary)]">
                  {t.entryLabel}
                  <select
                    aria-label={t.entryLabel}
                    value={entryIndex}
                    onChange={(event) => setEntryIndex(Number(event.target.value))}
                    className="mt-2 block min-h-11 w-full border border-white/15 bg-[#101113] px-3 text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--evidence-gold)]"
                  >
                    {fields.map((field, index) => <option key={`${domain}-${index}`} value={index}>{`${index + 1}. ${savedValue(field, t.unknown, t.missingValue)}`}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div key={`${domain}:${entryIndex}`} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[.08em] text-[var(--text-muted)]">{t.currentLabel}</p>
                  <p className="mt-2 break-words text-sm leading-6 text-[var(--text-primary)]">{savedValue(selectedField, t.unknown, t.missingValue)}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{selectedDomainLabel}</p>
                </div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  {t.startLabel}
                  <select
                    aria-label={t.startLabel}
                    value={startPeriod}
                    onChange={(event) => setStartPeriod(Number(event.target.value))}
                    className="mt-2 block min-h-11 w-full border border-white/15 bg-[#101113] px-3 text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--evidence-gold)]"
                  >
                    {periodLabels.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-sm text-[var(--text-secondary)]">
                {t.alternativeLabel}
                <textarea
                  aria-label={t.alternativeLabel}
                  required
                  maxLength={240}
                  value={newState}
                  onChange={(event) => setNewState(event.target.value)}
                  aria-describedby="life-climate-assumption-help"
                  className="mt-2 block min-h-28 w-full resize-y border border-white/15 bg-black/20 px-3 py-3 text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--evidence-gold)]"
                />
                <span id="life-climate-assumption-help" className="mt-2 block text-xs leading-5 text-[var(--text-muted)]">{t.alternativeHelp} {t.maxLength}</span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" disabled={!canAddChange || changes.length >= 12} onClick={addChange} className="min-h-11 active:scale-95">{t.addChange}</Button>
                {changes.length === 0 ? <span className="text-xs text-[var(--text-muted)]">{t.noChanges}</span> : null}
              </div>

              {changes.length > 0 ? (
                <section aria-label={t.addedChanges} className="rounded-md border border-white/10 bg-black/15 p-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t.addedChanges} ({changes.length}/12)</h3>
                  <ol className="mt-3 space-y-3">
                    {changes.map((change, index) => {
                      const changeDomain = domains.find((item) => item.key === change.domain)?.[locale] ?? change.domain;
                      return (
                        <li key={`${change.domain}:${change.entryIndex}:${change.startPeriod}`} className="flex flex-wrap items-start justify-between gap-3 border-t border-white/10 pt-3">
                          <p className="min-w-0 flex-1 break-words text-sm leading-6 text-[var(--text-secondary)]"><span className="text-[var(--evidence-gold)]">{periodLabels[change.startPeriod - 1]}</span> · {changeDomain}: {change.newState}</p>
                          <button type="button" aria-label={`${t.removeChange}: ${changeDomain}`} onClick={() => removeChange(index)} className="min-h-10 px-2 text-xs text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)]">{t.removeChange}</button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ) : null}

              {message ? <p role="status" className="rounded-md border border-white/10 bg-white/[.035] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">{message}</p> : null}
              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" loading={saving} loadingLabel={t.submitting} disabled={!canSubmit} className="min-h-11 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)]">{t.submit}</Button>
              </div>
            </form>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <h2 className="text-sm font-semibold text-[var(--signal-cyan)]">{t.currentStructure}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{t.boundary}</p>
            <ButtonLink href="/app/reality-profile" variant="ghost" className="mt-4 min-h-11 !w-auto active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)]">{t.editProfile}</ButtonLink>
          </SurfaceCard>
        </div>
      ) : null}

      {message && profileState !== "ready" ? <p role="status" className="sr-only">{message}</p> : null}

      {result ? (
        <SurfaceCard className="p-5 sm:p-7">
          {(() => {
            const selectedChanges = selectedLifeClimateChanges(result.result);
            const changedFields = [...new Map(selectedChanges.map((change) => [`${change.domain}:${change.entryIndex}`, { domain: change.domain, entryIndex: change.entryIndex }])).values()];
            const resultPeriods = periodLabelsFor(locale, result.result.horizon);
            return <>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--evidence-gold)]">{t.resultHeading}</p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--text-primary)]">{horizonLabel(locale, result.result.horizon)} · {locale === "zh" ? `${selectedChanges.length} 项明确假设` : `${selectedChanges.length} stated assumptions`}</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)]">{t.savedOn} {savedDate(result.created_at, locale)}</p>
          </div>
          <ol className="mt-5 grid gap-2 sm:grid-cols-2">
            {selectedChanges.map((change, index) => {
              const label = domains.find((item) => item.key === change.domain)?.[locale] ?? change.domain;
              return <li key={`${change.domain}:${change.entryIndex}:${change.startPeriod}`} className="rounded border border-white/10 bg-white/[.025] p-3 text-sm leading-6 text-[var(--text-secondary)]"><span className="font-mono text-xs text-[var(--evidence-gold)]">{resultPeriods[change.startPeriod - 1]}</span><span className="ml-2">{index + 1}. {label}: {change.newState}</span></li>;
            })}
          </ol>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.result.paths.map((path) => (
              <section key={path.id} aria-label={path.id === "baseline" ? t.baseline : t.alternative} className={`rounded-md border p-4 sm:p-5 ${path.id === "alternative" ? "border-[rgba(84,230,255,0.25)] bg-[rgba(84,230,255,0.035)]" : "border-white/10 bg-white/[.025]"}`}>
                <h3 className={`text-sm font-semibold ${path.id === "alternative" ? "text-[var(--signal-cyan)]" : "text-[var(--text-primary)]"}`}>{path.id === "baseline" ? t.baseline : t.alternative}</h3>
                <ol className="mt-4 space-y-3">
                  {path.periods.map((period) => {
                    return (
                      <li key={period.periodIndex} className="border-t border-white/[.07] pt-3 text-sm">
                        <span className="font-mono text-xs text-[var(--text-muted)]">{resultPeriods[period.periodIndex - 1]}</span>
                        <ul className="mt-2 space-y-2">
                          {changedFields.map(({ domain: fieldDomain, entryIndex: fieldIndex }) => {
                            const field = period.lifeModelDomains[fieldDomain][fieldIndex];
                            const changed = path.id === "alternative" && selectedChanges.some((change) => change.domain === fieldDomain && change.entryIndex === fieldIndex && change.startPeriod <= period.periodIndex);
                            const fieldLabel = domains.find((item) => item.key === fieldDomain)?.[locale] ?? fieldDomain;
                            return <li key={`${fieldDomain}:${fieldIndex}`} className={`break-words leading-6 ${changed ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}><span className="text-[var(--text-muted)]">{fieldLabel}: </span>{savedValue(field, t.noEntry, t.missingValue)}</li>;
                          })}
                        </ul>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
          <div className="mt-5 grid gap-2 border-l-2 border-[var(--evidence-gold)] pl-4 text-sm leading-6 text-[var(--text-secondary)]">
            <p>{t.linkedEvidence}</p>
            <p>{t.resultLimit}</p>
            <p>{t.onlyOne}</p>
          </div>
            </>;
          })()}
        </SurfaceCard>
      ) : null}

      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-[var(--font-display)] text-xl text-[var(--text-primary)]">{t.savedHeading}</h2>
          {historyState === "loading" ? <p role="status" className="text-xs text-[var(--text-muted)]">{t.readHistory}</p> : null}
          {historyState === "unavailable" ? <p role="status" className="text-xs text-[var(--text-muted)]">{t.noHistory}</p> : null}
        </div>
        {historyState === "ready" && history.length === 0 ? <p className="mt-4 text-sm text-[var(--text-muted)]">{t.savedEmpty}</p> : null}
        {history.length > 0 ? (
          <ul className="mt-4 divide-y divide-white/[.08]">
            {history.map((item) => {
              const firstChange = item.changes[0];
              const label = firstChange ? domains.find((domainItem) => domainItem.key === firstChange.domain)?.[locale] ?? firstChange.domain : "";
              const summary = firstChange ? `${horizonLabel(locale, item.horizon)} · ${label}${item.changes.length > 1 ? ` +${item.changes.length - 1}` : ""}: ${firstChange.newState}` : horizonLabel(locale, item.horizon);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={openingId !== null}
                    aria-label={`${t.openSaved}: ${summary}`}
                    onClick={() => void openHistory(item.id)}
                    className="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 py-3 text-left text-sm text-[var(--text-secondary)] transition-[color,transform] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)] hover:text-[var(--text-primary)] disabled:opacity-60"
                  >
                    <span className="min-w-0 break-words">{summary}</span>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">{openingId === item.id ? t.submitting : savedDate(item.created_at, locale)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
