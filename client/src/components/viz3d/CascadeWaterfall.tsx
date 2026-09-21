import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRendererSafe } from "../trade-sims/diagrams/three-lib";
import { CascadeFallback, type CascadeWaterfallProps } from "./svg-fallbacks";

function fmt$(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

// Recursively dispose every geometry, material (and its textures / material
// arrays) in a scene graph before renderer.dispose() so re-renders don't leak
// GPU memory.
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

function makeLabel(text: string, color: string, fontSize = 18, maxW = 256): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = maxW; c.height = 56;
  const ctx = c.getContext("2d")!;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const words = text.split(" ");
  let line = "";
  let y = 20;
  for (const w of words) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW - 8 && line) {
      ctx.fillText(line, maxW / 2, y); y += 20; line = w;
    } else { line = test; }
  }
  ctx.fillText(line, maxW / 2, y);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(maxW / 55, 1, 1);
  return s;
}

export default function CascadeWaterfall({ timeline, totalWithout, totalWith, geography }: CascadeWaterfallProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.replaceChildren();
    const nodes = (timeline || []).slice(0, 8);
    if (nodes.length === 0) return;

    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 480;

    // Replace any prior renderer or fallback before adding this view so a
    // prop-driven re-render cannot leave both representations in the DOM.
    const renderer = createRendererSafe({ antialias: true });
    if (!renderer) {
      setWebglUnavailable(true);
      return;
    }
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0f1e);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0f1e, 30, 70);
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 5, 18);
    camera.lookAt(0, 1, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const redLight = new THREE.PointLight(0xef4444, 1.2); redLight.position.set(-4, 3, 3); scene.add(redLight);
    const greenLight = new THREE.PointLight(0x10b981, 1.2); greenLight.position.set(4, 3, 3); scene.add(greenLight);
    const topLight = new THREE.DirectionalLight(0xffffff, 0.6); topLight.position.set(0, 15, 5); scene.add(topLight);

    const n = nodes.length;
    const spacing = 16 / n;
    const startX = -(n - 1) * spacing / 2;

    // Diverging path points for spline curves
    const withPts: THREE.Vector3[] = [];
    const withoutPts: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];

    nodes.forEach((node, i) => {
      const x = startX + i * spacing;
      const progress = i / (n - 1);

      // "With investment" path rises; "Without" path falls
      const withY  =  1 + progress * 3.5;
      const withoutY = 1 - progress * 3.0;

      withPts.push(new THREE.Vector3(x, withY, 0));
      withoutPts.push(new THREE.Vector3(x, withoutY, -0.5));

      // Milestone marker — glowing sphere
      const sphereGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa, emissive: 0x60a5fa, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.5,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(x, 1, 0);
      scene.add(sphere);
      nodeMeshes.push(sphere);

      // Age label below sphere
      const ageLabel = makeLabel(node.age, "#60a5fa", 20, 128);
      ageLabel.scale.set(1.4, 0.7, 1);
      ageLabel.position.set(x, 0.1, 0);
      scene.add(ageLabel);

      // Milestone label above sphere
      const short = node.milestone.length > 22 ? node.milestone.slice(0, 20) + "…" : node.milestone;
      const milLabel = makeLabel(short, "#e2e8f0", 16, 200);
      milLabel.scale.set(2.0, 0.6, 1);
      milLabel.position.set(x, 1.8, 0);
      scene.add(milLabel);

      // Fork indicators
      const forkGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const withMesh = new THREE.Mesh(forkGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      withMesh.position.set(x, withY, 0);
      scene.add(withMesh);
      const withoutMesh = new THREE.Mesh(forkGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      withoutMesh.position.set(x, withoutY, -0.5);
      scene.add(withoutMesh);
    });

    // Spline curves as tubes
    if (withPts.length >= 2) {
      const withCurve    = new THREE.CatmullRomCurve3(withPts);
      const withoutCurve = new THREE.CatmullRomCurve3(withoutPts);
      const withTube    = new THREE.TubeGeometry(withCurve, 60, 0.06, 8, false);
      const withoutTube = new THREE.TubeGeometry(withoutCurve, 60, 0.06, 8, false);
      scene.add(new THREE.Mesh(withTube,    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.4 })));
      scene.add(new THREE.Mesh(withoutTube, new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.4 })));
    }

    // Cost pillars at far right
    if (totalWithout > 0 || totalWith > 0) {
      const maxPillar = Math.max(totalWithout, totalWith, 1);
      const pillarX = startX + (n - 0.5) * spacing + 1.5;

      [[totalWithout, 0xef4444, -0.6, "Cost Without\n" + fmt$(totalWithout)],
       [totalWith,    0x10b981,  0.6, "Cost With\n"    + fmt$(totalWith)]
      ].forEach(([cost, color, xOff, lab]) => {
        const h = Math.max(0.2, ((cost as number) / maxPillar) * 6);
        const geo = new THREE.BoxGeometry(0.7, h, 0.7);
        const mat = new THREE.MeshStandardMaterial({ color: color as number, emissive: color as number, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.4 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pillarX + (xOff as number), h / 2, 0);
        scene.add(mesh);
        const lbl = makeLabel(lab as string, color === 0xef4444 ? "#ef4444" : "#10b981", 16, 180);
        lbl.scale.set(2.2, 0.8, 1);
        lbl.position.set(pillarX + (xOff as number), h + 0.7, 0);
        scene.add(lbl);
      });
    }

    // Legend
    const l1 = makeLabel("↑ With ThriveUp Investment", "#10b981", 18, 320); l1.scale.set(3.8, 0.6, 1); l1.position.set(-4, 5.5, 0); scene.add(l1);
    const l2 = makeLabel("↓ Without Investment", "#ef4444", 18, 320); l2.scale.set(3.8, 0.6, 1); l2.position.set(-4, 4.8, 0); scene.add(l2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2;

    let t = 0;
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.008;
      // Gently pulse the milestone spheres
      nodeMeshes.forEach((m, i) => {
        m.scale.setScalar(1 + Math.sin(t + i * 0.8) * 0.08);
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
      // Free all GPU resources (geometries/materials/textures) before renderer teardown.
      disposeScene(scene);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [timeline, totalWithout, totalWith]);

  if (!timeline || timeline.length === 0) {
    return <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400 text-sm">No cascade data available</div>;
  }
  if (webglUnavailable) {
    return (
      <div data-testid="cascade-waterfall-fallback" className="h-full overflow-auto bg-card p-3 text-foreground">
        <CascadeFallback timeline={timeline} totalWithout={totalWithout} totalWith={totalWith} geography={geography} />
        <p role="status" className="mt-2 text-center text-xs text-muted-foreground">
          Interactive cascade view is unavailable on this device.
        </p>
      </div>
    );
  }
  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
