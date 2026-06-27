"use client";

import { useEffect, useRef } from "react";
import type * as Three from "three";

import { createHeroAgentNodes } from "./hero-agent-nodes";
import { createHeroDestinyClimateRing } from "./hero-destiny-climate-ring";
import { createHeroEvidenceParticles } from "./hero-evidence-particles";
import { createHeroLightBeam } from "./hero-light-beam";
import { createHeroRelationFlows } from "./hero-relation-flows";

export default function CommandHologramCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | null = null;

    void import("three").then((THREE) => {
      if (disposed) return;
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 8.3, 17.5);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !mobile,
        powerPreference: "high-performance",
        stencil: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1 : 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = "command-webgl-canvas";
      mount.appendChild(renderer.domElement);

      const field = new THREE.Group();
      field.position.set(0, -0.5, -4.8);
      field.scale.set(1.08, 0.72, 1.08);
      scene.add(field);

      const beam = createHeroLightBeam(THREE);
      const { root: nodeRoot, nodes } = createHeroAgentNodes(THREE, mobile);
      const { root: flowRoot, flows } = createHeroRelationFlows(THREE, nodes);
      const { points } = createHeroEvidenceParticles(THREE, mobile);
      const climate = createHeroDestinyClimateRing(THREE);
      field.add(beam, nodeRoot, flowRoot, points, climate);

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      };

      let last = performance.now();
      const render = (now: number) => {
        if (disposed) return;
        const elapsed = now * 0.001;
        const delta = Math.min((now - last) * 0.001, 0.05);
        last = now;
        const beamMesh = beam.userData.beam as Three.Mesh;
        const beamMaterial = beam.userData.material as Three.MeshBasicMaterial;
        beamMaterial.opacity = 0.095 + Math.sin(elapsed * 1.05) * 0.025;
        beamMesh.scale.x = beamMesh.scale.z = 0.92 + Math.sin(elapsed * 0.88) * 0.08;

        nodes.forEach((node, index) => {
          node.group.position.y = node.position.y + Math.sin(elapsed * 0.48 + node.phase) * 0.09;
          const pulse = 0.9 + Math.sin(elapsed * 0.82 + node.phase) * 0.11;
          node.group.scale.setScalar(pulse);
          node.group.rotation.y += delta * (index % 2 === 0 ? 0.12 : -0.09);
        });
        flows.forEach((flow) => {
          const progress = (elapsed * flow.speed + flow.phase) % 1;
          flow.signal.position.copy(flow.curve.getPointAt(progress));
        });
        points.rotation.y += delta * 0.028;
        climate.rotation.y += delta * 0.022;
        climate.rotation.z = Math.sin(elapsed * 0.09) * 0.08;
        field.rotation.y = Math.sin(elapsed * 0.08) * 0.018;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };

      observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();
      mount.closest(".cinematic-command-hero")?.classList.add("command-webgl-ready");
      frame = requestAnimationFrame(render);

      return;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      mount.replaceChildren();
    };
  }, []);

  return <div ref={mountRef} className="command-hologram-canvas" aria-hidden="true" />;
}
