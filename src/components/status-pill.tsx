type StatusPillProps = {
  children: React.ReactNode;
  tone?: "ready" | "blocked" | "planned";
};

const tones = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blocked: "border-amber-200 bg-amber-50 text-amber-700",
  planned: "border-slate-200 bg-slate-50 text-slate-600",
};

export function StatusPill({ children, tone = "planned" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
