"use client";

import { useCallback, useEffect, useId, useReducer, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { HistoryComparisonDetails } from "./history-comparison-details";
import { comparisonText } from "./history-comparison-model";
export { buildHistoryComparisonModel } from "./history-comparison-model";
import {
  createFormalSandboxClient,
  type FormalSandboxResultProjection,
} from "@/lib/formal-sandbox/client";

export type HistoryRun = {
  id: string;
  status: string;
  time_horizon?: string;
  created_at?: string;
  completed_at?: string | null;
};

type ComparisonColumn = {
  run: HistoryRun;
  projection: FormalSandboxResultProjection;
};

type ComparisonColumns = readonly [ComparisonColumn, ComparisonColumn];

type ResultRead =
  | { ok: true; data: { projection: FormalSandboxResultProjection } }
  | { ok: false; status: number; errorCode: string };

type SelectionAction =
  | { type: "toggle"; runId: string; runs: HistoryRun[] }
  | { type: "history_view_changed" };

type ComparisonState =
  | { phase: "idle"; columns: null }
  | { phase: "loading"; columns: null }
  | { phase: "error"; columns: null; message: string }
  | { phase: "ready"; columns: ComparisonColumns };

const initialComparisonState: ComparisonState = { phase: "idle", columns: null };

function completedRuns(items: HistoryRun[]) {
  return items.filter((run) => run.status === "completed");
}

export function normalizeHistoryRunSelection(selectedRunIds: string[], runs: HistoryRun[]) {
  const completedIds = new Set(completedRuns(runs).map((run) => run.id));
  return [...new Set(selectedRunIds.filter((id) => completedIds.has(id)))].slice(0, 2);
}

export function toggleHistoryRunSelection(selectedRunIds: string[], runId: string, runs: HistoryRun[]) {
  const selected = normalizeHistoryRunSelection(selectedRunIds, runs);
  if (!completedRuns(runs).some((run) => run.id === runId)) return selected;
  if (selected.includes(runId)) return selected.filter((id) => id !== runId);
  if (selected.length >= 2) return selected;
  return [...selected, runId];
}

export function historySelectionReducer(selectedRunIds: string[], action: SelectionAction) {
  if (action.type === "history_view_changed") return [];
  return toggleHistoryRunSelection(selectedRunIds, action.runId, action.runs);
}

export async function loadHistoryComparison(
  runs: readonly [HistoryRun, HistoryRun],
  readResult: (runId: string) => Promise<ResultRead>,
): Promise<{ ok: true; columns: ComparisonColumns } | { ok: false }> {
  if (runs[0].id === runs[1].id || runs.some((run) => run.status !== "completed")) {
    return { ok: false };
  }

  try {
    const [first, second] = await Promise.all([
      readResult(runs[0].id),
      readResult(runs[1].id),
    ]);
    if (!first.ok || !second.ok) return { ok: false };
    return {
      ok: true,
      columns: [
        { run: runs[0], projection: first.data.projection },
        { run: runs[1], projection: second.data.projection },
      ],
    };
  } catch {
    return { ok: false };
  }
}

function formatRunTime(run: HistoryRun, timeUnavailableLabel: string) {
  const timestamp = run.completed_at ?? run.created_at;
  if (!timestamp) return timeUnavailableLabel;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timeUnavailableLabel : date.toLocaleString();
}

function formatHorizon(horizon: string | undefined) {
  if (horizon === "30_days") return "30 天";
  if (horizon === "90_days") return "90 天";
  return "时间范围未记录";
}

function HistoryComparisonColumn({
  column,
  index,
  timeUnavailableLabel,
}: {
  column: ComparisonColumn;
  index: number;
  timeUnavailableLabel: string;
}) {
  const { run, projection } = column;
  const profile = projection.realityProfile;

  return (
    <SurfaceCard className="min-w-0 p-5 sm:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--evidence-gold)]">
        Run {index + 1}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
        {formatHorizon(run.time_horizon)}
      </h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        完成时间：{formatRunTime(run, timeUnavailableLabel)}
      </p>
      <Button onClick={() => window.location.assign(`/app/simulation/result?run_id=${encodeURIComponent(run.id)}`)} variant="secondary" className="mt-4 min-h-11 !w-auto px-4 py-3">打开此 Run 结果与回填入口</Button>

      <section className="mt-6 border-t border-white/10 pt-5">
        <h4 className="text-base font-semibold text-[var(--text-primary)]">冻结的 Reality Profile</h4>
        {profile.status === "frozen" ? (
          <>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Revision {profile.revision}</p>
            <div className="mt-4 grid gap-4">
              <div>
                <h5 className="text-sm font-semibold">明确事实</h5>
                {profile.facts.length ? (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {profile.facts.map((item) => (
                      <li key={item.key}>
                        <strong className="text-[var(--text-primary)]">{comparisonText(item.label)}：</strong>
                        {comparisonText(item.statement)}
                        <span className="block text-[var(--text-muted)]">依据：{comparisonText(item.evidenceSummary)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-[var(--text-muted)]">暂无已记录事实</p>}
              </div>
              <div>
                <h5 className="text-sm font-semibold">明确假设</h5>
                {profile.assumptions.length ? (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {profile.assumptions.map((item) => (
                      <li key={item.key}>
                        <strong className="text-[var(--text-primary)]">{comparisonText(item.label)}：</strong>
                        {comparisonText(item.statement)}
                        <span className="block text-[var(--text-muted)]">依据：{comparisonText(item.evidenceSummary)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-[var(--text-muted)]">暂无已记录假设</p>}
              </div>
              <div>
                <h5 className="text-sm font-semibold">仍然未知</h5>
                {profile.unknowns.length ? (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {profile.unknowns.map((item) => <li key={item.key}>{comparisonText(item.label)}：明确未知</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-[var(--text-muted)]">没有单独标记为未知的 Profile 项</p>}
              </div>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            此历史 Run 未记录 Reality Profile 快照；这里不会用当前 Profile 补回。
          </p>
        )}
      </section>

      <section className="mt-6 border-t border-white/10 pt-5">
        <h4 className="text-base font-semibold text-[var(--text-primary)]">模拟步骤</h4>
        {projection.steps.length ? (
          <ol className="mt-3 space-y-3">
            {projection.steps.map((step) => (
              <li key={step.key} className="rounded border border-white/10 p-3">
                <p className="font-mono text-xs text-[var(--evidence-gold)]">步骤 {step.order}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{comparisonText(step.label)}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">这是模拟过程记录，不代表现实事件已经发生。</p>
              </li>
            ))}
          </ol>
        ) : <p className="mt-2 text-sm text-[var(--text-muted)]">本次结果没有可展示的步骤。</p>}
      </section>

      <section className="mt-6 border-t border-white/10 pt-5">
        <h4 className="text-base font-semibold text-[var(--text-primary)]">条件性结论</h4>
        {projection.claims.length ? (
          <ul className="mt-3 space-y-3">
            {projection.claims.map((claim) => (
              <li key={claim.key} className="rounded border border-[rgba(234,211,160,.22)] p-3">
                <p className="text-sm font-semibold leading-6 text-[var(--text-primary)]">{comparisonText(claim.statement)}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{comparisonText(claim.uncertainty)}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  关联模拟步骤：{claim.stepKeys.map((key) => projection.steps.find((step) => step.key === key)?.order).filter((order) => order !== undefined).join("、") || "未单独列出"}
                </p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-[var(--text-muted)]">本次结果没有可展示的条件性结论。</p>}
      </section>
    </SurfaceCard>
  );
}

export function HistoryComparisonPanel({
  columns,
  timeUnavailableLabel = "时间不可用",
}: {
  columns: ComparisonColumns;
  timeUnavailableLabel?: string;
}) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="mt-10 border-t border-white/10 pt-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--evidence-gold)]">Read-only comparison</p>
        <h2 id={titleId} className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">两次正式 Run 并排对照</h2>
        <p role="note" className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-secondary)]">
          这是两份冻结结果的并排阅读，不证明现实发生了变化，也不是受控因果实验；两次 Run 的 Seed 或 Relation Graph 可能不同。反馈作为后续Run记录输入，真实校准效果未完成；不会改写这里的历史结果。
        </p>
      </header>
      <HistoryComparisonDetails left={columns[0].projection} right={columns[1].projection} />
      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
        {columns.map((column, index) => (
          <HistoryComparisonColumn
            key={column.run.id}
            column={column}
            index={index}
            timeUnavailableLabel={timeUnavailableLabel}
          />
        ))}
      </div>
    </section>
  );
}

export function ArchiveHistoryClient({ timeUnavailableLabel }: { timeUnavailableLabel: string }) {
  const [items, setItems] = useState<HistoryRun[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<"30_days" | "90_days" | undefined>();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [selectedRunIds, dispatchSelection] = useReducer(historySelectionReducer, [] as string[]);
  const [comparison, setComparison] = useState<ComparisonState>(initialComparisonState);
  const [reloadVersion, setReloadVersion] = useState(0);
  const historyRequestVersion = useRef(0);
  const comparisonRequestVersion = useRef(0);
  const completedItems = completedRuns(items);
  const selectedRuns = normalizeHistoryRunSelection(selectedRunIds, completedItems)
    .map((id) => completedItems.find((run) => run.id === id))
    .filter((run): run is HistoryRun => Boolean(run));

  const clearComparison = useCallback(() => {
    comparisonRequestVersion.current += 1;
    dispatchSelection({ type: "history_view_changed" });
    setSelectionMessage("");
    setComparison(initialComparisonState);
  }, []);

  useEffect(() => {
    const requestVersion = ++historyRequestVersion.current;
    let active = true;

    void createFormalSandboxClient().history(12, undefined, horizon).then((response) => {
      if (!active || requestVersion !== historyRequestVersion.current) return;
      if (!response.ok) {
        setPhase("error");
        setMessage("Account History 暂时无法读取，请重试。");
        return;
      }
      setItems(completedRuns(response.data.items));
      setCursor(response.data.next_cursor);
      setPhase("ready");
    }).catch(() => {
      if (!active || requestVersion !== historyRequestVersion.current) return;
      setPhase("error");
      setMessage("Account History 暂时无法读取，请重试。");
    });

    return () => { active = false; };
  }, [horizon, reloadVersion]);

  const loadOlder = async () => {
    if (!cursor || pageLoading) return;
    clearComparison();
    const requestVersion = ++historyRequestVersion.current;
    setPageLoading(true);
    setMessage("");
    try {
      const response = await createFormalSandboxClient().history(12, cursor, horizon);
      if (requestVersion !== historyRequestVersion.current) return;
      if (!response.ok) {
        setMessage("较早的 History 暂时无法读取，请重试。");
        return;
      }
      setItems((current) => {
        const existingIds = new Set(current.map((run) => run.id));
        return [...current, ...completedRuns(response.data.items).filter((run) => !existingIds.has(run.id))];
      });
      setCursor(response.data.next_cursor);
    } catch {
      if (requestVersion === historyRequestVersion.current) setMessage("较早的 History 暂时无法读取，请重试。");
    } finally {
      if (requestVersion === historyRequestVersion.current) setPageLoading(false);
    }
  };

  const changeHorizon = (next: "30_days" | "90_days" | undefined) => {
    if (next === horizon) return;
    historyRequestVersion.current += 1;
    clearComparison();
    setItems([]);
    setCursor(null);
    setPhase("loading");
    setPageLoading(false);
    setMessage("");
    setHorizon(next);
  };

  const toggleSelection = (runId: string) => {
    const next = toggleHistoryRunSelection(selectedRunIds, runId, completedItems);
    if (next.length === selectedRunIds.length && !selectedRunIds.includes(runId) && selectedRunIds.length === 2) {
      setSelectionMessage("一次最多比较两条 Run；请先取消一条选择。");
      return;
    } else {
      setSelectionMessage("");
    }
    dispatchSelection({ type: "toggle", runId, runs: completedItems });
    comparisonRequestVersion.current += 1;
    setComparison(initialComparisonState);
  };

  const compareSelected = async () => {
    if (selectedRuns.length !== 2 || comparison.phase === "loading") return;
    const selectedPair: [HistoryRun, HistoryRun] = [selectedRuns[0], selectedRuns[1]];
    const requestVersion = ++comparisonRequestVersion.current;
    setComparison({ phase: "loading", columns: null });
    const client = createFormalSandboxClient();
    const result = await loadHistoryComparison(selectedPair, (runId) => client.result(runId));
    if (requestVersion !== comparisonRequestVersion.current) return;
    if (!result.ok) {
      setComparison({
        phase: "error",
        columns: null,
        message: "两份结果暂时无法一起读取。请刷新 History 后重试。",
      });
      return;
    }
    setComparison({ phase: "ready", columns: result.columns });
  };

  const retryHistory = () => {
    historyRequestVersion.current += 1;
    clearComparison();
    setItems([]);
    setCursor(null);
    setPhase("loading");
    setPageLoading(false);
    setMessage("");
    setReloadVersion((value) => value + 1);
  };

  return (
    <AppShell>
      <section id="main-content" className="mx-auto max-w-6xl py-8 sm:py-14">
        <header className="grid gap-6 border-b border-[rgba(176,224,230,.16)] pb-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--evidence-gold)]">Account History</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-[1.08] text-[var(--text-primary)] sm:text-6xl">Every completed Run remains where you left it.</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">History 读取账户中已经完成的正式 Run。打开旧结果不会重新运行；Feedback 只为后续 Run 提供输入，不会改写旧的 Events、Claims 或 Report。</p>
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Run horizon filter">
              <Button variant={horizon === undefined ? "secondary" : "ghost"} onClick={() => changeHorizon(undefined)} className="min-h-11 !w-auto px-3 py-2" aria-pressed={horizon === undefined}>All</Button>
              <Button variant={horizon === "30_days" ? "secondary" : "ghost"} onClick={() => changeHorizon("30_days")} className="min-h-11 !w-auto px-3 py-2" aria-pressed={horizon === "30_days"}>30 days</Button>
              <Button variant={horizon === "90_days" ? "secondary" : "ghost"} onClick={() => changeHorizon("90_days")} className="min-h-11 !w-auto px-3 py-2" aria-pressed={horizon === "90_days"}>90 days</Button>
            </div>
          </div>
          <SurfaceCard emphasis="dark" className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-white/45">Storage boundary</p>
            <p className="mt-3 text-sm leading-7 text-white/70">正式账户记录。浏览器本地草稿不会进入 History 或比较结果。</p>
          </SurfaceCard>
        </header>

        {phase === "loading" ? <p role="status" className="mt-8 text-sm text-[var(--text-secondary)]">Loading account History.</p> : null}
        {phase === "error" ? (
          <div className="mt-8">
            <p role="alert" className="text-sm text-[var(--risk-red)]">{message || "Account History 暂时无法读取，请重试。"}</p>
            <Button onClick={retryHistory} className="mt-4 min-h-11 !w-auto px-4 py-3">Retry History</Button>
          </div>
        ) : null}
        {phase === "ready" && completedItems.length === 0 ? (
          <div className="mt-8 border border-dashed border-white/15 p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">No completed formal Runs yet</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">Lock a Relation Graph, then start the first account Run.</p>
            <ButtonLink href="/app/new/graph" className="mt-5 min-h-11 !w-auto px-4 py-3">Open Relation Graph</ButtonLink>
          </div>
        ) : null}

        {completedItems.length > 0 ? (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="text-sm text-[var(--text-secondary)]">已选择 {selectedRuns.length} / 2 条 Run</p>
              <Button onClick={() => void compareSelected()} disabled={selectedRuns.length !== 2 || comparison.phase === "loading"} loading={comparison.phase === "loading"} loadingLabel="分别读取两份结果…" className="min-h-11 !w-auto px-4 py-3">
                比较所选 Run
              </Button>
            </div>
            {selectionMessage ? <p role="status" className="mt-2 text-sm text-[var(--risk-red)]">{selectionMessage}</p> : null}
            <ol className="mt-3 divide-y divide-white/10">
              {completedItems.map((run, index) => {
                const selected = selectedRunIds.includes(run.id);
                const displayTime = formatRunTime(run, timeUnavailableLabel);
                return (
                  <li key={run.id} className="grid gap-4 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center">
                    <span className="font-mono text-xs tabular-nums text-[var(--evidence-gold)]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{formatHorizon(run.time_horizon)}</h2>
                        <span className="rounded bg-[rgba(121,242,176,.1)] px-2 py-1 font-mono text-[10px] uppercase text-[var(--verified-green)]">completed</span>
                      </div>
                      <p className="mt-2 font-mono text-[11px] text-[var(--text-muted)]">{displayTime}</p>
                      <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-3 rounded px-3 py-2 text-sm text-[var(--text-secondary)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--evidence-gold)]">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelection(run.id)}
                          aria-label={`选择第 ${index + 1} 条 ${formatHorizon(run.time_horizon)} Run，${displayTime}`}
                          className="h-5 w-5 accent-[var(--evidence-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evidence-gold)]"
                        />
                        <span>{selected ? "已选入对照" : "选择此 Run 对照"}</span>
                      </label>
                    </div>
                    <ButtonLink href={`/app/simulation/result?run_id=${encodeURIComponent(run.id)}`} variant="secondary" className="min-h-11 !w-auto px-4 py-3">Reopen Result</ButtonLink>
                  </li>
                );
              })}
            </ol>
            {cursor ? <Button onClick={() => void loadOlder()} disabled={pageLoading} loading={pageLoading} loadingLabel="读取较早记录…" variant="secondary" className="mt-6 min-h-11 !w-auto px-4 py-3">Load older Runs</Button> : null}
            {message && phase !== "error" ? <p role="status" className="mt-3 text-sm text-[var(--risk-red)]">{message}</p> : null}

            {comparison.phase === "error" ? <p role="alert" className="mt-8 text-sm text-[var(--risk-red)]">{comparison.message}</p> : null}
            {comparison.phase === "ready" ? <HistoryComparisonPanel columns={comparison.columns} timeUnavailableLabel={timeUnavailableLabel} /> : null}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
