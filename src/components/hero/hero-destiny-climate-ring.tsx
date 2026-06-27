import type * as Three from "three";

export function createHeroDestinyClimateRing(THREE: typeof Three) {
  const group = new THREE.Group();
  [3.05, 3.55, 4.15].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, index === 1 ? 0.018 : 0.01, 6, 128),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0xa77dff : 0x6d93ff,
        transparent: true,
        opacity: index === 1 ? 0.23 : 0.11,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = index * 0.24;
    group.add(ring);
  });
  return group;
}
