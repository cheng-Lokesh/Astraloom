export function DestinyClimateRing() {
  return (
    <g className="destiny-climate" aria-hidden="true">
      <ellipse cx="600" cy="382" rx="226" ry="124" className="destiny-climate-band destiny-climate-band-a" />
      <ellipse cx="600" cy="382" rx="250" ry="136" className="destiny-climate-band destiny-climate-band-b" />
      <ellipse cx="600" cy="382" rx="275" ry="148" className="destiny-climate-band destiny-climate-band-c" />
      <path d="M350 382 A250 136 0 0 1 850 382" className="destiny-climate-front" pathLength="100" />
    </g>
  );
}
