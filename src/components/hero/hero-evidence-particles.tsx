import type * as Three from "three";

export function createHeroEvidenceParticles(THREE: typeof Three, mobile: boolean) {
  const count = mobile ? 28 : 110;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 14;
    const radius = 1.4 + (index % 17) * 0.42;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = 0.28 + Math.sin(index * 1.7) * 0.36;
    positions[index * 3 + 2] = Math.sin(angle) * radius * 0.55;
    phases[index] = index / count;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffd58a,
    size: mobile ? 0.055 : 0.045,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return { points: new THREE.Points(geometry, material), phases };
}
