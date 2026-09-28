"use client";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";

const copy = {
  en: {
    eyebrow: "Formal account path",
    title: "Begin one personal digital-life sandbox.",
    intro: "Start with the situation you want to understand. Astraloom supports the formal Track A path and a bounded 1-, 3-, or 5-year Track B comparison. A result appears in history only after the account flow has saved it.",
    primary: "Start Track A intake",
    trackB: "Explore long-horizon life climate",
    trackBNote: "Track B compares user-stated changes within one theme across coarse relative stages. It is conditional, not a forecast.",
    capabilityTitle: "What is available now",
    capability: ["Track A for one concrete situation", "Track B for a 1-, 3-, or 5-year user-authored path within one theme", "Structured Reality Intake and a formal account path from Seed to History and Feedback"],
    pathTitle: "The formal path",
    path: ["Seed", "People", "Agents", "Locked Graph", "Run", "History and Feedback"],
    boundary: "This entry does not open a sample workspace, local trial, or standalone Result.",
  },
  zh: {
    eyebrow: "正式账户路径",
    title: "开始一个属于你的个人数字生命沙盘。",
    intro: "从你想理解的一段现实处境开始。Astraloom 提供正式路径 A，以及范围受限的一年、三年或五年路径 B 对照。只有账户路径真正保存了结果后，它才会出现在历史记录中。",
    primary: "开始路径 A Intake",
    trackB: "查看长期人生气候",
    trackBNote: "路径 B 在同一个人生领域内，对照你自己设定的变化；这是条件式沙盘，不是预测。",
    capabilityTitle: "当前可用能力",
    capability: ["围绕一段具体处境的路径 A", "同一人生领域内的一年、三年或五年路径 B", "结构化 Reality Intake 与从 Seed 到 History、Feedback 的正式账户路径"],
    pathTitle: "正式路径",
    path: ["Seed", "People", "Agents", "锁定 Graph", "Run", "History 与 Feedback"],
    boundary: "这个入口不会打开示例工作区、本地试用数据或无 Run 的 Result。",
  },
} as const;

export default function ScenePage() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <AppShell>
      <section id="main-content" className="mx-auto grid max-w-6xl gap-6 py-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SurfaceCard emphasis="strong" className="p-6 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--evidence-gold)]">{t.eyebrow}</p>
          <h1 className="mt-5 max-w-3xl font-[var(--font-display)] text-4xl leading-[1.08] text-[var(--text-primary)] sm:text-6xl">{t.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">{t.intro}</p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/app/new/intake" className="!w-auto px-5 py-3">{t.primary}</ButtonLink>
            <ButtonLink href="/app/new/life-climate" variant="secondary" className="!w-auto px-5 py-3">{t.trackB}</ButtonLink>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">{t.trackBNote}</p>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">{t.boundary}</p>
        </SurfaceCard>
        <aside className="space-y-4">
          <SurfaceCard emphasis="dark" className="p-5">
            <h2 className="text-sm font-semibold text-[var(--signal-cyan)]">{t.capabilityTitle}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/70">
              {t.capability.map((item) => <li key={item} className="border-l border-[var(--evidence-gold)] pl-3">{item}</li>)}
            </ul>
          </SurfaceCard>
          <SurfaceCard className="p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t.pathTitle}</h2>
            <ol className="mt-4 grid gap-2">
              {t.path.map((item, index) => <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"><span className="font-mono text-xs text-[var(--evidence-gold)]">{String(index + 1).padStart(2, "0")}</span>{item}</li>)}
            </ol>
          </SurfaceCard>
        </aside>
      </section>
    </AppShell>
  );
}
