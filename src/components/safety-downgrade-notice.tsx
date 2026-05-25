import type { SafetyDecision } from "@/lib/safety/safety-types";

type SafetyDowngradeNoticeProps = {
  decision: SafetyDecision;
  title?: string;
};

export function SafetyDowngradeNotice({
  decision,
  title = "Safety mode is active",
}: SafetyDowngradeNoticeProps) {
  if (decision.safetyLevel === "safe") {
    return null;
  }

  const tone =
    decision.safetyLevel === "blocked"
      ? "border-red-200 bg-red-50 text-red-950"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <section className={`rounded-lg border p-5 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
            {decision.safetyLevel}
          </p>
          <h2 className="mt-2 text-base font-semibold">{title}</h2>
        </div>
        {decision.flags.length ? (
          <div className="flex max-w-full flex-wrap gap-2">
            {decision.flags.map((flag) => (
              <span
                key={flag}
                className="rounded border border-current/20 bg-white/55 px-2 py-1 text-xs font-semibold"
              >
                {flag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6">{decision.userMessage}</p>
      {decision.reportRestrictions.length ? (
        <div className="mt-4 space-y-2">
          {decision.reportRestrictions.map((restriction) => (
            <p key={restriction} className="text-xs leading-5 opacity-75">
              {restriction}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
