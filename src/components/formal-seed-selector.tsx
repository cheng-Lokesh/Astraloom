"use client";

type FormalSeedChoice = {
  id: string;
  version: string | number;
  submittedAt: string;
};

export function FormalSeedSelector({ seeds, selectedSeedId, onSelect }: {
  seeds: FormalSeedChoice[];
  selectedSeedId: string;
  onSelect: (seedId: string) => void;
}) {
  if (seeds.length < 2) return null;
  return <div className="mt-4 max-w-xl">
    <label htmlFor="formal-seed-selector" className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]">Submitted scenario</label>
    <select id="formal-seed-selector" value={selectedSeedId} onChange={(event) => onSelect(event.target.value)} className="mf-input mt-2 min-h-11 w-full" aria-describedby="formal-seed-help">
      {seeds.map((seed) => <option key={seed.id} value={seed.id}>Saved scenario · {new Date(seed.submittedAt).toLocaleString()} · version {seed.version}</option>)}
    </select>
    <p id="formal-seed-help" className="mt-2 text-sm leading-6 text-[#62695d]">Choose the submitted scenario whose saved People, Agents, and Graph you want to continue. The account server validates every selection.</p>
  </div>;
}
