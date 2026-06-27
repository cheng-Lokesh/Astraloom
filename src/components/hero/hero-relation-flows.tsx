import type * as Three from "three";
import type { CommandNode } from "./hero-agent-nodes";

export type RelationFlow = {
  curve: Three.CatmullRomCurve3;
  signal: Three.Mesh;
  phase: number;
  speed: number;
};

export function createHeroRelationFlows(
  THREE: typeof Three,
  nodes: CommandNode[],
) {
  const root = new THREE.Group();
  const flows: RelationFlow[] = [];
  const center = new THREE.Vector3(0, 0.15, 0);

  nodes.forEach((node, index) => {
    if (index % 2 !== 0) return;
    const color = index % 6 === 0 ? 0xf0c36d : index % 5 === 0 ? 0xa884ff : 0x5bbdff;
    const midpoint = node.position.clone().multiplyScalar(0.56);
    midpoint.y += 0.35 + (index % 3) * 0.18;
    const curve = new THREE.CatmullRomCurve3([center, midpoint, node.position]);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const signal = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(line, signal);
    flows.push({ curve, signal, phase: index / Math.max(nodes.length, 1), speed: 0.035 + (index % 4) * 0.005 });
  });

  return { root, flows };
}
