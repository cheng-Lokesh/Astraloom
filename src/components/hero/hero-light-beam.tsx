import type * as Three from "three";

export function createHeroLightBeam(THREE: typeof Three) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0x8fd8ff,
    transparent: true,
    opacity: 0.11,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.72, 12, 24, 1, true),
    material,
  );
  beam.position.y = 3.1;
  group.add(beam);

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xbcecff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const topGlow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), glowMaterial);
  topGlow.position.y = 8.7;
  const bottomGlow = topGlow.clone();
  bottomGlow.position.y = -2.7;
  group.add(topGlow, bottomGlow);
  group.userData.beam = beam;
  group.userData.material = material;
  return group;
}
