import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Vintage {
  year: number;
  povertyRate: number;
  unemploymentRate: number;
  cohortCost: number;
}

interface HistoricalTimelineProps {
  vintages: Vintage[];
  totalAccumulatedCost: number;
  trendDirection: "improving" | "stagnant" | "worsening";
  forwardCost: number;
  interventionCost: number;
  geography: string;
}

function fmt$(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

// Recursively dispose every geometry, material (and its textures / material
// arrays) attached to a scene graph. Without this, each re-render of the
// visualization leaks GPU memory (geometries + textures) even after
// renderer.dispose().
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
    const mesh = obj as THREE.Mesh & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m: any) => disposeMaterial(m));
      } else {
        disposeMaterial(mesh.material);
      }
    }
  });
}

function makeLabel(text: string, color: string, fontSize = 18, w = 256, h = 56): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(w / 48, h / 48, 1);
  return s;
}

const TREND_COLOR: Record<string, number> = {
  improving: 0x10b981,
  stagnant:  0xf59e0b,
  worsening: 0xef4444,
};

export default function HistoricalTimeline({
  vintages, totalAccumulatedCost, trendDirection, forwardCost, interventionCost, geography,
}: HistoricalTimelineProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !vintages || vintages.length === 0) return;

    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x07101f);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07101f, 30, 80);
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 7, 20);
    camera.lookAt(0, 2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(5, 15, 8); scene.add(sun);
    const redGlow = new THREE.PointLight(0xef4444, 0.8); redGlow.position.set(-8, 4, 2); scene.add(redGlow);
    const greenGlow = new THREE.PointLight(0x10b981, 0.8); greenGlow.position.set(8, 4, 2); scene.add(greenGlow);

    // Grid
    const grid = new THREE.GridHelper(32, 32, 0x1e293b, 0x1e293b);
    grid.position.y = -0.05;
    scene.add(grid);

    // ── Build timeline ────────────────────────────────────────────────────────
    // Historical bars: vintages (past, left side)
    // Forward bars: forward cost (future, right side)
    // NOW divider in the middle

    const allBars: Array<{ vintage?: Vintage; type: "historical" | "forward" | "intervention"; x: number }> = [];

    // Space: historical vintages on left, NOW at center, forward + intervention on right
    const histCount = vintages.length;
    const totalBars = histCount + 2; // + forward + intervention
    const spacing = 14 / (totalBars + 1);
    const startX = -(totalBars * spacing) / 2;

    vintages.forEach((v, i) => {
      allBars.push({ vintage: v, type: "historical", x: startX + i * spacing });
    });
    allBars.push({ type: "forward",      x: startX + histCount * spacing + spacing });
    allBars.push({ type: "intervention", x: startX + (histCount + 1) * spacing + spacing });

    const maxCost = Math.max(
      ...vintages.map(v => v.cohortCost),
      forwardCost,
      interventionCost,
      1
    );
    const MAX_H = 8;

    const nowX = startX + histCount * spacing + spacing / 2;

    // "NOW" divider plane
    const nowGeo = new THREE.PlaneGeometry(0.08, MAX_H + 3);
    const nowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const nowPlane = new THREE.Mesh(nowGeo, nowMat);
    nowPlane.position.set(nowX, MAX_H / 2, 0);
    scene.add(nowPlane);
    const nowLabel = makeLabel("NOW", "#ffffff", 22, 128, 40);
    nowLabel.scale.set(1.6, 0.5, 1);
    nowLabel.position.set(nowX, MAX_H + 1.2, 0);
    scene.add(nowLabel);

    // "PAST" and "FUTURE" region labels
    const pastLabel = makeLabel("WHAT HAS ALREADY BEEN PAID", "#94a3b8", 16, 400, 40);
    pastLabel.scale.set(5, 0.5, 1);
    pastLabel.position.set(nowX - 4, MAX_H + 0.5, 0);
    scene.add(pastLabel);
    const futureLabel = makeLabel("WHAT COMES NEXT", "#94a3b8", 16, 300, 40);
    futureLabel.scale.set(3.8, 0.5, 1);
    futureLabel.position.set(nowX + 2.5, MAX_H + 0.5, 0);
    scene.add(futureLabel);

    // Bars
    const animBars: Array<{ mesh: THREE.Mesh; targetH: number; costLabel: THREE.Sprite; labelTargetY: number }> = [];

    allBars.forEach(({ vintage, type, x }) => {
      let color: number;
      let label: string;
      let h: number;
      let yearLabel = "";

      if (type === "historical" && vintage) {
        color = TREND_COLOR[trendDirection] || 0xf59e0b;
        h = Math.max(0.15, (vintage.cohortCost / maxCost) * MAX_H);
        label = fmt$(vintage.cohortCost);
        yearLabel = String(vintage.year);
      } else if (type === "forward") {
        color = 0xef4444;
        h = Math.max(0.15, (forwardCost / maxCost) * MAX_H);
        label = fmt$(forwardCost);
        yearLabel = "Next\n25yr";
      } else {
        color = 0x10b981;
        h = Math.max(0.15, (interventionCost / maxCost) * MAX_H);
        label = fmt$(interventionCost);
        yearLabel = "Invest\nNow";
      }

      const geo = new THREE.BoxGeometry(0.65, h, 0.65);
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: type === "historical" ? 0.15 : 0.3,
        roughness: 0.3, metalness: 0.4,
        transparent: type === "historical", opacity: type === "historical" ? 0.75 : 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.001, 0);
      mesh.scale.y = 0.001;
      mesh.castShadow = true;
      scene.add(mesh);

      const costLabel = makeLabel(label, type === "intervention" ? "#10b981" : type === "forward" ? "#ef4444" : "#cbd5e1", 16, 160, 40);
      costLabel.scale.set(2, 0.5, 1);
      costLabel.position.set(x, 0.1, 0);
      scene.add(costLabel);

      const yr = makeLabel(yearLabel, type === "historical" ? "#64748b" : "#e2e8f0", 15, 128, 44);
      yr.scale.set(1.5, 0.55, 1);
      yr.position.set(x, -0.5, 0);
      scene.add(yr);

      // Poverty rate line point
      if (vintage) {
        const pRate = vintage.povertyRate;
        const lineGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        const linePt = new THREE.Mesh(lineGeo, lineMat);
        linePt.position.set(x, (pRate / 40) * MAX_H + 0.2, 0.8);
        scene.add(linePt);
      }

      animBars.push({ mesh, targetH: h, costLabel, labelTargetY: h + 0.6 });
    });

    // Poverty rate connecting line across historical bars
    if (vintages.length >= 2) {
      const ratePts = vintages.map((v, i) =>
        new THREE.Vector3(allBars[i].x, (v.povertyRate / 40) * MAX_H + 0.2, 0.8)
      );
      const rateCurve = new THREE.CatmullRomCurve3(ratePts);
      const rateGeo = new THREE.TubeGeometry(rateCurve, 40, 0.05, 6, false);
      scene.add(new THREE.Mesh(rateGeo, new THREE.MeshBasicMaterial({ color: 0xfbbf24 })));

      const legendPt = makeLabel("— Poverty rate", "#fbbf24", 15, 220, 40);
      legendPt.scale.set(2.8, 0.5, 1);
      legendPt.position.set(allBars[0].x + 1, (vintages[0].povertyRate / 40) * MAX_H + 1.2, 0.8);
      scene.add(legendPt);
    }

    // Total accumulated cost callout
    const totalLabel = makeLabel(
      `Total already paid: ${fmt$(totalAccumulatedCost)}`,
      "#fbbf24", 20, 480, 52
    );
    totalLabel.scale.set(6.5, 0.7, 1);
    totalLabel.position.set(nowX - 3.5, -1.2, 0);
    scene.add(totalLabel);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2.1;

    let elapsed = 0;
    let lastTs = 0;
    let animId: number;

    const animate = (ts: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      elapsed += delta;

      animBars.forEach(({ mesh, targetH, costLabel, labelTargetY }, idx) => {
        const delay = idx * 0.12;
        const progress = Math.min(1, Math.max(0, (elapsed - delay) * 1.5));
        const ease = 1 - Math.pow(1 - progress, 3);
        mesh.scale.y = Math.max(0.001, ease);
        mesh.position.y = (targetH * ease) / 2;
        costLabel.position.y = targetH * ease + 0.6;
      });

      controls.update();
      renderer.render(scene, camera);
    };
    requestAnimationFrame((ts) => { lastTs = ts; animate(ts); });

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
      // Dispose all GPU resources (geometries, materials, textures) before
      // tearing down the renderer to avoid leaking WebGL memory on re-render.
      disposeScene(scene);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [vintages, totalAccumulatedCost, trendDirection, forwardCost, interventionCost]);

  if (!vintages || vintages.length === 0) {
    return <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400 text-sm">No historical data available</div>;
  }

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
