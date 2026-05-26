"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { clearLocalSupportDrafts } from "@/lib/support/support-drafts";
import { getRepositories } from "@/lib/repositories/repository-provider";

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

export default function SettingsPage() {
  const [repos] = useState(() => getRepositories());
  const [language, setLanguage] = useState("English");
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
      setMessage("Type CLEAR LOCAL DATA to clear browser-local drafts.");
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
    setMessage(
      "Browser-local MiroFish drafts were cleared. No production deletion was executed.",
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="planned">Settings</StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Local preferences, privacy, and product boundaries.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Settings explains what MiroFish stores locally and what the product
            will not do. Clearing data here only affects this browser.
          </p>
        </div>
        <ButtonLink href="/app/archive" variant="secondary" className="px-4 py-2">
          Open archive
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
              Language and region
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              This local setting changes page preference only. It does not call
              a translation service.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["English", "中文"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                    language === option
                      ? "border-[#11150f] bg-[#11150f] text-white"
                      : "border-black/10 bg-white text-[#52594d]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              Current local data
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              MiroFish Local MVP stores drafts in this browser. Production
              database sync is not started from Settings.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Object.entries(localStatus).map(([key, ready]) => (
                <SettingState key={key} label={key} ready={ready} />
              ))}
              <SettingState label="storage" ready={seedContext !== null} value={storageSize} />
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              Privacy and local data
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[#62695d]">
              <p>Local drafts are stored in browser localStorage.</p>
              <p>Support drafts are local unless submitted as a local ticket.</p>
              <p>Deletion requests are recorded as requests, not executed as production deletion.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowClearModal(true)}
              className="mt-5 px-4 py-3"
            >
              Clear browser-local drafts
            </Button>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              Product boundaries
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <BoundaryCard title="Not professional advice" body="MiroFish does not provide medical, legal, investment, or psychotherapy advice." />
              <BoundaryCard title="Not a prediction engine" body="The sandbox uses evidence-linked scenario dynamics, not certain future claims." />
              <BoundaryCard title="Read-only graph" body="Users can inspect relation edges but cannot edit trust, hostility, dependency, or other weights." />
              <BoundaryCard title="Safety gate first" body="Safety downgraded or paused states cannot be bypassed by full-depth views." />
            </div>
          </SurfaceCard>
        </main>

        <aside className="h-fit space-y-5">
          <SurfaceCard emphasis="dark" className="p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              Safety levels
            </h2>
            <div className="mt-4 space-y-3">
              <SafetyRow label="Safe" body="The full local flow can continue." />
              <SafetyRow label="Caution" body="The flow continues with careful confidence language." />
              <SafetyRow label="Downgraded" body="Strong claims and depth expansion stay unavailable." />
              <SafetyRow label="Blocked" body="The flow pauses until setup is revised or reviewed." />
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              Account placeholders
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              Account export, production deletion, billing receipts, and team
              settings are not active in this local MVP screen.
            </p>
            <ButtonLink href="/app/support" variant="secondary" className="mt-4 px-4 py-3">
              Open support
            </ButtonLink>
          </SurfaceCard>
        </aside>
      </section>

      {showClearModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <section className="w-full max-w-lg rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.22)]">
            <StatusPill tone="caution">Browser-local only</StatusPill>
            <h2 className="mt-4 text-xl font-semibold text-[#11150f]">
              Clear local MiroFish drafts?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#62695d]">
              This clears local scenario, people, agents, graph, simulation,
              report, feedback, support drafts, and placeholder unlock state in
              this browser. It does not execute production deletion.
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                Type CLEAR LOCAL DATA
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
                Clear local drafts
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowClearModal(false)}
              >
                Keep data
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
}: {
  label: string;
  ready: boolean;
  value?: string;
}) {
  return (
    <div className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold capitalize text-[#11150f]">
          {label}
        </span>
        <StatusPill tone={ready ? "ready" : "planned"}>
          {value ?? (ready ? "stored" : "empty")}
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

function SafetyRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-sm font-semibold text-white">{label}</div>
      <p className="mt-1 text-xs leading-5 text-white/58">{body}</p>
    </div>
  );
}
