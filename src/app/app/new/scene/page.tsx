"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";

const tracks = [
  {
    id: "track-a",
    title: "Track A / 具体路口",
    horizon: "30 / 90 天",
    body: "适合一次具体选择，重点看短中期关系动态。",
  },
  {
    id: "track-b",
    title: "Track B / 长期气候",
    horizon: "1 / 3 / 5 年",
    body: "适合一个主题域的粗粒度变化，不做确定性长期断言。",
  },
];

const scenarios = ["职业选择", "合作关系", "亲密/家庭边界", "自我方向"];

export default function ScenePage() {
  const [track, setTrack] = useState(tracks[0].id);
  const [scenario, setScenario] = useState(scenarios[0]);

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="planned">New simulation</StatusPill>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            从一个沙盘框架开始，而不是做全人生预测。
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            选择一个轨道和一个主题域，后续才会抽取人物、生成 Agent、冻结只读关系图谱并写入 Event Log。
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {tracks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTrack(item.id)}
                className={`rounded-lg border p-5 text-left transition ${
                  track === item.id
                    ? "border-[#568262]/50 bg-[#eef5ee]"
                    : "border-black/8 bg-[#f7f8f4] hover:border-[#568262]/30"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#568262]">
                  {item.horizon}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-[#11150f]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {item.body}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-7">
            <h2 className="text-sm font-semibold text-[#11150f]">
              单一主题域
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {scenarios.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setScenario(item)}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                    scenario === item
                      ? "border-[#11150f] bg-[#11150f] text-white"
                      : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app/new/intake"
              className="inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              继续输入局面
            </Link>
            <TrialSampleButton className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]">
              载入完整样例
            </TrialSampleButton>
          </div>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            产品边界
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-white/68">
            <p>当前试用版不调用 LLM、不收费、不写后端。</p>
            <p>不是泛聊天、神秘化判断或专业建议工具。</p>
            <p>一次运行必须锚定 Agent、关系图、事件日志和证据链。</p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
