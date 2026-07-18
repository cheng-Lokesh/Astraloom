import type * as Three from "three";
import type { CommandNode } from "./hero-agent-nodes";

export type RelationFlow = {
  curve: Three.CatmullRomCurve3;
  line: Three.Line;
  material: Three.LineBasicMaterial;
  signal: Three.Mesh;
  phase: number;
  speed: number;
  from: number;
  to: number;
};

export function createHeroRelationFlows(
  THREE: typeof Three,
  nodes: CommandNode[],
) {
  const root = new THREE.Group();
  const flows: RelationFlow[] = [];
  const center = new THREE.Vector3(0, 0.15, 0);

  nodes.forEach((node, index) => {
    if (index % 2 !== 0 && index % 7 !== 0) return;
    const color = index % 6 === 0 ? 0xf0c36d : index % 5 === 0 ? 0xa884ff : 0x5bbdff;
    const midpoint = node.position.clone().multiplyScalar(0.56);
    midpoint.y += 0.18 + (index % 3) * 0.1;
    const anchor = index % 7 === 0 ? nodes[(index + 9) % nodes.length].position : center;
    const curve = new THREE.CatmullRomCurve3([anchor, midpoint, node.position]);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: index % 7 === 0 ? 0.075 : 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(56)), material);
    const signal = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.54,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(line, signal);
    flows.push({
      curve,
      line,
      material,
      signal,
      phase: index / Math.max(nodes.length, 1),
      speed: 0.038 + (index % 4) * 0.007,
      from: index % 7 === 0 ? nodes[(index + 9) % nodes.length].id : -1,
      to: node.id,
    });
  });

  return { root, flows };
}
