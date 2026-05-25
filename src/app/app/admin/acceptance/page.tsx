import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { runGoldenCaseAcceptance } from "@/lib/golden-cases/full-product-cases";

export const dynamic = "force-dynamic";

export default function AcceptancePage() {
  const result = runGoldenCaseAcceptance();
  const failedSteps = result.cases.flatMap((item) =>
    item.failures.map((failure) => ({
      caseTitle: item.title,
      ...failure,
    })),
  );

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_16px_48px_rgba(17,21,15,0.05)]">
          <StatusPill tone={result.passed ? "ready" : "blocked"}>
            {result.passed ? "Golden Cases Passed" : "Golden Cases Failed"}
          </StatusPill>
          <h1 className="mt-4 text-3xl font-semibold text-[#11150f]">
            End-to-End Golden Case Acceptance
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#62695d]">
            Local deterministic validation for the MiroFish evidence chain. This
            page does not call LLM providers, payment providers, or privileged
            backend writers.
          </p>
          <p className="mt-3 text-xs text-[#62695d]">
            Generated at {result.generatedAt}
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {result.cases.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(17,21,15,0.05)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#11150f]">
                  {item.title}
                </h2>
                <StatusPill tone={item.passed ? "ready" : "blocked"}>
                  {item.passed ? "Pass" : "Fail"}
                </StatusPill>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#62695d]">
                <div>
                  <dt>Key People</dt>
                  <dd className="text-base font-semibold text-[#11150f]">
                    {item.summary.keyPeopleCount}
                  </dd>
                </div>
                <div>
                  <dt>Agents</dt>
                  <dd className="text-base font-semibold text-[#11150f]">
                    {item.summary.agentProfileCount}
                  </dd>
                </div>
                <div>
                  <dt>Edges</dt>
                  <dd className="text-base font-semibold text-[#11150f]">
                    {item.summary.relationEdgeCount}
                  </dd>
                </div>
                <div>
                  <dt>Events</dt>
                  <dd className="text-base font-semibold text-[#11150f]">
                    {item.summary.eventLogCount}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 space-y-2">
                {item.steps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-md border border-black/8 bg-[#f8f7f2] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-[#11150f]">
                        {step.label}
                      </p>
                      <span
                        className={`text-xs font-semibold ${
                          step.passed ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {step.passed ? "Pass" : "Fail"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#62695d]">
                      {step.detail}
                    </p>
                    {!step.passed && step.fixSuggestion ? (
                      <p className="mt-2 text-xs leading-5 text-red-700">
                        {step.fixSuggestion}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {failedSteps.length > 0 ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h2 className="text-lg font-semibold text-red-900">
              Failure Items And Fix Suggestions
            </h2>
            <ul className="mt-3 space-y-3">
              {failedSteps.map((failure) => (
                <li
                  key={`${failure.caseTitle}:${failure.stepId}`}
                  className="text-sm leading-6 text-red-800"
                >
                  <strong>{failure.caseTitle}</strong> / {failure.stepId}:{" "}
                  {failure.detail} Suggested fix: {failure.fixSuggestion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Link
          href="/app/admin"
          className="inline-flex rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
        >
          Back to admin
        </Link>
      </section>
    </AppShell>
  );
}
