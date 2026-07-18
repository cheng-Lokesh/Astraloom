"use client";

import { useEffect, useRef, useState } from "react";
import type * as Three from "three";

type TooltipState = {
  label: string;
  kind: string;
  x: number;
  y: number;
} | null;

type RuntimeNode = {
  id: number;
  group: Three.Group;
  base: Three.Vector3;
  phase: number;
  label: string;
  kind: string;
  materials: Three.MeshBasicMaterial[];
};

type RuntimeFlow = {
  curve: Three.CatmullRomCurve3;
  material: Three.LineBasicMaterial;
  signal: Three.Mesh;
  speed: number;
  phase: number;
  from: number;
  to: number;
};

function disposeObject(object: Three.Object3D) {
  object.traverse((child) => {
    const mesh = child as Three.Mesh | Three.Line | Three.Points;
    mesh.geometry?.dispose();
    const material = mesh.material as Three.Material | Three.Material[] | undefined;
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else {
      material?.dispose();
    }
  });
}

function smooth01(value: number) {
  const next = Math.max(0, Math.min(1, value));
  return next * next * (3 - 2 * next);
}

export default function CommandHologramCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    let scene: Three.Scene | null = null;
    let renderer: Three.WebGLRenderer | null = null;
    const rootElement = mount.closest(".cinematic-command-hero") as HTMLElement | null;

    void import("three")
      .then((THREE) => {
        if (disposed) return;
        const mobile = window.matchMedia("(max-width: 760px)").matches;
        const nodeCount = mobile ? 20 : 36;
        const pointer = { x: 0, y: 0 };
        const pointerTarget = { x: 0, y: 0 };
        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const hoverTargets: Three.Object3D[] = [];
        let hoveredId: number | null = null;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x030915, mobile ? 0.055 : 0.034);

        const camera = new THREE.PerspectiveCamera(mobile ? 48 : 42, 1, 0.1, 90);
        camera.position.set(0, mobile ? 4.6 : 4.75, mobile ? 10.2 : 10.45);
        camera.lookAt(0, -0.66, -1.55);

        renderer = new THREE.WebGLRenderer({
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

        const world = new THREE.Group();
        world.position.set(0, mobile ? -0.55 : -0.58, mobile ? -1.85 : -2.2);
        world.rotation.x = mobile ? -0.18 : -0.23;
        world.scale.setScalar(mobile ? 1.2 : 1.58);
        scene.add(world);

        const atmosphere = new THREE.Group();
        const platform = new THREE.Group();
        const graph = new THREE.Group();
        const climate = new THREE.Group();
        const paths = new THREE.Group();
        world.add(atmosphere, platform, graph, climate, paths);

        const fadeMaterials: Three.Material[] = [];
        const nodes: RuntimeNode[] = [];
        const flows: RuntimeFlow[] = [];

        const makeBasic = (color: number, opacity: number) => {
          const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          fadeMaterials.push(material);
          return material;
        };

        const starCount = mobile ? 220 : 520;
        const starPositions = new Float32Array(starCount * 3);
        for (let index = 0; index < starCount; index += 1) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 5 + Math.random() * 12;
          starPositions[index * 3] = Math.cos(angle) * radius;
          starPositions[index * 3 + 1] = -0.3 + Math.random() * 5.6;
          starPositions[index * 3 + 2] = -6 - Math.random() * 18 + Math.sin(angle) * 2;
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({
          color: 0x8bcfff,
          size: mobile ? 0.016 : 0.022,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        fadeMaterials.push(starMaterial);
        atmosphere.add(new THREE.Points(starGeometry, starMaterial));

        [1.25, 2.15, 3.1, 4.25, 5.55, 6.9, 8.25].forEach((radius, index) => {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, index === 2 ? 0.012 : 0.007, 6, 168),
            makeBasic(index === 4 ? 0x8b6dff : 0x64c8ff, index === 2 ? 0.24 : 0.12),
          );
          ring.rotation.x = Math.PI / 2;
          ring.scale.z = 0.58;
          platform.add(ring);
        });

        for (let index = 0; index < 34; index += 1) {
          const angle = (index / 34) * Math.PI * 2;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(Math.cos(angle) * 1.05, 0, Math.sin(angle) * 0.6),
            new THREE.Vector3(Math.cos(angle) * 7.15, 0, Math.sin(angle) * 4.05),
          ]);
          const line = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
              color: index % 7 === 0 ? 0xd8b56a : 0x5fbfff,
              transparent: true,
              opacity: index % 7 === 0 ? 0.085 : 0.045,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          fadeMaterials.push(line.material as Three.Material);
          platform.add(line);
        }

        const floorBloomMaterial = new THREE.MeshBasicMaterial({
          color: 0x2aa9ff,
          transparent: true,
          opacity: 0.045,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        fadeMaterials.push(floorBloomMaterial);
        const floorBloom = new THREE.Mesh(new THREE.CircleGeometry(7.7, 160), floorBloomMaterial);
        floorBloom.rotation.x = Math.PI / 2;
        floorBloom.scale.y = 0.48;
        floorBloom.position.set(0, -0.055, -0.18);
        platform.add(floorBloom);

        for (let index = 0; index < 18; index += 1) {
          const x = -5.2 + index * 0.61;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, 2.65 + Math.sin(index) * 0.18, -4.8),
            new THREE.Vector3(x * 0.54, 0.55, -2.25),
            new THREE.Vector3(x * 0.28, -0.02, 0.42),
          ]);
          const material = new THREE.LineBasicMaterial({
            color: index % 5 === 0 ? 0xe2bd69 : 0x74d5ff,
            transparent: true,
            opacity: index % 5 === 0 ? 0.055 : 0.033,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          fadeMaterials.push(material);
          atmosphere.add(new THREE.Line(geometry, material));
        }

        for (let index = 0; index < 46; index += 1) {
          const angle = (index / 45) * Math.PI * 1.12 + Math.PI * 0.94;
          const radius = 8.4;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius * 0.58;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, 0, z),
            new THREE.Vector3(x * 0.72, 2.2 + Math.sin(index * 0.7) * 0.35, z * 0.72 - 1.4),
          ]);
          const material = new THREE.LineBasicMaterial({
            color: index % 8 === 0 ? 0xe2bd69 : 0x5fbfff,
            transparent: true,
            opacity: index % 8 === 0 ? 0.07 : 0.038,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          fadeMaterials.push(material);
          atmosphere.add(new THREE.Line(geometry, material));
        }

        const beamMaterial = makeBasic(0x9fe3ff, 0.16);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.72, 12.5, 34, 1, true), beamMaterial);
        beam.position.y = 4.6;
        graph.add(beam);

        const coreMaterials = [
          makeBasic(0xbdf0ff, 0.72),
          makeBasic(0x67c8ff, 0.18),
          makeBasic(0xf1c771, 0.42),
        ];
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 18), coreMaterials[0]);
        core.position.set(0, 0.54, 0);
        const coreColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 1.35, 24, 1, true), makeBasic(0x91e2ff, 0.18));
        coreColumn.position.y = 0.02;
        const coreHalo = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.014, 8, 96), coreMaterials[1]);
        coreHalo.rotation.x = Math.PI / 2;
        const coreGround = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.014, 8, 128), coreMaterials[2]);
        coreGround.rotation.x = Math.PI / 2;
        graph.add(coreColumn, core, coreHalo, coreGround);

        [1.28, 1.84, 2.45].forEach((radius, index) => {
          const lens = new THREE.Mesh(
            new THREE.TorusGeometry(radius, index === 1 ? 0.011 : 0.007, 6, 144),
            makeBasic(index === 2 ? 0xa884ff : 0x9fe3ff, index === 1 ? 0.11 : 0.07),
          );
          lens.position.set(0, 0.42 + index * 0.04, -0.06 - index * 0.1);
          lens.rotation.y = index * 0.08;
          lens.scale.y = 0.72;
          graph.add(lens);
        });

        const nodeLabels = ["Reality Signal", "Agent", "Event", "Evidence", "Pressure", "Opportunity", "Risk"];
        const nodeKinds = ["SIGNAL", "AGENT", "LEDGER", "EVIDENCE", "PRESSURE", "PATH", "RISK"];
        const nodeColors = [0x68caff, 0x8fe0ff, 0xd8b56a, 0xf4cd82, 0xaa80ff, 0x76efc4, 0xff7480];
        for (let index = 0; index < nodeCount; index += 1) {
          const angle = (index / nodeCount) * Math.PI * 2 + (index % 4) * 0.05;
          const ring = index % 3;
          const radius = 2.05 + ring * 1.32 + (index % 2) * 0.24;
          const base = new THREE.Vector3(
            Math.cos(angle) * radius,
            0.12 + ring * 0.08,
            Math.sin(angle) * radius * 0.58,
          );
          const colorIndex = index % nodeColors.length;
          const isRisk = colorIndex === 6 || index % 13 === 5;
          const group = new THREE.Group();
          group.position.copy(base);
          const nodeMaterial = makeBasic(isRisk ? 0xff7480 : nodeColors[colorIndex], isRisk ? 0.42 : 0.54);
          const orbitMaterial = makeBasic(isRisk ? 0xff7480 : nodeColors[colorIndex], isRisk ? 0.18 : 0.16);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(isRisk ? 0.08 : 0.062, 16, 10), nodeMaterial);
          dot.userData.nodeId = index;
          const orbit = new THREE.Mesh(new THREE.TorusGeometry(isRisk ? 0.23 : 0.17, 0.006, 6, 44), orbitMaterial);
          orbit.rotation.x = Math.PI / 2;
          orbit.userData.nodeId = index;
          group.add(dot, orbit);
          if (isRisk) {
            const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.006, 6, 54), makeBasic(0xff7480, 0.11));
            pulse.rotation.x = Math.PI / 2;
            pulse.userData.riskPulse = true;
            group.add(pulse);
          }
          graph.add(group);
          hoverTargets.push(dot, orbit);
          nodes.push({
            id: index,
            group,
            base,
            phase: index * 0.73,
            label: nodeLabels[colorIndex],
            kind: isRisk ? "RISK" : nodeKinds[colorIndex],
            materials: [nodeMaterial, orbitMaterial],
          });
        }

        const addFlow = (from: Three.Vector3, to: Three.Vector3, color: number, opacity: number, fromId: number, toId: number, phase: number) => {
          const mid = from.clone().lerp(to, 0.5);
          mid.y += 0.24 + Math.abs(to.x) * 0.018;
          const curve = new THREE.CatmullRomCurve3([from, mid, to]);
          const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          fadeMaterials.push(material);
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), material);
          const signal = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), makeBasic(color, 0.46));
          graph.add(line, signal);
          flows.push({ curve, material, signal, speed: 0.026 + (phase % 4) * 0.005, phase: phase * 0.031, from: fromId, to: toId });
        };

        nodes.forEach((node, index) => {
          if (index % 2 === 0) addFlow(new THREE.Vector3(0, 0.14, 0), node.base, index % 6 === 0 ? 0xe4bd69 : 0x68caff, 0.11, -1, node.id, index);
          if (index % 5 === 0) {
            const next = nodes[(index + 7) % nodes.length];
            addFlow(node.base, next.base, 0x8c78ff, 0.055, node.id, next.id, index + 31);
          }
        });

        [3.25, 3.65, 4.15].forEach((radius, index) => {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, index === 1 ? 0.012 : 0.007, 6, 160),
            makeBasic(index === 1 ? 0xa678ff : 0x6da8ff, index === 1 ? 0.16 : 0.08),
          );
          ring.rotation.x = Math.PI / 2.16;
          ring.rotation.z = index * 0.26;
          ring.scale.z = 0.68;
          climate.add(ring);
        });

        const branchColors = [0x6fcfff, 0xe2bd69, 0x7eeec8, 0xa77cff];
        const branchSignals: RuntimeFlow[] = [];
        for (let index = 0; index < 4; index += 1) {
          const side = index < 2 ? -1 : 1;
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(side * 0.35, -0.02, 0.1),
            new THREE.Vector3(side * (1.5 + index * 0.22), 0.08, -0.9 - index * 0.18),
            new THREE.Vector3(side * (3.4 + index * 0.26), 0.02, -2.7),
            new THREE.Vector3(side * (5.5 + index * 0.18), 0.1, -4.3),
          ]);
          const material = new THREE.LineBasicMaterial({
            color: branchColors[index],
            transparent: true,
            opacity: 0.13,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          fadeMaterials.push(material);
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(96)), material);
          const signal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), makeBasic(branchColors[index], 0.52));
          paths.add(line, signal);
          branchSignals.push({ curve, material, signal, speed: 0.022 + index * 0.004, phase: index * 0.24, from: -1, to: -1 });
        }

        const evidenceCount = mobile ? 36 : 96;
        const evidencePositions = new Float32Array(evidenceCount * 3);
        const evidenceGeometry = new THREE.BufferGeometry();
        evidenceGeometry.setAttribute("position", new THREE.BufferAttribute(evidencePositions, 3));
        const evidenceMaterial = new THREE.PointsMaterial({
          color: 0xe7c174,
          size: mobile ? 0.032 : 0.026,
          transparent: true,
          opacity: 0.36,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        fadeMaterials.push(evidenceMaterial);
        const evidence = new THREE.Points(evidenceGeometry, evidenceMaterial);
        graph.add(evidence);

        const resize = () => {
          if (!renderer) return;
          const width = mount.clientWidth;
          const height = mount.clientHeight;
          renderer.setSize(width, height, false);
          camera.aspect = width / Math.max(height, 1);
          camera.updateProjectionMatrix();
        };

        const updateHover = (event?: PointerEvent) => {
          if (!renderer || mobile) return;
          if (!event) {
            hoveredId = null;
            setTooltip(null);
            return;
          }
          const rect = renderer.domElement.getBoundingClientRect();
          ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          ndc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
          raycaster.setFromCamera(ndc, camera);
          const hit = raycaster.intersectObjects(hoverTargets, false)[0];
          hoveredId = typeof hit?.object.userData.nodeId === "number" ? hit.object.userData.nodeId : null;
          const node = nodes.find((item) => item.id === hoveredId);
          setTooltip(
            node
              ? {
                  label: node.label,
                  kind: node.kind,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                }
              : null,
          );
        };

        const handlePointerMove = (event: PointerEvent) => {
          const rect = mount.getBoundingClientRect();
          pointerTarget.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
          pointerTarget.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
          updateHover(event);
        };
        const handlePointerLeave = () => {
          pointerTarget.x = 0;
          pointerTarget.y = 0;
          updateHover();
        };
        mount.addEventListener("pointermove", handlePointerMove, { passive: true });
        mount.addEventListener("pointerleave", handlePointerLeave, { passive: true });

        let last = performance.now();
        const render = (now: number) => {
          if (disposed || !renderer || !scene) return;
          const elapsed = now * 0.001;
          const delta = Math.min((now - last) * 0.001, 0.05);
          const boot = smooth01(Math.min(elapsed / 4.2, 1));
          const ctaBoost = rootElement?.dataset.ctaActive === "true" ? 1.5 : 1;
          const scroll = Number(rootElement?.style.getPropertyValue("--scroll-progress") || 0);
          last = now;

          pointer.x += (pointerTarget.x - pointer.x) * 0.06;
          pointer.y += (pointerTarget.y - pointer.y) * 0.06;
          world.rotation.y = pointer.x * 0.045 + Math.sin(elapsed * 0.07) * 0.01;
          world.rotation.x = (mobile ? -0.18 : -0.23) + pointer.y * -0.024;
          world.position.y = (mobile ? -0.55 : -0.58) + scroll * 0.48;
          world.scale.setScalar((mobile ? 1.2 : 1.58) * (1 - scroll * 0.16));

          atmosphere.rotation.y += delta * 0.006;
          platform.rotation.y += delta * 0.012;
          graph.rotation.y += delta * 0.006;
          climate.rotation.y -= delta * 0.012;
          paths.rotation.y += delta * 0.004;

          const blackout = Math.max(0, 1 - elapsed / 1.2);
          fadeMaterials.forEach((material) => {
            material.opacity = Number(material.userData.baseOpacity ?? material.opacity);
            if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity;
            material.opacity = material.userData.baseOpacity * boot;
          });
          beamMaterial.opacity = (0.1 + Math.sin(elapsed * 1.08) * 0.024) * boot * ctaBoost;
          beam.scale.x = beam.scale.z = 0.82 + Math.sin(elapsed * 0.9) * 0.07 + (ctaBoost - 1) * 0.1;
          core.scale.setScalar((0.88 + Math.sin(elapsed * 1.4) * 0.04 + (ctaBoost - 1) * 0.12) * boot);
          coreHalo.rotation.z += delta * 0.18;
          coreGround.rotation.z -= delta * 0.08;

          nodes.forEach((node) => {
            const related = hoveredId === null || hoveredId === node.id || flows.some((flow) => (flow.from === hoveredId && flow.to === node.id) || (flow.to === hoveredId && flow.from === node.id));
            node.group.position.y = node.base.y + Math.sin(elapsed * 0.54 + node.phase) * 0.045;
            node.group.scale.setScalar((hoveredId === node.id ? 1.18 : related ? 0.88 : 0.62) * boot);
            node.group.rotation.y += delta * 0.12;
            node.materials.forEach((material) => {
              const baseOpacity = Number(material.userData.baseOpacity ?? material.opacity);
              material.opacity = baseOpacity * boot * (related ? 1 : 0.32);
            });
            node.group.children.forEach((child) => {
              if (child.userData.riskPulse) child.scale.setScalar(1 + Math.sin(elapsed * 2.3 + node.phase) * 0.12);
            });
          });

          flows.forEach((flow) => {
            const related = hoveredId === null || flow.from === hoveredId || flow.to === hoveredId;
            const baseOpacity = Number(flow.material.userData.baseOpacity ?? flow.material.opacity);
            flow.material.opacity = baseOpacity * boot * (related ? 1 : 0.24);
            flow.signal.position.copy(flow.curve.getPointAt((elapsed * flow.speed * ctaBoost + flow.phase) % 1));
            const signalMaterial = flow.signal.material as Three.MeshBasicMaterial;
            const signalBase = Number(signalMaterial.userData.baseOpacity ?? signalMaterial.opacity);
            signalMaterial.opacity = signalBase * boot * (related ? 1 : 0.28);
          });

          branchSignals.forEach((branch) => {
            branch.signal.position.copy(branch.curve.getPointAt((elapsed * branch.speed * ctaBoost + branch.phase) % 1));
          });

          const evidenceAttribute = evidenceGeometry.getAttribute("position") as Three.BufferAttribute;
          for (let index = 0; index < evidenceAttribute.count; index += 1) {
            const angle = index * 0.62 + elapsed * (0.12 + (index % 5) * 0.01) * ctaBoost;
            const radius = 1.1 + (index % 18) * 0.25;
            evidenceAttribute.setXYZ(
              index,
              Math.cos(angle) * radius,
              0.12 + Math.sin(angle * 2.1) * 0.13,
              Math.sin(angle) * radius * 0.5,
            );
          }
          evidenceAttribute.needsUpdate = true;

          rootElement?.style.setProperty("--webgl-boot-progress", boot.toFixed(3));
          rootElement?.style.setProperty("--blackout", blackout.toFixed(3));
          renderer.render(scene, camera);
          frame = requestAnimationFrame(render);
        };

        observer = new ResizeObserver(resize);
        observer.observe(mount);
        resize();
        rootElement?.classList.add("command-webgl-ready");
        frame = requestAnimationFrame(render);
      })
      .catch((error: unknown) => {
        rootElement?.classList.add("command-webgl-unavailable");
        console.error("Astraloom command WebGL failed to initialize", error);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      if (scene) disposeObject(scene);
      renderer?.dispose();
      mount.replaceChildren();
    };
  }, []);

  return (
    <div ref={mountRef} className="command-hologram-canvas" aria-hidden="true">
      {tooltip ? (
        <div className="command-agent-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <span>{tooltip.kind}</span>
          <strong>{tooltip.label}</strong>
          <small>relation field focused</small>
        </div>
      ) : null}
    </div>
  );
}
