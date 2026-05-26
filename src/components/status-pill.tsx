type StatusPillProps = {
  children: React.ReactNode;
  tone?:
    | "ready"
    | "blocked"
    | "planned"
    | "active"
    | "locked"
    | "caution"
    | "downgraded"
    | "failed"
    | "neutral";
  className?: string;
};

const tones = {
  ready: "border-[#568262]/25 bg-[#eef5ee] text-[#2f5d3d]",
  blocked: "border-[#d49b4a]/35 bg-[#fff8ed] text-[#7c5524]",
  planned: "border-black/8 bg-[#f7f8f4] text-[#62695d]",
  active: "border-[#568262]/35 bg-white text-[#2f5d3d]",
  locked: "border-[#11150f]/20 bg-[#11150f] text-white",
  caution: "border-[#d49b4a]/35 bg-[#fff8ed] text-[#7c5524]",
  downgraded: "border-[#d49b4a]/35 bg-[#fff8ed] text-[#7c5524]",
  failed: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-black/8 bg-white text-[#62695d]",
};

export function StatusPill({
  children,
  tone = "planned",
  className = "",
}: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
