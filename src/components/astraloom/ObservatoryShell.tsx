import Link from "next/link";
import type { ReactNode } from "react";

export function ObservatoryShell({ title, stage, children }: { title: string; stage?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-observatory-base font-sans text-slate-100">
      <a href="#main-content" className="sr-only z-50 rounded bg-amber-400 px-4 py-2 text-slate-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">跳到主要内容</a>
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b border-observatory-subtle bg-observatory-surface/95 px-4 py-2 md:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" /><Link href="/" className="truncate text-sm font-semibold tracking-tight text-slate-100">{title}</Link></div>
        {stage ? <div className="text-right font-mono text-xs text-slate-500">{stage}</div> : <nav aria-label="观测台导航" className="flex items-center gap-1 text-xs font-mono text-slate-400"><Link href="/history" className="min-h-10 rounded-lg px-3 py-3 hover:text-slate-200 active:scale-95">归档</Link><Link href="/calibration" className="min-h-10 rounded-lg px-3 py-3 hover:text-slate-200 active:scale-95">校准</Link><Link href="/new" className="min-h-10 rounded-lg bg-amber-500 px-3 py-3 font-semibold text-slate-950 hover:bg-amber-400 active:scale-95">+ 新沙盘</Link></nav>}
      </header>
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 p-4 py-8 md:p-6 md:py-10">{children}</main>
      <footer className="flex min-h-12 flex-col justify-between gap-1 border-t border-observatory-subtle px-4 py-3 font-mono text-[11px] text-slate-500 md:flex-row md:px-6"><span>Astraloom · Personal Digital Life Simulator</span><span>条件性因果推演 · 不替代专业医疗、法律或投资建议</span></footer>
    </div>
  );
}
