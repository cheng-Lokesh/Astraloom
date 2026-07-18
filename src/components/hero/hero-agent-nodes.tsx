import type * as Three from "three";

export type CommandNode = {
  id: number;
  group: Three.Group;
  position: Three.Vector3;
  phase: number;
  label: string;
  kind: "signal" | "agent" | "ledger" | "branch" | "risk" | "climate";
};

const NODE_COLORS = [0x70cfff, 0xf0c36d, 0xad7cff, 0x83f2c4, 0x70cfff, 0xf0c36d, 0xad7cff, 0xff6f78];
const NODE_LABELS = [
  "Reality Signal",
  "Advisor",
  "Family Pressure",
  "Opportunity",
  "Event Record",
  "Evidence",
  "Timing Lens",
  "Risk Pulse",
];
const NODE_KINDS: CommandNode["kind"][] = ["signal", "agent", "agent", "branch", "ledger", "signal", "climate", "risk"];

export function createHeroAgentNodes(THREE: typeof Three, mobile: boolean) {
  const root = new THREE.Group();
  const nodes: CommandNode[] = [];
  const count = mobile ? 12 : 28;

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 + (index % 3) * 0.08;
    const ring = index % 4;
    const radius = 2.05 + ring * 1.18 + (index % 2) * 0.28;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      0.08 + ring * 0.12 + Math.sin(angle * 2) * 0.12,
      Math.sin(angle) * radius * 0.52,
    );
    const color = NODE_COLORS[index % NODE_COLORS.length];
    const isRisk = index % 11 === 7 || index % 17 === 3;
    const material = new THREE.MeshBasicMaterial({
      color: isRisk ? 0xff6f78 : color,
      transparent: true,
      opacity: isRisk ? 0.48 : 0.56,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(index % 5 === 0 ? 0.1 : 0.064, 14, 10), material);
    core.userData.nodeId = index;
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(index % 5 === 0 ? 0.23 : 0.155, isRisk ? 0.012 : 0.008, 6, 36),
      material,
    );
    orbit.userData.nodeId = index;
    orbit.rotation.x = Math.PI / 2;
    group.add(core, orbit);
    if (isRisk) {
      const pulse = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.01, 6, 42),
        new THREE.MeshBasicMaterial({
          color: 0xff7380,
          transparent: true,
          opacity: 0.16,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      pulse.rotation.x = Math.PI / 2;
      pulse.userData.riskPulse = true;
      group.add(pulse);
    }
    group.position.copy(position);
    root.add(group);
    nodes.push({
      id: index,
      group,
      position,
      phase: index * 0.67,
      label: NODE_LABELS[index % NODE_LABELS.length],
      kind: isRisk ? "risk" : NODE_KINDS[index % NODE_KINDS.length],
    });
  }

  return { root, nodes };
}
