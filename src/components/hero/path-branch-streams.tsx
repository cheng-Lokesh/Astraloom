const branches = [
  { id: "inertia", label: "current inertia", color: "blue", d: "M600 392 C520 445 430 492 332 540" },
  { id: "observe", label: "cautious observation", color: "gold", d: "M600 392 C555 468 525 526 506 608" },
  { id: "push", label: "active push", color: "green", d: "M600 392 C660 458 748 492 872 528" },
  { id: "boundary", label: "boundary adjustment", color: "violet", d: "M600 392 C642 476 666 544 690 624" },
] as const;

export function PathBranchStreams() {
  return (
    <g className="path-branch-streams" aria-label="Future path streams">
      {branches.map((branch, index) => (
        <g key={branch.id} className={`path-branch path-branch-${branch.color}`} data-path-label={branch.label}>
          <path d={branch.d} className="path-branch-bed" />
          <path
            d={branch.d}
            className="path-branch-energy"
            pathLength="100"
            style={{ "--branch-delay": `${index * -0.7}s` } as React.CSSProperties}
          />
          <circle r="4" className="path-branch-beacon">
            <animateMotion dur={`${6.8 + index * 0.55}s`} repeatCount="indefinite" path={branch.d} />
          </circle>
        </g>
      ))}
    </g>
  );
}
