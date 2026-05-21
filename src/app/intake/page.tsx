"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import {
  clearSeedContextDraft,
  createSeedContextId,
  loadSeedContextDraft,
  saveSeedContextDraft,
} from "@/lib/seed-context/storage";
import type {
  SeedContextDraft,
  TimeWindow,
  TrackType,
} from "@/types/seed-context";

type IntakeFormState = {
  questionText: string;
  trackType: TrackType;
  timeWindow: TimeWindow;
  situationSummary: string;
  keyPeopleText: string;
  privacyAck: boolean;
};

const timeWindowsByTrack: Record<TrackType, TimeWindow[]> = {
  crossroad: ["30_days", "90_days"],
  life_climate: ["1_year", "3_years", "5_years"],
};

const defaultTimeWindowByTrack: Record<TrackType, TimeWindow> = {
  crossroad: "30_days",
  life_climate: "1_year",
};

const intakeCopy = {
  en: {
    title: "Start a simulation",
    status: "Local draft",
    body: "Capture the seed context first. This MVP step stays low-cost: no model call, no payment, no report generation.",
    localOnly:
      "Saved in this browser until Supabase is configured for authenticated storage.",
    questionLabel: "Main question",
    questionPlaceholder:
      "Example: Should I accept the new job offer or stay with my current team?",
    trackLabel: "Simulation track",
    tracks: {
      crossroad: {
        title: "Track A: crossroad",
        detail: "A concrete decision with short-term consequences.",
      },
      life_climate: {
        title: "Track B: life climate",
        detail: "A broader trend scan across the next phase of life.",
      },
    },
    windowLabel: "Time window",
    windows: {
      "30_days": "30 days",
      "90_days": "90 days",
      "1_year": "1 year",
      "3_years": "3 years",
      "5_years": "5 years",
    },
    situationLabel: "Current situation",
    situationPlaceholder:
      "What has already happened? What constraints or stakes matter now?",
    peopleLabel: "Key people involved",
    peoplePlaceholder:
      "Names, roles, or short descriptions. Example: manager, partner, competitor, investor.",
    privacyLabel:
      "I understand this may contain sensitive personal context and should be treated as simulation input, not professional advice.",
    save: "Save seed context",
    continuePeople: "Confirm people",
    clear: "Clear draft",
    validationQuestion: "Add a clearer main question before saving.",
    validationPrivacy: "Confirm the privacy acknowledgement before saving.",
    saved: "Draft saved. Next build step: person confirmation.",
    cleared: "Draft cleared.",
    summaryTitle: "Saved draft",
    emptySummary: "No saved seed context yet.",
    track: "Track",
    window: "Window",
    people: "People",
    noPeople: "Not provided yet",
    updated: "Updated",
  },
  zh: {
    title: "开始一次推演",
    status: "本地草稿",
    body: "先收集推演的种子上下文。本 MVP 阶段保持低成本：不调用模型、不接支付、不生成报告。",
    localOnly: "在接入 Supabase 登录存储之前，草稿只保存在当前浏览器。",
    questionLabel: "主问题",
    questionPlaceholder: "例如：我应该接受新工作机会，还是留在现在的团队？",
    trackLabel: "推演轨道",
    tracks: {
      crossroad: {
        title: "轨道 A：十字路口",
        detail: "用于具体决策，关注短中期后果。",
      },
      life_climate: {
        title: "轨道 B：人生气象",
        detail: "用于泛化迷茫，观察未来阶段的大趋势。",
      },
    },
    windowLabel: "时间窗口",
    windows: {
      "30_days": "30 天",
      "90_days": "90 天",
      "1_year": "1 年",
      "3_years": "3 年",
      "5_years": "5 年",
    },
    situationLabel: "当前处境",
    situationPlaceholder: "已经发生了什么？现在有哪些约束、筹码或风险？",
    peopleLabel: "涉及的关键人物",
    peoplePlaceholder: "姓名、角色或简短描述。例如：上司、伴侣、竞争者、投资人。",
    privacyLabel:
      "我理解这里可能包含敏感个人信息，系统只会把它作为推演输入，不构成专业建议。",
    save: "保存种子上下文",
    continuePeople: "确认人物",
    clear: "清空草稿",
    validationQuestion: "保存前请补充一个更清晰的主问题。",
    validationPrivacy: "保存前请确认隐私说明。",
    saved: "草稿已保存。下一步构建：人物确认。",
    cleared: "草稿已清空。",
    summaryTitle: "已保存草稿",
    emptySummary: "当前还没有保存种子上下文。",
    track: "轨道",
    window: "窗口",
    people: "人物",
    noPeople: "暂未填写",
    updated: "更新时间",
  },
} as const;

const defaultForm: IntakeFormState = {
  questionText: "",
  trackType: "crossroad",
  timeWindow: "30_days",
  situationSummary: "",
  keyPeopleText: "",
  privacyAck: false,
};

