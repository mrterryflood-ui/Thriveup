import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createRendererSafe } from "../trade-sims/diagrams/three-lib";

interface ParticleFlowProps {
  costOfInaction: number;
  netSavings: number;
  roi: string | number;
  populationSize?: number;
}

const COUNT = 4000;

const BAD_DESTS  = [[-5,-3,-1.5],[-6.5,-2,0.5],[-4,-4,1],[-7,-1,-0.5]] as const;
const GOOD_DESTS = [[5,-2,-1],[6,-1,0.5],[4.5,-3,1],[5.5,-2.5,-0.5]] as const;

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

function makeLabel(text: string, color: string, size = 20): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 44);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(4.5, 0.56, 1);
  return s;
}

export default function ParticleFlow({ costOfInaction, netSavings, roi }: ParticleFlowProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.replaceChildren();

    const roiNum = typeof roi === "string" ? parseFloat(roi) : (roi || 0);
    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 480;

    const renderer = createRendererSafe({ antialias: true });
    if (!renderer) {
      const fallback = document.createElement("div");
      fallback.dataset.testid = "particle-flow-fallback";
      fallback.className = "flex h-full items-center justify-center bg-slate-900 px-4 text-center text-sm text-slate-300";
      fallback.setAttribute("role", "status");
      fallback.textContent = "Interactive particle-flow visualization is unavailable on this device.";
      mount.appendChild(fallback);
      return;
    }
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0f1e);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 2, 12);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const redLight = new THREE.PointLight(0xef4444, 1.5); redLight.position.set(-6, 2, 0); scene.add(redLight);
    const greenLight = new THREE.PointLight(0x10b981, 1.5); greenLight.position.set(6, 2, 0); scene.add(greenLight);

    // Build particle buffers
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const targets   = new Float32Array(COUNT * 3);

    const goodRatio = Math.min(0.85, Math.max(0.15, roiNum / 100));

    for (let i = 0; i < COUNT; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 0.5;
      positions[i*3+1] = (Math.random() - 0.5) * 0.5;
      positions[i*3+2] = (Math.random() - 0.5) * 0.5;

      const goGood = Math.random() < goodRatio;
      const dests = goGood ? GOOD_DESTS : BAD_DESTS;
      const d = dests[Math.floor(Math.random() * dests.length)];
      targets[i*3]   = d[0] + (Math.random() - 0.5) * 2;
      targets[i*3+1] = d[1] + (Math.random() - 0.5) * 1.5;
      targets[i*3+2] = d[2] + (Math.random() - 0.5) * 2;

      if (goGood) { colors[i*3]=0.06; colors[i*3+1]=0.73; colors[i*3+2]=0.51; }
      else        { colors[i*3]=0.94; colors[i*3+1]=0.27; colors[i*3+2]=0.27; }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.08, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.85 }));
    scene.add(pts);

    // Labels
    const l1 = makeLabel("No Investment", "#ef4444", 22); l1.position.set(-5.5, 0.8, 0); scene.add(l1);
    const l2 = makeLabel("ER · Prison · Shelter · Poverty", "#94a3b8", 16); l2.position.set(-5.5, 0.15, 0); scene.add(l2);
    const l3 = makeLabel("With Investment", "#10b981", 22); l3.position.set(5.5, 0.8, 0); scene.add(l3);
    const l4 = makeLabel("Jobs · Housing · Education", "#94a3b8", 16); l4.position.set(5.5, 0.15, 0); scene.add(l4);
    const l5 = makeLabel(`${roiNum.toFixed(1)}x return on every dollar invested`, "#ffffff", 20); l5.position.set(0, 2.5, 0); scene.add(l5);

    let elapsed = 0;
    let lastTs = 0;
    let animId: number;

    const animate = (ts: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      elapsed += delta;

      const phase = Math.min(1, elapsed / 2.5);
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        const t = elapsed * 0.6 + i * 0.01;
        const wobble = Math.sin(t) * 0.04 * (1 - phase);
        posAttr.setX(i, posAttr.getX(i) + (targets[i*3]   - posAttr.getX(i)) * 0.015 * phase + wobble);
        posAttr.setY(i, posAttr.getY(i) + (targets[i*3+1] - posAttr.getY(i)) * 0.015 * phase);
        posAttr.setZ(i, posAttr.getZ(i) + (targets[i*3+2] - posAttr.getZ(i)) * 0.015 * phase + Math.cos(t) * 0.04 * (1 - phase));
      }
      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame((ts) => { lastTs = ts; animate(ts); });

    const onResize = () => {
      const nW = mount.clientWidth; const nH = mount.clientHeight;
      camera.aspect = nW / nH; camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      disposeScene(scene);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [roi]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
