import type * as Three from "three";

export type CommandNode = {
  group: Three.Group;
  position: Three.Vector3;
  phase: number;
};

const NODE_COLORS = [0x70cfff, 0xf0c36d, 0xad7cff, 0x70cfff, 0x70cfff, 0xf0c36d, 0xad7cff, 0xff6f78];

export function createHeroAgentNodes(THREE: typeof Three, mobile: boolean) {
  const root = new THREE.Group();
  const nodes: CommandNode[] = [];
  const count = mobile ? 14 : 26;

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 + (index % 3) * 0.08;
    const ring = index % 3;
    const radius = 3.4 + ring * 2.1 + (index % 2) * 0.45;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      0.25 + ring * 0.22 + Math.sin(angle * 2) * 0.3,
      Math.sin(angle) * radius * 0.58,
    );
    const color = NODE_COLORS[index % NODE_COLORS.length];
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: index % 8 === 7 ? 0.68 : 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(index % 5 === 0 ? 0.13 : 0.085, 14, 10), material);
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(index % 5 === 0 ? 0.29 : 0.2, 0.012, 6, 36),
      material,
    );
    orbit.rotation.x = Math.PI / 2;
    group.add(core, orbit);
    group.position.copy(position);
    root.add(group);
    nodes.push({ group, position, phase: index * 0.67 });
  }

  return { root, nodes };
}
