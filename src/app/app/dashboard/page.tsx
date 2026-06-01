"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { LocalSandboxSnapshot } from "@/components/local-sandbox-snapshot";
import { RuntimeCapabilityBanner } from "@/components/runtime-capability-banner";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";

const dashboardCopy = {
  en: {
    title:
      "Astraloom builds a scenario sandbox from your birth context and current situation.",
    intro:
      "Start with your birth information and one real question. When AI intake or external reality sources are unavailable, the product stays in local assumption demo mode.",
    start: "Start my destiny sandbox",
    sample: "View complete sample",
    progressTitle: "Local progress",
    stepsTitle: "How it works",
    steps: [
      "Enter birth information",
      "Describe your current question",
      "View the dynamic sandbox and key findings",
    ],
    advancedLink: "Advanced structure view",
  },
  zh: {
    title:
      "Astraloom 会结合你的出生信息、命理气候和当前困局，展示几种路径可能如何展开。",
    intro:
      "从出生信息和一个真实问题开始。Astraloom 会把它们整理成动态沙盘，帮助你在行动前看见几种可能路径。",
    start: "开始我的命运沙盘",
    sample: "查看完整示例",
    progressTitle: "本地进度",
    stepsTitle: "如何开始",
    steps: [
      "填写出生信息",
      "描述当前问题",
      "查看动态沙盘和关键发现",
    ],
    advancedLink: "高级结构查看",
  },
} as const;

export default function DashboardPage() {
  const { locale } = useLanguage();
  const t = dashboardCopy[locale];
  const [repos] = useState(() => getRepositories());
  const [realityIntake] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.realityIntakes.load(seed.id);
    return result.ok ? result.data : null;
  });

  return (
    <AppShell>
      <div className="space-y-7">
        <RuntimeCapabilityBanner realityIntake={realityIntake} />

        <section className="mf-page-grid items-start">
          <SurfaceCard emphasis="strong" className="p-7 sm:p-9">
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#11150f] sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#62695d]">
              {t.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/app/start" className="px-5 py-3">
                {t.start}
              </ButtonLink>
              <TrialSampleButton
                target="/app/simulation/result"
                className="mf-button mf-button-secondary px-5 py-3"
              >
                {t.sample}
              </TrialSampleButton>
            </div>
          </SurfaceCard>

          <aside aria-labelledby="local-progress-title" className="space-y-3">
            <h2
              id="local-progress-title"
              className="px-1 text-sm font-semibold text-[#11150f]"
            >
              {t.progressTitle}
            </h2>
            <LocalSandboxSnapshot variant="product" />
          </aside>
        </section>

        <section className="mf-card p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[#11150f]">{t.stepsTitle}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {t.steps.map((step, index) => (
              <article
                key={step}
                className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
              >
                <span className="text-xs font-semibold text-[#568262]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-sm font-semibold leading-6 text-[#11150f]">
                  {step}
                </h3>
              </article>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Link
            href="/app/new/scene"
            className="text-xs font-semibold text-[#7d8578] underline-offset-4 hover:text-[#11150f] hover:underline"
          >
            {t.advancedLink}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