function formFromDraft(draft: SeedContextDraft | null): IntakeFormState {
  if (!draft) {
    return defaultForm;
  }

  return {
    questionText: draft.questionText,
    trackType: draft.trackType,
    timeWindow: draft.timeWindow,
    situationSummary: draft.situationSummary,
    keyPeopleText: draft.keyPeopleText,
    privacyAck: draft.privacyAck,
  };
}

function formatSavedTime(value: string, locale: "en" | "zh") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function IntakePage() {
  const { locale } = useLanguage();
  const copy = intakeCopy[locale];
  const [savedDraft, setSavedDraft] = useState<SeedContextDraft | null>(() =>
    loadSeedContextDraft(),
  );
  const [form, setForm] = useState<IntakeFormState>(() =>
    formFromDraft(loadSeedContextDraft()),
  );
  const [message, setMessage] = useState("");

  const availableWindows = timeWindowsByTrack[form.trackType];
  const questionIsValid = form.questionText.trim().length >= 12;
  const canSave = questionIsValid && form.privacyAck;

  function updateField<Key extends keyof IntakeFormState>(
    field: Key,
    value: IntakeFormState[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function updateTrack(trackType: TrackType) {
    setForm((current) => ({
      ...current,
      trackType,
      timeWindow: defaultTimeWindowByTrack[trackType],
    }));
    setMessage("");
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!questionIsValid) {
      setMessage(copy.validationQuestion);
      return;
    }

    if (!form.privacyAck) {
      setMessage(copy.validationPrivacy);
      return;
    }

    const now = new Date().toISOString();
    const draft: SeedContextDraft = {
      id: savedDraft?.id ?? createSeedContextId(),
      questionText: form.questionText.trim(),
      trackType: form.trackType,
      timeWindow: form.timeWindow,
      situationSummary: form.situationSummary.trim(),
      keyPeopleText: form.keyPeopleText.trim(),
      privacyAck: form.privacyAck,
      locale,
      status: "draft",
      createdAt: savedDraft?.createdAt ?? now,
      updatedAt: now,
    };

    saveSeedContextDraft(draft);
    setSavedDraft(draft);
    setMessage(copy.saved);
  }

  function handleClear() {
    clearSeedContextDraft();
    setSavedDraft(null);
    setForm(defaultForm);
    setMessage(copy.cleared);
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
        </div>
        <StatusPill tone="planned">{copy.status}</StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSave}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
            {copy.localOnly}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-900">
              {copy.questionLabel}
            </span>
            <textarea
              value={form.questionText}
              onChange={(event) =>
                updateField("questionText", event.target.value)
              }
              placeholder={copy.questionPlaceholder}
              rows={4}
              className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            />
          </label>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-slate-900">
              {copy.trackLabel}
            </legend>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {(["crossroad", "life_climate"] as const).map((trackType) => {
                const track = copy.tracks[trackType];
                const selected = form.trackType === trackType;

                return (
                  <label
                    key={trackType}
                    className={`rounded-md border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="trackType"
                      value={trackType}
                      checked={selected}
                      onChange={() => updateTrack(trackType)}
                      className="sr-only"
                    />
                    <span className="block font-semibold">{track.title}</span>
                    <span
                      className={`mt-1 block leading-5 ${
                        selected ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {track.detail}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-slate-900">
              {copy.windowLabel}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableWindows.map((timeWindow) => {
                const selected = form.timeWindow === timeWindow;

                return (
                  <label
                    key={timeWindow}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeWindow"
                      value={timeWindow}
                      checked={selected}
                      onChange={() => updateField("timeWindow", timeWindow)}
                      className="sr-only"
                    />
                    {copy.windows[timeWindow]}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-900">
              {copy.situationLabel}
            </span>
            <textarea
              value={form.situationSummary}
              onChange={(event) =>
                updateField("situationSummary", event.target.value)
              }
              placeholder={copy.situationPlaceholder}
              rows={4}
              className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-900">
              {copy.peopleLabel}
            </span>
            <textarea
              value={form.keyPeopleText}
              onChange={(event) =>
                updateField("keyPeopleText", event.target.value)
              }
              placeholder={copy.peoplePlaceholder}
              rows={3}
              className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            />
          </label>

          <label className="mt-5 flex gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={form.privacyAck}
              onChange={(event) =>
                updateField("privacyAck", event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span>{copy.privacyLabel}</span>
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSave}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {copy.save}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.clear}
            </button>
            {savedDraft ? (
              <Link
                href="/people"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.continuePeople}
              </Link>
            ) : null}
            {message ? (
              <span className="text-sm font-medium text-slate-600">
                {message}
              </span>
            ) : null}
          </div>
        </form>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.summaryTitle}
          </h2>

          {savedDraft ? (
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.questionLabel}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {savedDraft.questionText}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.track}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {copy.tracks[savedDraft.trackType].title}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.window}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {copy.windows[savedDraft.timeWindow]}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.people}</dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {savedDraft.keyPeopleText || copy.noPeople}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.updated}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {formatSavedTime(savedDraft.updatedAt, locale)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {copy.emptySummary}
            </p>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
