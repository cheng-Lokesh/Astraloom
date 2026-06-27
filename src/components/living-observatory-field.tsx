"use client";

import { useEffect, useRef } from "react";
import type * as Three from "three";

import type { MotionState } from "@/lib/motion/motion-state";
import { motionStateIntensity, seededUnit } from "@/lib/motion/motion-state";
import { motionTokens } from "@/lib/motion/motion-tokens";

type PathSystem = {
  curve: Three.CatmullRomCurve3;
  group: Three.Group;
  state: MotionState;
  particles: Three.Mesh[];
  signal: Three.Mesh;
  beacon: Three.Mesh;
  material: Three.MeshPhysicalMaterial;
  speed: number;
};

type NodeSystem = {
  group: Three.Group;
  core: Three.Mesh;
  ring: Three.Mesh;
  state: MotionState;
  phase: number;
};

type GroundRouteSystem = {
  curve: Three.CatmullRomCurve3;
  lane: Three.Mesh;
  edge: Three.Line;
  signals: Three.Mesh[];
  phase: number;
  speed: number;
};

type MotionEnvironment = {
  isMobile: boolean;
  isPageVisible: boolean;
  prefersReducedMotion: boolean;
};

export function LivingObservatoryField({
  environment,
}: {
  environment: MotionEnvironment;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const environmentRef = useRef(environment);

  useEffect(() => {
    environmentRef.current = environment;
  }, [environment]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;
    const cleanup: Array<() => void> = [];

    void import("three").then((THREE) => {
      if (disposed) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020707, 0.018);

      const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 160);
      camera.position.set(0, 7.4, 25);
      camera.lookAt(2.5, 2.2, -10);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      renderer.setClearColor(0x020707, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.48;
      renderer.domElement.className = "observatory-webgl-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const backgroundScene = new THREE.Scene();
      const backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const backgroundUniforms = {
        uTexture: { value: null as Three.Texture | null },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTextureResolution: { value: new THREE.Vector2(1586, 992) },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uMotion: { value: 0 },
        uLoaded: { value: 0 },
      };
      const backgroundMaterial = new THREE.ShaderMaterial({
        uniforms: backgroundUniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          varying vec2 vUv;
          uniform sampler2D uTexture;
          uniform vec2 uResolution;
          uniform vec2 uTextureResolution;
          uniform vec2 uPointer;
          uniform float uTime;
          uniform float uMotion;
          uniform float uLoaded;

          vec2 coverUv(vec2 uv) {
            float screenAspect = uResolution.x / max(uResolution.y, 1.0);
            float textureAspect = uTextureResolution.x / max(uTextureResolution.y, 1.0);
            vec2 scale = vec2(1.0);
            if (screenAspect > textureAspect) {
              scale.y = textureAspect / screenAspect;
            } else {
              scale.x = screenAspect / textureAspect;
            }
            return (uv - 0.5) * scale + 0.5;
          }

          void main() {
            vec2 sceneUv = vUv;
            vec2 focalPoint = vec2(0.535, 0.54);
            vec2 radialVector = sceneUv - focalPoint;
            float radialDistance = length(radialVector * vec2(1.0, 0.82));
            vec2 direction = normalize(radialVector + vec2(0.0001));

            float slowDolly = sin(uTime * 0.18) * 0.0032 * uMotion;
            sceneUv += direction * slowDolly * smoothstep(0.03, 0.86, radialDistance);
            sceneUv += uPointer * vec2(0.0042, -0.0032) * uMotion *
              (0.24 + radialDistance * 0.76);

            float upperField = smoothstep(0.53, 0.9, sceneUv.y);
            sceneUv.y += sin(uTime * 0.34 + sceneUv.x * 18.0) *
              0.00115 * upperField * uMotion;

            vec2 textureUv = coverUv(sceneUv);
            vec3 firstSample = texture2D(uTexture, textureUv).rgb;
            float luminance = dot(firstSample, vec3(0.2126, 0.7152, 0.0722));
            vec2 depthOffset = uPointer * (luminance - 0.22) * 0.0026 * uMotion;
            vec3 color = texture2D(uTexture, textureUv + depthOffset).rgb;

            float tealMask = smoothstep(0.02, 0.28, color.g - color.r * 0.48) *
              smoothstep(0.035, 0.42, luminance);
            float goldMask = smoothstep(0.015, 0.24, color.r - color.b * 0.72) *
              smoothstep(0.04, 0.5, luminance);
            float infrastructureMask = clamp(max(tealMask, goldMask), 0.0, 1.0);

            float roadFlow = pow(
              max(0.0, sin(radialDistance * 112.0 - uTime * 2.4)),
              18.0
            );
            float orbitalFlow = pow(
              max(0.0, sin(atan(radialVector.y, radialVector.x) * 18.0 +
                radialDistance * 28.0 - uTime * 0.72)),
              22.0
            );
            vec3 energyColor = mix(
              vec3(0.08, 0.52, 0.48),
              vec3(0.92, 0.58, 0.18),
              goldMask
            );
            color += energyColor * infrastructureMask *
              (roadFlow * 0.14 + orbitalFlow * 0.055) * uMotion;

            float coreDistance = length((sceneUv - focalPoint) * vec2(1.0, 1.24));
            float corePulse = exp(-coreDistance * 34.0) *
              (0.52 + sin(uTime * 1.15) * 0.18);
            color += vec3(0.22, 0.88, 0.8) * corePulse * uMotion;

            float horizonBreath = exp(-abs(sceneUv.y - 0.55) * 18.0) *
              (0.5 + sin(uTime * 0.42) * 0.16);
            color += vec3(0.08, 0.28, 0.25) * horizonBreath *
              infrastructureMask * uMotion;

            gl_FragColor = vec4(color, uLoaded);
          }
        `,
      });
      const backgroundQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        backgroundMaterial,
      );
      backgroundScene.add(backgroundQuad);

      let backgroundTexture: Three.Texture | null = null;
      new THREE.TextureLoader().load(
        "/images/astraloom-reality-field-v1.webp",
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          backgroundTexture = texture;
          backgroundUniforms.uTexture.value = texture;
          backgroundUniforms.uTextureResolution.value.set(
            texture.image.width || 1586,
            texture.image.height || 992,
          );
          backgroundUniforms.uLoaded.value = 1;
          mount.closest(".fidelity-home")?.classList.add("is-animated-environment-ready");
        },
      );
      const field = new THREE.Group();
      field.position.set(4.6, -1.1, -11.5);
      field.rotation.x = -0.03;
      scene.add(field);

      const graphite = new THREE.MeshStandardMaterial({
        color: 0x132020,
        emissive: 0x030808,
        emissiveIntensity: 0.28,
        metalness: 0.88,
        roughness: 0.3,
      });
      const darkMetal = new THREE.MeshStandardMaterial({
        color: 0x24312f,
        metalness: 0.9,
        roughness: 0.24,
      });
      const amberMetal = new THREE.MeshStandardMaterial({
        color: 0xc39042,
        emissive: 0x3a2107,
        emissiveIntensity: 0.7,
        metalness: 0.9,
        roughness: 0.18,
      });
      const mineral = new THREE.MeshStandardMaterial({
        color: 0x79d8cc,
        emissive: 0x155c56,
        emissiveIntensity: 2.4,
        metalness: 0.34,
        roughness: 0.2,
      });
      const mineralGlow = new THREE.MeshBasicMaterial({
        color: 0x7ce9db,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const amberGlow = new THREE.MeshBasicMaterial({
        color: 0xf1ba5f,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const evidenceGlass = new THREE.MeshPhysicalMaterial({
        color: 0x213d3a,
        transparent: true,
        opacity: 0.5,
        transmission: 0.28,
        thickness: 0.5,
        metalness: 0.36,
        roughness: 0.22,
      });
      const riskGlow = new THREE.MeshBasicMaterial({
        color: 0xe76d62,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const climateGlow = new THREE.MeshBasicMaterial({
        color: 0x8d78a8,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lowConfidenceLine = new THREE.LineBasicMaterial({
        color: 0x788482,
        transparent: true,
        opacity: 0.22,
      });

      const base = new THREE.Group();
      field.add(base);
      [
        [10.5, 11.8, 0.56, -0.3, graphite],
        [9.9, 10.55, 0.22, 0.1, amberMetal],
        [9.2, 9.85, 0.4, 0.34, darkMetal],
      ].forEach(([top, bottom, height, y, material]) => {
        const layer = new THREE.Mesh(
          new THREE.CylinderGeometry(
            top as number,
            bottom as number,
            height as number,
            96,
          ),
          material as Three.Material,
        );
        layer.position.y = y as number;
        base.add(layer);
      });

      const contourGroup = new THREE.Group();
      contourGroup.position.y = 0.59;
      base.add(contourGroup);
      const contourRings: Three.Mesh[] = [];
      for (let i = 0; i < 10; i += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.25 + i * 0.83, i % 3 === 0 ? 0.035 : 0.018, 8, 128),
          i % 3 === 0 ? amberMetal : darkMetal,
        );
        ring.rotation.x = Math.PI / 2;
        contourGroup.add(ring);
        contourRings.push(ring);
      }

      const groundRoutes = new THREE.Group();
      groundRoutes.position.y = 0.64;
      base.add(groundRoutes);
      const groundRouteSystems: GroundRouteSystem[] = [];
      const routeCount = environmentRef.current.isMobile ? 7 : 12;
      for (let index = 0; index < routeCount; index += 1) {
        const angle = (index / routeCount) * Math.PI * 2 + 0.12;
        const sweep = (seededUnit(index, 31) - 0.5) * 0.34;
        const innerRadius = 1.65 + (index % 3) * 0.09;
        const middleRadius = 5.2 + (index % 2) * 0.28;
        const outerRadius = 9.15 - (index % 4) * 0.1;
        const pointAt = (radius: number, angleOffset: number) =>
          new THREE.Vector3(
            Math.cos(angle + angleOffset) * radius,
            0,
            Math.sin(angle + angleOffset) * radius * 0.78,
          );
        const curve = new THREE.CatmullRomCurve3([
          pointAt(innerRadius, 0),
          pointAt(middleRadius, sweep),
          pointAt(outerRadius, sweep * 0.45),
        ]);
        const laneMaterial = new THREE.MeshStandardMaterial({
          color: index % 4 === 1 ? 0x2b2820 : 0x10201f,
          emissive: index % 4 === 1 ? 0x6a4015 : 0x0d5851,
          emissiveIntensity: 0.16,
          metalness: 0.82,
          roughness: 0.3,
          transparent: true,
          opacity: 0.62,
        });
        const lane = new THREE.Mesh(
          new THREE.TubeGeometry(
            curve,
            environmentRef.current.isMobile ? 44 : 72,
            index % 4 === 1 ? 0.075 : 0.055,
            6,
            false,
          ),
          laneMaterial,
        );
        groundRoutes.add(lane);

        const edgeMaterial = new THREE.LineBasicMaterial({
          color: index % 4 === 1 ? 0xe0aa57 : 0x78e2d4,
          transparent: true,
          opacity: index % 4 === 1 ? 0.32 : 0.25,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const edge = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),
          edgeMaterial,
        );
        groundRoutes.add(edge);

        const signals: Three.Mesh[] = [];
        const signalCount = environmentRef.current.isMobile ? 1 : 2;
        for (let signalIndex = 0; signalIndex < signalCount; signalIndex += 1) {
          const signal = new THREE.Mesh(
            new THREE.OctahedronGeometry(signalIndex === 0 ? 0.085 : 0.055, 0),
            index % 4 === 1 ? amberGlow : mineralGlow,
          );
          signal.userData.offset = signalIndex / signalCount;
          groundRoutes.add(signal);
          signals.push(signal);
        }

        groundRouteSystems.push({
          curve,
          lane,
          edge,
          signals,
          phase: seededUnit(index, 37),
          speed: 0.022 + seededUnit(index, 41) * 0.018,
        });
      }

      const intake = new THREE.Group();
      intake.position.set(0, 1, -1.6);
      field.add(intake);
      for (let i = 0; i < 5; i += 1) {
        const tier = new THREE.Mesh(
          new THREE.CylinderGeometry(2.05 - i * 0.28, 2.28 - i * 0.25, 0.18, 64),
          i % 2 === 0 ? graphite : amberMetal,
        );
        tier.position.y = i * 0.18;
        intake.add(tier);
      }
      const intakeCore = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.78, 0.24, 32), mineral);
      intakeCore.position.y = 1.06;
      intake.add(intakeCore);
      const intakeBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.5, 7.8, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x80ecdf,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      intakeBeam.position.y = 5;
      intake.add(intakeBeam);

      const evidenceField = new THREE.Group();
      evidenceField.position.set(0, 4.6, -1.6);
      field.add(evidenceField);
      const evidenceShards: Three.Mesh[] = [];
      const evidencePositions: Three.Vector3[] = [];
      for (let i = 0; i < 34; i += 1) {
        const angle = i * 2.39996;
        const radius = 2.2 + (i % 8) * 0.42;
        const position = new THREE.Vector3(
          Math.cos(angle) * radius,
          0.4 + (i % 7) * 0.68,
          Math.sin(angle) * radius * 0.52,
        );
        const shard = new THREE.Mesh(
          new THREE.BoxGeometry(
            i % 6 === 0 ? 0.72 : 0.28,
            i % 6 === 0 ? 0.46 : 0.36,
            0.045,
          ),
          i % 6 === 0 ? evidenceGlass : i % 4 === 0 ? amberGlow : mineralGlow,
        );
        shard.position.copy(position);
        shard.rotation.set(
          Math.sin(angle) * 0.18,
          angle + Math.PI / 2,
          Math.cos(angle * 0.7) * 0.16,
        );
        evidenceField.add(shard);
        evidenceShards.push(shard);
        evidencePositions.push(position);
      }

      const evidenceLines: number[] = [];
      evidencePositions.forEach((position, index) => {
        if (index % 2 !== 0) return;
        evidenceLines.push(position.x, position.y, position.z, 0, -2.9, 0);
      });
      const evidenceLineGeometry = new THREE.BufferGeometry();
      evidenceLineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(evidenceLines, 3),
      );
      const evidenceNetwork = new THREE.LineSegments(
        evidenceLineGeometry,
        new THREE.LineBasicMaterial({
          color: 0x78d8cc,
          transparent: true,
          opacity: 0.16,
          blending: THREE.AdditiveBlending,
        }),
      );
      evidenceField.add(evidenceNetwork);
      const evidenceGlowNetwork = new THREE.LineSegments(
        evidenceLineGeometry.clone(),
        new THREE.LineBasicMaterial({
          color: 0x8bf1df,
          transparent: true,
          opacity: 0.08,
          blending: THREE.AdditiveBlending,
        }),
      );
      evidenceGlowNetwork.scale.setScalar(1.002);
      evidenceField.add(evidenceGlowNetwork);

      const relationSignals: Array<{
        mesh: Three.Mesh;
        from: Three.Vector3;
        phase: number;
        speed: number;
        state: MotionState;
      }> = [];
      const relationTarget = new THREE.Vector3(0, -2.9, 0);
      evidencePositions.forEach((position, index) => {
        if (index % 2 !== 0) return;
        const state: MotionState =
          index % 10 === 0
            ? "risk"
            : index % 6 === 0
              ? "low-confidence"
              : index % 4 === 0
                ? "source-backed"
                : "active";
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(state === "source-backed" ? 0.07 : 0.045, 10, 8),
          state === "risk"
            ? riskGlow
            : state === "low-confidence"
              ? new THREE.MeshBasicMaterial({
                  color: 0x788482,
                  transparent: true,
                  opacity: 0.35,
                })
              : state === "source-backed"
                ? amberGlow
                : mineralGlow,
        );
        mesh.position.copy(position);
        evidenceField.add(mesh);
        relationSignals.push({
          mesh,
          from: position,
          phase: seededUnit(index, 4),
          speed: 1 / (motionTokens.edgeFlowRange[0] + seededUnit(index, 8) * 2.8),
          state,
        });
      });

      const nodeSystems: NodeSystem[] = [];
      const nodeStates: MotionState[] = [
        "active",
        "source-backed",
        "idle",
        "risk",
        "low-confidence",
        "fallback",
        "active",
        "source-backed",
      ];
      for (let index = 0; index < 8; index += 1) {
        const angle = (index / 8) * Math.PI * 2 + 0.25;
        const node = new THREE.Group();
        node.position.set(
          Math.cos(angle) * (4.4 + (index % 2) * 1.1),
          2.2 + (index % 3) * 1.05,
          Math.sin(angle) * 2.8,
        );
        const state = nodeStates[index];
        const material =
          state === "risk"
            ? riskGlow
            : state === "source-backed"
              ? amberGlow
              : state === "low-confidence"
                ? new THREE.MeshBasicMaterial({
                    color: 0x7a8583,
                    transparent: true,
                    opacity: 0.4,
                  })
                : state === "fallback"
                  ? new THREE.MeshBasicMaterial({
                      color: 0xd59c55,
                      transparent: true,
                      opacity: 0.46,
                    })
                  : mineralGlow;
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(state === "active" ? 0.15 : 0.11, 16, 12),
          material,
        );
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.018, 8, 40),
          state === "risk"
            ? riskGlow
            : state === "source-backed"
              ? amberGlow
              : state === "low-confidence"
                ? lowConfidenceLine
                : mineralGlow,
        );
        ring.rotation.x = Math.PI / 2;
        node.add(core, ring);
        evidenceField.add(node);
        nodeSystems.push({
          group: node,
          core,
          ring,
          state,
          phase: index * motionTokens.nodeDelayStep + seededUnit(index, 12),
        });
      }

      const pathColors = [0x75d8cc, 0xb7d4bc, 0xe0a955, 0x77b4aa];
      const pathSystems: PathSystem[] = [];
      const pathEnds = [-7.2, -2.8, 2.2, 7.1];
      const pathStates: MotionState[] = [
        "active",
        "source-backed",
        "risk",
        "low-confidence",
      ];
      const pathSpeeds = [0.024, 0.031, 0.027, 0.018];

      pathEnds.forEach((endX, index) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 1.05, -1.5),
          new THREE.Vector3(endX * 0.18, 0.78 + index * 0.07, 1.5),
          new THREE.Vector3(endX * 0.55, 0.45, 5.2),
          new THREE.Vector3(endX, 0.12, 9.5),
        ]);
        const group = new THREE.Group();
        field.add(group);
        const state = pathStates[index];
        const material = new THREE.MeshPhysicalMaterial({
          color: state === "risk" ? 0xb85b50 : pathColors[index],
          emissive: state === "risk" ? 0x5b1812 : pathColors[index],
          emissiveIntensity:
            state === "low-confidence" ? 0.05 : state === "risk" ? 0.26 : 0.2,
          metalness: 0.48,
          roughness: 0.16,
          transparent: true,
          opacity: state === "low-confidence" ? 0.22 : 0.5,
          transmission: 0.28,
          thickness: 0.6,
          side: THREE.DoubleSide,
        });
        const ribbon = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 96, index === 2 ? 0.28 : 0.36, 12, false),
          material,
        );
        group.add(ribbon);
        const edge = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 96, 0.035, 8, false),
          state === "risk"
            ? riskGlow
            : state === "source-backed"
              ? amberGlow
              : state === "low-confidence"
                ? new THREE.MeshBasicMaterial({
                    color: 0x7c8886,
                    transparent: true,
                    opacity: 0.28,
                  })
                : mineralGlow,
        );
        group.add(edge);

        if (state === "low-confidence") {
          const dashedGeometry = new THREE.BufferGeometry().setFromPoints(
            curve.getPoints(96),
          );
          const dashedLine = new THREE.Line(
            dashedGeometry,
            new THREE.LineDashedMaterial({
              color: 0x788482,
              dashSize: 0.22,
              gapSize: 0.14,
              transparent: true,
              opacity: 0.35,
            }),
          );
          dashedLine.computeLineDistances();
          group.add(dashedLine);
        }

        const particles: Three.Mesh[] = [];
        const evidenceParticleCount =
          state === "source-backed" ? (environmentRef.current.isMobile ? 4 : 8) : 0;
        for (
          let particleIndex = 0;
          particleIndex < evidenceParticleCount;
          particleIndex += 1
        ) {
          const particle = new THREE.Mesh(
            new THREE.SphereGeometry(particleIndex % 4 === 0 ? 0.08 : 0.045, 10, 8),
            amberGlow,
          );
          particle.userData.offset =
            particleIndex / Math.max(evidenceParticleCount, 1) +
            seededUnit(particleIndex, index) * 0.04;
          group.add(particle);
          particles.push(particle);
        }

        const signal = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 12, 8),
          state === "risk"
            ? riskGlow
            : state === "source-backed"
              ? amberGlow
              : state === "low-confidence"
                ? new THREE.MeshBasicMaterial({
                    color: 0x7c8886,
                    transparent: true,
                    opacity: 0.28,
                  })
                : mineralGlow,
        );
        group.add(signal);
        const beacon = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.24, 0),
          state === "risk"
            ? riskGlow
            : state === "source-backed"
              ? amberGlow
              : state === "low-confidence"
                ? lowConfidenceLine
                : mineralGlow,
        );
        beacon.position.copy(curve.getPointAt(0.96));
        group.add(beacon);
        pathSystems.push({
          curve,
          group,
          state,
          particles,
          signal,
          beacon,
          material,
          speed: pathSpeeds[index],
        });
      });

      const pressureField = new THREE.Group();
      pressureField.position.set(-1.8, 2.5, 1.4);
      field.add(pressureField);
      const pressureRings: Three.Mesh[] = [];
      for (let i = 0; i < 6; i += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.25 + i * 0.72, 0.022, 8, 96),
          i % 2 === 0 ? amberGlow : mineralGlow,
        );
        ring.rotation.set(Math.PI / 2, 0, i * 0.12);
        ring.scale.y = 0.48;
        pressureField.add(ring);
        pressureRings.push(ring);
      }

      const timingLens = new THREE.Group();
      timingLens.position.set(4.3, 5.1, 0.8);
      timingLens.rotation.z = -0.24;
      field.add(timingLens);
      const timingRail = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.06, 0.08), amberGlow);
      timingLens.add(timingRail);
      const timingTicks = new THREE.Group();
      timingLens.add(timingTicks);
      for (let i = 0; i < 22; i += 1) {
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, i % 5 === 0 ? 0.3 : 0.16, 0.035),
          amberGlow,
        );
        tick.position.x = -4 + i * 0.38;
        timingTicks.add(tick);
      }
      const timingMarker = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), amberGlow);
      timingLens.add(timingMarker);

      const climateLayer = new THREE.Group();
      climateLayer.position.set(1.1, 5.1, -2.8);
      field.add(climateLayer);
      const climateRings: Three.Mesh[] = [];
      for (let index = 0; index < 3; index += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(4.2 + index * 1.25, 0.035, 8, 128),
          climateGlow,
        );
        ring.rotation.set(
          Math.PI / 2.4 + index * 0.16,
          index * 0.52,
          index * 0.38,
        );
        climateLayer.add(ring);
        climateRings.push(ring);
      }

      const starsGeometry = new THREE.BufferGeometry();
      const dustCount = environmentRef.current.isMobile ? 10 : 32;
      const dust = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i += 1) {
        dust[i * 3] = (Math.random() - 0.5) * 45;
        dust[i * 3 + 1] = Math.random() * 18;
        dust[i * 3 + 2] = (Math.random() - 0.5) * 34 - 6;
      }
      starsGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
      const ambientDust = new THREE.Points(
        starsGeometry,
        new THREE.PointsMaterial({
          color: 0xa5d7cd,
          size: 0.035,
          transparent: true,
          opacity: 0.42,
          sizeAttenuation: true,
        }),
      );
      scene.add(ambientDust);

      scene.add(new THREE.HemisphereLight(0xb7e0d8, 0x120e09, 1.45));
      const keyLight = new THREE.DirectionalLight(0xf0d0a0, 2.8);
      keyLight.position.set(-7, 18, 12);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0x7dd5c8, 2.2);
      fillLight.position.set(12, 9, 9);
      scene.add(fillLight);
      const coreLight = new THREE.PointLight(0x72dfd1, 54, 30, 2);
      coreLight.position.set(4.6, 2.3, -12.8);
      scene.add(coreLight);
      const timingLight = new THREE.PointLight(0xe3a74d, 28, 30, 2);
      timingLight.position.set(9, 8, -8);
      scene.add(timingLight);

      let pointerX = 0;
      let pointerY = 0;
      let targetX = 0;
      let targetY = 0;
      let lastTime = 0;
      let hoveredPath = -1;

      const handlePointer = (event: PointerEvent) => {
        targetX = (event.clientX / window.innerWidth - 0.5) * 2;
        targetY = (event.clientY / window.innerHeight - 0.5) * 2;
        const normalizedX = event.clientX / window.innerWidth;
        const normalizedY = event.clientY / window.innerHeight;
        hoveredPath =
          normalizedY > 0.48 && normalizedX > 0.28
            ? Math.min(3, Math.max(0, Math.floor(((normalizedX - 0.28) / 0.64) * 4)))
            : -1;
      };

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        renderer.setSize(width, height, false);
        backgroundUniforms.uResolution.value.set(width, height);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      };

      const render = (time: number) => {
        if (disposed) return;
        const elapsed = time * 0.001;
        const delta = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        const motionEnvironment = environmentRef.current;
        if (
          !motionEnvironment.prefersReducedMotion &&
          motionEnvironment.isPageVisible
        ) {
          pointerX += (targetX - pointerX) * 0.032;
          pointerY += (targetY - pointerY) * 0.032;
          backgroundUniforms.uPointer.value.set(pointerX, pointerY);
          backgroundUniforms.uTime.value = elapsed;
          backgroundUniforms.uMotion.value =
            motionEnvironment.isMobile ? 0.58 : 1;
          camera.position.x = pointerX * 0.8;
          camera.position.y = 7.4 - pointerY * 0.38 + Math.sin(elapsed * 0.16) * 0.08;
          camera.lookAt(2.5 + pointerX * 0.2, 2.2 - pointerY * 0.12, -10);

          contourRings.forEach((ring, index) => {
            const duration =
              motionTokens.orbitDurations[index % motionTokens.orbitDurations.length];
            ring.rotation.z +=
              (delta * Math.PI * 2 * (index % 2 === 0 ? 1 : -1)) / duration;
            const breathe =
              1 + Math.sin(elapsed * 0.34 + index * 0.63) * motionTokens.intensity.orbit * 0.025;
            ring.scale.setScalar(breathe);
          });
          groundRouteSystems.forEach((route, routeIndex) => {
            const wave = Math.sin(elapsed * 0.48 + route.phase * Math.PI * 2);
            const laneMaterial = route.lane.material as Three.MeshStandardMaterial;
            const edgeMaterial = route.edge.material as Three.LineBasicMaterial;
            laneMaterial.emissiveIntensity = 0.15 + (wave + 1) * 0.075;
            edgeMaterial.opacity =
              (routeIndex % 4 === 1 ? 0.28 : 0.21) + (wave + 1) * 0.055;
            route.signals.forEach((signal, signalIndex) => {
              const progress =
                (elapsed * route.speed +
                  route.phase +
                  signal.userData.offset) %
                1;
              signal.position.copy(route.curve.getPointAt(progress));
              const pulse =
                0.78 +
                Math.sin(elapsed * 1.2 + routeIndex * 0.47 + signalIndex) * 0.18;
              signal.scale.setScalar(pulse);
              signal.rotation.y += delta * (0.45 + routeIndex * 0.015);
            });
          });
          pressureField.rotation.y -= delta * 0.035;
          pressureRings.forEach((ring, index) => {
            const pulse = 0.94 + Math.sin(elapsed * 0.55 + index * 0.7) * 0.06;
            ring.scale.x = pulse;
            ring.scale.z = pulse;
          });
          evidenceField.rotation.y = Math.sin(elapsed * 0.11) * 0.08;
          evidenceShards.forEach((shard, index) => {
            shard.position.y += Math.sin(elapsed * 0.7 + index * 0.53) * 0.0008;
            shard.rotation.z += delta * (index % 2 === 0 ? 0.018 : -0.014);
          });
          relationSignals.forEach((signal) => {
            const progress = (elapsed * signal.speed + signal.phase) % 1;
            signal.mesh.position.lerpVectors(
              signal.from,
              relationTarget,
              progress,
            );
            const intensity = motionStateIntensity[signal.state];
            signal.mesh.scale.setScalar(
              intensity * (0.82 + Math.sin(elapsed * 1.1 + signal.phase * 6) * 0.12),
            );
          });
          nodeSystems.forEach((node, index) => {
            const isHoverRelated = hoveredPath >= 0 && index % 4 === hoveredPath;
            const baseIntensity =
              motionStateIntensity[isHoverRelated ? "hover" : node.state];
            const pulseFrequency = node.state === "risk" ? 0.65 : 0.38;
            const pulse =
              1 + Math.sin(elapsed * pulseFrequency + node.phase) * baseIntensity * 0.09;
            node.core.scale.setScalar(pulse * (isHoverRelated ? 1.06 : 1));
            node.ring.rotation.z +=
              delta * (0.08 + seededUnit(index, 17) * 0.08) * (index % 2 ? -1 : 1);
            node.ring.scale.setScalar(isHoverRelated ? 1.08 : 1);
          });
          pathSystems.forEach((path, pathIndex) => {
            const isHovered = hoveredPath === pathIndex;
            const dimmed = hoveredPath >= 0 && !isHovered;
            path.material.opacity =
              path.state === "low-confidence"
                ? dimmed
                  ? 0.1
                  : 0.22
                : dimmed
                  ? 0.22
                  : isHovered
                    ? 0.72
                    : 0.5;
            path.group.scale.setScalar(isHovered ? 1.035 : 1);
            const signalProgress =
              (elapsed * path.speed + pathIndex * 0.19) % 1;
            path.signal.position.copy(path.curve.getPointAt(signalProgress));
            path.particles.forEach((particle, particleIndex) => {
              const progress =
                (elapsed * path.speed +
                  particle.userData.offset +
                  particleIndex * 0.013) %
                1;
              particle.position.copy(path.curve.getPointAt(progress));
            });
            const beaconPulse = 0.82 + Math.sin(elapsed * 1.1 + pathIndex * 0.8) * 0.2;
            path.beacon.scale.setScalar(beaconPulse);
          });
          climateRings.forEach((ring, index) => {
            ring.rotation.z +=
              (delta * Math.PI * 2 * (index % 2 ? -1 : 1)) /
              (motionTokens.duration.climate + index * 3);
          });
          climateLayer.position.x = 1.1 + Math.sin(elapsed * 0.11) * 0.22;
          timingMarker.position.x = Math.sin(elapsed * 0.34) * 3.85;
          timingMarker.rotation.y += delta * 0.5;
          intakeBeam.scale.x = 0.88 + Math.sin(elapsed * 0.72) * 0.12;
          intakeBeam.scale.z = intakeBeam.scale.x;
          coreLight.intensity = 50 + Math.sin(elapsed * 0.64) * 7;
          ambientDust.rotation.y += delta * 0.0015;
        } else if (motionEnvironment.prefersReducedMotion) {
          backgroundUniforms.uPointer.value.set(0, 0);
          backgroundUniforms.uTime.value = 0;
          backgroundUniforms.uMotion.value = 0;
          groundRouteSystems.forEach((route, routeIndex) => {
            const laneMaterial = route.lane.material as Three.MeshStandardMaterial;
            const edgeMaterial = route.edge.material as Three.LineBasicMaterial;
            laneMaterial.emissiveIntensity = 0.16;
            edgeMaterial.opacity = routeIndex % 4 === 1 ? 0.3 : 0.23;
            route.signals.forEach((signal, signalIndex) => {
              signal.position.copy(
                route.curve.getPointAt(
                  (route.phase + signalIndex / route.signals.length) % 1,
                ),
              );
            });
          });
          pathSystems.forEach((path) => {
            path.material.opacity = path.state === "low-confidence" ? 0.18 : 0.42;
          });
        }

        renderer.autoClear = false;
        renderer.clear();
        renderer.render(backgroundScene, backgroundCamera);
        renderer.clearDepth();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      window.addEventListener("pointermove", handlePointer, { passive: true });
      cleanup.push(() => window.removeEventListener("pointermove", handlePointer));

      mount.closest(".fidelity-home")?.classList.add("is-visual-ready", "is-webgl-ready");
      resize();
      raf = requestAnimationFrame(render);

      cleanup.push(() => {
        const disposedMaterials = new Set<Three.Material>();
        scene.traverse((object) => {
          if (
            object instanceof THREE.Mesh ||
            object instanceof THREE.Line ||
            object instanceof THREE.LineSegments ||
            object instanceof THREE.Points
          ) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.forEach((material) => {
              if (!disposedMaterials.has(material)) {
                material.dispose();
                disposedMaterials.add(material);
              }
            });
          }
        });
        backgroundQuad.geometry.dispose();
        backgroundMaterial.dispose();
        backgroundTexture?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      cleanup.forEach((dispose) => dispose());
      mount
        .closest(".fidelity-home")
        ?.classList.remove("is-webgl-ready", "is-animated-environment-ready");
    };
  }, []);

  return <div ref={mountRef} className="living-field observatory-webgl" aria-hidden="true" />;
}
