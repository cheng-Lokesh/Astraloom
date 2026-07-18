const metrics = [
  ["Source-backed", "94"],
  ["Reality Signals", "87"],
  ["Agent Graph", "36"],
  ["Event Ledger", "LIVE"],
  ["Path Branches", "04"],
];

export function HeroHudPanels() {
  return (
    <div className="command-hud" aria-hidden="true">
      <aside className="command-hud-left">
        {["Reality Signals", "Agent Graph", "Event Ledger", "Path Branches"].map((label, index) => (
          <div key={label} className="command-hud-module" style={{ "--hud-index": index } as React.CSSProperties}>
            <span className="command-hud-icon"><i /></span>
            <span>{label}</span>
          </div>
        ))}
      </aside>
      <aside className="command-hud-right">
        {metrics.map(([label, value], index) => (
          <div key={label} className="command-hud-metric" style={{ "--hud-index": index } as React.CSSProperties}>
            <span>{label}</span>
            <strong>{value}</strong>
            <i><b style={{ width: `${38 + index * 11}%` }} /></i>
          </div>
        ))}
      </aside>
      <div className="command-status-strip">
        <span><i /> SOURCE-BACKED</span>
        <span>AGENTS 036</span>
        <span>EVENT LEDGER LIVE</span>
        <span>PATH BRANCHES 04</span>
        <span>SYSTEM NOMINAL</span>
      </div>
      <div className="command-core-readout">
        <span>USER CORE</span>
        <strong>ACTIVE</strong>
        <i />
      </div>
    </div>
  );
}
