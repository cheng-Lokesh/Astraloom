import { FrozenWorldGuards } from "@/app/app/simulation/result/frozen-world-guards";
import type { PathDiagnostics } from "@/lib/digital-life/guard-observations";
export type { PathDiagnostics } from "@/lib/digital-life/guard-observations";

export function NoEligibleActions({ diagnostics }: { diagnostics: PathDiagnostics }) {
  return <section aria-label="本次条件未形成完整运行" className="min-w-0 space-y-4 border-t border-white/15 pt-5">
    <h3 className="font-semibold">本次未形成可保存的完整运行</h3>
    <p role="alert" className="max-w-prose text-sm leading-6">至少一条路径没有可引用的模拟事件，未形成可保存的完整运行与报告。下方只说明本次实际执行情况。你可以修改明确条件，逐项重新确认后发起新的运行。</p>
    {diagnostics.paths.map(path => <section key={path.key} aria-label={path.label} className="min-w-0 space-y-2">
      <h4 className="font-medium">{path.label} · {path.status === "no_actions" ? "无可引用事件" : "本路径有模拟事件，但未保存为完整运行"}</h4>
      {path.samples.map((sample, index) => <p key={sample.key} className="text-sm leading-6">样本 {index + 1} · 实际执行 {sample.executedTickCount} 个周期 · 选中事件 {sample.selectedEventCount} 个 · {sample.terminalStatus === "no_actions" ? "无可执行行动而结束" : "执行结束"}</p>)}
      <FrozenWorldGuards observations={path.guardObservations} temporary />
    </section>)}
  </section>;
}
