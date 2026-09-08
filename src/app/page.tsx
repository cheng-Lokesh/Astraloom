"use client";

import React from "react";
import Link from "next/link";
import { ConfidenceIndicator } from "@/components/astraloom/ConfidenceIndicator";

export default function HomePage() {
  const macroWeather = {
    theme: "边界确立与沟通阻力窗口",
    dateText: "2026-09-08 · 宏观气候观察",
    frictionIndex: 68,
    safeAction: "适合梳理未澄清书面预期，避免在高压场景中进行即时对抗式决策。",
    isStormWarning: false,
  };

  const recentRun = {
    id: "sim_90d_career_001",
    title: "Mira 的 90 天职业十字路口：大厂留任 vs 创业公司 offer",
    track: "Track A · 90天决策周期",
    updatedAt: "2 小时前",
    activeAgentsCount: 5,
    topRiskLevel: "L2" as const,
    confidence: 78,
    status: "ready",
  };

  return (
    <div className="min-h-screen bg-observatory-base text-slate-100 font-sans flex flex-col justify-between">
      <header className="min-h-14 border-b border-observatory-subtle px-4 py-2 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-observatory-surface/95 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-h-10">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-sm tracking-tight text-slate-100">
            Astraloom
          </span>
          <span className="hidden sm:inline text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Your AI Life Simulator
          </span>
        </div>

        <nav className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-4 text-[11px] sm:text-xs font-mono text-slate-400">
          <Link href="/history" className="min-h-10 flex items-center justify-center sm:justify-start hover:text-slate-200 transition-colors">
            沙盘归档 (History)
          </Link>
          <Link href="/calibration" className="min-h-10 flex items-center justify-center sm:justify-start hover:text-slate-200 transition-colors">
            现实校准 (Calibration)
          </Link>
          <Link
            href="/new"
            className="min-h-10 px-2 sm:px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors flex items-center justify-center text-center"
          >
            + 装载新沙盘
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl w-full mx-auto p-4 py-8 sm:p-6 sm:py-10 flex-1 space-y-8">
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">
            Evidence-Driven Agent Simulation
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            把你的现实困局，装载成一个可观察的数字生命沙盘
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
            不是占星，不是玄学，也不是一篇长文章。Astraloom 生成你与关键人物的数字个体，在未来沙盘中演化微观博弈，通过证据链与关系图谱为你呈现行动策略。
          </p>
        </div>

        <section className="p-5 rounded-2xl bg-observatory-surface border border-observatory-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{macroWeather.dateText}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                宏观气候规则引擎
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-200">
              今日沙盘气候：{macroWeather.theme}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              行动建议参考：{macroWeather.safeAction}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-500">外部阻力指数</div>
              <div className="text-base font-mono font-bold text-amber-300">
                {macroWeather.frictionIndex} / 100
              </div>
            </div>
            <Link
              href="/new"
              className="text-xs px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors shrink-0"
            >
              启动深度推演 →
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              [活跃沙盘推演记录] · 最近一次运行
            </h2>
            <Link href="/history" className="text-xs text-amber-400 hover:underline">
              查看全部历史沙盘 →
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-observatory-surface border border-observatory-subtle hover:border-slate-700 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{recentRun.track}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-700/60 text-amber-300">
                    最高风险: {recentRun.topRiskLevel}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                    不可变锁定
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-100">{recentRun.title}</h3>
              </div>

              <ConfidenceIndicator score={recentRun.confidence} compact />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>包含 {recentRun.activeAgentsCount} 位数字个体</span>
                <span>·</span>
                <span>更新于 {recentRun.updatedAt}</span>
              </div>

              <Link
                href="/simulation/result"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
              >
                打开只读沙盘控制台 →
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Link
            href="/new"
            className="p-6 rounded-2xl bg-observatory-surface border border-observatory-subtle hover:border-amber-500/60 hover:bg-observatory-raised transition-all group block"
          >
            <div className="text-xs font-mono text-amber-400 mb-1">Track A · 十字路口模式</div>
            <h3 className="text-base font-semibold text-slate-100 mb-2 group-hover:text-amber-200 transition-colors">
              针对近期明确抉择 (30/90天)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              我要不要跳槽？如何打破与老板的权力拉扯？在明确时间窗口内观察多方个体互动与分身分叉。
            </p>
          </Link>

          <Link
            href="/new"
            className="p-6 rounded-2xl bg-observatory-surface border border-observatory-subtle hover:border-sky-500/60 hover:bg-observatory-raised transition-all group block"
          >
            <div className="text-xs font-mono text-sky-400 mb-1">Track B · 长期气候模式</div>
            <h3 className="text-base font-semibold text-slate-100 mb-2 group-hover:text-sky-200 transition-colors">
              针对人生阶段与关系气候 (1/3/5年)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              处于泛化迷茫期？宏观推演未来数年的关系结构演进、阻力周期与能力建设窗口，不输出虚假具体日期。
            </p>
          </Link>
        </section>
      </main>

      <footer className="h-12 border-t border-observatory-subtle px-6 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Astraloom · Personal Digital Life Simulator</span>
        <span>条件性因果推演 · 严禁替代专业医疗/法律/投资建议</span>
      </footer>
    </div>
  );
}
