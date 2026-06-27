const readings = [
  ["Grounding", "94.7"],
  ["Evidence", "87.3"],
  ["Consensus", "71.8"],
  ["Risk", "18.6"],
] as const;

export function HeroCommandPanel() {
  return (
    <aside className="hero-command-panel" aria-label="Observatory system status">
      <header>
        <span><i /> SYSTEM NOMINAL</span>
        <small>RT-026</small>
      </header>
      {readings.map(([label, value], index) => (
        <div key={label} className="command-reading">
          <span>{label}</span>
          <strong>{value}</strong>
          <i><b style={{ "--reading": `${43 + index * 13}%` } as React.CSSProperties} /></i>
        </div>
      ))}
      <footer>
        <span>AGENTS 032</span>
        <span>PATHS 004</span>
      </footer>
    </aside>
  );
}
