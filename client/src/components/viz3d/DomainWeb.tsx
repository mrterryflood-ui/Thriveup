import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRendererSafe } from "../trade-sims/diagrams/three-lib";

interface DomainScore {
  score: number;
  grade: string;
  label: string;
  urgency: string;
}

interface DomainWebProps {
  systemsScores: Record<string, DomainScore>;
}

const URGENCY_COLOR: Record<string, number> = {
  stable:  0x10b981,
  watch:   0xf59e0b,
  concern: 0xf97316,
  crisis:  0xef4444,
};

const POSITIONS: Record<string, [number, number, number]> = {
  healthAccess:    [ 0,    4,    0   ],
  mentalHealth:    [ 3,    2,    2   ],
  benefits:        [-3,    2,    2   ],
  housing:         [ 3,    0,   -2   ],
  earlyChildhood:  [-3,    0,   -2   ],
  education:       [ 2.5, -2,    2   ],
  workforce:       [-2.5, -2,    2   ],
  justice:         [ 2.5, -2,   -2   ],
  fostersAndAging: [-2.5, -2,   -2   ],
  ruralAccess:     [ 0,   -4,    0   ],
};

const EDGES: [string, string, number][] = [
  ["healthAccess", "mentalHealth", 0.85],
  ["mentalHealth", "benefits", 0.72],
  ["benefits", "housing", 0.78],
  ["housing", "earlyChildhood", 0.65],
  ["earlyChildhood", "education", 0.88],
  ["education", "workforce", 0.82],
  ["workforce", "justice", 0.60],
  ["justice", "housing", 0.68],
  ["mentalHealth", "justice", 0.71],
  ["healthAccess", "benefits", 0.55],
  ["fostersAndAging", "mentalHealth", 0.70],
  ["fostersAndAging", "housing", 0.63],
  ["ruralAccess", "healthAccess", 0.58],
  ["ruralAccess", "benefits", 0.52],
];

function disposeMaterial(material: THREE.Material) {
  for (const key of Object.keys(material)) {
    const value = (material as unknown as Record<string, unknown>)[key];
    if (value && (value as THREE.Texture).isTexture) {
      (value as THREE.Texture).dispose();
    }
  }
  material.dispose();
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj: any) => {
    const renderable = obj as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    renderable.geometry?.dispose();
    if (Array.isArray(renderable.material)) {
      renderable.material.forEach(disposeMaterial);
    } else if (renderable.material) {
      disposeMaterial(renderable.material);
    }
  });
}

function makeLabel(text: string, color: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 48;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(2.4, 0.45, 1);
  return s;
}

export default function DomainWeb({ systemsScores }: DomainWebProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.replaceChildren();
    if (!systemsScores || Object.keys(systemsScores).length === 0) return;

    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 480;

    const renderer = createRendererSafe({ antialias: true });
    if (!renderer) {
      const fallback = document.createElement("div");
      fallback.dataset.testid = "domain-web-fallback";
      fallback.className = "flex h-full items-center justify-center bg-slate-900 px-4 text-center text-sm text-slate-300";
      fallback.setAttribute("role", "status");
      fallback.textContent = "Interactive domain visualization is unavailable on this device.";
      mount.appendChild(fallback);
      return;
    }
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f2042);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 2, 14);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pLight = new THREE.PointLight(0x60a5fa, 1.5);
    pLight.position.set(0, 10, 0);
    scene.add(pLight);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.8));

    // Nodes
    const nodePositions: Record<string, THREE.Vector3> = {};
    Object.entries(systemsScores).forEach(([id, domain]) => {
      const pos = POSITIONS[id] || [0, 0, 0];
      const v = new THREE.Vector3(...pos);
      nodePositions[id] = v;

      const color = URGENCY_COLOR[domain.urgency] || 0x64748b;
      const size = 0.3 + (1 - domain.score / 100) * 0.4;
      const geo = new THREE.SphereGeometry(size, 24, 24);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(v);
      scene.add(mesh);

      const label = makeLabel(
        domain.label.length > 14 ? domain.label.slice(0, 12) + "…" : domain.label,
        "#ffffff"
      );
      label.position.set(v.x, v.y + size + 0.45, v.z);
      scene.add(label);
    });

    // Edges
    EDGES.forEach(([a, b, weight]) => {
      if (!nodePositions[a] || !nodePositions[b]) return;
      const pA = nodePositions[a];
      const pB = nodePositions[b];
      const mid = new THREE.Vector3(
        (pA.x + pB.x) / 2,
        (pA.y + pB.y) / 2 + weight * 0.8,
        (pA.z + pB.z) / 2
      );
      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const pts = curve.getPoints(30);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.2 + weight * 0.5 });
      scene.add(new THREE.Line(geo, mat));
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Floating animation for nodes
    const nodeObjects: Array<{ mesh: THREE.Mesh; baseY: number; phase: number }> = [];
    scene.children.forEach((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
        nodeObjects.push({ mesh: obj, baseY: obj.position.y, phase: Math.random() * Math.PI * 2 });
      }
    });

    let animId: number;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.01;
      nodeObjects.forEach(({ mesh, baseY, phase }) => {
        mesh.position.y = baseY + Math.sin(t * 0.8 + phase) * 0.12;
      });
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nW = mount.clientWidth; const nH = mount.clientHeight;
      camera.aspect = nW / nH; camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [systemsScores]);

  if (!systemsScores || Object.keys(systemsScores).length === 0) {
    return <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400 text-sm">No domain data available</div>;
  }
  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
