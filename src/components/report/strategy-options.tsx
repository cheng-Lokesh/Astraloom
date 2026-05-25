import type { ReportStrategyOption } from "@/types/report";

export function StrategyOptions({
  options,
  selectedClaimId,
}: {
  options: ReportStrategyOption[];
  selectedClaimId: string;
}) {
  const visibleOptions = selectedClaimId
    ? options.filter((option) => option.claimId === selectedClaimId)
    : options.slice(0, 4);

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            Strategy options
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Each option is tied to a claim_id and evidence chain.
          </p>
        </div>
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs font-semibold text-[#62695d]">
          {visibleOptions.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {visibleOptions.map((option) => (
          <article
            key={option.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  {option.strategyType}
                </p>
                <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
                  {option.title}
                </h3>
              </div>
              <code className="max-w-[150px] truncate text-[11px] text-[#7d8578]">
                {option.claimId}
              </code>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#62695d]">{option.body}</p>
            <p className="mt-2 text-xs leading-5 text-[#7d8578]">
              {option.expectedUse}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
